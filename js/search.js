(function (root) {
  'use strict';
  const normalize = value => String(value).toLowerCase().replace(/[\s_()]/g, '');
  root.PCIeSearch = {
    matches(pin, query, group, lane) {
      const text = normalize([pin.pin, pin.signal, pin.category, root.PCIeData.categories[pin.category].label, ...pin.aliases].join(' '));
      const q = normalize(query);
      // An exact pin ID must not match a longer ID (A1 is not A10).
      const queryMatch = !q || (/^[ab]\d+$/.test(q) ? normalize(pin.pin) === q : text.includes(q));
      const groupMatch = group === 'all' || (group === 'lanes' ? pin.lane !== null : group === 'management' ? ['management','jtag'].includes(pin.category) : pin.category === group);
      return queryMatch && groupMatch && (lane === null || pin.lane === lane);
    }
  };
})(typeof window === 'undefined' ? globalThis : window);
