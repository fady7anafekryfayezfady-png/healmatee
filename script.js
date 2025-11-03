/* مساعدك الصحي — script.js
   نسخة نهائية: portrait-only، تصميم احترافي، خرائط تعمل */
   
/* ===== عناصر DOM ===== */
const startBtn = document.getElementById('startBtn');
const demoBtn = document.getElementById('demoBtn');
const appEl = document.getElementById('app');
const introEl = document.getElementById('intro');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const fab = document.getElementById('fab');
const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
const pages = Array.from(document.querySelectorAll('.page'));
const videoDialog = document.getElementById('videoDialog');
const iframe = document.getElementById('exerciseIframe');
const music = document.getElementById('musicTrack');

/* ===== صوت خفيف (WebAudio) ===== */
let audioCtx = null;
function beep(freq=880, time=0.06){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='sine'; o.frequency.value = freq;
  o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time);
  o.start(); setTimeout(()=> o.stop(), (time+0.06)*1000);
}

/* ===== بدء التطبيق وديمو ===== */
startBtn.addEventListener('click', () => {
  introEl.style.display='none'; appEl.classList.remove('hidden'); initAll(); showPage('page-meds'); beep(660,0.06);
});
demoBtn.addEventListener('click', () => {
  // demo seed
  localStorage.setItem('meds_final', JSON.stringify([{name:'باراسيتامول',time:'08:00',repeat:true},{name:'فيتامين د',time:'14:00'}]));
  localStorage.setItem('notes_final', 'ملاحظة تجريبية: افحص الضغط يومياً.');
  introEl.style.display='none'; appEl.classList.remove('hidden'); initAll(); showPage('page-extras'); beep(880,0.06);
});

/* ===== Sidebar & navigation ===== */
menuBtn.addEventListener('click', ()=> sidebar.classList.toggle('active'));
closeSidebar.addEventListener('click', ()=> sidebar.classList.remove('active'));
Array.from(sidebar.querySelectorAll('li[data-page]')).forEach(li => li.addEventListener('click', ()=>{
  sidebar.classList.remove('active'); showPage(li.dataset.page); beep(720,0.04);
}));
document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', ()=>{
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); showPage(btn.dataset.page); beep(900,0.04);
}));

function showPage(id){
  pages.forEach(p=>p.classList.remove('active'));
  const el = document.getElementById(id); if(el) el.classList.add('active');
  if(videoDialog.open){ iframe.src=''; videoDialog.close(); }
}

/* ===== FAB quick add ===== */
fab.addEventListener('click', ()=> { showPage('page-meds'); document.getElementById('medName').focus(); beep(760,0.05); });

/* ===== swipe nav (simple) ===== */
let touchStartX = 0;
document.getElementById('mainContent').addEventListener('touchstart', (e)=> touchStartX = e.changedTouches[0].clientX);
document.getElementById('mainContent').addEventListener('touchend', (e)=> {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if(Math.abs(dx) < 50) return;
  const visible = pages.findIndex(p=>p.classList.contains('active')); if(visible === -1) return;
  let next = visible + (dx<0? 1 : -1);
  if(next < 0) next = pages.length-1; if(next >= pages.length) next = 0;
  const btn = document.querySelector(`.nav-btn[data-page="${pages[next].id}"]`);
  if(btn){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); showPage(pages[next].id); }
});

/* ===== وضع ليلي تلقائي وزر ===== */
const darkToggle = document.getElementById('darkToggle');
darkToggle.addEventListener('click', ()=> document.body.classList.toggle('dark'));
(function autoDark(){ const h = new Date().getHours(); if(h>=19 || h<6) document.body.classList.add('dark'); else document.body.classList.remove('dark'); })();

