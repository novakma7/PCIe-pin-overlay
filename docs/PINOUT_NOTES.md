# Pinout and physical orientation

## View convention

The drawing is a schematic elevation of an **add-in card**, contact edge downward. It is not a motherboard slot top view and is not dimensionally suitable for manufacturing.

| View | Visible contacts | Bracket / I/O | Left-to-right order |
| --- | --- | --- | --- |
| Front / component | B | Left | B1 → B82 |
| Back / solder | A | Right | A82 → A1 |

To obtain the back view, turn the card about its vertical axis while keeping the contact edge downward. The renderer mirrors the entire mechanical silhouette and calculates each A-contact position as `width - B_position - finger_width`. Text remains readable. A1 and B1 are opposite faces at the same bracket-end position; switching sides never relabels B1 as A82. GPU components can be placed on either side; use the bracket and key as references. Manually switching sides clears selection. Related-contact navigation preserves the explicitly requested ID and switches side when necessary.

Both A/B mode displays B above A as two independent physical views; it keeps both faces visible during related-pin selection. The mobile close-up is cloned from the corresponding rendered face, removes the row translation and crops around its actual x coordinate. It retains A's mechanical mirror and the notch. Close-up IDs use `focus-A…` / `focus-B…` and never duplicate the main `pin-A…` / `pin-B…` IDs. Previous / Next follows visual order rather than always incrementing the pin number.

## Structural checks

- 82 contacts per face; 164 total. The key is between positions 11 and 12, not an omitted contact.
- +12 V: A2, A3, B1, B2, B3.
- Main +3.3 V: A9, A10, B8. Auxiliary +3.3 V: B10 only.
- REFCLK+: A13; REFCLK−: A14; PERST#: A11; WAKE#: B11.
- SMBus: B5 clock, B6 data. JTAG: B9 TRST#, A5 TCK, A6 TDI, A7 TDO, A8 TMS.
- Presence: A1 PRSNT1#; B17 / B31 / B48 / B81 PRSNT2# for x1 / x4 / x8 / x16 lengths.
- Physical connector endpoints: 18 / 32 / 49 / 82. Presence contact number is not the connector endpoint.
- 68 ground contacts. B82 is reserved; A82 is ground.

## Differential pairs

The CEM transmitter/receiver names refer to the **motherboard**. On a GPU/card, PET is received and PER is transmitted. The UI labels this convention throughout. p = positive half, n = negative half; these do not denote positive and negative supply rails.

| Lane | Host TX / card RX (+, −) | Host RX / card TX (+, −) |
| --- | --- | --- |
| 0 | B14, B15 | A16, A17 |
| 1 | B19, B20 | A21, A22 |
| 2 | B23, B24 | A25, A26 |
| 3 | B27, B28 | A29, A30 |
| 4 | B33, B34 | A35, A36 |
| 5 | B37, B38 | A39, A40 |
| 6 | B41, B42 | A43, A44 |
| 7 | B45, B46 | A47, A48 |
| 8 | B50, B51 | A52, A53 |
| 9 | B54, B55 | A56, A57 |
| 10 | B58, B59 | A60, A61 |
| 11 | B62, B63 | A64, A65 |
| 12 | B66, B67 | A68, A69 |
| 13 | B70, B71 | A72, A73 |
| 14 | B74, B75 | A76, A77 |
| 15 | B78, B79 | A80, A81 |

These are physical connector lane indices. Optional lane reversal and polarity inversion mean they do not necessarily match the silk-screening or silicon ball names of a particular PCB.

## Revision handling

The legacy profile follows CEM 1.1. The modern profile follows the publicly inspected **CEM 4.0 v0.9 draft map**, including CLKREQ# at B12 and optional PWRBRK# at B30. These are reserved in the legacy profile. B5/B6 spelling changes from SMCLK/SMDAT to SMBCLK/SMBDAT; search accepts either spelling. This profile is not a substitute for a current final licensed CEM specification. Revision selection changes records and category colors, not physical geometry.

Reserved does not universally mean NC. Optional functions may be unconnected on a particular board. Never tie a reserved pin to a rail or ground based on this tool.

## Presence and measurements

An x16 card's length-appropriate strap is A1 to B81. Intermediate PRSNT2# positions support shorter cards; do not assume all are strapped on every full-length card. The renderer schematically shortens presence fingers to communicate insertion-detection behavior; exact dimensions require the relevant CEM drawing. Presence does not prove an x16 negotiated electrical link.

Rail values are nominal, not universal power-state guarantees. A powered-off PC can retain standby voltage; unplug every supply before resistance tests. PCIe pairs are AC coupled and high speed. Resistance, diode-mode or DC voltage readings depend on the circuit and power state and cannot alone identify a failed GPU or a working link. Consult schematics and use appropriate differential probing for link quality.
