/* Original factual transcription; see docs/SOURCES.md. No runtime network requests. */
(function (root) {
  'use strict';
  const categories = {
    power: { label: 'Power', color: '#f1b35b' }, ground: { label: 'Ground', color: '#8092a8' },
    tx: { label: 'PCIe TX (host)', color: '#77b8ff' }, rx: { label: 'PCIe RX (host)', color: '#b89afe' },
    clock: { label: 'Reference clock', color: '#ed91c2' }, control: { label: 'Control', color: '#70dbc0' },
    management: { label: 'SMBus / management', color: '#64d5e7' }, presence: { label: 'Presence detect', color: '#d3d477' },
    reserved: { label: 'Reserved', color: '#6e7683' }, jtag: { label: 'JTAG / test', color: '#da9f7c' }
  };
  // CEM 1.1 baseline. Position in each array is physical contact number minus one.
  const signals = {
    A: [
      'PRSNT1#', '+12V', '+12V', 'GND', 'TCK', 'TDI', 'TDO', 'TMS', '+3.3V', '+3.3V', 'PERST#',
      'GND', 'REFCLK+', 'REFCLK-', 'GND', 'PERp0', 'PERn0', 'GND',
      'RSVD', 'GND', 'PERp1', 'PERn1', 'GND', 'GND', 'PERp2', 'PERn2', 'GND', 'GND', 'PERp3', 'PERn3', 'GND', 'RSVD',
      'RSVD', 'GND', 'PERp4', 'PERn4', 'GND', 'GND', 'PERp5', 'PERn5', 'GND', 'GND', 'PERp6', 'PERn6', 'GND', 'GND', 'PERp7', 'PERn7', 'GND',
      'RSVD', 'GND', 'PERp8', 'PERn8', 'GND', 'GND', 'PERp9', 'PERn9', 'GND', 'GND', 'PERp10', 'PERn10', 'GND', 'GND', 'PERp11', 'PERn11',
      'GND', 'GND', 'PERp12', 'PERn12', 'GND', 'GND', 'PERp13', 'PERn13', 'GND', 'GND', 'PERp14', 'PERn14', 'GND', 'GND', 'PERp15', 'PERn15', 'GND'
    ],
    B: [
      '+12V', '+12V', '+12V', 'GND', 'SMCLK', 'SMDAT', 'GND', '+3.3V', 'TRST#', '+3.3Vaux', 'WAKE#',
      'RSVD', 'GND', 'PETp0', 'PETn0', 'GND', 'PRSNT2#', 'GND',
      'PETp1', 'PETn1', 'GND', 'GND', 'PETp2', 'PETn2', 'GND', 'GND', 'PETp3', 'PETn3', 'GND', 'RSVD', 'PRSNT2#', 'GND',
      'PETp4', 'PETn4', 'GND', 'GND', 'PETp5', 'PETn5', 'GND', 'GND', 'PETp6', 'PETn6', 'GND', 'GND', 'PETp7', 'PETn7', 'GND', 'PRSNT2#', 'GND',
      'PETp8', 'PETn8', 'GND', 'GND', 'PETp9', 'PETn9', 'GND', 'GND', 'PETp10', 'PETn10', 'GND', 'GND', 'PETp11', 'PETn11', 'GND', 'GND',
      'PETp12', 'PETn12', 'GND', 'GND', 'PETp13', 'PETn13', 'GND', 'GND', 'PETp14', 'PETn14', 'GND', 'GND', 'PETp15', 'PETn15', 'GND', 'PRSNT2#', 'RSVD'
    ]
  };
  const safety = 'Disconnect all power and discharge capacitors before resistance or continuity tests. Avoid shorting adjacent contacts.';
  const highSpeed = 'High-speed differential signal. A multimeter DC or resistance reading cannot establish link integrity; AC coupling, terminations and power state affect readings.';
  const optional = 'Implementation is optional. Verify routing and pull-ups against the board schematic; an unused function is not necessarily a fault.';
  const profiles = {
    legacy: { label: 'CEM 1.1', source: 'cem11', overrides: {} },
    modern: { label: 'CEM 4.0 v0.9 draft', source: 'cem40draft', overrides: { B12: 'CLKREQ#', B30: 'PWRBRK#', B5: 'SMBCLK', B6: 'SMBDAT' } }
  };
  function describe(pin, signal) {
    const laneMatch = /^(PET|PER)(p|n)(\d+)$/.exec(signal);
    const base = { pin, side: pin[0], number: Number(pin.slice(1)), signal, lane: null, polarity: null, voltage: null,
      measurementExtensions: { measuredResistanceToGround: null, expectedResistanceRange: null, expectedVoltage: null, powerSequencing: null, deviceNotes: null },
      warnings: [safety], diagnosticNotes: [], testPoints: [], aliases: [] };
    if (laneMatch) {
      const tx = laneMatch[1] === 'PET';
      base.lane = Number(laneMatch[3]); base.polarity = laneMatch[2] === 'p' ? '+' : '-'; base.category = tx ? 'tx' : 'rx';
      base.direction = tx ? 'Motherboard TX → add-in card RX' : 'Add-in card TX → motherboard RX';
      base.description = `Lane ${base.lane}, ${base.polarity} half of the ${tx ? 'motherboard transmit' : 'motherboard receive'} differential pair. Each lane uses two independent pairs for full-duplex communication.`;
      base.electrical = 'AC-coupled serial differential link; rate and signaling depend on PCIe generation. PET/PER names are referenced to the motherboard, not the GPU.';
      base.typicalVoltage = 'No fixed DC diagnostic voltage';
      base.diagnosticNotes = [highSpeed, 'Inspect fingers, vias and differential routing for damage. Compare both halves and known-good hardware under identical unpowered conditions; there is no universal resistance threshold.', 'Lane numbering is connector numbering. Optional lane reversal and polarity inversion can change routing to the silicon.'];
      base.testPoints = ['Corresponding differential traces and accessible vias; locate transmitter coupling capacitors from the schematic. Use suitable differential probing without loading the link.'];
      base.warnings.push(highSpeed); base.aliases = [`${tx ? 'TX' : 'RX'}${base.lane}${base.polarity}`, `lane ${base.lane}`, `${tx ? 'HSO' : 'HSI'}${laneMatch[2]}(${base.lane})`];
    } else if (signal.startsWith('+')) {
      const aux = signal.includes('aux'); base.category = 'power'; base.direction = 'Motherboard supply → add-in card';
      base.voltage = signal === '+12V' ? 12 : 3.3; base.typicalVoltage = `${base.voltage} V nominal${aux ? ' auxiliary / standby' : ' main supply'}`;
      base.description = aux ? 'Auxiliary 3.3 V rail for supported standby and wake functions.' : `Main ${base.voltage} V slot power rail supplying the add-in card.`;
      base.electrical = 'DC supply, referenced to GND. Nominal voltage is not a guarantee for every platform power state.';
      base.diagnosticNotes = [aux ? 'May remain powered in soft-off or sleep while standby power is available and the platform implements this rail. It is absent without an energy source.' : 'Normally present in the powered operating state; sleep, soft-off, slot switching and platform sequencing can remove it. Check the platform schematic.', 'With power removed, check for a rail-to-ground short and damaged rail components. Low resistance can be normal; do not infer failure from a universal threshold.', 'For live voltage checks use a known ground reference and an insulated probe. Verify voltage at both the slot and card rail.'];
      base.testPoints = ['Same-rail contacts; rail decoupling capacitor pads or input protection components identified from the schematic.'];
    } else if (signal === 'GND') {
      base.category = 'ground'; base.direction = 'Common reference / return'; base.voltage = 0; base.typicalVoltage = '0 V reference';
      base.description = 'Common ground return and signal reference. Ground contacts between differential pairs help control crosstalk.';
      base.electrical = 'Connected to board ground; check the actual PCB ground network.';
      base.diagnosticNotes = ['Check continuity to a verified board ground with all power removed. Account for probe and contact resistance.', 'Use an accessible ground pad for probing. Do not assume a bracket or heatsink is electrically bonded.'];
      base.testPoints = ['Verified ground-plane vias or ground sides of decoupling capacitors.'];
    } else if (signal.startsWith('REFCLK')) {
      base.category = 'clock'; base.direction = 'Motherboard clock → add-in card'; base.polarity = signal.endsWith('+') ? '+' : '-';
      base.typicalVoltage = 'Differential clock; not a 3.3 V supply'; base.description = `${base.polarity} half of the nominal 100 MHz differential reference clock pair.`;
      base.electrical = 'Low-swing differential clock; electrical implementation and clock availability depend on platform and power management.';
      base.diagnosticNotes = ['Inspect A13 and A14 as a pair. Clock can be gated by platform power management and CLKREQ# support.', 'Use suitable differential clock probing. A multimeter cannot confirm frequency, jitter or signal integrity.'];
      base.testPoints = ['Clock pair vias or clock buffer outputs identified in the schematic.']; base.warnings.push(highSpeed);
    } else if (signal.startsWith('PRSNT')) {
      base.category = 'presence'; base.direction = 'Passive card connection → motherboard detection'; base.typicalVoltage = 'Platform detection logic; not a supply rail';
      base.description = signal === 'PRSNT1#' ? 'Presence-detect contact connected by the card to the PRSNT2# contact appropriate to its physical length.' : `Presence-detect position for a ${ {17:'x1',31:'x4',48:'x8',81:'x16'}[base.number]} card edge.`;
      base.electrical = 'Passive presence strap on the add-in card; the system senses insertion. PRSNT1# and the required PRSNT2# mating contact are shorter to support insertion detection.';
      base.diagnosticNotes = ['Presence locations are B17 (x1), B31 (x4), B48 (x8) and B81 (x16). For a full-length x16 card verify its A1-to-B81 presence connection against the schematic.', 'Physical card length detection does not establish negotiated electrical link width. Shorter-card presence contacts need not all be strapped on a full-length card.', 'Inspect shortened fingers for wear or cracks; a deliberately shortened presence contact is not missing metal by itself.'];
      base.testPoints = ['A1 and the length-appropriate PRSNT2# finger / routed strap, with power removed.'];
    } else if (/^SM(B)?(CLK|DAT)$/.test(signal)) {
      base.category = 'management'; base.direction = 'Bidirectional open-drain bus'; base.typicalVoltage = '3.3 V logic domain; actual pull-up / state is platform-dependent';
      base.description = signal.endsWith('CLK') ? 'Optional SMBus clock for management communication; not the PCIe reference clock.' : 'Optional SMBus data line for management communication.';
      base.electrical = 'Open-drain SMBus signaling. Idle high requires an available pull-up supply.';
      base.diagnosticNotes = [optional, 'Check pull-up supply and stuck-low behavior. Use a scope or logic analyzer for communication; a static high or low alone does not validate the bus.'];
      base.testPoints = ['Bus pull-up resistors and management device pads located from the schematic.']; base.aliases = ['SMBus', signal.endsWith('CLK') ? 'SMCLK SMBCLK' : 'SMDAT SMBDAT'];
    } else if (['TCK','TDI','TDO','TMS','TRST#'].includes(signal)) {
      base.category = 'jtag'; base.direction = signal === 'TDO' ? 'Add-in card → external test controller' : 'External test controller → add-in card';
      base.typicalVoltage = 'Logic interface; verify the implemented test circuitry';
      base.description = {TCK:'Optional JTAG test clock.',TDI:'Optional JTAG test data input.',TDO:'Optional JTAG test data output.',TMS:'Optional JTAG test mode select.','TRST#':'Optional active-low JTAG test reset.'}[signal];
      base.electrical = 'Optional boundary-scan / test interface. CEM uses JTAG1…JTAG5 aliases.';
      base.diagnosticNotes = [optional, 'Do not inject voltages without verifying interface voltage and implementation. JTAG activity is not required for normal PCIe link operation.'];
      base.testPoints = ['Test-interface routing or headers identified in the board schematic.']; base.aliases = ['JTAG', { 'TRST#':'JTAG1',TCK:'JTAG2',TDI:'JTAG3',TDO:'JTAG4',TMS:'JTAG5'}[signal]];
    } else if (signal === 'RSVD') {
      base.category = 'reserved'; base.direction = 'Unassigned in selected map'; base.typicalVoltage = 'Not specified';
      base.description = 'Reserved contact in the selected CEM pin map. Reserved is not a promise of a physically absent contact or a board-level NC.';
      base.electrical = 'No assigned signal in this profile. Later revisions can repurpose reserved pins.';
      base.diagnosticNotes = ['Do not drive, ground or bridge a reserved contact. Check revision and device schematic before interpreting a reading.', ...(pin === 'B12' ? ['B12 becomes CLKREQ# in the modern profile.'] : pin === 'B30' ? ['B30 becomes PWRBRK# in the modern profile.'] : [])];
      base.testPoints = ['No generic test point; consult the board schematic.']; base.aliases = ['reserved', 'NC (not guaranteed)'];
    } else {
      base.category = 'control'; base.typicalVoltage = '3.3 V logic domain; state and pull-ups depend on platform';
      const control = {
        'PERST#': ['Motherboard → add-in card', 'Active-low fundamental reset for the add-in card.', 'Asserted during reset / power-up; released when platform sequencing permits operation. Check with a scope and correlate with rails and reference clock.'],
        'WAKE#': ['Add-in card → motherboard (open drain)', 'Optional active-low wake request for link / platform reactivation.', 'May be pulled up from an available standby source. No wake activity is required during normal operation; idle voltage depends on platform support.'],
        'CLKREQ#': ['Bidirectional open drain', 'Active-low reference clock request associated with supported clock power management.', 'B12 was reserved in the legacy map. Check clock request and REFCLK together; clock gating and L1 substates make static voltage alone inconclusive.'],
        'PWRBRK#': ['Motherboard → add-in card', 'Optional active-low emergency power reduction request.', 'B30 was reserved in the legacy map. A low assertion requests power reduction on supported cards; check platform routing before diagnosing.']
      }[signal];
      base.direction = control[0]; base.description = control[1];
      base.electrical = 'Active-low sideband logic (# means asserted low), not a power supply. Check pull-ups and driver type before probing.';
      base.diagnosticNotes = [control[2], ...(signal === 'PERST#' ? [] : [optional]), 'Use a scope for sequencing or pulses; a multimeter only shows a coarse DC state.'];
      base.testPoints = ['Accessible signal vias, pull-ups or buffer pads identified from the schematic.'];
    }
    return base;
  }
  function build(profileId) {
    const profile = profiles[profileId]; if (!profile) throw new Error('Unknown pin profile: ' + profileId);
    const pins = Object.entries(signals).flatMap(([side, entries]) => entries.map((signal, i) => {
      const pin = side + (i + 1); const record = describe(pin, profile.overrides[pin] || signal);
      record.sourceIds = [profile.source]; return record;
    }));
    pins.forEach(p => {
      p.relatedPins = pins.filter(q => q.pin !== p.pin && (
        p.lane !== null ? q.lane === p.lane :
        p.category === 'clock' ? q.category === 'clock' :
        p.category === 'presence' ? q.category === 'presence' :
        p.category === 'management' ? q.category === 'management' :
        p.category === 'jtag' ? q.category === 'jtag' :
        p.category === 'power' || p.category === 'ground' ? q.signal === p.signal :
        p.signal === 'CLKREQ#' ? q.category === 'clock' : false
      )).map(q => q.pin);
    });
    return pins;
  }
  root.PCIeData = { categories, profiles, signals, build,
    connector: { id:'pcie-x16', contactsPerSide:82, keyAfter:11, widths:{x1:18,x4:32,x8:49,x16:82} },
    sources: {
      cem11:{label:'CEM 1.1 · Table 5-1 / §§2, 3, 4, 5',url:'https://studylib.net/doc/27781038/pci-express-card-electromechanical-specification-rev-1.1'},
      cem40draft:{label:'CEM 4.0 v0.9 draft · Table 37 / §§2, 3, 4, 6',url:'https://studylib.net/doc/27755779/pcie-cem-spec-r4-v9-12072018-ncb'}
    }
  };
})(typeof window === 'undefined' ? globalThis : window);
