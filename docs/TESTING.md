# Validation

## Automated checks

`js/self-test.js` runs at startup and whenever the connector is regenerated. It logs errors only. It verifies all 164 database contacts, unique IDs, side/number consistency, required fields, known categories and related IDs, independent lane position fixtures, the nine power contacts, 68 grounds, critical auxiliary assignments, revision-specific sidebands, the 11/12 key gap, mirror equations, and a one-to-one mapping of all database contacts to SVG elements (including the hidden opposite side).

Start a local HTTP server from the repository root, then open `tests/browser.html`. Seventeen integration checks exercise:

1. Both complete revision profiles and SVG/data mapping.
2. Visible A/B faces, bracket text, mechanical mirroring and physical endpoints.
3. Pointer preview, selection persistence, preview restoration and deselection.
4. Exact pin search, rail search, clock and SMBus aliases, no-match behavior and reset.
5. Search-result navigation to an opposite-side contact.
6. All sixteen four-contact lanes.
7. Combined signal-group and search filtering.
8. Related-contact navigation and explicit host/card direction.
9. Basic and Repair modes.
10. Live revision changes and B12/B30 assignments.
11. Arrow navigation in visual order on both sides, side shortcuts and Escape.
12. Touch-style pointer behavior and Enter activation.
13. Zoom scaling at wide and 390 px embedded viewports.
14. Dual A/B visibility, mirrored mechanics, unique IDs, simultaneous lane highlighting and cross-side selection without leaving dual mode.
15. Magnified neighbors, locked-selection stability, tap selection, visual-order navigation on each face, endpoint bounds and keyboard focus retention.
16. Mobile close-up visibility, Locate and absence of page overflow in dual mode at 390 px.
17. Help dialog state and absence of self-test errors.

These use synthetic DOM events in a real browser; they do not certify physical touchscreen ergonomics or assistive technology behavior.

## Completed local verification (2026-10-13)

- All JavaScript files parsed successfully in a Node VM; both data profiles passed the topology checks.
- Headless installed Chrome loaded the application through HTTP and passed **17 checks, 0 failures** after adding the dual view and mobile close-up.
- Chrome loaded `index.html` directly via `file://`, generated all **164 SVG contacts**, and rendered the inspector without a server.
- Desktop and narrow viewport screenshots were inspected for layout and connector visibility. Horizontal scrolling and zoom are intentional on smaller screens.

Temporary QA artifacts are ignored in `.qa/`. No external runtime dependency was installed.

## Before pinout changes

Verify against the documented revision and independent manufacturer material. Test A/B orientation with the edge downward and bracket visible. Update source references, critical fixtures and documentation together. Check the map, notch and each differential pair rather than relying on a total contact count alone. A passing test proves consistency with the supplied fixtures, not independent electrical certification.
