(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = { side:'B', both:false, profile:'modern', repair:true, selected:null, preview:null, query:'', group:'all', lane:null };
  let pins = PCIeData.build(state.profile), byId = new Map(pins.map(p=>[p.pin,p])), svg;
  const groups = [['all','All contacts'],['power','Power'],['ground','Ground'],['lanes','PCIe lanes'],['clock','Clock'],['control','Control'],['management','Management'],['presence','Presence'],['reserved','Reserved']];
  function button(text, action, title) {
    const b = document.createElement('button'); b.type='button'; b.textContent=text;
    if(title) b.title=title; b.addEventListener('click',action); return b;
  }
  groups.forEach(([id,label])=>{
    const b=button(label,()=>{state.group=id; updateMatches();}); b.dataset.group=id;
    $('filters').append(b);
  });
  for(let n=0;n<16;n++) { const o=document.createElement('option'); o.value=n; o.textContent=`Lane ${n}`; $('lane').append(o); }
  Object.entries(PCIeData.categories).forEach(([id,c])=>{
    const item=document.createElement('span'); item.style.setProperty('--pin-color',c.color);
    const swatch=document.createElement('i'); swatch.className='swatch'; item.append(swatch,document.createTextNode(c.label)); $('legend').append(item);
  });
  function activePin() { return byId.get(state.preview || state.selected); }
  function matching(p) { return PCIeSearch.matches(p,state.query,state.group,state.lane); }
  function relatedButtons(container, ids) {
    ids.forEach(id=>container.append(button(id,()=>select(id,true),`${id} · ${byId.get(id).signal}`)));
  }
  function section(title, content, warning=false) {
    const s=document.createElement('section'); s.className='detail-section'+(warning?' warning':'');
    const h=document.createElement('h3');h.textContent=title;s.append(h);
    if(Array.isArray(content)) { const list=document.createElement('ul'); content.forEach(t=>{const li=document.createElement('li');li.textContent=t;list.append(li);});s.append(list); }
    else {const p=document.createElement('p');p.textContent=content;s.append(p);} return s;
  }
  function showDetails() {
    const mount=$('details'), p=activePin(); mount.replaceChildren();
    if(!p) {
      const empty=document.createElement('div');empty.className='empty';
      empty.innerHTML='<span class="empty-icon" aria-hidden="true">⌖</span><h2>Select a contact</h2><p>Hover to inspect a signal. Click or tap to keep its details here.</p>';
      mount.append(empty); return;
    }
    mount.style.setProperty('--pin-color',PCIeData.categories[p.category].color);
    const top=document.createElement('div');top.className='pin-top';
    const id=document.createElement('h2');id.className='pin-id';id.textContent=p.pin;
    const tag=document.createElement('span');tag.className='pin-state';tag.textContent=state.preview ? 'PREVIEW' : 'PINNED';top.append(id,tag);
    const signal=document.createElement('div');signal.className='signal-title';signal.textContent=p.signal;
    const description=document.createElement('p');description.className='description';description.textContent=p.description;
    mount.append(top,signal,description);
    if(!state.both && p.side !== state.side) mount.append(button(`Show ${p.pin} on ${p.side === 'B' ? 'front' : 'back'} side`,()=>select(p.pin,true)));
    if(state.repair) {
      const grid=document.createElement('dl');grid.className='data-grid';
      const rows=[['Pin',p.pin],['Side',`${p.side} · ${p.side === 'B' ? 'Component / front' : 'Solder / back'}`],['Signal',p.signal],['Signal group',PCIeData.categories[p.category].label],['Direction',p.direction],['Typical voltage',p.typicalVoltage]];
      rows.forEach(([name,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;grid.append(dt,dd);});
      mount.append(grid,section('Expected rail / electrical information',p.electrical),section('Repair / diagnostic notes',p.diagnosticNotes),section('Useful test points',p.testPoints),section('Warnings',p.warnings,true));
      const related=section('Related pins','');const list=document.createElement('div');list.className='related';relatedButtons(list,p.relatedPins);related.append(list);
      if(!p.relatedPins.length) related.lastChild.textContent='No generic related contacts.';mount.append(related);
      const source=document.createElement('p');source.className='detail-source';source.append(document.createTextNode('Pin map: '));
      const a=document.createElement('a');a.href=PCIeData.sources[p.sourceIds[0]].url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=PCIeData.sources[p.sourceIds[0]].label;source.append(a);mount.append(source);
    }
  }
  function paint() {
    const p=activePin(), related=new Set(p?.relatedPins || []);
    svg.querySelectorAll('[data-pin]').forEach(e=>{
      const data=byId.get(e.dataset.pin), match=matching(data);
      e.classList.toggle('dimmed',!match && data.pin !== state.selected && data.pin !== state.preview);
      e.classList.toggle('highlight',match && (!!state.query || state.group !== 'all' || state.lane !== null));
      e.classList.toggle('selected',data.pin === state.selected);
      e.classList.toggle('related',state.repair && related.has(data.pin));
      e.setAttribute('aria-pressed',String(data.pin === state.selected));
    });
    for(const side of ['A','B']) {
      const visible=pins.filter(p=>p.side === side);
      const entry=byId.get(state.selected)?.side === side ? state.selected : (visible.find(matching) || visible[0]).pin;
      visible.forEach(p=>$('pin-'+p.pin).setAttribute('tabindex',(state.both || side === state.side) && p.pin === entry ? '0' : '-1'));
    }
    updateCloseUp();
  }
  function updateCloseUp() {
    // Follow the locked contact, not hover, so the touch targets do not move under a finger.
    const p=byId.get(state.selected);
    $('focus-title').textContent=p ? `${p.pin} · ${p.signal}` : 'Select a contact';
    $('focus-orientation').textContent=p ? `${p.side === 'B' ? 'B · Component / front · Bracket toward left' : 'A · Solder / back · Bracket toward right'} · Contact edge down` : 'Tap a connector contact or search result to magnify its neighbors.';
    $('focus-position').textContent=p ? `${p.number} / 82` : '—';
    $('focus-reveal').disabled=!p;
    const visualIndex=p ? (p.side === 'B' ? p.number : 83-p.number) : 0;
    $('focus-prev').disabled=!p || visualIndex === 1;$('focus-next').disabled=!p || visualIndex === 82;
    PCIeConnector.renderCloseUp($('focus-mount'),svg,p);
    $('focus-mount').querySelectorAll('[data-focus-pin]').forEach(node=>{
      const id=node.dataset.focusPin;
      node.addEventListener('click',()=>select(id));
      node.addEventListener('keydown',e=>{if(e.key === 'Enter' || e.key === ' ') {e.preventDefault();select(id);$('focus-'+id)?.focus();}});
    });
  }
  function showTooltip(p, node) {
    const t=$('tooltip');t.replaceChildren();const title=document.createElement('strong');title.textContent=`${p.pin} · ${p.signal}`;
    const body=document.createElement('p');body.textContent=p.description;t.append(title,body);t.hidden=false;
    const card=node.closest('.connector-card').getBoundingClientRect(), rect=node.getBoundingClientRect();
    const left=Math.min(Math.max(12,rect.left-card.left-60),Math.max(12,card.width-t.offsetWidth-12));
    t.style.left=left+'px';t.style.top=Math.max(65,rect.top-card.top-t.offsetHeight-12)+'px';
  }
  function preview(id, node) { state.preview=id;showDetails();paint();showTooltip(byId.get(id),node); }
  function endPreview() {state.preview=null;$('tooltip').hidden=true;showDetails();paint();}
  function renderConnector() {
    svg=PCIeConnector.render($('connector-mount'),pins,state.side,state.both);
    svg.querySelectorAll('[data-pin]').forEach(node=>{
      const id=node.dataset.pin;
      node.addEventListener('pointerenter',e=>{if(e.pointerType !== 'touch') preview(id,node);});
      node.addEventListener('pointerleave',()=>{if(state.preview === id) endPreview();});
      node.addEventListener('focus',()=>preview(id,node));
      node.addEventListener('blur',()=>{if(state.preview === id) endPreview();});
      node.addEventListener('click',()=>{
        const same=state.selected === id;state.selected=same ? null : id;state.preview=null;state.side=byId.get(id).side;
        $('tooltip').hidden=true;showDetails();paint();
      });
      node.addEventListener('keydown',e=>{if(e.key === 'Enter' || e.key === ' ') {e.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
    });
    $('view-title').innerHTML=state.both ? 'Both physical views <span>B / A</span>' : `${state.side === 'B' ? 'Component side' : 'Solder side'} <span>${state.side}</span>`;
    $('orientation').textContent=state.both ? 'Above: B · bracket left. Below: A · bracket right. Each row is a separate physical view of the PCB.' : state.side === 'B' ? 'Bracket left · B1 → B82 · Contact edge down toward motherboard' : 'Bracket right · A82 ← A1 · PCB physically turned around its vertical axis';
    $('front').setAttribute('aria-pressed',!state.both && state.side === 'B');$('back').setAttribute('aria-pressed',!state.both && state.side === 'A');$('both').setAttribute('aria-pressed',state.both);
    applyZoom();paint();PCIeSelfTest.run(pins,svg,state.profile);
  }
  function setSide(side, clear=true) {
    state.side=side;state.preview=null;if(clear) {state.selected=null;state.both=false;}
    $('tooltip').hidden=true;renderConnector();showDetails();updateMatches();
    $('viewport').scrollLeft=side === 'B' ? 0 : $('viewport').scrollWidth;
  }
  function select(id, reveal=false) {
    const p=byId.get(id);if(!p) return;
    state.selected=id;state.preview=null;
    if(p.side !== state.side) {if(state.both)state.side=p.side;else setSide(p.side,false);}
    $('tooltip').hidden=true;showDetails();paint();
    if(reveal) $('pin-'+id).scrollIntoView({block:'nearest',inline:'center',behavior:'auto'});
  }
  function updateMatches() {
    const matches=pins.filter(matching), current=state.both ? matches : matches.filter(p=>p.side === state.side);
    $('match-count').textContent=`${current.length} visible · ${matches.length} across both sides`;
    $('filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.group === state.group));
    const results=$('results');results.replaceChildren();
    matches.forEach(p=>results.append(button(`${p.pin} · ${p.signal}`,()=>select(p.pin,true),`${PCIeData.categories[p.category].label} · side ${p.side}`)));
    if(!matches.length){const text=document.createElement('p');text.textContent='No contacts match these filters. Try resetting filters.';results.append(text);}
    $('results-heading').textContent=`Browse matching contacts (${matches.length})`;
    if(state.query) $('results-heading').parentElement.open=true;
    $('lane-heading').textContent=state.lane === null ? 'Two pairs. One lane.' : `Lane ${state.lane} · four contacts, full duplex`;
    $('lane-description').textContent='Each lane has a separate transmit and receive differential pair. PET = motherboard TX → card RX; PER = card TX → motherboard RX. Host TX and RX contacts lie on opposite PCB sides.';
    $('lane-pins').replaceChildren();if(state.lane !== null) relatedButtons($('lane-pins'),pins.filter(p=>p.lane === state.lane).map(p=>p.pin));
    paint();
  }
  function applyZoom() {
    const z=Number($('zoom').value), minimum=window.matchMedia('(max-width:800px)').matches ? 1200 : 920;
    $('connector-mount').style.width=(Math.max($('viewport').clientWidth,minimum)*z)+'px';$('zoom-value').value=z+'×';$('tooltip').hidden=true;
  }
  function clearSelection(){state.selected=null;state.preview=null;$('tooltip').hidden=true;showDetails();paint();}
  function setMode(repair){state.repair=repair;$('repair').setAttribute('aria-pressed',repair);$('basic').setAttribute('aria-pressed',!repair);showDetails();paint();}
  $('front').addEventListener('click',()=>setSide('B'));$('back').addEventListener('click',()=>setSide('A'));
  $('both').addEventListener('click',()=>{state.both=true;state.preview=null;$('tooltip').hidden=true;renderConnector();showDetails();updateMatches();});
  function moveContact(step) {
    const p=byId.get(state.selected);if(!p)return;
    const next=p.number+step*(p.side === 'B' ? 1 : -1);
    if(next>=1 && next<=82)select(p.side+next);
  }
  $('focus-prev').addEventListener('click',()=>moveContact(-1));$('focus-next').addEventListener('click',()=>moveContact(1));
  $('focus-reveal').addEventListener('click',()=>{if(state.selected)select(state.selected,true);});
  $('basic').addEventListener('click',()=>setMode(false));$('repair').addEventListener('click',()=>setMode(true));
  $('search').addEventListener('input',e=>{state.query=e.target.value;updateMatches();});
  $('lane').addEventListener('change',e=>{state.lane=e.target.value === '' ? null : Number(e.target.value);updateMatches();});
  $('reset').addEventListener('click',()=>{state.query='';state.group='all';state.lane=null;$('search').value='';$('lane').value='';updateMatches();});
  $('profile').addEventListener('change',e=>{
    state.profile=e.target.value;pins=PCIeData.build(state.profile);byId=new Map(pins.map(p=>[p.pin,p]));state.preview=null;renderConnector();showDetails();updateMatches();
  });
  $('zoom').addEventListener('input',applyZoom);window.addEventListener('resize',applyZoom);$('viewport').addEventListener('scroll',()=>{$('tooltip').hidden=true;});
  $('clear').addEventListener('click',clearSelection);$('help-open').addEventListener('click',()=>{$('help').showModal();});
  $('help').addEventListener('click',e=>{if(e.target === $('help')) {const r=$('help').getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) $('help').close();}});
  document.addEventListener('keydown',e=>{
    if($('help').open || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    const key=e.key.toLowerCase();
    if(key === 'escape') clearSelection();
    else if(key === 'f') setSide('B');else if(key === 'b') setSide('A');
    else if(key === 'd') $('both').click();
    else if(key === '/') {e.preventDefault();$('search').focus();}
    else if(key === '?') $('help').showModal();
    else if(key === 'arrowleft' || key === 'arrowright') {
      e.preventDefault();
      const focus=e.target.dataset?.pin || e.target.dataset?.focusPin;
      const navigationSide=byId.get(focus || state.selected)?.side || state.side;
      const visualOrder=pins.filter(p=>p.side === navigationSide).sort((a,b)=>PCIeConnector.xFor(a.number,navigationSide)-PCIeConnector.xFor(b.number,navigationSide));
      let index=visualOrder.findIndex(p=>p.pin === (focus || state.selected));
      if(index<0) index=key === 'arrowright' ? -1 : visualOrder.length;
      index=Math.max(0,Math.min(visualOrder.length-1,index+(key === 'arrowright' ? 1 : -1)));
      const id=visualOrder[index].pin, inCloseUp=!!e.target.dataset?.focusPin;
      select(id,!inCloseUp);$(inCloseUp ? 'focus-'+id : 'pin-'+id)?.focus();state.preview=null;$('tooltip').hidden=true;showDetails();
    }
  });
  renderConnector();updateMatches();showDetails();
})();
