# Source provenance

Reviewed on 2026-10-13. Pin assignments are factual transcriptions with original explanatory prose; no third-party drawings or specification PDFs are redistributed. PCI-SIG owns the normative specifications. Public mirrors below are third-party hosts of PCI-SIG-authored documents; their OCR is not an authoritative final release. Obtain the appropriate licensed final document for compliance work.

## Normative authority

[PCI-SIG CEM specification overview](https://pcisig.com/specification-overview/pci-express-cem) identifies the CEM revision family and approved releases. Full final specifications can require member access or licensed purchase. This project does **not** claim validation against CEM 6.x or certification by PCI-SIG.

## Signal and mechanical maps

| ID | Document / location | Verification scope |
| --- | --- | --- |
| `cem11` | [PCI-SIG CEM 1.1, public mirror](https://studylib.net/doc/27781038/pci-express-card-electromechanical-specification-rev-1.1), Table 5-1, pp. 53–56; §5.1; Figures 5-1–5-3; §§2–4 | Baseline 164-contact map; power, grounds, lanes, JTAG aliases, SMBus, reset, clock, wake, presence and key. B12 and B30 are reserved. |
| `cem40draft` | [PCI-SIG CEM 4.0 v0.9 draft, public mirror](https://studylib.net/doc/27755779/pcie-cem-spec-r4-v9-12072018-ncb), Table 37, pp. 86–88; §6.1; §§2–4 | Modern profile: B12 CLKREQ#, B30 PWRBRK#, SMBCLK/SMBDAT spelling. PET/PER direction is explicitly defined immediately after Table 37. Draft provenance is visible in the UI. |
| `arbor` | [ARBOR PBE-1702 QIG v1.2](https://www.arbor-technology.com/storage/media/docs/QIG/Embedded_Computing/PBE-1702_QIG_V12_20141029.pdf), printed p. 14, PCEG1 table | Manufacturer cross-check of power, presence endpoints, lane positions and A82/B82. Its A59–A62 labels contain apparent typographical mistakes; use CEM positions A60/A61 for lane 10. Its older PWRGD label is not adopted as the CEM reset name. |
| `3m` | [3M drawing 78-5100-2520-4 rev B](https://www.farnell.com/datasheets/1651413.pdf), sheets 1–2 | Independent check of mirrored A/B endpoints, 164 positions, key after 11 and pair locations. B82 is described inconsistently as hot-plug detect on sheet 2; CEM and ARBOR identify it as reserved, which this project uses. |

The CEM 1.1 mirror's B28 text reads PETn0 despite its lane-3 context. The neighboring PETp3 and independent manufacturer lane-3 tables establish PETn3. This correction is explicitly covered by self-test assertions. Manufacturer tables and OCR therefore cannot be used uncritically as an automatic import.

## Electrical cross-checks

- [Intel 81341/81342 design guide](https://www.intel.com/content/dam/www/public/us/en/documents/guides/81341-81342-i-o-processors-design-guide.pdf), §11.1.1, p. 96: transmitter AC coupling and TX-to-RX pairing. Its device-specific component values are deliberately not turned into generic repair thresholds.
- [Microchip PCI12000 hardware design checklist DS00005168](https://ww1.microchip.com/downloads/aemDocuments/documents/UNG/ProductDocuments/DesignChecklist/PCI12000-Hardware-Design-Checklist-DS00005168.pdf): searchable manufacturer excerpt independently associates optional CLKREQ# with standard edge pin B12. Full PDF retrieval was unavailable during review; it is supplementary, not the sole basis of the map.

## Attribution by field

Signal positions and aliases come from the selected CEM table. Side conventions and key location are checked against the mechanical drawings. Lane direction uses CEM §5.1 / §6.1 and names the host and card explicitly. Auxiliary functions, standby behavior and presence handling use CEM §§2–4. Nominal rail voltages are from the pin table; displayed logic levels describe a domain rather than a guaranteed measurement. Diagnostic advice and suggested test-point types are general engineering guidance, not board-specific standard requirements. No expected resistance ranges are asserted.
