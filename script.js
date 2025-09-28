/******************** Helpers ********************/
const $ = id => document.getElementById(id);
const THB = n => new Intl.NumberFormat('th-TH').format(n);
const dateTH = d => new Date(d).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });
const daysBetween = (a,b) => Math.max(1, Math.ceil((new Date(b)-new Date(a)) / (1000*60*60*24)));
function fallbackExt(img){ if(!img?.src) return; if(!img.dataset.tried){ img.dataset.tried=1; img.src = img.src.replace(/\.png$/i, '.jpg'); } }

/******************** Storage (Fake DB) ********************/
const LS_USERS='mc_users', LS_SESSION='mc_session', LS_ORDER='mc_order', LS_HISTORY='mc_history';

const Users = {
  all: () => JSON.parse(localStorage.getItem(LS_USERS) || '[]'),
  save: list => localStorage.setItem(LS_USERS, JSON.stringify(list)),
  exists: u => Users.all().some(x => x.user === u),
  add: u => { const l = Users.all(); l.push(u); Users.save(l); },
  check: (u,p) => Users.all().find(x => x.user === u && x.pass === p)
};

const Session = {
  get: () => JSON.parse(localStorage.getItem(LS_SESSION) || 'null'),
  set: s => localStorage.setItem(LS_SESSION, JSON.stringify(s)),
  clear: () => localStorage.removeItem(LS_SESSION)
};

/******************** รูปตามยี่ห้อ/รุ่น ********************/
const ModelMap = {
  HONDA: {
    'Wave 110i': 'Moto/H 110-NB.png',
    'Wave 125i': 'Moto/H 125-NB.png',
    'Click 160': 'Moto/H Crilick-NB.png',
    'Forza 350': 'Moto/H forza-NB.png',
    'PCX 160': 'Moto/H pcx-NB.png',
    'Scoopy i': 'Moto/H scoopy-NB.png',
    'ทรงเชง' : 'Moto/ทรงเชง.jpg'
  },
  YAMAHA: {
    'Aerox': 'Moto/Y aerox-NB.png',
    'FAZZIO': 'Moto/Y FAZZIO-NB.png',
    'Finn': 'Moto/Y fin-NB.png',
    'Fino': 'Moto/Y fino-NB.png',
    'Grand Filano': 'Moto/Y GRAND FILANO-NB.png',
    'NMAX': 'Moto/Y nmax-NB.png',
    'XMAX': 'Moto/Y xmax-NB.png'
  }
};

/******************** Single-View Router ********************/
const VIEWS = ['homeSection','depositSection','reviewSection','successSection','historySection'];
function showView(id){ VIEWS.forEach(v => $(v)?.classList.add('hidden')); $(id)?.classList.remove('hidden'); }

/******************** Auth (Login/Sign in) ********************/
const authTitle=$('authTitle'), loginForm=$('loginForm'), signup1=$('signup1'), signup2=$('signup2');

// ปุ่ม logout และตัวห่อ (ไว้สลับแสดง/ซ่อน)
const logoutMini = $('logoutMini');
const logoutWrap = $('logoutWrap');

$('gotoSignup').onclick = (e)=>{ e.preventDefault();
  authTitle.textContent='Sign in';
  loginForm.classList.add('hidden'); signup2.classList.add('hidden'); signup1.classList.remove('hidden');
};

function showLoginOnly(){
  authTitle.textContent='Login';
  signup1.classList.add('hidden'); signup2.classList.add('hidden'); loginForm.classList.remove('hidden');
}
$('backToLogin1').onclick = showLoginOnly;
$('backToLogin2').onclick = showLoginOnly;

signup1.addEventListener('submit', e=>{ e.preventDefault(); signup1.classList.add('hidden'); signup2.classList.remove('hidden'); });

signup2.addEventListener('submit', e=>{
  e.preventDefault();
  const user=$('suUser').value.trim(), pass=$('suPass').value, confirm=$('suConfirm').value;
  const tel=$('suTel').value.trim(), email=$('suEmail').value.trim();
  if(!user) return alert('กรอก Username');
  if(Users.exists(user)) return alert('ชื่อผู้ใช้นี้มีอยู่แล้ว');
  if(pass!==confirm) return alert('รหัสผ่านไม่ตรงกัน');
  Users.add({user, pass, tel, email});
  Session.set({user});
  onSignedIn();
  authTitle.textContent='Login';
});

loginForm.addEventListener('submit', e=>{
  e.preventDefault();
  const user=$('loginUser').value.trim(), pass=$('loginPass').value;
  if(Users.check(user,pass)){ Session.set({user}); onSignedIn(); }
  else alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
});

