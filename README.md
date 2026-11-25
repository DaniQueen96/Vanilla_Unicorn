# Vanilla Unicorn — VU Staff Hub

Free GitHub Pages staff calculator for the FiveM Vanilla Unicorn business.

## Features
- Quick drinks and bulk order quotes
- Cocktail recipe book (populates as recipes are confirmed)
- Event packages and customer quote copying
- Read-only booking schedule and overlap checking per resource
- Limousine pricing (inactive until vehicles and rates are confirmed)
- Agreed tip splitting

## Publish the website
Open Settings → Pages → Build and deployment, select **Deploy from a branch**, choose **main** and **/(root)**, then Save.

Expected website: https://DaniQueen96.github.io/Vanilla_Unicorn/

## Update staff-facing information
Edit `data/public.json` in GitHub. Every drink has `price: null` until you determine its **selling price**. A price set to `null` cannot be included in customer quotes. Do not replace these values with the store's purchase costs.

Recipes can be published as `{"name":"Cocktail","ingredients":[{"name":"Vodka","quantity":1}]}` after confirming in-game crafting requirements.

Services use `{"id":"venue","name":"Private venue hire","price":5000}`.

Vehicles use `{"id":"limo-1","name":"Limousine 1","hourlyPrice":1000,"active":true}`.

Bookings use `{"title":"Birthday party","start":"2026-11-14T20:00","end":"2026-11-14T23:00","resources":["venue"]}`. Add resources to the `resources` array when assigning unique workers or vehicles.

## Security and limitations
This is a **public** site. Never commit private purchase costs, profit margins, personal contact details, access tokens or passwords to this repository. Owner-only ingredient costing must stay in a separate private workspace.

Staff cannot edit shared data using the website. Only authorized GitHub contributors can update the published catalogue and booking JSON. Availability checks reflect the **last published** booking file, not a live booking system, and checking availability does not reserve a slot. Confirm all customer bookings with management before promising availability. Overlap is detected when requested start is before an existing booking's end and requested end is after its start for the same resource.

This repository does not include an owner-only profit calculator yet.

## Owner package creator (November 2026)

The authenticated owner workspace now uses a three-step creator: Customer & event,
Build package, and Review & save. Select any combination of fixed-fee cocktail
truck, limousine, premium room, VIP booths or whole-venue hire. Whole-venue hire
includes and reserves the room and both booths.

Pricing rules are in the creator's owner-only settings. Truck/limo starting rates
and discounts are explicitly **trial** until approved; room/booth/venue/delivery
rates are unset. Menu prices and ingredient costs come from the existing private
Firebase records. Unknown costs disable savings and profit estimates. Bundle and
bulk offers do not stack; an eligible included-drinks offer competes with the
normal discount. Colour changes cover both application and restoration.

`packagePlans` holds complete versioned booking snapshots. `ownerSettings/packagePricing`
holds the owner's rules; `ownerSettings/packageReservations` serialises resource holds
in a Firestore transaction. Incomplete drafts do not reserve resources. Saved enquiries
hold resources without expiry; cancellation/release/completion frees them. Cross-device
revision checks prevent stale edits from overwriting newer bookings. Customer directory
entries are only created when permission to save details is selected. Existing legacy
plans remain intact and can be used as a reference when rebuilding a new booking.

Start/end times use IANA time zones with explicit repeated-clock occurrence selection.
Calendar holds appear in UK time; the customer quote includes converted times. Booking
payments, refunds and refundable vehicle damage deposits are recorded separately. This
is a recordkeeping and quoting tool, not a payment processor or live bar-tab integration.

The creator and private costing remain owner-only. The repository contains no actual
customer records or private saved prices. Existing deployed Firestore owner-only rules
must match `firebase/firestore.rules`; changes here do not deploy Firebase rules.

Run `node --test tests/*.test.cjs` and `node --check` on modified JavaScript files.
Persistence tests use an in-memory Firestore adapter; they do not replace a signed-in
production test. Browser QA uses synthetic data without touching live bookings.
