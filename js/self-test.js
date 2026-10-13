(function (root) {
  'use strict';
  function run(pins, svg, profileId) {
    const errors = [];
    const check = (condition, message) => { if (!condition) errors.push(message); };
    const byId = new Map(pins.map(p=>[p.pin,p]));
    check(pins.length === 164, 'Expected 164 contacts');
    check(byId.size === pins.length, 'Duplicate database pin IDs');
    for(const side of ['A','B']) for(let n=1;n<=82;n++) {
      const p = byId.get(side+n);
      check(!!p, `Missing ${side}${n}`);
      if(p) {
        check(p.side === side && p.number === n, `Side / number mismatch at ${p.pin}`);
        ['signal','category','direction','description','electrical','typicalVoltage'].forEach(k=>check(!!p[k], `Missing ${k} at ${p.pin}`));
        check(!!root.PCIeData.categories[p.category], `Unknown category at ${p.pin}`);
        check(p.relatedPins.every(id=>byId.has(id)), `Unknown related pin at ${p.pin}`);
      }
    }
    const tx = [14,19,23,27,33,37,41,45,50,54,58,62,66,70,74,78];
    const rx = [16,21,25,29,35,39,43,47,52,56,60,64,68,72,76,80];
    for(let lane=0;lane<16;lane++) {
      const group = pins.filter(p=>p.lane === lane);
      check(group.length === 4, `Lane ${lane} must have four contacts`);
      for(const [side,start,prefix] of [['B',tx[lane],'PET'],['A',rx[lane],'PER']]) {
        for(const [offset,polarity] of [[0,'p'],[1,'n']]) {
          const pin = byId.get(side+(start+offset));
          check(pin && pin.signal === `${prefix}${polarity}${lane}` && pin.lane === lane && pin.polarity === (polarity === 'p' ? '+' : '-'), `Incorrect lane ${lane} ${prefix}${polarity} position`);
        }
      }
    }
    const critical = {A1:'PRSNT1#',A2:'+12V',A3:'+12V',B1:'+12V',B2:'+12V',B3:'+12V',A9:'+3.3V',A10:'+3.3V',B8:'+3.3V',B10:'+3.3Vaux',A11:'PERST#',A13:'REFCLK+',A14:'REFCLK-',B11:'WAKE#',B17:'PRSNT2#',B31:'PRSNT2#',B48:'PRSNT2#',B81:'PRSNT2#',B82:'RSVD',A82:'GND',A5:'TCK',A6:'TDI',A7:'TDO',A8:'TMS',B9:'TRST#'};
    Object.entries(critical).forEach(([id,signal])=>check(byId.get(id)?.signal === signal, `Critical pin ${id} must be ${signal}`));
    check(byId.get('B12')?.signal === (profileId === 'modern' ? 'CLKREQ#' : 'RSVD'), 'B12 profile mismatch');
    check(byId.get('B30')?.signal === (profileId === 'modern' ? 'PWRBRK#' : 'RSVD'), 'B30 profile mismatch');
    check(byId.get('B5')?.signal === (profileId === 'modern' ? 'SMBCLK' : 'SMCLK'), 'SMBus clock mismatch');
    check(byId.get('B6')?.signal === (profileId === 'modern' ? 'SMBDAT' : 'SMDAT'), 'SMBus data mismatch');
    check(pins.filter(p=>p.category === 'power').length === 9, 'Expected nine power contacts including auxiliary supply');
    check(pins.filter(p=>p.category === 'ground').length === 68, 'Expected 68 ground contacts');
    check(root.PCIeData.connector.keyAfter === 11, 'Key must follow contact 11');
    const geo = root.PCIeConnector.geometry;
    for(let n=1;n<=82;n++) check(Math.abs(root.PCIeConnector.xFor(n,'A')+root.PCIeConnector.xFor(n,'B')+geo.fingerWidth-geo.width) < 1e-8, `Mirror mismatch for contact ${n}`);
    check(root.PCIeConnector.xFor(12,'B')-root.PCIeConnector.xFor(11,'B') === geo.pitch+geo.keyWidth, 'Notch gap mismatch');
    if(svg) {
      const elements = Array.from(svg.querySelectorAll('[data-pin]'));
      const ids = elements.map(e=>e.id);
      check(ids.length === 164 && new Set(ids).size === 164, 'SVG must contain 164 unique contacts');
      elements.forEach(e=>check(byId.has(e.dataset.pin) && e.id === 'pin-'+e.dataset.pin, `SVG contact not in database: ${e.id}`));
      pins.forEach(p=>check(ids.includes('pin-'+p.pin), `Database contact not in SVG: ${p.pin}`));
    }
    errors.forEach(error=>console.error('[PCIe self-test] '+error));
    return errors;
  }
  root.PCIeSelfTest = { run };
})(typeof window === 'undefined' ? globalThis : window);
