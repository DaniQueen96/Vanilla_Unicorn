# Vanilla Unicorn booking checklist

Scope and acceptance criteria are recorded in [issue #25](https://github.com/DaniQueen96/Vanilla_Unicorn/issues/25).

| Area | At audit | In this change |
| --- | --- | --- |
| Six-step bespoke planner | Present. Saving omitted catering, service notes and the final price snapshot. | Persists the full plan, line items, terms and quote total. Existing drafts remain readable. |
| Enquiries and customer profiles | In-city contact and owner-managed till profiles existed separately. | Customers can prepare a copyable enquiry for the existing in-city number. Owners can save and revise the plan and link a reusable customer profile when consent is recorded. |
| Approval, lifecycle and payments | Status was a label, with no reservation or payment validation. | Draft, quoted, confirmed, completed and cancelled states. Confirmation requires a saved quote, recorded agreement and the appropriate payment state. |
| Venue, premium room and VIP booths | Generic venue hire existed. There was no closure mode or named booth/room reservation. | Exclusive or shared venue hire, paid premium rooms and individually priced booth reservations. An owner can record a complimentary booth or discount and its reason. |
| Transport and events | Van and limo quote options existed. Availability used published static data. | Assign transport identifiers and check actual overlap on confirmation. Public event publishing also checks exclusive venue closure. |
| Billing and terms | Copyable quote existed. | Copyable billing/receipt text uses the saved quote. The owner can set defaults and record the terms agreed for each booking. |
| Till and package pricing | Separate catalogue keys caused mismatches for some cocktails and snacks. | Uses the till's catalogue identifiers for shared items and the saved selling prices and active specials. The price catalogue and owner-set prices were not edited. |
| Public site and gallery | Service copy, phone contact, venue carousel, memory albums and drinks menus existed. | Advertises booth, venue and transport hire at prices on enquiry, adds the enquiry message form and fixes featured-photo navigation during rapid image loads. |
| Access | Owner-only Firestore storage for plans and customer data. | Booking data and the private schedule use the existing owner-only rules. Public enquiry preparation stays in the browser. |

## Owner checks before rollout

- [ ] Confirm the identifiers to use for each physical room, booth, cocktail van and limousine. Reuse the same identifier for every booking of that resource. Staff should confirm DJ and dancer availability separately.
- [ ] Review older plans labelled Confirmed or Completed. These predate reservations and require manual reconciliation. Older public events are assumed to use UK time.
- [ ] Record the applicable deposit, cancellation and refund terms. Existing in-city payment collection remains the source of truth.
- [ ] Run one test booking as the owner and confirm staff cannot read or change it. Verify the draft, quote, confirmation, conflict, receipt and cancellation against the deployed Firebase project with a test record.
- [ ] Add actual in-game photos before publishing the separate VIP Experiences & Services TV poster.

The public enquiry form prepares a message to send in city. Delivery and quote responses are handled by management at the existing number.

Run the booking rule tests with `node --test booking.test.mjs`. GitHub Pages deploys from `main`. Confirm the deployed revision and smoke-test the public and owner flows before marking them live.