function onSignedIn(){
  $('authBox').classList.add('hidden');
  $('menuBox').classList.remove('hidden');
  const name = Session.get()?.user || 'User';
  $('welcomeName').textContent = name;
  const us = $('userStatus'); if(us) us.textContent = `เข้าสู่ระบบเป็น: ${name}`;

  // แสดงปุ่ม Logout เมื่อเข้าสู่ระบบ
  if (logoutWrap) logoutWrap.classList.remove('hidden');

  showView('homeSection');
}

// ปุ่ม Logout เล็กใน panel (มุมขวาล่าง)
if (logoutMini) {
  logoutMini.onclick = () => {
    if (confirm('ออกจากระบบใช่หรือไม่?')) {
      Session.clear();
      if (logoutWrap) logoutWrap.classList.add('hidden'); // ซ่อนปุ่มทันที
      location.reload();
    }
  };
}

// คงสถานะตอนรีเฟรช
(function(){
  if(Session.get()){
    onSignedIn();
  }else{
    if (logoutWrap) logoutWrap.classList.add('hidden'); // ซ่อนเมื่อยังไม่ได้ล็อกอิน
  }
})();

/******************** เมนูหลังล็อกอิน ********************/
$('goDeposit').onclick = ()=> showView('depositSection');
$('goHistory').onclick = ()=> { renderHistory(); showView('historySection'); };

/******************** Deposit form ********************/
const brand=$('brand'), model=$('model'), modelPreview=$('modelPreview');

brand.onchange = ()=>{
  model.innerHTML = '<option value="">— เลือก —</option>';
  const m = ModelMap[brand.value] || {};
  Object.keys(m).forEach(name=>{
    const o = document.createElement('option'); o.value=name; o.textContent=name; model.appendChild(o);
  });
  model.value=''; modelPreview.src='';
};

model.onchange = ()=>{
  const src = (ModelMap[brand.value]||{})[model.value];
  if(src){ modelPreview.src = src; modelPreview.onerror = function(){ fallbackExt(this); }; }
};

// วัน default + กันย้อนหลัง
const todayISO = new Date().toISOString().split('T')[0];
$('startDate').value = todayISO; $('endDate').value = todayISO;
$('startDate').min = todayISO;   $('endDate').min = todayISO;

// cancel → กลับหน้าแรก
$('cancelDeposit').onclick = ()=>{
  $('depositForm').reset();
  model.innerHTML = '<option value="">— เลือก —</option>';
  modelPreview.src='';
  updateLivePrice();
  showView('homeSection'); // กลับหน้าแรก
};

// submit → review
$('depositForm').addEventListener('submit', e=>{
  e.preventDefault();
  if(!Session.get()) return alert('กรุณาเข้าสู่ระบบก่อน');
  if(!brand.value) return alert('กรุณาเลือกยี่ห้อ');
  if(!model.value) return alert('กรุณาเลือกรุ่น');

  const data = {
    user: Session.get().user,
    type: $('type').value,
    brand: brand.value,
    model: model.value,
    plate: $('plate').value.trim(),
    start: $('startDate').value,
    end: $('endDate').value,
    note: $('note').value.trim(),
    img: (ModelMap[brand.value]||{})[model.value] || ''
  };
  if(new Date(data.end) < new Date(data.start)) return alert('วันที่รับต้องไม่น้อยกว่าวันที่ฝาก');

  data.days = daysBetween(data.start, data.end);
  data.rate = 15;
  data.total = data.days * data.rate;

  localStorage.setItem(LS_ORDER, JSON.stringify(data));
  renderReview();
  showView('reviewSection');
});

/******************** ราคาแบบเรียลไทม์ ********************/
function updateLivePrice(){
  const s=$('startDate').value, e=$('endDate').value, box=$('priceLive');
  if(!box || !s || !e) return;
  const days = Math.max(1, Math.ceil((new Date(e)-new Date(s))/(1000*60*60*24)));
  box.textContent = `รวมค่าฝาก: ${THB(days*15)} บาท (${days} วัน)`;
}
['startDate','endDate'].forEach(id=>{
  const el=$(id); el.addEventListener('change',updateLivePrice); el.addEventListener('input',updateLivePrice);
});
updateLivePrice();

/******************** Review / Payment ********************/
function renderReview(){
  const x = JSON.parse(localStorage.getItem(LS_ORDER) || 'null'); if(!x) return;
  const L = $('reviewList'); L.innerHTML = '';
  [
    ['ชื่อผู้ใช้',x.user], ['ทะเบียนรถ',x.plate], ['ยี่ห้อ',x.brand], ['รุ่น',x.model],
    ['นำรถมาฝากวันที่',dateTH(x.start)], ['มารับรถวันที่',dateTH(x.end)],
    ['จำนวนวัน',THB(x.days)+' วัน'], ['อัตรา',THB(x.rate)+' บาท/วัน'],
    ['จำนวนเงินที่ต้องชำระ',THB(x.total)+' บาท'], ['หมายเหตุ',x.note||'-']
  ].forEach(([k,v])=>{ const b=document.createElement('b'); b.textContent=k; const d=document.createElement('div'); d.textContent=v; L.append(b,d); });
  $('payTotal').textContent = THB(x.total);
}

