# PCIe x16 Interactive Pinout & Repair Assistant

A standalone, offline reference for the 164 contacts of the PCI Express x16 add-in card edge connector. Inspect signals, follow differential pairs and check physical orientation while diagnosing hardware. Vanilla HTML, CSS, JavaScript and SVG; no build step, backend, package dependencies, CDN or telemetry.

> **Screenshot placeholder:** add an application screenshot here when preparing your repository listing. The application itself is fully implemented.

## Features

- Complete A1–A82 and B1–B82 database with source provenance.
- Component-side B and solder-side A views with physically mirrored PCB, bracket, notch and contact positions.
- Both A/B mode shows the two physical views together: component B above, mirrored solder A below.
- Mobile contact close-up with enlarged neighbors, visual-order Previous / Next buttons and Locate.
- Individually interactive SVG contacts; hover/focus preview and click/tap selection.
- Basic and Repair modes, related-pin navigation across both sides.
- Search by pin, signal, aliases and category, combined with group and lane filters.
- Lane 0–15 visualization including both PET and PER pairs.
- Zoom, horizontal scrolling, keyboard navigation and mobile layout.
- CEM 1.1 legacy profile and CEM 4.0 v0.9 draft pin-map profile.
- Automatic startup checks plus a dependency-free browser integration test page.

## Usage

Open `index.html`. Keep the card edge pointing down. In the front/component view, the bracket is on the left and B1 is nearest it. In the back/solder view, the bracket moves to the right and A1 remains nearest it. The key always separates positions 11 and 12.

Hover or focus a finger to preview its function. Click, tap, Enter or Space locks the contact; selecting it again releases it. Search covers both sides; matching contacts on the visible side are highlighted and the results list can select contacts on the other side. Filters combine with search and lane selection. A locked contact remains outlined even if it does not match a filter. Selecting related contacts opens their actual side. Manually changing sides clears selection to avoid conflating A and B contacts.

**Direction convention:** PET is motherboard TX → card RX; PER is card TX → motherboard RX. The labels do not describe the GPU's TX/RX perspective.

Choose **Both A/B** to display both physical faces at once. Each row keeps its own bracket, key and numbering; these are two views of a turned PCB, not a transparent overlay. Selecting related pins on the opposite side preserves this mode, so all four lane contacts remain visible and highlighted. Arrow navigation follows the face of the selected or focused contact.

On screens up to 800 px wide, the **Contact close-up** shows enlarged contacts around the locked selection. Tap a neighbor to select it, or use **Previous / Next**, which follow left-to-right visual order (ascending on B, descending on A). The buttons stop at the connector ends. **Locate** scrolls the full connector to the selected contact. Hover previews do not move this close-up, and the key gap is preserved when it lies in the magnified area.

## Repair Mode

Repair mode adds side, category, direction, nominal rail/function, electrical information, measurement guidance, accessible test-point suggestions, warnings and related pins. Test-point locations must be found in the device schematic. No model-specific resistance values or universal fault thresholds are supplied.

Main and auxiliary rail behavior depends on platform power state. High-speed data and clock signals cannot be validated with a DC multimeter. Switch to Basic mode for just the pin ID, signal and function.

## Pin categories

Power, Ground, PCIe TX (host), PCIe RX (host), Reference clock, Control, SMBus / management, Presence detect, Reserved, and JTAG / test. Colors are accompanied by text in the legend, inspector, results and accessible contact labels. The Management filter includes JTAG; the lane filter includes TX and RX.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Left / Right | Previous / next contact in visual order |
| Enter / Space | Toggle a focused contact |
| Esc | Clear selection (or close the Help dialog) |
| F / B | Front / back |
| D | Show both A/B physical views |
| / | Focus search |
| ? | Open Help |

Shortcuts do not intercept typing in inputs or selects. Tab reaches controls and the connector's current contact; arrow keys navigate its fingers.

## Running locally

Double-click `index.html` to run directly using `file://`. Classic deferred scripts expose small shared namespaces, so there are no ES-module or JSON-fetch origin restrictions. All runtime assets are local. Keep the entire directory together.

An optional HTTP preview:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8765/`. To run integration tests, visit `http://127.0.0.1:8765/tests/browser.html`. The test harness uses an iframe and requires HTTP to inspect it across normal browser origin restrictions. The application itself works directly from `file://`. The test page temporarily exercises an embedded copy of the application and reports pass/fail results. Startup self-tests report **errors only** in the browser console.

## GitHub Pages deployment

Commit these files into a repository. In **Settings → Pages**, select **Deploy from a branch**, choose the desired branch and **/(root)**, then save. All URLs are relative, so project Pages under a repository subpath work. `.nojekyll` disables unnecessary Jekyll processing. No build action is required. No repository or hosting service is created automatically by this local project.

## Architecture

```text
.
├── index.html
├── css/style.css
├── data/pcie-x16-pins.js
├── js/
│   ├── app.js
│   ├── connector.js
│   ├── search.js
│   └── self-test.js
├── assets/favicon.svg
├── docs/
│   ├── SOURCES.md
│   ├── PINOUT_NOTES.md
│   └── TESTING.md
├── tests/
│   ├── browser.html
│   └── browser-tests.js
├── .gitignore
├── .nojekyll
├── README.md
└── LICENSE
```

`PCIeData` contains complete baseline signal arrays, revision overrides, category metadata and a record builder. Each generated record has pin, side, number, signal, lane, polarity, category, direction, voltage, description, electrical information, diagnostic notes, warnings, suggested test points, related pins and source IDs. `PCIeConnector` generates the SVG and mechanical view; `PCIeSearch` handles matching; `app.js` handles selection and UI state; `PCIeSelfTest` verifies topology and the SVG/data relationship.

Connector metadata contains x1/x4/x8/x16 physical endpoints. Additional widths require their own renderer parameters and width-aware presence handling; they are not exposed as completed features. Revision overrides are separate from geometry. Nullable `measurementExtensions` fields reserve space for future measured resistance, sourced expected ranges, sequencing and device notes without inventing those values today.

## Data sources

See [source provenance](docs/SOURCES.md) and [pinout notes](docs/PINOUT_NOTES.md). PCI-SIG is the normative authority. Publicly readable copies of PCI-SIG-authored CEM documents and manufacturer material were used for verification. The modern profile is explicitly tied to a **4.0 v0.9 draft**, not the latest licensed final specification. Do not assume every optional signal is implemented on a particular card.

## Contributing

Pinout changes need a traceable document revision, table/page reference and explicit direction convention. Keep physical contact IDs stable. Add a separate revision profile for repurposed pins and run the browser tests. Check both sides, mobile scrolling and keyboard access. Do not add speculative GPU resistance thresholds. See [testing](docs/TESTING.md).

## License

Project code, original illustrations and original explanatory text are licensed under the [MIT License](LICENSE). Referenced third-party specifications and drawings retain their own licenses and are not bundled.

## Disclaimer

This is an auxiliary repair reference provided without warranty, not a certified PCI-SIG compliance tool or a substitute for board schematics. Incorrect probing can damage hardware. Disconnect all power before resistance measurements, discharge capacitors and avoid bridging adjacent fingers. Standby supplies can persist in soft-off. High-speed differential signals require appropriate equipment. A resistance value alone does not prove a fault.
