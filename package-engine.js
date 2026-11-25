/* Shared, deterministic quote rules. No customer data or private prices are stored in source. */
(function (root) {
  'use strict';
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const amount = n => n !== '' && n != null && Number.isFinite(Number(n)) && Number(n) >= 0;
  const normalise = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\(n\/a\)/g, '').replace(/[^a-z0-9]/g, '');
  const defaults = { approved: false, truckPurchase: null, limoPurchase: null, truck: 1500, limo: 2000, premium: null, booth: null, venue: null, fuel: 100, delivery: null, returnJourney: 0, extraStop: 0, smallDiscount: 2, largeDiscount: 5, maxDiscount: 8, bulkQuantity: 50, bulkDiscount: 5, minimumMargin: 20, minimumProfit: 0, includedDrinks: 0 };
  function unitCost(item, costing) {
    if (!costing?.prices) return null;
    const recipe = (costing.recipes || []).find(r => normalise(r.name) === normalise(item.name));
    if (recipe) {
      if (!amount(recipe.yieldCount) || Number(recipe.yieldCount) <= 0 || !recipe.ingredients?.length) return null;
      let total = 0;
      for (const ingredient of recipe.ingredients) {
        const p = costing.prices[ingredient.name];
        if (!amount(p) || !amount(ingredient.qty) || Number(ingredient.qty) <= 0) return null;
        total += Number(p) * Number(ingredient.qty);
      }
      return total / Number(recipe.yieldCount);
    }
    const pair = Object.entries(costing.prices).find(([name]) => normalise(name) === normalise(item.name));
    return pair && amount(pair[1]) ? Number(pair[1]) : null;
  }
  function wallTime(value, zone, occurrence = 'earlier') {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || '')) throw Error('Enter a date and time.');
    const [y, mo, d, h, m] = value.split(/[-T:]/).map(Number), wall = Date.UTC(y, mo - 1, d, h, m);
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const asWall = instant => { const p = Object.fromEntries(formatter.formatToParts(new Date(instant)).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)])); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute); };
    const candidates = new Set();
    for (let hours = -36; hours <= 36; hours += 6) { const at = wall + hours * 3600000, candidate = wall - (asWall(at) - at); if (asWall(candidate) === wall) candidates.add(candidate); }
    const sorted = [...candidates].sort((a, b) => a - b);
    if (!sorted.length) throw Error('This local time does not exist because the clocks change. Choose another time.');
    return { iso: new Date(occurrence === 'later' ? sorted.at(-1) : sorted[0]).toISOString(), ambiguous: sorted.length > 1 };
  }
  const formatTime = (iso, zone) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  function intervals(draft) {
    const result = [], errors = [], b = draft.customer || {}, services = draft.services || {};
    for (const [key, service] of Object.entries(services)) {
      if (!service.enabled) continue;
      try {
        const start = wallTime(service.start || b.start, b.zone || 'Europe/London', b.occurrence).iso;
        const end = wallTime(service.end || b.end, b.zone || 'Europe/London', b.occurrence).iso;
        if (start >= end) throw Error('Return / end time must be after the start.');
        let resources = key === 'venue' ? (service.space === 'venue' ? ['venue', 'premium', 'booth1', 'booth2'] : service.space === 'booths' ? [service.booth1 ? 'booth1' : null, service.booth2 ? 'booth2' : null].filter(Boolean) : ['premium']) : [key];
        if (!resources.length) throw Error('Choose at least one VIP booth.');
        if ((key === 'limo' && service.driver === 'vu') || (key === 'truck' && service.staffed)) resources.push('owner');
        if (key === 'truck' && service.delivery === 'delivery' && !service.staffed) {
          // Reserve the owner's handover/collection windows rather than the entire hire.
          result.push({ start, end: new Date(new Date(start).getTime() + 30 * 60000).toISOString(), resources: ['owner'], service: 'Truck delivery' });
          result.push({ start: new Date(new Date(end).getTime() - 30 * 60000).toISOString(), end, resources: ['owner'], service: 'Truck collection' });
        }
        result.push({ start, end, resources, service: key });
      } catch (e) { errors.push(key + ': ' + e.message); }
    }
    return { reservations: result, errors };
  }
  function conflicts(requested, existing, ignoreId) {
    const found = [];
    for (const [i, a] of requested.entries()) {
      for (const b of requested.slice(i + 1)) if (a.start < b.end && a.end > b.start && a.resources.some(r => b.resources.includes(r))) found.push('Your selected services overlap and need the same vehicle, space or driver.');
      for (const booking of existing) {
        if (booking.id === ignoreId || ['Cancelled', 'Completed', 'Draft', 'Released'].includes(booking.status)) continue;
        for (const b of booking.reservations || []) if (a.start < b.end && a.end > b.start && a.resources.some(r => b.resources.includes(r))) found.push('Overlaps ' + (booking.title || 'an existing booking') + ' (' + booking.status + ').');
      }
    }
    return [...new Set(found)];
  }
  function quote(draft, rawSettings = {}) {
    const s = { ...defaults, ...rawSettings }, lines = [], missing = [], costMissing = [], pending = [];
    const services = draft.services || {};
    function add(name, price, cost, category, quantity = 1) {
      if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) { missing.push(name + ' quantity'); return; }
      if (!amount(price)) missing.push(name);
      if (!amount(cost)) costMissing.push(name);
      lines.push({ name, price: amount(price) ? Number(price) : null, cost: amount(cost) ? Number(cost) : null, quantity: Number(quantity), category });
    }
    for (const [key, v] of Object.entries(services)) {
      if (!v.enabled) continue;
      if (key === 'truck') {
        add('Mobile cocktail truck hire', s.truck, Number(v.fuel ?? s.fuel) + Number(v.labour || 0), 'hire');
        if (v.delivery === 'delivery') add('Truck delivery and collection', s.delivery, Number(v.deliveryCost || 0), 'delivery');
      }
      if (key === 'limo') {
        add('Limousine hire', s.limo, Number(v.fuel ?? s.fuel) + Number(v.labour || 0), 'hire');
        if (v.journey === 'return') add('Return journey', s.returnJourney, 0, 'journey');
        if (Number(v.stops) > 0) add('Additional limo stops', s.extraStop, 0, 'journey', Number(v.stops));
        if (v.colourEnabled) {
          const known = amount(v.colourCost) && amount(v.restoreCost);
          const cost = known ? Number(v.colourCost) + Number(v.restoreCost) : null;
          add('Custom limo colour' + (v.colour ? ': ' + v.colour : '') + ' (includes restoration)', cost, cost, 'colour');
        }
      }
      if (key === 'venue') {
        const fee = v.space === 'venue' ? s.venue : v.space === 'booths' ? s.booth : s.premium;
        const count = v.space === 'booths' ? Number(!!v.booth1) + Number(!!v.booth2) : 1;
        if (!count) missing.push('Choose a VIP booth');
        else add(v.space === 'venue' ? 'Exclusive whole venue — premium room and both booths included' : v.space === 'booths' ? 'Exclusive VIP booth reservation' : 'Exclusive premium room hire', fee, Number(v.expenses || 0) / count, 'hire', count);
        if (v.bar === 'tab') add('Organiser prepaid bar allowance', v.tabLimit, v.tabCost, 'tab');
      }
      for (const item of draft.items || []) if (item.service === key && Number(item.quantity) > 0) { add(item.name, item.price, item.cost, item.category, item.quantity); lines.at(-1).service = key; }
    }
    for (const extra of draft.extras || []) {
      if (extra.status !== 'Confirmed') pending.push(extra.name || 'Requested supplier');
      add(extra.name || 'Requested supplier', extra.price, extra.cost, 'supplier', Number(extra.quantity || 1));
    }
    const subtotal = round(lines.reduce((n, l) => n + (l.price || 0) * l.quantity, 0));
    const costs = round(lines.reduce((n, l) => n + (l.cost || 0) * l.quantity, 0));
    const complete = !missing.length, costComplete = !costMissing.length;
    const categories = new Set(lines.filter(l => l.price > 0 && !['hire', 'journey', 'delivery', 'tab'].includes(l.category)).map(l => l.category));
    const serviceCount = Object.values(services).filter(v => v.enabled).length;
    const extrasCount = categories.size + Math.max(0, serviceCount - 1);
    const rate = Math.min(Number(s.maxDiscount), extrasCount >= 3 ? Number(s.maxDiscount) : extrasCount >= 2 ? Number(s.largeDiscount) : extrasCount ? Number(s.smallDiscount) : 0);
    // Only margin-bearing lines can fund savings; colour restoration and bar tabs are pass-through costs.
    const eligible = lines.filter(l => !['colour', 'tab', 'delivery'].includes(l.category));
    const eligibleTotal = eligible.reduce((n, l) => n + (l.price || 0) * l.quantity, 0);
    const drinks = lines.filter(l => l.category === 'drink'), drinkCount = drinks.reduce((n, l) => n + l.quantity, 0);
    const bulkSaving = drinkCount >= Number(s.bulkQuantity) ? drinks.reduce((n, l) => n + (l.price || 0) * l.quantity, 0) * Number(s.bulkDiscount) / 100 : 0;
    const minimum = Math.max(costs + Number(s.minimumProfit), costs / (1 - Math.min(90, Math.max(0, Number(s.minimumMargin))) / 100));
    const headroom = Math.max(0, subtotal - minimum);
    let includedSaving = 0, includedCount = 0; const includedItems = [];
    if (services.venue?.enabled && extrasCount && costComplete && complete) {
      for (const l of drinks.filter(l => l.service === 'venue').sort((a, b) => a.price - b.price)) {
        const count = Math.min(l.quantity, Math.max(0, Number(s.includedDrinks) - includedCount), l.price > 0 ? Math.floor((headroom - includedSaving) / l.price) : 0);
        includedCount += count; includedSaving += count * l.price; if (count) includedItems.push({ name: l.name, quantity: count });
      }
    }
    const discountSaving = Math.max(eligibleTotal * rate / 100, bulkSaving);
    const useIncluded = includedSaving > discountSaving;
    const saving = complete && costComplete ? round(Math.min(headroom, useIncluded ? includedSaving : discountSaving)) : 0;
    const total = round(subtotal - saving), profit = complete && costComplete ? round(total - costs) : null;
    const payment = draft.payment || {}, paid = Math.max(0, Number(payment.paid) || 0), refund = Math.max(0, Number(payment.refund) || 0);
    const deposit = payment.mode === 'deposit' ? round(Math.min(total, payment.depositType === 'percent' ? total * Math.min(100, Number(payment.deposit) || 0) / 100 : Number(payment.deposit) || 0)) : total;
    return { includedItems: useIncluded && saving > 0 ? includedItems : [], lines, subtotal, costs, complete, costComplete, missing, costMissing, pending, saving, total, profit, minimum, offer: saving ? useIncluded ? includedCount + ' drinks included in package' : 'Automatic bundle / bulk saving' : 'Standard pricing', balance: round(Math.max(0, total - paid + refund)), paid, refund, deposit, damageDeposit: Math.max(0, Number(payment.damageDeposit) || 0), approved: !!s.approved, shortfall: complete && costComplete ? round(Math.max(0, minimum - total)) : null };
  }
  const api = { round, amount, normalise, defaults, unitCost, wallTime, formatTime, intervals, conflicts, quote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VUPackageEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
