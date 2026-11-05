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
