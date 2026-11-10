// Convert an event's wall time to an unambiguous instant, independent of the owner's device.
export function eventInstant(value, zone) {
  const wall = Date.parse(value + "Z");
  if (!Number.isFinite(wall)) throw Error("Enter valid event start and end times.");
  const format = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", hourCycle: "h23"
  });
  const local = instant => {
    const p = Object.fromEntries(format.formatToParts(instant).map(part => [part.type, Number(part.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  };
  const offsets = new Set([wall - 86400000, wall, wall + 86400000].map(at => local(at) - at));
  const matches = [...offsets].map(offset => wall - offset).filter(at => local(at) === wall);
  if (matches.length !== 1) throw Error("Choose a time outside the daylight-saving change, or enter the equivalent time in UTC.");
  return matches[0];
}

export function reservationFor(plan) {
  const f = plan.fields;
  const mode = f["vu-pkg-mode"];
  const type = f["vu-pkg-booking-type"];
  const onsite = ["venue", "combined"].includes(type) || Boolean(mode);
  if (!type || !f["vu-plan-name"]?.trim() || !f["vu-plan-customer"]?.trim()) {
    throw Error("Enter the booking type, event name and customer name.");
  }
  if (onsite && !["exclusive", "shared"].includes(mode)) throw Error("Choose exclusive or non-exclusive venue hire.");
  const resources = [];
  for (const [kind, enabled, fee] of [
    ["room", f["vu-pkg-room-enabled"], "vu-pkg-premium-fee"],
    ["booth", f["vu-pkg-booth-enabled"], "vu-pkg-booth-fee"],
    ["van", f["vu-pkg-van-enabled"] || ["mobile", "combined"].includes(type), "vu-pkg-van-fee"],
    ["limo", f["vu-pkg-limo-enabled"] || type === "limo", "vu-pkg-limo-fee"]
  ]) {
    if (!enabled) continue;
    if (["room", "booth"].includes(kind) && !onsite) throw Error("Select a venue mode for room or booth hire.");
    const id = f["vu-pkg-" + kind + "-resource"]?.trim().toLowerCase().replace(/\s+/g, " ");
    if (!id) throw Error("Enter the assigned " + kind + " identifier.");
    if (!f[fee]?.trim() || !Number.isFinite(Number(f[fee])) || Number(f[fee]) < 0 ||
        (kind === "room" && Number(f[fee]) <= 0)) throw Error("Enter a valid " + kind + " hire fee.");
    resources.push(kind + ":" + id);
  }
  if (!f["vu-pkg-timezone"]) throw Error("Select the event time zone.");
  const start = eventInstant(f["vu-pkg-start"], f["vu-pkg-timezone"]);
  const end = eventInstant(f["vu-pkg-end"], f["vu-pkg-timezone"]);
  if (end <= start) throw Error("The event must finish after it starts.");
  return {start, end, onsite, exclusive: mode === "exclusive", resources};
}

export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end &&
    ((a.onsite && b.onsite && (a.exclusive || b.exclusive)) ||
      a.resources.some(resource => b.resources.includes(resource)));
}

export function validateBooking(plan, previous) {
  const f = plan.fields;
  const status = f["vu-pkg-status"];
  const oldStatus = previous?.lifecycle;
  const transitions = {
    Draft: ["Draft", "Quoted", "Cancelled"],
    Quoted: ["Draft", "Quoted", "Confirmed", "Cancelled"],
    Confirmed: ["Confirmed", "Completed", "Cancelled"],
    Completed: [],
    Cancelled: []
  };
  if (!transitions[oldStatus || "Draft"]?.includes(status)) throw Error("That booking status change is unavailable.");
  if (status === "Cancelled") return null;
  if (status === "Draft") return null;
  const reservation = reservationFor(plan);
  if (!plan.pricingComplete || !Number.isFinite(plan.quotedTotal) || !plan.lines?.length) {
    throw Error("Add at least one service or item and complete its pricing before quoting.");
  }
  if (f["vu-pkg-room-enabled"] && plan.quotedTotal <= 0) throw Error("Premium room hire requires a paid quote.");
  if (["Confirmed", "Completed"].includes(status)) {
    const allowed = plan.quotedTotal > 0 ? ["paid"] : ["not-required"];
    if (status === "Confirmed" && f["vu-pkg-deposit"] === true && plan.quotedTotal > 0) allowed.push("deposit-paid");
    if (!f["vu-pkg-agreed"] || !allowed.includes(f["vu-pkg-payment"])) {
      throw Error("Record customer agreement and the required payment before confirming or completing.");
    }
    if (["Quoted", "Confirmed"].includes(oldStatus) && plan.quote !== previous.quote) {
      throw Error("Save the revised quote before confirming it.");
    }
  }
  return status === "Confirmed" ? reservation : null;
}