$('backToForm').onclick = ()=> showView('depositSection');

$('confirmPay').onclick = ()=>{
  const x = JSON.parse(localStorage.getItem(LS_ORDER) || 'null'); if(!x) return;
  saveHistory(x);
  renderSuccess(x);
  showView('successSection');
};

/******************** Success ********************/
function renderSuccess(x){
  $('successImg').src = x.img || '';
  $('successImg').onerror = function(){ fallbackExt(this); };
  const L = $('successList'); L.innerHTML='';
  [
    ['ชื่อผู้ใช้',x.user],
    ['เบอร์', Users.all().find(u=>u.user===x.user)?.tel || '-'],
    ['ทะเบียนรถ',x.plate],
    ['ยี่ห้อ/รุ่น',x.brand+' / '+x.model],
    ['นำรถมาฝาก',dateTH(x.start)],
    ['มารับรถ',dateTH(x.end)],
    ['ยอดที่ชำระ',THB(x.total)+' บาท],
    ['หมายเหตุ',x.note||'-']
  ].forEach(([k,v])=>{ const b=document.createElement('b'); b.textContent=k; const d=document.createElement('div'); d.textContent=v; L.append(b,d); });
}

// เสร็จสิ้น → กลับหน้าแรก
$('finishBtn').onclick = ()=>{
  localStorage.removeItem(LS_ORDER);
  showView('homeSection');
};

/******************** History (การ์ดมีรูป + ดู/ลบ) ********************/
function saveHistory(x){
  const h = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
  h.unshift({...x, time: Date.now()});
  localStorage.setItem(LS_HISTORY, JSON.stringify(h));
}

function deleteHistoryById(id){
  const h = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
  const next = h.filter(it => it.time !== id);
  localStorage.setItem(LS_HISTORY, JSON.stringify(next));
}

function renderHistory(){
  const h = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
  const box = $('historyList');
  box.classList.add('hist-list');
  box.innerHTML = '';

  if(!h.length){ box.innerHTML = '<div class="muted">ยังไม่มีรายการ</div>'; return; }

  h.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'hist-card';
    card.dataset.id = item.time;

    const thumb = document.createElement('div');
    thumb.className = 'hist-thumb';
    const img = document.createElement('img');
    img.src = item.img || '';
    img.onerror = function(){ fallbackExt(this); };
    thumb.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'hist-meta';
    meta.innerHTML = `
      <b>${item.brand} / ${item.model}</b>
      <div class="muted">${item.plate} • ${new Date(item.time).toLocaleString('th-TH')}</div>
      <div class="muted">${dateTH(item.start)} → ${dateTH(item.end)} (${item.days} วัน) • ${THB(item.total)} บาท</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'hist-actions';
    const btnView = document.createElement('button'); btnView.className='btn-small'; btnView.textContent='ดูรายละเอียด';
    const btnDel  = document.createElement('button'); btnDel.className='btn-small red'; btnDel.textContent='ลบรายการ';
    actions.append(btnView, btnDel);

    const details = document.createElement('div');
    details.className = 'hist-details';
    details.innerHTML = `
      <div class="list">
        <b>ผู้ใช้</b><div>${item.user}</div>
        <b>ทะเบียน</b><div>${item.plate}</div>
        <b>ยี่ห้อ/รุ่น</b><div>${item.brand} / ${item.model}</div>
        <b>นำรถมาฝาก</b><div>${dateTH(item.start)}</div>
        <b>มารับรถ</b><div>${dateTH(item.end)}</div>
        <b>จำนวนวัน</b><div>${item.days} วัน</div>
        <b>ยอดรวม</b><div>${THB(item.total)} บาท</div>
        <b>หมายเหตุ</b><div>${item.note || '-'}</div>
      </div>
    `;

    btnView.onclick = ()=>{
      card.classList.toggle('open');
      btnView.textContent = card.classList.contains('open') ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด';
    };
    [thumb, meta].forEach(el=>{
      el.style.cursor='pointer';
      el.onclick = btnView.onclick;
    });

    btnDel.onclick = ()=>{
      if(confirm('ต้องการลบรายการนี้ใช่หรือไม่?')){
        deleteHistoryById(item.time);
        renderHistory();
      }
    };

    card.append(thumb, meta, actions, details);
    box.append(card);
  });
}

/******************** ปุ่มกลับหน้าแรกในหน้า History ********************/
const backHome = $('backHome');
if (backHome) backHome.onclick = () => showView('homeSection');

/******************** Utils show/hide (เผื่อเรียก) ********************/
function show(id){ $(id)?.classList.remove('hidden'); }
function hide(...ids){ ids.forEach(i => $(i)?.classList.add('hidden')); }
