(() => {
  const $ = id => document.getElementById(id);
  const COLORS = ['#4e83f4','#f5b84b','#4ec5b4','#ef7c83','#8b7be8','#56a5d9','#ee9b58','#6ebc82','#d879b2','#8e9db4'];
  const defaults = [
    {name:'MegaPrize',weight:1,category:'mega'},{name:'Beng Beng',weight:1,category:'regular'},{name:'Oreo',weight:1,category:'regular'},
    {name:'Permen',weight:1,category:'regular'},{name:'Hadiah Hiburan',weight:1,category:'regular'}
  ];
  let entries = [], history = [], rotation = 0, spinning = false, soundOn = true, idCounter = 1, audioCtx = null;
  try {
    const saved = JSON.parse(localStorage.getItem('spinWheelFixed') || 'null');
    if (saved && Array.isArray(saved.entries) && saved.entries.length) {
      entries = saved.entries.map(e => ({id:e.id || makeId(), name:String(e.name || 'Hadiah'), weight:Math.max(0,Number(e.weight)||0), category:e.category==='mega'?'mega':'regular'}));
      history = Array.isArray(saved.history) ? saved.history : [];
      soundOn = saved.soundOn !== false;
    } else entries = defaults.map(e => ({...e,id:makeId()}));
  } catch { entries = defaults.map(e => ({...e,id:makeId()})); }
  function makeId(){ return 'entry-' + (Date.now().toString(36)) + '-' + (idCounter++).toString(36) + '-' + Math.random().toString(36).slice(2,6); }
  function save(){ try{localStorage.setItem('spinWheelFixed',JSON.stringify({entries,history,soundOn}));}catch{} }
  const wheel = $('wheel'), ctx = wheel.getContext('2d');
  function color(i){return COLORS[i%COLORS.length]}
  function drawWheel(){
    const n=entries.length, size=wheel.width, c=size/2, r=size/2-12;
    ctx.clearRect(0,0,size,size);
    if(!n){ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fillStyle='#e7edf6';ctx.fill();ctx.fillStyle='#53657e';ctx.font='bold 25px sans-serif';ctx.textAlign='center';ctx.fillText('Tambahkan item',c,c);return;}
    const step=Math.PI*2/n;
    entries.forEach((e,i)=>{
      const start=-Math.PI/2+i*step, end=start+step;
      ctx.beginPath();ctx.moveTo(c,c);ctx.arc(c,c,r,start,end);ctx.closePath();ctx.fillStyle=color(i);ctx.fill();
      ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.stroke();
      ctx.save();ctx.translate(c,c);ctx.rotate(start+step/2);
      ctx.textAlign='right';ctx.textBaseline='middle';
      const label=e.name.length>19?e.name.slice(0,17)+'…':e.name;
      const fontSize=Math.max(13,Math.min(22,190/n+6));ctx.font=`800 ${fontSize}px system-ui, sans-serif`;
      ctx.fillStyle='#fff';ctx.shadowColor='#20314f55';ctx.shadowBlur=3;
      ctx.fillText(label,r-29,0);ctx.restore();
    });
    ctx.beginPath();ctx.arc(c,c,r+1,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=9;ctx.stroke();
  }
  function renderEntries(){
    $('entryCount').textContent=`${entries.length} item`;
    const megaBox=$('megaEntries'), regularBox=$('regularEntries');
    megaBox.innerHTML='';regularBox.innerHTML='';
    entries.forEach((e)=>{
      const i=entries.indexOf(e), box=e.category==='mega'?megaBox:regularBox;
      const row=document.createElement('div');row.className='entry';
      row.innerHTML=`<span class="swatch" style="background:${color(i)}"></span><div><div class="entry-name"></div><div class="entry-sub">${e.category==='mega'?'MegaPrize':'Doorprize biasa'}</div></div><button class="icon-btn" title="Gandakan item" aria-label="Gandakan">＋</button><button class="icon-btn delete" title="Hapus item" aria-label="Hapus">×</button>`;
      row.querySelector('.entry-name').textContent=e.name;
      row.querySelectorAll('button')[0].addEventListener('click',()=>{entries.splice(i+1,0,{...e,id:makeId()});renderAll();});
      row.querySelectorAll('button')[1].addEventListener('click',()=>{if(entries.length===1){setStatus('Minimal harus ada satu item.');return;}entries.splice(i,1);renderAll();});
      box.appendChild(row);
    });
    const megaChance=$('megaChanceList'), regularChance=$('regularChanceList');
    megaChance.innerHTML='';regularChance.innerHTML='';
    const total=entries.reduce((s,e)=>s+Math.max(0,e.weight),0);
    entries.forEach((e,i)=>{
      const item=document.createElement('div');item.className='chance-item';
      const left=document.createElement('div');
      const label=document.createElement('div');label.className='chance-label';
      const nm=document.createElement('span');nm.textContent=e.name;
      const pct=document.createElement('span');pct.textContent=(total?e.weight/total*100:0).toFixed(1)+'%';
      label.append(nm,pct);
      const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.step='1';range.value=Math.min(100,e.weight);
      range.setAttribute('aria-label','Bobot peluang '+e.name);
      range.addEventListener('input',()=>{e.weight=Number(range.value);num.value=e.weight;updatePercents();save();});
      left.append(label,range);
      const num=document.createElement('input');num.className='weight-input';num.type='number';num.min='0';num.max='100';num.step='1';num.value=e.weight;num.title='Bobot peluang';
      num.addEventListener('change',()=>{e.weight=Math.max(0,Math.min(100,Number(num.value)||0));range.value=e.weight;num.value=e.weight;updatePercents();save();});
      item.append(left,num);
      (e.category==='mega'?megaChance:regularChance).appendChild(item);
    });
    drawWheel();save();
  }
  function updatePercents(){
    const total=entries.reduce((s,e)=>s+Math.max(0,e.weight),0);
    [...$('megaChanceList').children,...$('regularChanceList').children].forEach(item=>{const name=item.querySelector('.chance-label span:first-child').textContent;const e=entries.find(x=>x.name===name);if(e)item.querySelector('.chance-label span:last-child').textContent=(total?e.weight/total*100:0).toFixed(1)+'%';});
  }
  function renderHistory(){
    const box=$('history');box.innerHTML='';
    if(!history.length){box.innerHTML='<p class="empty">Belum ada hasil. Putar dulu!</p>';return;}
    history.slice(0,20).forEach((h,i)=>{
      const row=document.createElement('div');row.className='history-item';
      row.innerHTML=`<span class="history-num">${history.length-i}</span><div><strong></strong><small></small></div>`;
      row.querySelector('strong').textContent=h.name;row.querySelector('small').textContent=h.time;
      box.appendChild(row);
    });
  }
  function renderAll(){renderEntries();renderHistory();$('soundToggle').textContent='♫ Suara: '+(soundOn?'ON':'OFF');$('soundToggle').setAttribute('aria-pressed',String(soundOn));}
  function setStatus(s){$('status').textContent=s}
  function weightedIndex(){
    const total=entries.reduce((s,e)=>s+Math.max(0,e.weight),0);
    if(total<=0)return Math.floor(Math.random()*entries.length);
    let r=Math.random()*total;
    for(let i=0;i<entries.length;i++){r-=Math.max(0,entries[i].weight);if(r<0)return i;}
    return entries.length-1;
  }
  function beep(freq=520,duration=.07,type='sine',gain=.035){
    if(!soundOn)return;
    try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.stop(audioCtx.currentTime+duration);}catch{}
  }
  function showResult(entry){
    const name=entry.name, low=name.toLowerCase(), isMega=entry.category==='mega'||low.includes('megaprize')||low.includes('mega prize');
    const isZonk=/zonk|coba lagi|coba ulang|belum beruntung|tidak menang|gak menang|ga menang|nggak menang|kosong|apes|no luck/.test(low);
    const isSnack=/beng\s*beng|oreo|permen|candy|cokelat|snack|wafer/.test(low);
    $('resultEmoji').textContent=isMega?'🎉':isZonk?'🥲':(/oreo/.test(low)?'🍪':(/permen/.test(low)?'🍬':(/beng\s*beng|cokelat|wafer/.test(low)?'🍫':'🎁')));
    const megaTitles=['WOI, HOKI BANGET?!','MEGAPRIZE JATUH KE KAMU!','INI BUKAN LATIHAN 🚨','BINTANG KEBERUNTUNGANMU NYALA!'];
    const snackTitles=['YAH, DAPET CAMILAN!','REZEKI ANAK SOLEH 😭','KRIUK-KRIUK TIME!','HADIAHNYA BISA DIMAKAN!'];
    const regularTitles=['MANTAP, ADA HASIL!','HOKI TIPIS-TIPIS 😎','YANG PENTING MENANG!','PULANG NGGAK KOSONG!','WADUH, DAPET NIH!'];
    const zonkTitles=['TANGAN LAGI BAU YA? 😭','HOKI-NYA LAGI CUTI','RODA NYA LAGI MUSUHAN SAMA KAMU','WADUH, KENA PRANK!','SABAR, JAGOAN SPIN','YAHH, KURANG SESAJEN 😂'];
    const zonkLines=['Coba cuci tangan dulu, siapa tahu hoki ikut bersih. 😂','Tenang, ini cuma cara roda ngajarin kamu ikhlas.','Keberuntunganmu lagi mode pesawat, coba lagi nanti. ✈️','Roda bilang: “belum saatnya, bestie”—eh, maksudnya pemain!','Nggak apa-apa, yang penting gaya muternya meyakinkan.','Hoki lagi antre, silakan ambil nomor. 😭','Waduh, spin-nya penuh harapan, hasilnya penuh cobaan.','Jangan salahin roda ya… walau mencurigakan. 👀'];
    const megaLines=['Bentar, jangan pingsan dulu. Ini beneran punya kamu! 😂','Hoki kamu hari ini lagi nggak ngotak. Jangan lupa traktir angin!','Semesta akhirnya membaca wishlist-mu. ✨','Auto senyum sampai besok pagi. Selamat ya!'];
    const snackLines=['Ya lumayan lah, ada teman ngemil 😭','Bersyukur, rezeki nggak boleh ditolak!','Bukan mobil sport, tapi bisa bikin happy pas lapar.','Camilan dulu, ambisi jadi sultan menyusul.','Lumayan buat ganjel perut sambil mikirin kemenangan berikutnya.','Yang penting gratis, best deal! 🍫'];
    const regularLines=['Nggak zonk-zonk amat, kan? 😂','Rezeki hari ini datang dalam bentuk '+name+'.','Kemenangan kecil tetap kemenangan, bos!','Boleh juga, roda masih sayang sama kamu.','Simpan senyumnya, siapa tahu spin berikutnya lebih gacor.','Alhamdulillah, pulang bawa sesuatu!'];
    $('resultTitle').textContent=isMega?megaTitles[Math.floor(Math.random()*megaTitles.length)]:isZonk?zonkTitles[Math.floor(Math.random()*zonkTitles.length)]:isSnack?snackTitles[Math.floor(Math.random()*snackTitles.length)]:regularTitles[Math.floor(Math.random()*regularTitles.length)];
    $('resultMessage').textContent=isMega?megaLines[Math.floor(Math.random()*megaLines.length)]:isZonk?zonkLines[Math.floor(Math.random()*zonkLines.length)]:isSnack?snackLines[Math.floor(Math.random()*snackLines.length)]:regularLines[Math.floor(Math.random()*regularLines.length)];
    $('resultPrize').textContent=name;
    $('celebration').classList.toggle('mega',isMega);$('celebration').classList.remove('hidden');
    const conf=$('confetti');conf.innerHTML='';
    const colors=isMega?['#f7c94c','#4e83f4','#ef7c83','#4ec5b4','#8b7be8']:['#e9d9c8','#c6d1df','#d5c4df','#c7d4c7','#e4bca9'];
    for(let i=0;i<(isMega?70:34);i++){const bit=document.createElement('i');bit.style.setProperty('--c',colors[i%colors.length]);bit.style.setProperty('--x',Math.random()*100+'%');bit.style.setProperty('--d',(2.2+Math.random()*3.5)+'s');bit.style.setProperty('--delay',(-Math.random()*4)+'s');bit.style.setProperty('--r',Math.random()*180+'deg');conf.appendChild(bit);}
    beep(isMega?880:650,.22,'triangle',.055);setTimeout(()=>beep(isMega?1100:780,.25,'triangle',.04),130);
  }
  async function toggleFullscreen(){
    const stage=$('wheelStage');
    if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}return;}
    if(stage.classList.contains('fallback-fullscreen')){stage.classList.remove('fallback-fullscreen');$('fullscreenBtn').textContent='⛶ Layar penuh';return;}
    try{if(stage.requestFullscreen){await stage.requestFullscreen();$('fullscreenBtn').textContent='⤢ Keluar layar penuh';}else throw new Error('unsupported');}
    catch{stage.classList.add('fallback-fullscreen');$('fullscreenBtn').textContent='⤢ Keluar layar penuh';}
  }
  $('spinBtn').addEventListener('click',()=>{
    if(spinning||!entries.length)return;
    if(!entries.some(e=>e.weight>0)&&entries.length>1){setStatus('Semua bobot 0, jadi pilihan diacak merata.');}
    const index=weightedIndex(), winner=entries[index], n=entries.length, step=360/n;
    spinning=true;$('spinBtn').disabled=true;$('spinBtn').textContent='RODA BERPUTAR…';$('celebration').classList.add('hidden');setStatus('Semoga hoki! Roda sedang berputar…');
    const targetMod=((360-((index+.5)*step%360))%360);
    const currentMod=((rotation%360)+360)%360;
    const delta=((targetMod-currentMod)+360)%360;
    rotation += 360*(5+Math.floor(Math.random()*3))+delta;
    wheel.style.transform=`rotate(${rotation}deg)`;
    let ticks=0;const tick=setInterval(()=>{beep(300+Math.min(ticks,10)*35,.035,'square',.018);ticks++;if(ticks>22)clearInterval(tick)},180);
    setTimeout(()=>{
      clearInterval(tick);spinning=false;$('spinBtn').disabled=false;$('spinBtn').innerHTML='PUTAR LAGI <span>↗</span>';
      history.unshift({name:winner.name,time:new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+' • '+new Date().toLocaleDateString('id-ID')});
      if($('removeWinner').checked&&entries.length>1){const idx=entries.findIndex(e=>e.id===winner.id);if(idx>=0)entries.splice(idx,1);}
      renderAll();setStatus('Hasil sudah keluar. Mau coba lagi?');showResult(winner);
    },5700);
  });
  $('continueBtn').addEventListener('click',()=>{$('celebration').classList.add('hidden');setStatus('Siap untuk putaran berikutnya!');});
  $('fullscreenBtn').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;$('fullscreenBtn').textContent=active?'⤢ Keluar layar penuh':'⛶ Layar penuh';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('wheelStage').classList.contains('fallback-fullscreen')){$('wheelStage').classList.remove('fallback-fullscreen');$('fullscreenBtn').textContent='⛶ Layar penuh';}});
  $('addForm').addEventListener('submit',e=>{e.preventDefault();const name=$('entryName').value.trim();if(!name)return;entries.push({id:makeId(),name,weight:1,category:$('entryCategory').value});$('entryName').value='';renderAll();});
  $('bulkToggle').addEventListener('click',()=>$('bulkArea').classList.toggle('hidden'));
  $('bulkAdd').addEventListener('click',()=>{const names=$('bulkNames').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);names.forEach(name=>entries.push({id:makeId(),name,weight:1,category:$('entryCategory').value}));$('bulkNames').value='';$('bulkArea').classList.add('hidden');renderAll();});
  $('shuffleBtn').addEventListener('click',()=>{for(let i=entries.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];}renderAll();});
  $('equalWeights').addEventListener('click',()=>{entries.forEach(e=>e.weight=1);renderAll();});
  $('clearHistory').addEventListener('click',()=>{history=[];renderHistory();save();});
  $('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;renderAll();});
  $('resetAll').addEventListener('click',()=>{if(!confirm('Reset daftar hadiah dan riwayat?'))return;entries=defaults.map(e=>({...e,id:makeId()}));history=[];rotation=0;wheel.style.transition='none';wheel.style.transform='rotate(0deg)';requestAnimationFrame(()=>wheel.style.transition='transform 5.6s cubic-bezier(.12,.75,.12,1)');renderAll();setStatus('Sudah di-reset. Yuk spin!');});
  $('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({entries,history,soundOn},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='spin-wheel-data.json';a.click();URL.revokeObjectURL(a.href);});
  $('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const raw=await file.text();let parsed;try{parsed=JSON.parse(raw)}catch{parsed={entries:raw.split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean).map(name=>({name,weight:1}))}}const incoming=Array.isArray(parsed)?parsed:(parsed.entries||[]);if(!incoming.length)throw new Error('Kosong');entries=incoming.map(e=>typeof e==='string'?({id:makeId(),name:e,weight:1,category:'regular'}):({id:makeId(),name:String(e.name||'Hadiah'),weight:Math.max(0,Number(e.weight)||0),category:e.category==='mega'?'mega':'regular'}));if(parsed.history)history=parsed.history;renderAll();setStatus('Data berhasil diimpor.');}catch{setStatus('File tidak bisa dibaca. Coba JSON atau daftar nama per baris.');}e.target.value='';});
  renderAll();
})();