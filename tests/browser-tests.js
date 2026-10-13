(async function () {
  'use strict';
  const frame=document.getElementById('app'), report=document.getElementById('report'), lines=[];
  let failures=0;
  function test(name, run) {try{run();lines.push('PASS '+name);}catch(e){failures++;lines.push('FAIL '+name+': '+e.message);}}
  function assert(value,message='assertion failed'){if(!value)throw new Error(message);}
  await new Promise(resolve=>{if(frame.contentDocument?.readyState === 'complete' && frame.contentWindow.PCIeData)resolve();else frame.addEventListener('load',resolve,{once:true});});
  try {
    const w=frame.contentWindow,d=w.document,$=id=>d.getElementById(id);
    const click=id=>$(id).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
    const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event(id === 'search' || id === 'zoom' ? 'input' : 'change',{bubbles:true}));};
    const key=value=>(d.activeElement || d.body).dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true}));
    const selected=()=>$('connector-mount').querySelector('.pin.selected')?.dataset.pin;
    const visible=()=>Array.from(d.querySelectorAll('[data-side]')).filter(e=>w.getComputedStyle(e).display !== 'none');
    const errors=[];const original=w.console.error;w.console.error=(...args)=>{errors.push(args.join(' '));original.apply(w.console,args);};
    test('both profiles: complete topology and SVG mapping',()=>{
      for(const profile of ['legacy','modern'])assert(w.PCIeSelfTest.run(w.PCIeData.build(profile),$('connector-mount').querySelector('svg'),profile).length === 0);
      assert(d.querySelectorAll('[data-pin]').length === 164);
    });
    test('physical front / back geometry and key',()=>{
      assert(visible().length === 1 && visible()[0].dataset.side === 'B');
      const b1=Number($('pin-B1').querySelector('.finger').getAttribute('x'));
      click('back');assert(visible().length === 1 && visible()[0].dataset.side === 'A');
      const a1=Number($('pin-A1').querySelector('.finger').getAttribute('x'));
      assert(a1>b1 && Math.abs(a1+b1+w.PCIeConnector.geometry.fingerWidth-w.PCIeConnector.geometry.width)<1e-8);
      assert($('orientation').textContent.includes('Bracket right'));
      assert($('connector-mount').querySelector('[data-face="A"] .mechanical').getAttribute('transform').includes('scale(-1,1)'));
      click('front');assert($('orientation').textContent.includes('Bracket left'));
    });
    test('hover preview, locking, leave and deselect',()=>{
      $('pin-B17').dispatchEvent(new w.PointerEvent('pointerenter',{pointerType:'mouse'}));
      assert($('details').textContent.includes('B17') && !$('tooltip').hidden);
      click('pin-B17');assert(selected() === 'B17');
      $('pin-B17').dispatchEvent(new w.PointerEvent('pointerleave',{pointerType:'mouse'}));assert(selected() === 'B17' && $('details').textContent.includes('PINNED'));
      $('pin-B14').dispatchEvent(new w.PointerEvent('pointerenter',{pointerType:'mouse'}));assert($('details').textContent.includes('PETp0'));
      $('pin-B14').dispatchEvent(new w.PointerEvent('pointerleave',{pointerType:'mouse'}));assert($('details').textContent.includes('PRSNT2#'));
      click('pin-B17');assert(!selected());
    });
    test('search exact IDs, rail aliases and reset',()=>{
      input('search','A1');assert($('results').children.length === 1 && $('results').textContent.includes('A1 · PRSNT1#'));
      input('search','12V');assert($('connector-mount').querySelectorAll('.pin.highlight').length === 5);
      input('search','REFCLK');assert($('connector-mount').querySelectorAll('.pin.highlight').length === 2);
      input('search','SMCLK');assert($('results').children.length === 1);
      input('search','does-not-exist');assert($('match-count').textContent.includes('0 visible'));
      click('reset');assert($('search').value === '' && $('results').children.length === 164);
    });
    test('search result changes physical side',()=>{
      input('search','A13');$('results').querySelector('button').click();
      assert(selected() === 'A13' && visible()[0].dataset.side === 'A');click('reset');
    });
    test('lane isolates four contacts and all lanes have both pairs',()=>{
      click('clear');for(let lane=0;lane<16;lane++) {input('lane',String(lane));assert($('connector-mount').querySelectorAll('.pin.highlight').length === 4);assert($('lane-pins').children.length === 4);}
      input('lane','0');assert($('lane-pins').textContent.includes('B14') && $('lane-pins').textContent.includes('A16'));click('reset');
    });
    test('group and search filters intersect',()=>{
      d.querySelector('[data-group="power"]').click();assert($('connector-mount').querySelectorAll('.pin.highlight').length === 9);
      input('search','12V');assert($('connector-mount').querySelectorAll('.pin.highlight').length === 5);input('search','PERST');assert($('connector-mount').querySelectorAll('.pin.highlight').length === 0);click('reset');
    });
    test('related differential pair and cross-side lane selection',()=>{
      click('front');click('pin-B14');
      const buttons=Array.from($('details').querySelectorAll('.related button'));assert(buttons.length === 3);
      buttons.find(b=>b.textContent === 'A16').click();assert(selected() === 'A16' && visible()[0].dataset.side === 'A');
      assert($('details').textContent.includes('Add-in card TX → motherboard RX'));
    });
    test('basic / repair inspector detail',()=>{
      click('basic');assert(!$('details').querySelector('.data-grid') && !$('details').querySelector('.warning'));assert($('details').textContent.includes('PERp0'));
      click('repair');assert($('details').querySelector('.data-grid') && $('details').textContent.includes('Useful test points'));
    });
    test('revision-specific B12/B30 and labels',()=>{
      input('profile','legacy');assert($('pin-B12').getAttribute('aria-label').includes('RSVD'));
      click('front');click('pin-B12');assert($('details').textContent.includes('RSVD'));
      input('profile','modern');assert($('pin-B12').getAttribute('aria-label').includes('CLKREQ#') && $('details').textContent.includes('CLKREQ#'));
      assert($('pin-B30').getAttribute('aria-label').includes('PWRBRK#'));
    });
    test('keyboard follows visual order on each face',()=>{
      click('front');click('pin-B14');key('ArrowRight');assert(selected() === 'B15');
      d.activeElement.blur();key('b');assert(!selected() && visible()[0].dataset.side === 'A');
      click('pin-A17');key('ArrowRight');assert(selected() === 'A16');key('Escape');assert(!selected());
      d.activeElement.blur();key('f');assert(visible()[0].dataset.side === 'B');
    });
    test('touch selection and focus activation',()=>{
      $('pin-B8').dispatchEvent(new w.PointerEvent('pointerenter',{pointerType:'touch'}));assert($('tooltip').hidden);
      click('pin-B8');assert(selected() === 'B8');$('pin-B10').focus();
      $('pin-B10').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert(selected() === 'B10');$('pin-B10').blur();
    });
    test('zoom scales on narrow and wide viewports',()=>{
      const before=parseFloat($('connector-mount').style.width);input('zoom','3');assert(parseFloat($('connector-mount').style.width) === before*3);
      input('zoom','1');const old=frame.style.width;frame.style.width='390px';w.dispatchEvent(new w.Event('resize'));
      const mobile=parseFloat($('connector-mount').style.width);input('zoom','3');assert(parseFloat($('connector-mount').style.width) === mobile*3);
      assert(d.documentElement.scrollWidth <= d.documentElement.clientWidth+1,`Mobile page overflows: ${d.documentElement.scrollWidth} > ${d.documentElement.clientWidth}; explorer=${d.querySelector('.explorer').clientWidth}; viewport=${$('viewport').clientWidth}; mount=${$('connector-mount').style.width}; columns=${w.getComputedStyle(d.querySelector('.workspace')).gridTemplateColumns}`);
      frame.style.width=old;input('zoom','1');
    });
    test('both physical faces, unique IDs, all lane contacts and cross-side selection',()=>{
      click('clear');d.activeElement.blur();key('d');assert(visible().length === 2 && $('both').getAttribute('aria-pressed') === 'true');
      assert($('connector-mount').querySelector('svg').getAttribute('viewBox') === '0 0 1120 680');
      assert($('connector-mount').querySelector('[data-face="A"] .mechanical').getAttribute('transform').includes('scale(-1,1)'));
      input('lane','0');assert($('connector-mount').querySelectorAll('.pin.highlight').length === 4);
      click('pin-B14');Array.from($('details').querySelectorAll('.related button')).find(b=>b.textContent === 'A16').click();
      assert(selected() === 'A16' && visible().length === 2 && $('both').getAttribute('aria-pressed') === 'true');
      $('pin-A16').focus();key('ArrowRight');assert(selected() === 'A15');$('pin-A15').blur();
      assert(w.PCIeSelfTest.run(w.PCIeData.build('modern'),$('connector-mount').querySelector('svg'),'modern').length === 0);
      const ids=Array.from(d.querySelectorAll('[id]'),node=>node.id);assert(new Set(ids).size === ids.length,'Duplicate IDs');click('reset');
    });
    test('mobile close-up follows locked selection and physical A/B order',()=>{
      click('front');click('pin-B14');assert($('focus-title').textContent.includes('B14'));
      assert($('focus-mount').querySelectorAll('[data-focus-pin]').length >= 5 && $('focus-mount').querySelector('[data-focus-pin="B14"]'));
      assert($('focus-mount').querySelector('.focus-labels').textContent.includes('B14') && !$('focus-mount').querySelector('text'),'Close-up labels must not stretch');
      $('pin-B20').dispatchEvent(new w.PointerEvent('pointerenter',{pointerType:'mouse'}));assert($('focus-title').textContent.includes('B14'));
      $('pin-B20').dispatchEvent(new w.PointerEvent('pointerleave',{pointerType:'mouse'}));
      click('focus-next');assert(selected() === 'B15');click('focus-prev');assert(selected() === 'B14');
      click('focus-B16');assert(selected() === 'B16');
      click('back');click('pin-A17');click('focus-next');assert(selected() === 'A16' && $('focus-orientation').textContent.includes('Bracket toward right'));
      click('focus-prev');assert(selected() === 'A17');
      $('focus-A17').focus();key('ArrowRight');assert(selected() === 'A16' && d.activeElement.id === 'focus-A16');
      click('front');click('pin-B1');assert($('focus-prev').disabled);click('back');click('pin-A82');assert($('focus-prev').disabled);
      click('pin-A82');assert(!$('focus-mount').children.length && $('focus-next').disabled);
      click('pin-A81');input('profile','legacy');assert($('focus-title').textContent.includes('A81'));input('profile','modern');
    });
    test('mobile close-up visibility and dual-view page width',()=>{
      const old=frame.style.width;frame.style.width='390px';w.dispatchEvent(new w.Event('resize'));click('both');
      assert(w.getComputedStyle($('focus-card')).display !== 'none');
      assert(d.documentElement.scrollWidth <= d.documentElement.clientWidth+1);
      assert($('focus-mount').querySelector('svg').getAttribute('preserveAspectRatio') === 'none');
      click('focus-reveal');assert(selected() === 'A81' && visible().length === 2);
      frame.style.width=old;w.dispatchEvent(new w.Event('resize'));click('front');
    });
    test('help dialog and no self-test errors',()=>{click('help-open');assert($('help').open);$('help').close();assert(errors.length === 0);});
    click('clear');click('reset');click('front');
  } catch(e) {failures++;lines.push('FAIL test harness: '+e.message+'; serve this page over HTTP.');}
  report.className=failures ? 'fail' : 'pass';report.textContent=`${failures ? 'FAILED' : 'PASSED'} · ${lines.length} checks · ${failures} failures\n`+lines.join('\n');
  document.title=(failures?'FAIL':'PASS')+' · PCIe integration tests';document.body.dataset.testResult=failures?'fail':'pass';
})();