/* ========== منظم الأدوية ========= */
let meds = JSON.parse(localStorage.getItem('meds_final') || '[]');
const medListEl = document.getElementById('medList');
function renderMeds(){
  medListEl.innerHTML=''; if(!meds.length){ medListEl.innerHTML='<li class="muted">لا توجد أدوية مضافة بعد.</li>'; return;}
  meds.forEach((m, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div>${m.time? `${m.name} — ${m.time}`: m.name}</div>`;
    const actions = document.createElement('div'); actions.style.display='flex';
    const takenBtn = document.createElement('button'); takenBtn.textContent='تم'; takenBtn.className='btn';
    takenBtn.style.marginLeft='8px'; takenBtn.addEventListener('click', ()=> {
      addLog(`أخذ الدواء: ${m.name}`); playVoiceReminder(`${m.name} تم أخذه`); beep(1200,0.05); addPoints(5);
    });
    const rm = document.createElement('button'); rm.textContent='حذف'; rm.className='btn'; rm.style.background='#ff5b5b';
    rm.addEventListener('click', ()=> { meds.splice(idx,1); saveMeds(); renderMeds(); addLog(`حذف الدواء: ${m.name}`); });
    actions.appendChild(takenBtn); actions.appendChild(rm);
    li.appendChild(actions); medListEl.appendChild(li);
  });
}
function saveMeds(){ localStorage.setItem('meds_final', JSON.stringify(meds)); }
document.getElementById('addMedBtn').addEventListener('click', ()=> {
  const name = document.getElementById('medName').value.trim();
  const time = document.getElementById('medTime').value;
  const repeat = document.getElementById('repeatCheckbox').checked;
  if(!name) return alert('اكتب اسم الدواء');
  meds.push({name, time, repeat, created:new Date().toISOString(), lastNotified:null});
  saveMeds(); renderMeds(); addLog(`أضف دواء: ${name}`); document.getElementById('medName').value=''; document.getElementById('medTime').value=''; addPoints(2); beep(980,0.05);
});
document.getElementById('clearMedsBtn').addEventListener('click', ()=> { if(confirm('مسح كل الأدوية؟')){ meds=[]; saveMeds(); renderMeds(); addLog('مسح كل الأدوية'); beep(600,0.06); }});
renderMeds();

/* smart reminders: while الصفحة مفتوحة (check every 30s) */
setInterval(checkMedsDue, 30*1000);
function checkMedsDue(){
  const now = new Date();
  meds.forEach((m) => {
    if(!m.time) return;
    const [h,min] = m.time.split(':').map(Number);
    if(isNaN(h)) return;
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min, 0);
    const diff = Math.abs(now - target);
    if(diff < 60*1000){
      const key = `${m.name}@${m.time}@${now.toISOString().slice(0,16)}`;
      if(!m.lastNotified || m.lastNotified !== key){
        playVoiceReminder(`حان وقت ${m.name}`); addLog(`تذكير: ${m.name}`); m.lastNotified = key; saveMeds(); addPoints(3);
      }
    }
  });
}

/* ========== الملاحظات ========== */
const notesBox = document.getElementById('notesBox');
const savedMsg = document.getElementById('savedMsg');
notesBox.value = localStorage.getItem('notes_final') || '';
document.getElementById('saveNotesBtn').addEventListener('click', ()=>{
  localStorage.setItem('notes_final', notesBox.value); savedMsg.style.display='block'; setTimeout(()=> savedMsg.style.display='none', 1400); addLog('حفظ ملاحظة'); beep(760,0.05); addPoints(1);
});
document.getElementById('clearNotesBtn').addEventListener('click', ()=> { if(confirm('مسح الملاحظات؟')){ notesBox.value=''; localStorage.removeItem('notes_final'); addLog('مسح الملاحظات'); }});

/* ========== المساعد الطبي (نص + صوت) ========== */
const aiAnswer = document.getElementById('aiAnswer');
document.getElementById('askAiBtn').addEventListener('click', ()=>{
  const q = document.getElementById('question').value.trim(); if(!q){ aiAnswer.textContent='من فضلك اكتب سؤالك.'; return; }
  // Local rules OR optionally call a real AI endpoint (not included)
  const reply = defaultAIReply(q); aiAnswer.textContent = reply; playVoiceReminder(reply); addLog(`سؤال AI: ${q}`); addPoints(2);
});
document.getElementById('speakBtn').addEventListener('click', ()=>{
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition) return alert('التعرف الصوتي غير مدعوم في متصفحك.');
  const rec = new SpeechRecognition(); rec.lang='ar-SA'; rec.interimResults=false; rec.maxAlternatives=1;
  rec.onresult = e => { const text = e.results[0][0].transcript; document.getElementById('question').value = text; const reply = defaultAIReply(text); aiAnswer.textContent = reply; playVoiceReminder(reply); addLog(`سؤال صوتي AI: ${text}`); addPoints(2); };
  rec.onerror = err => alert('خطأ في التعرف الصوتي: '+err.message); rec.start();
});
function defaultAIReply(q){
  const s = q.toLowerCase();
  if(s.includes('ضغط')) return 'نصيحة عامة: راقب الضغط يوميًا، التزم بالدواء وقلل الملح.';
  if(s.includes('سكر')) return 'نصيحة عامة: حافظ على نظام متوازن وراقب السكر بانتظام.';
  if(s.includes('صداع')) return 'الصداع قد يكون من الجفاف أو التعب؛ اشرب ماء وارتاح.';
  if(s.includes('دوخة')) return 'الدوخة قد تكون من انخفاض الضغط/السكر؛ اجلس واشرب ماء.';
  if(s.includes('جرعة')) return 'راجع تعليمات الدواء أو استشر الصيدلي/الطبيب حول الجرعات.';
  return 'سؤالك مهم. للحصول على جواب أدق يُفضّل استشارة طبيب. أقدر أقدّم نصائح عامة إن أردت.';
}

/* ========== نصائح تحفيزية ========== */
const tips = [
  "ابدأ يومك بابتسامة — كل يوم فرصة جديدة 🌟",
  "خطوة صغيرة اليوم تُصنع فرقًا غدًا — استمر 💪",
  "ثقتك بنفسك بداية الشفاء — امنح نفسك وقتًا ❤️",
  "خصص لحظة لنفسك اليوم — صحتك النفسية مهمة",
  "المداومة أفضل من المثالية — استمر بخطوات ثابتة"
];
const tipEl = document.getElementById('dailyTip');
function showRandomTip(){ tipEl.textContent = tips[Math.floor(Math.random()*tips.length)]; }
document.getElementById('newTipBtn').addEventListener('click', ()=> { showRandomTip(); beep(900,0.04); });
document.getElementById('saveTipBtn').addEventListener('click', ()=> { localStorage.setItem('favTip_final', tipEl.textContent); alert('تم الحفظ'); addLog('حفظ نصيحة'); });
showRandomTip();

/* ========== تمارين + فيديو ========== */
const exercises = [
  { text: "تنفّس عميق: اشهيق 4 ث، احبس 4 ث، ازفر 4 ث", video: "https://www.youtube.com/embed/SEfs5TJZ6Nk" },
  { text: "حركات رقبة لطيفة: يمين/يسار 10 مرات", video: "https://www.youtube.com/embed/2L2lnxIcNmo" },
  { text: "تمدد الذراعين: ارفع الذراعين وحافظ 10 ث", video: "https://www.youtube.com/embed/odADwWzHR24" },
  { text: "حركات كاحل أثناء الجلوس: 10 دورات", video: "https://www.youtube.com/embed/4pKly2JojMw" }
];
const exerciseText = document.getElementById('exerciseText');
function newExercise(){ const ex = exercises[Math.floor(Math.random()*exercises.length)]; exerciseText.textContent = ex.text; exerciseText.dataset.video = ex.video; }
document.getElementById('newExerciseBtn').addEventListener('click', ()=> { newExercise(); addLog('تمرين جديد'); beep(780,0.04); });
document.getElementById('showExerciseVideoBtn').addEventListener('click', ()=> {
  const url = exerciseText.dataset.video || exercises[0].video; iframe.src = url + '?rel=0&autoplay=1'; videoDialog.showModal(); addLog('فتح فيديو تمرين');
});
document.getElementById('closeVideo').addEventListener('click', ()=> { iframe.src=''; videoDialog.close(); });
newExercise();

/* ========== موسيقى هادئة ========= */
const tracks = [
  "https://cdn.pixabay.com/audio/2021/08/04/audio_b29207f4f3.mp3",
  "https://cdn.pixabay.com/audio/2022/03/15/audio_2f05a6f52d.mp3"
];
let curTrack=0, playing=false;
document.getElementById('playMusicBtn')?.addEventListener('click', ()=> {
  if(!music.src) music.src = tracks[curTrack];
  if(playing){ music.pause(); playing=false; addLog('إيقاف موسيقى'); } else { music.play(); playing=true; addLog('تشغيل موسيقى'); }
  beep(720,0.04);
});
document.getElementById('changeTrackBtn')?.addEventListener('click', ()=> {
  curTrack = (curTrack+1) % tracks.length; music.src = tracks[curTrack]; if(playing) music.play(); addLog('تغيير مسار'); beep(840,0.04);
});
music?.addEventListener('ended', ()=> playing=false);

/* ========== حساب السعرات التقريبي ========= */
const foodDB = {"تفاحة":95,"برتقال":62,"موز":105,"رغيف":150,"خبز":80,"بيض":78,"جبنة":90,"لبن":120,"سلطة":30};
document.getElementById('calcBtn')?.addEventListener('click', ()=> {
  const input = document.getElementById('calInput').value.trim(); if(!input) return alert('اكتب الأطعمة أولاً');
  const items = input.split(/[،,]+/).map(s=>s.trim()).filter(Boolean); let total=0, details=[];
  items.forEach(it => { const key = it.replace(/\d+/g,'').trim(); const val = foodDB[key] || 0; total+=val; details.push(`${it}→${val} kcal`); });
  document.getElementById('calResult').textContent = `التقدير: ${total} kcal — (${details.join(' ; ')})`; addLog('حساب سعرات');
});
document.getElementById('clearCalcBtn')?.addEventListener('click', ()=> { document.getElementById('calInput').value=''; document.getElementById('calResult').textContent=''; });

/* ========== تمرين التنفّس ========== */
let breathInterval=null;
document.getElementById('startBreathBtn')?.addEventListener('click', ()=> startBreathing(4,4,4,3));
document.getElementById('stopBreathBtn')?.addEventListener('click', stopBreathing);
function startBreathing(inhale, hold, exhale, cycles=3){
  if(breathInterval) stopBreathing(); let cycle=0; const status = document.getElementById('breathingText');
  let step=0, timer=inhale; status.textContent = `اشهيق ${timer}s`;
  breathInterval = setInterval(()=> {
    timer--;
    if(timer<=0){
      if(step===0){ step=1; timer=hold; status.textContent=`احبس ${timer}s`; }
      else if(step===1){ step=2; timer=exhale; status.textContent=`ازفر ${timer}s`; }
      else { cycle++; if(cycle>=cycles){ stopBreathing(); status.textContent='انتهى التمرين'; addLog('انتهى تمرين التنفس'); return; } step=0; timer=inhale; status.textContent=`اشهيق ${timer}s`; }
    } else {
      if(step===0) status.textContent=`اشهيق ${timer}s`; else if(step===1) status.textContent=`احبس ${timer}s`; else status.textContent=`ازفر ${timer}s`;
    }
  },1000);
  addLog('بدء تمرين التنفس'); beep(760,0.04);
}
function stopBreathing(){ clearInterval(breathInterval); breathInterval=null; document.getElementById('breathingText').textContent='تم الإيقاف'; }

/* ========== أقرب مستشفى/صيدلية (خرائط) ========= */
document.getElementById('findHospitalBtn')?.addEventListener('click', ()=>{
  if(!navigator.geolocation) return alert('الموقع غير مدعوم');
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    // فتح بحث عام في خرائط Google حول إحداثيات المستخدم
    const url = `https://www.google.com/maps/search/صيدلية+أو+مستشفى/@${lat},${lon},14z`;
    window.open(url, '_blank'); addLog('بحث عن مستشفى/صيدلية');
  }, err => alert('تعذّر الحصول على الموقع: فضلاً فعل مشاركة الموقع في المتصفح'));
});
document.getElementById('openMapsBtn')?.addEventListener('click', ()=> window.open('https://www.google.com/maps', '_blank'));

