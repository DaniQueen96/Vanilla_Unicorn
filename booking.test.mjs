import { test } from "node:test";
import assert from "node:assert/strict";
import { eventInstant, overlaps, reservationFor, validateBooking } from "./booking.mjs";

function plan(fields = {}, options = {}) {
  return {
    fields: {
      "vu-pkg-status": "Quoted",
      "vu-pkg-booking-type": "venue",
      "vu-pkg-mode": "shared",
      "vu-plan-name": "Birthday",
      "vu-plan-customer": "Customer",
      "vu-pkg-timezone": "Europe/London",
      "vu-pkg-start": "2027-01-03T20:00",
      "vu-pkg-end": "2027-01-04T00:00",
      "vu-pkg-booth-enabled": true,
      "vu-pkg-booth-resource": "Booth 1",
      "vu-pkg-booth-fee": "50",
      "vu-pkg-payment": "unpaid",
      ...fields
    },
    quote: "quote snapshot",
    lines: [{ name: "VIP booth", quantity: 1, price: 50 }],
    pricingComplete: true,
    quotedTotal: 50,
    ...options
  };
}

test("time zones share an instant and ambiguous or skipped hours require clarification", () => {
  assert.equal(eventInstant("2027-01-03T20:00", "Europe/London"), eventInstant("2027-01-03T15:00", "America/New_York"));
  for (const wall of ["2027-03-28T01:30", "2027-10-31T01:30"]) {
    assert.throws(() => eventInstant(wall, "Europe/London"), /daylight-saving/);
  }
});

test("exclusive events conflict with venue use, while shared events conflict by resource", () => {
  const booth = reservationFor(plan());
  const same = reservationFor(plan({ "vu-pkg-booth-resource": " booth  1 " }));
  const different = reservationFor(plan({ "vu-pkg-booth-resource": "Booth 2" }));
  const exclusive = reservationFor(plan({ "vu-pkg-mode": "exclusive" }));
  const offsite = { ...different, onsite: false, resources: ["van:van 1"] };
  assert.ok(overlaps(booth, same));
  assert.ok(overlaps(exclusive, different));
  assert.ok(overlaps(exclusive, { ...booth, resources: [] }));
  assert.equal(overlaps(booth, different), false);
  assert.equal(overlaps(exclusive, offsite), false);
  assert.equal(overlaps(booth, { ...same, start: booth.end, end: booth.end + 1 }), false);
});

test("mode, assignments and service charges must be explicit", () => {
  assert.throws(() => reservationFor(plan({ "vu-pkg-mode": "" })), /venue hire/);
  assert.throws(() => reservationFor(plan({ "vu-pkg-booth-resource": "" })), /identifier/);
  assert.throws(() => reservationFor(plan({ "vu-pkg-booth-fee": "" })), /hire fee/);
  assert.throws(() => reservationFor(plan({ "vu-pkg-room-enabled": true, "vu-pkg-room-resource": "Main", "vu-pkg-premium-fee": "0" })), /room hire fee/);
  assert.throws(() => reservationFor(plan({ "vu-pkg-booking-type": "combined" })), /van identifier/);
});

test("quotes do not reserve and a confirmed booking needs agreement and payment", () => {
  assert.equal(validateBooking(plan(), null), null);
  const quoted = { lifecycle: "Quoted", quote: "quote snapshot" };
  const confirm = plan({ "vu-pkg-status": "Confirmed", "vu-pkg-agreed": true, "vu-pkg-payment": "paid" });
  assert.ok(validateBooking(confirm, quoted));
  assert.throws(() => validateBooking(confirm, null), /status change/);
  assert.throws(() => validateBooking(plan({ ...confirm.fields, "vu-pkg-payment": "unpaid" }), quoted), /payment/);
  assert.throws(() => validateBooking(plan(confirm.fields, { quote: "revised" }), quoted), /revised quote/);
  const confirmed = { lifecycle: "Confirmed", quote: quoted.quote };
  assert.equal(validateBooking(plan({ "vu-pkg-status": "Cancelled" }), confirmed), null);
  assert.equal(validateBooking(plan({ ...confirm.fields, "vu-pkg-status": "Completed" }), confirmed), null);
});

test("deposit and complimentary arrangements use distinct payment states", () => {
  const quoted = { lifecycle: "Quoted", quote: "quote snapshot" };
  const confirm = { "vu-pkg-status": "Confirmed", "vu-pkg-agreed": true };
  assert.ok(validateBooking(plan({ ...confirm, "vu-pkg-payment": "deposit-paid", "vu-pkg-deposit": true }), quoted));
  assert.throws(() => validateBooking(plan({ ...confirm, "vu-pkg-payment": "deposit-paid" }), quoted), /payment/);
  assert.ok(validateBooking(plan({ ...confirm, "vu-pkg-payment": "not-required", "vu-pkg-booth-fee": "0" }, {
    quotedTotal: 0, lines: [{name:"VIP booth",quantity:1,price:0}]
  }), quoted));
});
