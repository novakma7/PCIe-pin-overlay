(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const geometry = { width:1120, height:340, start:104, pitch:10.5, fingerWidth:6.8, keyWidth:18, y:174, fingerHeight:73 };
  function xFor(number, side) {
    const x = geometry.start + (number-1)*geometry.pitch + (number > root.PCIeData.connector.keyAfter ? geometry.keyWidth : 0);
    return side === 'B' ? x : geometry.width-x-geometry.fingerWidth;
  }
  function el(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key,value]) => node.setAttribute(key,value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function face(pins, side, offset, visible) {
    const g=geometry, view=el('g',{'data-face':side,transform:`translate(0,${offset})`});
    view.style.display=visible ? '' : 'none';
    const pcb=el('g',{class:'mechanical',transform:side === 'A' ? `translate(${g.width},0) scale(-1,1)` : ''});
    const notchLeft=g.start+10*g.pitch+g.fingerWidth+4, notchRight=g.start+11*g.pitch+g.keyWidth-4;
    pcb.append(el('path',{d:`M88 82 H1005 V250 H${notchRight} V199 H${notchLeft} V250 H88 Z`,fill:'#15362d',stroke:'#36634d','stroke-width':1.2}));
    pcb.append(el('path',{d:'M48 61 H66 V264 H48 M48 104 H83 M48 229 H83',fill:'none',stroke:'#728490','stroke-width':5}));
    for(let i=0;i<8;i++) pcb.append(el('path',{d:`M${330+i*73} 99 V124 H${347+i*73} V158`,stroke:'#244c3c',fill:'none','stroke-width':1}));
    pcb.append(el('rect',{x:735,y:96,width:110,height:49,rx:4,fill:'#102720',stroke:'#2d5142'}));view.append(pcb);
    const group=el('g',{'data-side':side});group.style.display=visible ? '' : 'none';
    pins.filter(p=>p.side === side).forEach(p=>{
      const x=xFor(p.number,side), short=p.category === 'presence';
      const node=el('g',{id:`pin-${p.pin}`,class:'pin','data-pin':p.pin,role:'button',tabindex:'-1','aria-label':`${p.pin}, ${p.signal}, ${root.PCIeData.categories[p.category].label}`,'aria-pressed':'false'});
      node.style.setProperty('--pin-color',root.PCIeData.categories[p.category].color);
      node.append(el('title',{},`${p.pin} · ${p.signal} · ${p.description}`));
      node.append(el('rect',{x:x-1.8,y:g.y-8,width:g.pitch,height:103,fill:'transparent'}));
      node.append(el('rect',{x,y:g.y,width:g.fingerWidth,height:g.fingerHeight-(short ? 13 : 0),rx:1,class:'finger'}));
      node.append(el('rect',{x,y:g.y+5,width:g.fingerWidth,height:4,class:'stripe'}));
      node.append(el('text',{x:x+g.fingerWidth/2,y:short ? 267 : 260,'text-anchor':'middle',class:'pin-number'},String(p.number)));
      group.append(node);
    });view.append(group);
    view.append(el('text',{x:side === 'B' ? 49 : 1071,y:42,'text-anchor':'middle',class:'svg-label'},'BRACKET / I/O'));
    view.append(el('text',{x:560,y:65,'text-anchor':'middle',class:'svg-pcb'},side === 'B' ? 'B · COMPONENT / FRONT' : 'A · SOLDER / BACK'));
    view.append(el('text',{x:560,y:116,'text-anchor':'middle',class:'svg-pcb'},`PCB · SIDE ${side}`));
    const keyX=side === 'B' ? (notchLeft+notchRight)/2 : g.width-(notchLeft+notchRight)/2;
    view.append(el('path',{d:`M${keyX} 170 V192`,stroke:'#a0b8ab','stroke-dasharray':'2 3'}));
    view.append(el('text',{x:keyX,y:161,'text-anchor':'middle',class:'svg-label'},'KEY 11 | 12'));
    view.append(el('text',{x:560,y:308,'text-anchor':'middle',class:'svg-label'},'↓ CONTACT EDGE / INSERTS INTO MOTHERBOARD SLOT ↓'));
    [1,82].forEach(n=>view.append(el('text',{x:xFor(n,side)+3,y:286,'text-anchor':'middle',class:'svg-label'},`${side}${n} · ${n === 1 ? 'START' : 'END'}`)));
    return view;
  }
  function render(mount,pins,side,both=false) {
    const svg=el('svg',{viewBox:`0 0 ${geometry.width} ${geometry.height*(both ? 2 : 1)}`,role:'group','aria-label':both ? 'Both physical views: component side B above, mirrored solder side A below' : `PCIe x16 side ${side}`});
    // Every physical ID occurs once, also in dual view; A remains geometrically mirrored.
    for(const s of (both ? ['B','A'] : [side,side === 'B' ? 'A' : 'B'])) svg.append(face(pins,s,both && s === 'A' ? geometry.height : 0,both || s === side));
    if(both)svg.append(el('path',{d:`M30 ${geometry.height} H1090`,stroke:'#2b3542','stroke-dasharray':'5 5'}));
    mount.replaceChildren(svg);return svg;
  }
  function renderCloseUp(mount,svg,pin) {
    mount.replaceChildren();if(!pin)return;
    const g=geometry, width=75, center=xFor(pin.number,pin.side)+g.fingerWidth/2;
    const left=Math.max(88,Math.min(center-width/2,1005-width));
    const crop=el('svg',{viewBox:`${left} 150 ${width} 132`,preserveAspectRatio:'none',role:'group','aria-label':`Magnified ${pin.pin} and adjacent contacts; ${pin.side === 'B' ? 'bracket toward left' : 'bracket toward right'}`});
    const source=svg.querySelector(`[data-face="${pin.side}"]`), view=source.cloneNode(true);
    view.removeAttribute('transform');view.style.display='';
    view.querySelector('[data-side]').style.display='';view.querySelector('[data-side]').removeAttribute('data-side');
    const labels=document.createElement('div');labels.className='focus-labels';labels.setAttribute('aria-hidden','true');
    view.querySelectorAll('[data-pin]').forEach(node=>{
      const id=node.dataset.pin, x=Number(node.querySelector('.finger').getAttribute('x'));
      if(x+g.fingerWidth<left || x>left+width){node.remove();return;}
      node.id='focus-'+id;node.dataset.focusPin=id;node.removeAttribute('data-pin');node.setAttribute('tabindex','0');
      node.classList.remove('dimmed');
      const label=document.createElement('span');label.textContent=id;label.style.left=((x+g.fingerWidth/2-left)/width*100)+'%';labels.append(label);
    });
    // Keep labels as HTML: stretching the crop horizontally must not distort glyphs.
    view.querySelectorAll('text').forEach(node=>node.remove());
    crop.append(view);mount.append(crop,labels);
    const keyCenter=(g.start+10*g.pitch+g.fingerWidth+4+g.start+11*g.pitch+g.keyWidth-4)/2;
    const keyX=pin.side === 'B' ? keyCenter : g.width-keyCenter;
    if(keyX>=left && keyX<=left+width){const key=document.createElement('span');key.className='focus-key';key.textContent='KEY';key.style.left=((keyX-left)/width*100)+'%';mount.append(key);}
  }
  root.PCIeConnector={geometry,xFor,render,renderCloseUp};
})(typeof window === 'undefined' ? globalThis : window);
