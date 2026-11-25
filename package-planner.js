import './package-engine.js';
const E = window.VUPackageEngine;
const root = document.getElementById('booking-creator');
const money = n => n == null ? 'Not set' : '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fresh = (rules = E.defaults) => ({ schema: 2, id: null, customer: { name: '', phone: '', title: '', start: '', end: '', zone: 'Europe/London', occurrence: 'earlier', save: false }, services: { truck: { enabled: false, delivery: 'collect', driver: '', location: '', fuel: rules.fuel, labour: 0, staffed: false }, limo: { enabled: false, driver: 'vu', approved: false, journey: 'oneway', stops: 0, passengers: '', route: '', fuel: rules.fuel, labour: 0, colourEnabled: false, colour: '', colourCost: '', restoreCost: '' }, venue: { enabled: false, space: 'premium', booth1: true, booth2: false, guests: '', purpose: '', bar: 'guest', tabLimit: '', tabCost: '', expenses: 0 } }, items: [], extras: [], payment: { mode: 'full', depositType: 'percent', deposit: 25, paid: 0, refund: 0, damageDeposit: 0, damagePaid: 0, damageReturned: 0, deadline: '' }, handover: { before: '', after: '', fuel: '', stock: '', damage: '', repair: 0 }, status: 'Draft', notes: '', cancellation: '', holdOverride: false });
let state = fresh(), step = 0, settings = { ...E.defaults }, plans = [], customers = [], prices = {}, costing = null, catalogue = [], published = [], lockedQuote = null, saving = false, ready = false;
const byId = id => root.querySelector('#' + id);
function field(label, path, type = 'text', extra = '') { const value = read(path); if (type === 'datetime-local') return dateTimeField(label, path); return `<label>${esc(label)}<input data-field="${path}" type="${type}" value="${esc(value)}" ${extra}></label>`; }
function dateTimeField(label, path) {
  const [date = '', time = ''] = String(read(path)).split('T'), [hour = '18', minute = '00'] = time.split(':');
  return `<fieldset class="booking-datetime" data-datetime="${path}"><legend>${esc(label)}</legend><details class="booking-date-popover"><summary>${date ? esc(new Date(date + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) : 'Choose date'}<span aria-hidden="true">▦</span></summary><div class="booking-calendar" data-month="${date.slice(0, 7) || new Date().toISOString().slice(0, 7)}"></div></details><div class="booking-time-parts"><label>Hour<select data-time-part="hour">${Array.from({length:24}, (_, i) => String(i).padStart(2,'0')).map(v => `<option ${v === hour ? 'selected' : ''}>${v}</option>`).join('')}</select></label><span>:</span><label>Minute<select data-time-part="minute">${Array.from({length:60}, (_, i) => String(i).padStart(2,'0')).map(v => `<option ${v === minute ? 'selected' : ''}>${v}</option>`).join('')}</select></label><span class="booking-time-format">24-hour</span></div><input type="hidden" data-field="${path}" value="${esc(read(path))}"><button type="button" class="booking-date-clear" data-date-clear>Clear</button></fieldset>`;
}
function paintCalendars() {
  root.querySelectorAll('.booking-calendar').forEach(cal => {
    const [year, month] = cal.dataset.month.split('-').map(Number), first = new Date(year, month - 1, 1), offset = (first.getDay() + 6) % 7, count = new Date(year, month, 0).getDate();
    const selected = String(read(cal.closest('[data-datetime]').dataset.datetime)).slice(0,10);
    cal.innerHTML = `<div class="booking-calendar-heading"><button type="button" data-month-shift="-1" aria-label="Previous month">‹</button><strong>${first.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</strong><button type="button" data-month-shift="1" aria-label="Next month">›</button></div><div class="booking-calendar-days">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => `<span>${d}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({length:count},(_,i) => { const date = `${year}-${String(month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`; return `<button type="button" data-date="${date}" aria-pressed="${date === selected}">${i+1}</button>`; }).join('')}</div>`;
  });
}
function updateDateTime(box, date) {
  const input = box.querySelector('input[data-field]');
  const chosen = date === undefined ? input.value.slice(0,10) : date;
  input.value = chosen ? `${chosen}T${box.querySelector('[data-time-part="hour"]').value}:${box.querySelector('[data-time-part="minute"]').value}` : '';
  changed({target:input},false);
}
function select(label, path, values) { return `<label>${esc(label)}<select data-field="${path}">${values.map(([v, name]) => `<option value="${esc(v)}" ${read(path) === v ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>`; }
function check(label, path) { return `<label class="booking-check"><input type="checkbox" data-field="${path}" ${read(path) ? 'checked' : ''}>${esc(label)}</label>`; }
function read(path) { return path.split('.').reduce((o, key) => o?.[key], state) ?? ''; }
function write(path, value) { const keys = path.split('.'); let obj = state; for (const key of keys.slice(0, -1)) obj = obj[key]; obj[keys.at(-1)] = value; }
function times(key) { return `<details><summary>Different service times</summary><p>Otherwise uses the event start and end. Hire fees are fixed, not hourly.</p><div class="booking-grid">${field('Service start / pickup', `services.${key}.start`, 'datetime-local')}${field('Service end / return', `services.${key}.end`, 'datetime-local')}</div></details>`; }
function base() {
  root.innerHTML = `<div class="head"><p class="booking-eyebrow">VANILLA UNICORN · OWNER WORKSPACE</p><h2>Create their experience</h2><p>One enquiry. Every detail. A clear price.</p></div><div class="booking-toolbar"><label>Saved enquiries & bookings<select id="booking-saved"><option value="">Choose a saved booking</option></select></label><button type="button" id="booking-new">New enquiry</button><button type="button" id="booking-draft">Save draft</button><button type="button" id="booking-save">Save enquiry</button></div><p id="booking-message" role="status" aria-live="polite"></p><nav class="booking-steps" aria-label="Package steps">${['Customer & event', 'Build package', 'Review & save'].map((s, i) => `<button type="button" data-step="${i}">${i + 1}. ${s}</button>`).join('')}</nav><div class="booking-layout"><div id="booking-panel"></div><aside class="booking-summary"><p class="booking-eyebrow">YOUR PACKAGE</p><h3 id="booking-title">New enquiry</h3><div id="booking-summary-lines"></div><div id="booking-summary-total" aria-live="polite"></div><details open><summary>Private costing · only you</summary><div id="booking-private"></div></details></aside></div><div class="booking-nav"><button id="booking-back" type="button">Previous</button><button id="booking-next" type="button">Continue</button></div><details class="booking-settings"><summary>Automatic pricing settings · owner only</summary><p>Trial vehicle fees and discount rules are starting points, not confirmed market rates. Approve these rules once before issuing final quotes. Unset space / delivery fees must be entered here; they are never guessed.</p><div id="booking-settings-fields" class="booking-grid"></div><label class="booking-check"><input id="booking-rules-approved" type="checkbox">I approve these pricing rules for new quotes</label><button type="button" id="booking-settings-save">Save pricing rules</button><p id="booking-settings-message" role="status"></p></details><details><summary>Calendar holds & upcoming bookings</summary><div id="booking-holds"></div></details>`;
  root.addEventListener('change', event => { if (event.target.dataset.timePart) updateDateTime(event.target.closest('[data-datetime]')); else changed(event); });
  root.addEventListener('input', event => { if (event.target.dataset.field && !['checkbox'].includes(event.target.type) && !event.target.matches('select')) changed(event, false); });
  root.addEventListener('click', clicked);
  byId('booking-saved').onchange = event => load(plans.find(p => p.id === event.target.value));
  byId('booking-new').onclick = () => { if (confirm('Start a new enquiry? Save your current changes first if needed.')) { state = fresh(settings); lockedQuote = null; step = 0; render(); } };
  byId('booking-back').onclick = () => { step = Math.max(0, step - 1); render(); };
  byId('booking-next').onclick = () => { if (step === 0 && !validCustomer()) return; step = Math.min(2, step + 1); render(); };
  byId('booking-save').onclick = () => save(false);
  byId('booking-draft').onclick = () => save(true);
  byId('booking-settings-save').onclick = () => {
    const next = {};
    for (const input of root.querySelectorAll('[data-setting]')) {
      if (input.value !== '' && (!Number.isFinite(Number(input.value)) || Number(input.value) < 0)) return settingsMessage('Prices and rules must be non-negative numbers.');
      next[input.dataset.setting] = input.value === '' ? null : Number(input.value);
    }
    for (const key of ['smallDiscount', 'largeDiscount', 'maxDiscount', 'bulkDiscount', 'minimumMargin']) if (next[key] > 90 || next[key] == null) return settingsMessage('Percentage rules must be between 0 and 90.');
    if (!Number.isInteger(next.bulkQuantity) || next.bulkQuantity < 1 || !Number.isInteger(next.includedDrinks)) return settingsMessage('Drink quantities must be whole numbers; bulk threshold must be at least one.');
    next.approved = byId('booking-rules-approved').checked;
    document.dispatchEvent(new CustomEvent('vu:booking-settings-save', { detail: next }));
    settingsMessage('Saving pricing rules…');
  };
  renderSettings(); render();
}
function settingsMessage(text) { byId('booking-settings-message').textContent = text; }
function renderSettings() {
  const labels = { truckPurchase: 'Truck purchase cost ($) · private', limoPurchase: 'Limo purchase cost ($) · private', truck: 'Fixed truck hire', limo: 'Fixed limo hire', premium: 'Fixed premium room hire', booth: 'Fixed hire per VIP booth', venue: 'Fixed whole-venue hire', fuel: 'Default fuel estimate', delivery: 'Truck delivery + collection fee', returnJourney: 'Additional return-journey fee', extraStop: 'Fee per extra limo stop', smallDiscount: 'One-extra bundle saving (%)', largeDiscount: 'Two-extra bundle saving (%)', maxDiscount: 'Maximum bundle saving (%)', bulkQuantity: 'Bulk drinks quantity threshold', bulkDiscount: 'Bulk drinks saving (%)', minimumMargin: 'Minimum package profit margin (%)', minimumProfit: 'Minimum package profit ($)', includedDrinks: 'Maximum included drinks for VU bundles' };
  byId('booking-settings-fields').innerHTML = Object.entries(labels).map(([key, label]) => `<label>${label}<input data-setting="${key}" type="number" min="0" step="${['bulkQuantity', 'includedDrinks'].includes(key) ? '1' : '0.01'}" value="${settings[key] ?? ''}" placeholder="Not set"></label>`).join('');
  byId('booking-rules-approved').checked = !!settings.approved;
}
function render() {
  root.dataset.step = String(step);
  root.querySelector('.booking-summary').hidden = step === 0;
  root.querySelectorAll('[data-step]').forEach(button => { const selected = Number(button.dataset.step) === step; button.classList.toggle('active', selected); button.setAttribute('aria-current', selected ? 'step' : 'false'); });
  byId('booking-back').disabled = step === 0; byId('booking-next').hidden = step === 2;
  byId('booking-panel').innerHTML = step === 0 ? customerPanel() : step === 1 ? buildPanel() : reviewPanel();
  byId('booking-save').textContent = saving ? 'Saving…' : 'Save enquiry / booking'; byId('booking-save').disabled = saving; byId('booking-draft').disabled = saving;
  renderSummary(); renderHolds(); renderSaved(); updateLiveClocks();
}
const clockZones = [['Europe/London', 'UK'], ['Europe/Helsinki', 'Finland'], ['America/New_York', 'US Eastern'], ['America/Chicago', 'US Central'], ['America/Denver', 'US Mountain'], ['America/Los_Angeles', 'US Pacific'], ['Australia/Sydney', 'Sydney'], ['UTC', 'UTC']];
function clockText(zone, now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(now);
}
function zoneLabel(zone) { return clockZones.find(([z]) => z === zone)?.[1] || zone.replace(/_/g, ' '); }
function updateLiveClocks() {
  const now = new Date();
  for (const button of root.querySelectorAll('[data-clock-zone]')) {
    button.setAttribute('aria-pressed', String(button.dataset.clockZone === state.customer.zone));
    const z = button.dataset.clockZone;
    let text = 'Choose a booking date and time';
    try { if (state.customer.start) { const a = E.wallTime(state.customer.start, state.customer.zone, state.customer.occurrence); text = clockText(z, new Date(a.iso)); if (state.customer.end) { const b = E.wallTime(state.customer.end, state.customer.zone, state.customer.occurrence); text += ' → ' + clockText(z, new Date(b.iso)); } } } catch (error) { text = error.message; }
    button.querySelector('time').textContent = text;
    button.querySelector('small').textContent = 'Now: ' + clockText(z, now);
  }
  const picker = byId('booking-zone-picker');
  if (picker && document.activeElement !== picker) for (const option of picker.options) option.textContent = zoneLabel(option.value) + ' — ' + clockText(option.value, now);
}
function customerPanel() {
  const zones = [...new Set(['Europe/London', 'UTC', 'Europe/Helsinki', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Australia/Sydney', ...(Intl.supportedValuesOf?.('timeZone') || [])])];
  return `<div class="booking-customer-form"><section class="booking-form-card"><div class="booking-card-heading"><h3>Customer details</h3><p>Who are we arranging this for?</p></div>${customers.length ? `<details class="booking-returning"><summary>Find a returning customer</summary><label>Saved customer<select id="booking-customer"><option value="">Choose a customer</option>${customers.map(c => `<option value="${esc(c.id)}">${esc(c.name)} · ${esc(c.phone)}</option>`).join('')}</select></label></details>` : ''}<div class="booking-grid">${field('Customer name', 'customer.name', 'text', 'autocomplete="off" placeholder="Full name"')}${field('In-city phone number', 'customer.phone', 'tel', 'placeholder="Phone number"')}</div>${check('Save their details for future bookings · with their permission', 'customer.save')}</section><section class="booking-form-card"><div class="booking-card-heading"><h3>Event details</h3><p>The name below will appear on your calendar.</p></div>${field('Event name', 'customer.title', 'text', 'placeholder="e.g. Birthday party for Alex"')}<label class="booking-zone-label">Customer time zone<select id="booking-zone-picker" data-field="customer.zone">${zones.map(z => `<option value="${z}" ${z === state.customer.zone ? 'selected' : ''}>${esc(zoneLabel(z))} — ${esc(clockText(z))}</option>`).join('')}</select><span class="booking-field-hint">Choose their zone, then enter the booking in their local time. Your UK booking time converts automatically.</span></label><div class="booking-grid booking-event-times">${field('Starts · customer’s local time', 'customer.start', 'datetime-local')}${field('Ends / return · customer’s local time', 'customer.end', 'datetime-local')}</div><div class="booking-world-times"><h4>Your booking in other time zones</h4><p class="booking-field-hint">Tick the customer’s zone and enter the time they requested above. These times update together, including date changes.</p><div class="booking-clock-grid">${clockZones.map(([z, label]) => `<button type="button" data-clock-zone="${z}" aria-pressed="${z === state.customer.zone}"><span>${label}</span><time>Choose a booking date and time</time><small>Now: ${esc(clockText(z))}</small></button>`).join('')}</div></div><div id="booking-clock-choice" hidden>${select('This time occurs twice when the clocks change', 'customer.occurrence', [['earlier', 'First occurrence'], ['later', 'Second occurrence']])}</div><details id="booking-time-conversions" class="booking-time-conversions" hidden><summary>View times in other time zones</summary><div id="booking-times" class="booking-times"></div></details></section></div>`;
}
function menu(key) {
  const selected = state.items.filter(i => i.service === key);
  return `<details class="booking-menu" ${selected.length ? 'open' : ''}><summary>Choose food & drinks${selected.length ? ' · ' + selected.reduce((n, x) => n + x.quantity, 0) + ' selected' : ''}</summary><p>Prices and ingredient costs come from your saved menu. Bundle / bulk savings are calculated automatically.</p><div class="booking-grid"><label>Menu item<select id="booking-menu-${key}"><option value="">Choose an item</option>${catalogue.map((i, n) => `<option value="${n}">${esc(i.name)} · ${money(i.price)}${i.price == null ? ' (needs pricing)' : ''}</option>`).join('')}</select></label><label>Quantity<input id="booking-qty-${key}" type="number" min="1" step="1" value="1"></label></div><button type="button" data-add-menu="${key}">Add to ${key === 'truck' ? 'truck stock' : key + ' package'}</button><div class="booking-menu-lines">${selected.map(i => `<div><span>${i.quantity} × ${esc(i.name)} · ${money(i.price == null ? null : i.price * i.quantity)}</span><button type="button" data-remove-item="${esc(i.key)}">Remove</button></div>`).join('')}</div></details>`;
}
function buildPanel() {
  const t = state.services.truck, l = state.services.limo, v = state.services.venue;
  return `<h3>Build their package</h3><p>Tick one or several services. Everything opens here, without extra steps.</p>
  <section class="booking-service">${check('Mobile Cocktail Bar · K-truck', 'services.truck.enabled')}${t.enabled ? `<div class="booking-service-body"><div class="booking-grid">${field('Event location', 'services.truck.location')}${select('Handover', 'services.truck.delivery', [['collect', 'Customer collects and returns'], ['delivery', 'VU delivery and collection']])}${field('Customer / nominated driver and contact', 'services.truck.driver')}</div>${check('VU operator stays to serve drinks', 'services.truck.staffed')}${times('truck')}${menu('truck')}<p class="booking-note">Fixed van hire plus purchased stock. Customer keeps leftover drinks; unused drinks are non-refundable. Customer-driven hire requires return in the agreed condition and responsibility for damage.</p><details><summary>Private operating costs</summary><div class="booking-grid">${field('Fuel estimate ($)', 'services.truck.fuel', 'number', 'min="0"')}${field('Driver / bartender pay ($)', 'services.truck.labour', 'number', 'min="0"')}${field('Other delivery expenses ($)', 'services.truck.deliveryCost', 'number', 'min="0"')}</div><p>Delivery reserves 30-minute handover and collection windows for you. Extend service times if travel needs longer.</p></details></div>` : ''}</section>
  <section class="booking-service">${check('Limousine Hire', 'services.limo.enabled')}${l.enabled ? `<div class="booking-service-body"><div class="booking-grid">${select('Driver', 'services.limo.driver', [['vu', 'VU chauffeur provided'], ['customer', 'Customer drives · approval required']])}${field('Passenger numbers', 'services.limo.passengers', 'number', 'min="1" step="1"')}${field('Pickup, destination and route', 'services.limo.route')}${select('Journey', 'services.limo.journey', [['oneway', 'One-way'], ['return', 'Return journey'], ['multi', 'Multiple stops']])}${field('Additional stops', 'services.limo.stops', 'number', 'min="0" step="1"')}</div>${l.driver === 'customer' ? `${field('Nominated driver and contact', 'services.limo.customerDriver')}${check('I approve customer driving for this booking', 'services.limo.approved')}` : ''}${times('limo')}${check('Add a custom colour to match their theme', 'services.limo.colourEnabled')}${l.colourEnabled ? `<div class="booking-grid">${field('Requested colour', 'services.limo.colour')}${field('Cost to change colour ($)', 'services.limo.colourCost', 'number', 'min="0"')}${field('Cost to restore original colour ($)', 'services.limo.restoreCost', 'number', 'min="0"')}</div><p>Both colour costs are covered automatically. Enter the actual estimate for this booking; no colour charge is assumed.</p>` : ''}${menu('limo')}<details><summary>Private operating costs</summary><div class="booking-grid">${field('Fuel estimate ($)', 'services.limo.fuel', 'number', 'min="0"')}${field('Driver pay ($)', 'services.limo.labour', 'number', 'min="0"')}</div></details></div>` : ''}</section>
  <section class="booking-service">${check('Vanilla Unicorn · rooms, booths or whole venue', 'services.venue.enabled')}${v.enabled ? `<div class="booking-service-body">${select('Space', 'services.venue.space', [['premium', 'Premium room · booking only'], ['booths', 'VIP seating booths · exclusive reservation'], ['venue', 'Whole venue · entire building included']])}${v.space === 'booths' ? check('Reserve VIP booth 1', 'services.venue.booth1') + check('Reserve VIP booth 2', 'services.venue.booth2') + '<p>Unreserved booths are free to use. A booking restricts access to approved guests.</p>' : ''}${v.space === 'venue' ? '<p class="booking-note">Includes the premium room and both VIP booths. No separate space charges.</p>' : ''}<div class="booking-grid">${field('Guest numbers', 'services.venue.guests', 'number', 'min="1" step="1"')}${field('Purpose / occasion / approved guests', 'services.venue.purpose')}${select('Bar arrangement', 'services.venue.bar', [['guest', 'Guests pay individually / open their own tabs'], ['prepaid', 'Organiser prepays selected food and drinks'], ['tab', 'Organiser funds a limited bar tab']])}</div>${v.bar === 'tab' ? `<div class="booking-grid">${field('Organiser bar limit ($)', 'services.venue.tabLimit', 'number', 'min="0"')}${field('Estimated bar stock cost ($) · private', 'services.venue.tabCost', 'number', 'min="0"')}</div><p>This is a prepaid allowance in the quote. Track actual consumption in the Bar Till and seek approval before exceeding it.</p>` : ''}${times('venue')}${v.bar === 'prepaid' ? menu('venue') : ''}${field('Setup / security / running cost ($) · private', 'services.venue.expenses', 'number', 'min="0"')}<p>Included drinks are suggested only when your saved rules and available profit support them.</p></div>` : ''}</section>
  <details ${state.extras.length ? 'open' : ''}><summary>Entertainment, catering & support</summary><p>Optional dancers, DJ, catering and other businesses. Requests are not confirmed availability.</p><div class="booking-grid"><label>Service<select id="booking-extra-type"><option>Dancers</option><option>DJ</option><option>External catering</option><option>Event support</option><option>Other</option></select></label><label>Details / supplier<input id="booking-extra-name"></label><label>Quantity<input id="booking-extra-qty" type="number" min="1" step="1" value="1"></label><label>Supplier cost per unit ($)<input id="booking-extra-cost" type="number" min="0" placeholder="Awaiting quote"></label><label>Customer price per unit ($)<input id="booking-extra-price" type="number" min="0" placeholder="Not set"></label><label>Availability<select id="booking-extra-status"><option>Requested</option><option>Confirmed</option></select></label></div><button type="button" id="booking-extra-add">Add requested service</button><p>Free help can have a $0 supplier cost. Leave costs or selling prices blank while awaiting a quote; they are not assumed to be free.</p>${state.extras.map((x, i) => `<div class="booking-extra"><strong>${esc(x.name)}</strong><span>${esc(x.status)} · ${money(x.price)} × ${x.quantity}</span><button type="button" data-confirm-extra="${i}">Mark ${x.status === 'Confirmed' ? 'requested' : 'confirmed'}</button><button type="button" data-remove-extra="${i}">Remove</button></div>`).join('')}</details><label>Special requests / internal notes<textarea data-field="notes" rows="3">${esc(state.notes)}</textarea></label>`;
}
function reviewPanel() {
  return `<h3>Review, payment & booking</h3><div id="booking-review-warnings"></div><pre id="booking-customer-preview" class="booking-customer-preview"></pre><div class="booking-grid">${select('Booking status', 'status', [['Draft', 'Enquiry draft · does not hold resources'], ['On hold', 'On hold · reserves date, no automatic expiry'], ['Quoted', 'Quoted · reserves date'], ['Confirmed', 'Confirmed · deposit / full payment received'], ['Completed', 'Completed'], ['Cancelled', 'Cancelled · releases resources'], ['Released', 'Hold released']])}${select('Payment option', 'payment.mode', [['full', 'Pay in full'], ['deposit', 'Deposit then balance']])}${select('Deposit type', 'payment.depositType', [['percent', 'Percentage'], ['fixed', 'Fixed amount']])}${field('Deposit amount / percentage', 'payment.deposit', 'number', 'min="0"')}${field('Booking payments received ($)', 'payment.paid', 'number', 'min="0"')}${field('Balance due date · optional', 'payment.deadline', 'date')}${field('Refund recorded ($)', 'payment.refund', 'number', 'min="0"')}${field('Refundable damage deposit required ($)', 'payment.damageDeposit', 'number', 'min="0"')}${field('Damage deposit received ($)', 'payment.damagePaid', 'number', 'min="0"')}${field('Damage deposit returned ($)', 'payment.damageReturned', 'number', 'min="0"')}</div><div id="booking-payment-summary"></div><label>Cancellation / refund reason<textarea data-field="cancellation" rows="2">${esc(state.cancellation)}</textarea></label><details><summary>Vehicle handover & return checklist</summary><div class="booking-grid">${field('Before hire · condition / photo reference', 'handover.before')}${field('After hire · condition / photo reference', 'handover.after')}${field('Agreed fuel level on return', 'handover.fuel')}${field('Supplied stock / removal of leftovers', 'handover.stock')}${field('Damage / repair notes', 'handover.damage')}${field('Agreed actual repair charge ($)', 'handover.repair', 'number', 'min="0"')}</div><p>Repair charges are recorded separately for follow-up; they are not silently added to the agreed quote.</p></details>${check('Allow this hold despite a listed conflict · explain in notes', 'holdOverride')}<div class="booking-actions"><button type="button" id="booking-copy">Copy customer quote</button><button type="button" id="booking-bill">Copy bill description</button><button type="button" id="booking-reprice">Recalculate with current prices</button></div><p class="muted">Saved quotes keep their prices until you explicitly recalculate or edit package contents. Copying a quote does not send a message or collect payment.</p>`;
}
function currentQuote() { return lockedQuote || E.quote(effectiveState(), settings); }
function visibleItems() { return state.items.filter(i => state.services[i.service]?.enabled && !(i.service === 'venue' && state.services.venue.bar !== 'prepaid')); }
function effectiveState() { return { ...state, items: visibleItems() }; }
function timesText() {
  try { const c = state.customer, a = E.wallTime(c.start, c.zone, c.occurrence), b = E.wallTime(c.end, c.zone, c.occurrence); return [...new Set([c.zone, 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC'])].map(z => z + ': ' + E.formatTime(a.iso, z) + ' – ' + E.formatTime(b.iso, z)).join('\n') + (a.ambiguous || b.ambiguous ? '\nClock change: ' + c.occurrence + ' occurrence selected.' : ''); } catch (e) { return e.message; }
}
function customerText(bill = false) {
  const q = currentQuote(), c = state.customer;
  const details = ['VANILLA UNICORN · ' + (q.approved ? 'QUOTE' : 'PROVISIONAL ESTIMATE'), c.title || 'Custom booking', 'Customer: ' + c.name, 'Contact: ' + c.phone, timesText()];
  for (const [key, service] of Object.entries(state.services)) if (service.enabled) {
    if (key === 'truck') details.push('Truck: ' + (service.delivery === 'delivery' ? 'VU delivery and collection' : 'Customer collection and return') + ' · ' + (service.location || 'Location to confirm'), 'Customer / driver: ' + (service.driver || 'To confirm'));
    if (key === 'limo') details.push('Limo: ' + (service.driver === 'vu' ? 'VU chauffeur' : 'Customer driving — ' + (service.approved ? 'approved' : 'approval pending')) + ' · ' + service.journey + ' · ' + (service.route || 'Route to confirm'), 'Passengers: ' + (service.passengers || 'To confirm'));
    if (key === 'venue') details.push('Guests: ' + (service.guests || 'To confirm'), 'Occasion / access: ' + (service.purpose || 'To confirm'), 'Bar: ' + ({ guest: 'Guests buy their own drinks / individual tabs', prepaid: 'Selected drinks prepaid by organiser', tab: 'Organiser prepaid bar limit ' + money(Number(service.tabLimit || 0)) }[service.bar]));
    if (service.start || service.end) { try { const a = E.wallTime(service.start || c.start, c.zone, c.occurrence), b = E.wallTime(service.end || c.end, c.zone, c.occurrence); details.push(key + ' timing (' + c.zone + '): ' + E.formatTime(a.iso, c.zone) + ' – ' + E.formatTime(b.iso, c.zone), key + ' timing (UK): ' + E.formatTime(a.iso, 'Europe/London') + ' – ' + E.formatTime(b.iso, 'Europe/London')); } catch { details.push(key + ' timing needs confirmation'); } }
  }
  if (!bill) details.push('', ...q.lines.map(l => `${l.quantity} × ${l.name}: ${money(l.price == null ? null : l.price * l.quantity)}`), 'Separate price: ' + money(q.subtotal), q.offer + ': −' + money(q.saving));
  else details.push(...q.lines.map(l => l.quantity + ' × ' + l.name));
  if (q.includedItems?.length) details.push('Included drinks: ' + q.includedItems.map(i => i.quantity + ' × ' + i.name).join(', '));
  details.push('TOTAL: ' + (q.complete ? money(q.total) : 'Incomplete — prices needed'), 'Payment received: ' + money(q.paid) + ' · Remaining balance: ' + money(q.balance));
  if (state.payment.mode === 'deposit') details.push('Booking deposit: ' + money(q.deposit));
  if (q.damageDeposit) details.push('Refundable damage deposit, separate: ' + money(q.damageDeposit));
  if (state.payment.deadline) details.push('Balance due: ' + state.payment.deadline);
  if (q.pending.length) details.push('Awaiting confirmation: ' + q.pending.join(', '));
  if (state.services.truck.enabled) details.push('Purchased drinks belong to the customer; unused drinks are non-refundable. Remove remaining stock before returning the truck.');
  if (state.services.limo.driver === 'customer' && state.services.limo.enabled || state.services.truck.enabled && state.services.truck.delivery === 'collect') details.push('Customer driving: return at the agreed time and fuel level, in the agreed condition. Customer pays for damage caused during hire.');
  details.push('Status: ' + state.status + '. Holds have no automatic expiry; changes and refunds are arranged with management.');
  return details.join('\n');
}
function renderSummary() {
  paintCalendars();
  const q = currentQuote(), intervals = E.intervals(state), overlaps = E.conflicts(intervals.reservations, [...plans.filter(p => p.schema === 2), ...published], state.id);
  byId('booking-title').textContent = state.customer.title || 'New enquiry';
  byId('booking-summary-lines').innerHTML = q.lines.length ? q.lines.map(l => `<p><span>${l.quantity} × ${esc(l.name)}</span><strong>${money(l.price == null ? null : l.price * l.quantity)}</strong></p>`).join('') : '<p>Select services to begin.</p>';
  byId('booking-summary-total').innerHTML = `<p>Separate price <strong>${money(q.subtotal)}</strong></p><p>${esc(q.offer)} <strong>−${money(q.saving)}</strong></p><p class="booking-total">${q.complete ? money(q.total) : 'Price incomplete'}</p>${!q.approved ? '<p class="booking-warning">Trial rules — approve pricing settings before issuing a final quote.</p>' : ''}${q.missing.length ? `<p class="booking-warning">Set prices: ${esc(q.missing.join(', '))}</p>` : ''}${q.pending.length ? `<p>Awaiting confirmation: ${esc(q.pending.join(', '))}</p>` : ''}${overlaps.length ? `<p class="booking-warning">${esc(overlaps.join(' '))}</p>` : ''}`;
  byId('booking-private').innerHTML = `<p>Known costs <strong>${money(q.costs)}</strong></p><p>Expected profit <strong>${money(q.profit)}</strong></p>${q.costMissing.length ? `<p class="booking-warning">Missing costs: ${esc(q.costMissing.join(', '))}. No automatic saving until known.</p>` : ''}${q.shortfall > 0 ? '<p class="booking-warning">Base price is below your minimum profit rule. Adjust saved pricing before finalising.</p>' : ''}${lockedQuote ? '<p>Saved price snapshot. Payment totals update independently.</p>' : ''}${['truck', 'limo'].filter(k => state.services[k].enabled).map(k => { const contribution = Number(settings[k]) - Number(state.services[k].fuel || 0) - Number(state.services[k].labour || 0); const purchase = settings[k + 'Purchase']; return `<p>${k === 'truck' ? 'Truck' : 'Limo'} purchase ${money(purchase)} · ${E.amount(purchase) && contribution > 0 ? Math.ceil(purchase / contribution) + ' hires at base contribution before bundle savings / other expenses' : 'set your private purchase cost to estimate recovery'}</p>`; }).join('')}`;
  if (byId('booking-times')) {
    const c = state.customer, complete = !!(c.start && c.end);
    updateLiveClocks();
    byId('booking-times').textContent = complete ? timesText() : '';
    byId('booking-time-conversions').hidden = true;
    let ambiguous = false;
    try { ambiguous = (c.start && E.wallTime(c.start, c.zone, c.occurrence).ambiguous) || (c.end && E.wallTime(c.end, c.zone, c.occurrence).ambiguous); } catch { /* Date validation remains visible in the conversions panel. */ }
    byId('booking-clock-choice').hidden = !ambiguous;
  }
  if (byId('booking-customer-preview')) {
    byId('booking-customer-preview').textContent = customerText();
    byId('booking-review-warnings').textContent = [...intervals.errors, ...overlaps, ...q.pending.map(x => x + ': awaiting confirmation')].join(' ');
    byId('booking-payment-summary').textContent = `Due to secure booking: ${money(q.deposit)} · Paid: ${money(q.paid)} · Refunded: ${money(q.refund)} · Balance: ${money(q.balance)}. Refundable damage deposit: ${money(q.damageDeposit)} (separate from sales).`;
  }
}
function renderSaved() { const sel = byId('booking-saved'); sel.innerHTML = '<option value="">Choose a saved booking</option>' + plans.map(p => `<option value="${esc(p.id)}">${esc(p.customer?.title || p.fields?.['vu-plan-name'] || 'Legacy package')} · ${esc(p.customer?.name || p.fields?.['vu-plan-customer'] || '')} · ${esc(p.status || p.fields?.['vu-pkg-status'] || 'Draft')}</option>`).join(''); sel.value = state.id || ''; }
function renderHolds() { byId('booking-holds').innerHTML = plans.filter(p => !['Draft', 'Cancelled', 'Released', 'Completed'].includes(p.status) && p.schema === 2).sort((a, b) => (a.reservations?.[0]?.start || '').localeCompare(b.reservations?.[0]?.start || '')).map(p => `<p><strong>${esc(p.customer?.title)}</strong> · ${esc(p.status)}<br>${esc(p.reservations?.map(r => E.formatTime(r.start, 'Europe/London') + ' — ' + E.formatTime(r.end, 'Europe/London') + ' UK · ' + r.service).join(' / '))}</p>`).join('') || '<p>No held or confirmed bookings.</p>'; }
function changed(event, redraw = true) {
  const target = event.target, path = target.dataset.field;
  if (!path) { if (target.id === 'booking-customer') { const c = customers.find(x => x.id === target.value); if (c) { state.customer.name = c.name; state.customer.phone = c.phone || ''; state.customer.directoryId = c.id; state.customer.save = true; render(); } } return; }
  message('Unsaved changes. Save to update the booking and its hold.');
  write(path, target.type === 'checkbox' ? target.checked : target.type === 'number' ? target.value === '' ? '' : Math.max(0, Number(target.value)) : target.value);
  if (!/^(payment\.|handover\.|status$|cancellation$|holdOverride$|notes$|customer\.)/.test(path)) lockedQuote = null;
  if (path === 'services.venue.bar') lockedQuote = null;
  refreshLockedPayment();
  if (redraw && (target.type === 'checkbox' || target.matches('select'))) render(); else renderSummary();
}
function refreshLockedPayment() { if (lockedQuote) { const pay = E.quote({ ...effectiveState(), items: [] }, settings); const paid = Math.max(0, Number(state.payment.paid) || 0), refund = Math.max(0, Number(state.payment.refund) || 0); lockedQuote = { ...lockedQuote, paid, refund, balance: E.round(Math.max(0, lockedQuote.total - paid + refund)), deposit: state.payment.mode === 'full' ? lockedQuote.total : E.round(Math.min(lockedQuote.total, state.payment.depositType === 'percent' ? lockedQuote.total * Math.min(100, Number(state.payment.deposit) || 0) / 100 : Number(state.payment.deposit) || 0)), damageDeposit: pay.damageDeposit }; } }
function clicked(event) {
  const b = event.target.closest('button'); if (!b) return;
  if (b.dataset.monthShift) { const cal = b.closest('.booking-calendar'), [y,m] = cal.dataset.month.split('-').map(Number), date = new Date(y,m-1+Number(b.dataset.monthShift),1); cal.dataset.month = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; paintCalendars(); return; }
  if (b.dataset.date || b.hasAttribute('data-date-clear')) { const box = b.closest('[data-datetime]'); updateDateTime(box,b.dataset.date || ''); render(); return; }
  if (b.dataset.clockZone) { state.customer.zone = b.dataset.clockZone; message('Customer time zone updated.'); render(); }
  if (b.dataset.step) { const next = Number(b.dataset.step); if (next > 0 && !validCustomer()) return; step = next; render(); }
  if (b.dataset.addMenu) {
    const service = b.dataset.addMenu, selected = byId('booking-menu-' + service).value, quantity = Number(byId('booking-qty-' + service).value);
    if (selected === '' || !Number.isInteger(quantity) || quantity < 1) return message('Choose a menu item and a whole quantity above zero.');
    const item = catalogue[Number(selected)], existing = state.items.find(i => i.service === service && i.id === item.id);
    if (existing) existing.quantity += quantity; else state.items.push({ ...item, service, quantity, key: crypto.randomUUID() });
    lockedQuote = null; render();
  }
  if (b.dataset.removeItem) { state.items = state.items.filter(i => i.key !== b.dataset.removeItem); lockedQuote = null; render(); }
  if (b.dataset.removeExtra != null) { state.extras.splice(Number(b.dataset.removeExtra), 1); lockedQuote = null; render(); }
  if (b.dataset.confirmExtra != null) { const extra = state.extras[Number(b.dataset.confirmExtra)]; extra.status = extra.status === 'Confirmed' ? 'Requested' : 'Confirmed'; if (lockedQuote) lockedQuote.pending = state.extras.filter(x => x.status !== 'Confirmed').map(x => x.name); render(); }
  if (b.id === 'booking-extra-add') {
    const quantity = Number(byId('booking-extra-qty').value);
    if (!Number.isInteger(quantity) || quantity < 1) return message('Use a whole supplier quantity above zero.');
    const cost = byId('booking-extra-cost').value, price = byId('booking-extra-price').value;
    state.extras.push({ name: byId('booking-extra-type').value + (byId('booking-extra-name').value ? ' · ' + byId('booking-extra-name').value : ''), quantity, cost: cost === '' ? null : Number(cost), price: price === '' ? null : Number(price), status: byId('booking-extra-status').value }); lockedQuote = null; render();
  }
  if (b.id === 'booking-reprice') { if (!confirm('Recalculate using current menu prices and pricing rules? The previous saved quote remains unchanged until you save.')) return; for (const item of state.items) { const current = catalogue.find(x => x.id === item.id); if (current) { item.price = current.price; item.cost = current.cost; } } lockedQuote = null; render(); }
  if (b.id === 'booking-copy' || b.id === 'booking-bill') {
    const q = currentQuote(); if (!validCustomer()) return; if (!q.lines.length) return message('Choose at least one service.'); if (!q.complete) return message('Set missing selling prices before copying a quote.');
    if (E.intervals(state).errors.length) return message('Check service start and return times before copying.');
    navigator.clipboard.writeText(customerText(b.id === 'booking-bill')).then(() => message('Copied. Only customer-facing details were included.')).catch(() => message('Clipboard unavailable. Select and copy the customer preview above.'));
  }
}
function validCustomer() { const c = state.customer; if (!c.name.trim() || !c.phone.trim() || !c.title.trim()) { message('Enter customer name, phone and event name.'); return false; } try { const a = E.wallTime(c.start, c.zone, c.occurrence), b = E.wallTime(c.end, c.zone, c.occurrence); if (a.iso >= b.iso) throw Error('Event end must be after its start.'); return true; } catch (e) { message(e.message); return false; } }
function save(draftOnly = false) {
  if (saving) return;
  if (!ready) return message('Wait for your saved bookings to connect before saving.');
  if (!draftOnly && !validCustomer()) { step = 0; render(); return; }
  if (draftOnly && !state.customer.name.trim() && !state.customer.title.trim()) return message('Give this draft a customer or event name first.');
  if (!draftOnly && !Object.values(state.services).some(x => x.enabled)) return message('Choose at least one service.');
  const result = E.intervals(state), q = currentQuote(), overlap = E.conflicts(result.reservations, [...plans.filter(p => p.schema === 2), ...published], state.id);
  if (!draftOnly && result.errors.length) return message(result.errors.join(' '));
  if (state.payment.refund > state.payment.paid) return message('A refund cannot exceed booking payments received.');
  if (state.payment.damageReturned > state.payment.damagePaid) return message('Damage deposit returned cannot exceed the amount received.');
  if (state.payment.depositType === 'percent' && Number(state.payment.deposit) > 100) return message('Deposit percentage cannot exceed 100.');
  if (!draftOnly && overlap.length && !['Draft', 'Cancelled', 'Completed', 'Released'].includes(state.status) && (!state.holdOverride || !state.notes.trim())) return message(overlap.join(' ') + ' Review the hold and explain any deliberate override in notes.');
  if (!draftOnly && state.status === 'Confirmed') {
    if (!q.complete || !q.costComplete || !q.approved || q.shortfall > 0 || q.pending.length) return message('Confirm availability, missing costs/prices and approved pricing rules before confirming the booking.');
    if (state.services.limo.enabled && state.services.limo.driver === 'customer' && !state.services.limo.approved) return message('Approve the customer driver first.');
    if (q.paid - q.refund < q.deposit || q.paid - q.refund <= 0) return message('Record the agreed booking deposit or full payment before confirming.');
  }
  const payload = JSON.parse(JSON.stringify({ ...state, schema: 2, id: state.id || crypto.randomUUID(), quote: q, reservations: result.reservations, updatedAt: new Date().toISOString() }));
  if (draftOnly) { payload.status = 'Draft'; payload.reservations = []; }
  else if (payload.status === 'Draft') payload.status = 'On hold';
  state.id = payload.id; saving = true; render(); message('Saving privately and checking calendar holds…');
  document.dispatchEvent(new CustomEvent('vu:booking-save', { detail: payload }));
}
function message(text) { byId('booking-message').textContent = text; }
function load(record) {
  if (!record) return;
  if (record.schema !== 2) { message('This is a legacy plan. Its original record is preserved. Review the details below and rebuild it as a new enquiry.'); state = fresh(); const f = record.fields || {}; Object.assign(state.customer, { name: f['vu-plan-customer'] || '', title: f['vu-plan-name'] || '', phone: f['vu-pkg-phone'] || '', start: f['vu-pkg-start'] || '', end: f['vu-pkg-end'] || '', zone: f['vu-pkg-timezone'] || 'Europe/London' }); state.notes = 'Legacy plan reference: ' + record.id + '\n' + JSON.stringify({ fields: record.fields, items: record.items, custom: record.custom, catering: record.catering }, null, 2); lockedQuote = null; }
  else { state = structuredClone(record); lockedQuote = structuredClone(record.quote); refreshLockedPayment(); message('Loaded saved booking. Its quoted prices are preserved.'); }
  step = 0; render();
}
function buildCatalogue(data) {
  const recipes = [...(costing?.recipes || [])];
  for (const r of data.recipes || []) if (!recipes.some(x => E.normalise(x.name) === E.normalise(r.name))) recipes.push(r);
  const priceFor = keys => {
    for (const key of keys) { const special = prices['__specialActive::' + key] === 1 || prices['__specialActive::' + key] === true; const value = special ? prices['__special::' + key] : prices[key]; if (E.amount(value)) return Number(value); }
    return null;
  };
  const namedPrice = (name, group) => Object.keys(prices).find(k => k.startsWith(group + '::') && E.normalise(k.split('::').slice(1).join('::')) === E.normalise(name));
  catalogue = recipes.map(r => { const key = namedPrice(r.name, 'Cocktails'); return { id: 'cocktail:' + E.normalise(r.name), name: r.name, category: 'drink', price: key ? priceFor([key]) : null, cost: E.unitCost(r, costing) }; });
  for (const d of data.drinks || []) { const food = /food|snack/i.test(d.category || '') || /hot dog|sandwich|nachos|peanuts|s'mores|skittles/i.test(d.name); const keys = ['Soft Drinks', 'Beer & Cider', 'Spirits & Alcohol', 'Other Drinks', 'More Drinks', 'Food & Snacks'].map(g => g + '::' + d.id); catalogue.push({ id: 'menu:' + d.id, name: d.name, category: food ? 'food' : 'drink', price: priceFor(keys) ?? (E.amount(d.price) ? Number(d.price) : null), cost: E.unitCost(d, costing) }); }
  const groups = ['Soft Drinks', 'Beer & Cider', 'Spirits & Alcohol', 'Other Drinks', 'More Drinks', 'Food & Snacks'];
  for (const key of Object.keys(prices)) {
    const [group, id] = key.split('::');
    if (!groups.includes(group) || !id || catalogue.some(x => x.id === 'menu:' + id)) continue;
    const names = { hotdog: 'Hot Dog', smores: "S'mores", ham_sandwich: 'Ham Sandwich', salted_peanuts: 'Salted Peanuts' };
    const name = names[id] || id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    catalogue.push({ id: 'menu:' + id, name, category: group === 'Food & Snacks' ? 'food' : 'drink', price: priceFor([key]), cost: E.unitCost({ name }, costing) });
  }
  catalogue.sort((a, b) => a.name.localeCompare(b.name));
}
let publicData;
if (root) {
  base();
  let clockMinute = Math.floor(Date.now() / 60000);
  setInterval(() => { const minute = Math.floor(Date.now() / 60000); if (minute !== clockMinute) { clockMinute = minute; updateLiveClocks(); } }, 1000);
  document.addEventListener('vu:booking-signed-out', () => { state = fresh(); lockedQuote = null; plans = []; customers = []; prices = {}; costing = null; ready = false; render(); });
  document.addEventListener('vu:prices-updated', e => { prices = e.detail || {}; if (publicData) buildCatalogue(publicData); });
  document.addEventListener('vu:costing-updated', e => { costing = e.detail; if (publicData) buildCatalogue(publicData); });
  document.addEventListener('vu:customers-updated', e => { customers = e.detail || []; if (step === 0) render(); });
  document.addEventListener('vu:packages-updated', e => { plans = e.detail || []; ready = true; renderSaved(); renderHolds(); renderSummary(); document.dispatchEvent(new CustomEvent('vu:booking-calendar-updated', { detail: plans.filter(p => p.schema === 2) })); });
  document.addEventListener('vu:booking-data-connected', () => { ready = true; });
  document.addEventListener('vu:booking-settings-updated', e => { settings = { ...E.defaults, ...e.detail }; renderSettings(); renderSummary(); });
  document.addEventListener('vu:booking-settings-result', e => settingsMessage(e.detail));
  document.addEventListener('vu:booking-result', e => { saving = false; if (e.detail.error) message(e.detail.error); else { state = structuredClone(e.detail.record); lockedQuote = structuredClone(state.quote); message('Saved privately. ' + (state.status === 'Draft' ? 'Draft does not hold resources.' : ['Cancelled', 'Released', 'Completed'].includes(state.status) ? 'Resources released.' : 'Date and resources held until you release them.')); } render(); });
  document.addEventListener('vu:package-error', e => { saving = false; ready = false; message('Booking connection failed: ' + e.detail); });
  fetch('data/public.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw Error('Menu unavailable'); return r.json(); }).then(d => { publicData = d; buildCatalogue(d); published = (d.bookings || []).map((b, i) => ({ id: 'published-' + i, title: b.title, status: 'Confirmed', reservations: [{ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString(), resources: b.resources || [] }] })); render(); }).catch(e => message(e.message + '. Refresh before adding drinks.'));
  document.addEventListener('vu:booking-auth-ready', () => document.dispatchEvent(new Event('vu:booking-ready')));
  document.dispatchEvent(new Event('vu:booking-ready'));
  document.dispatchEvent(new Event('vu:pricing-ready'));
}