/* ========== Speech Synthesis helper ========== */
function playVoiceReminder(text='حان وقت تناول الدواء الآن.'){
  if(!('speechSynthesis' in window)) return;
  const msg = new SpeechSynthesisUtterance(text); msg.lang='ar-SA';
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(msg);
}

/* ========== Activity log & gamification ========= */
let activity = JSON.parse(localStorage.getItem('activity_final') || '[]');
const activityEl = document.getElementById('activityLog');
let points = Number(localStorage.getItem('points_final') || 0);
function addLog(text){ const entry = {text, time: new Date().toISOString()}; activity.unshift(entry); if(activity.length>300) activity.pop(); localStorage.setItem('activity_final', JSON.stringify(activity)); renderActivity(); }
function renderActivity(){ activityEl.innerHTML=''; if(!activity.length) activityEl.innerHTML='<li class="muted">لا يوجد نشاط بعد.</li>'; activity.forEach(a=>{ const li=document.createElement('li'); li.textContent=`${new Date(a.time).toLocaleString()} — ${a.text}`; activityEl.appendChild(li); }); }
function addPoints(n){ points += n; localStorage.setItem('points_final', String(points)); showToast(`حصلت على ${n} نقاط • المجموع: ${points}`); if(points>=100) showToast('🎉 مبروك! إنجاز: ملتزم بصحتك'); }
document.getElementById('clearHistoryBtn')?.addEventListener('click', ()=> { if(confirm('مسح السجل؟')){ activity=[]; localStorage.removeItem('activity_final'); renderActivity(); }});
document.getElementById('exportBtn')?.addEventListener('click', ()=> { const blob = new Blob([JSON.stringify(activity, null,2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'activity.json'; a.click(); URL.revokeObjectURL(url); });
renderActivity();

/* ========== INIT ======== */
function initAll(){ meds = JSON.parse(localStorage.getItem('meds_final') || '[]'); renderMeds(); notesBox.value = localStorage.getItem('notes_final') || ''; activity = JSON.parse(localStorage.getItem('activity_final') || '[]'); renderActivity(); const fav = localStorage.getItem('favTip_final'); if(fav) tipEl.textContent = fav; else showRandomTip(); document.addEventListener('click', ()=> { if(music && music.paused) {/*unlock*/} }, {once:true}); }
if(!introEl) initAll();

/* ========== toast helper ========== */
let toastTimeout = null;
function showToast(msg, time = 2200){
  let t = document.getElementById('miniToast');
  if(!t){ t = document.createElement('div'); t.id='miniToast'; t.style.position='fixed'; t.style.bottom='160px'; t.style.left='50%'; t.style.transform='translateX(-50%)'; t.style.background='rgba(16,24,40,0.9)'; t.style.color='#fff'; t.style.padding='8px 14px'; t.style.borderRadius='999px'; t.style.zIndex='9999'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  if(toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=> t.style.opacity='0', time);
}

/* ===== نهاية الملف ===== */


