const KEY='qarzdaftar.v1';
let db=[],filter='active',editId=null;
try{db=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){db=[]}
const $=id=>document.getElementById(id);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('Saqlab bo‘lmadi: xotira to‘la yoki brauzer ruxsat bermadi.')}};
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const rest=d=>Math.max(0,d.amount-d.paid);
const today=()=>{const t=new Date();t.setHours(0,0,0,0);return t};
const days=s=>s?Math.round((new Date(s+'T00:00:00')-today())/864e5):null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function dueInfo(d){
  if(rest(d)===0)return{cls:'paid',txt:'To‘liq to‘langan'};
  const n=days(d.due);
  if(n===null)return{cls:'ok',txt:'Muddat belgilanmagan'};
  const dt=new Date(d.due+'T00:00:00').toLocaleDateString('uz-UZ',{day:'numeric',month:'long',year:'numeric'});
  if(n<0)return{cls:'late',txt:`${dt} · ${-n} kun o‘tib ketdi`};
  if(n===0)return{cls:'soon',txt:`Bugun qaytarishi kerak`};
  if(n<=3)return{cls:'soon',txt:`${dt} · ${n} kun qoldi`};
  return{cls:'ok',txt:`${dt} · ${n} kun qoldi`};
}

function render(){
  const q=$('q').value.trim().toLowerCase();
  const act=db.filter(d=>rest(d)>0);
  $('total').textContent=fmt(act.reduce((s,d)=>s+rest(d),0));
  const late=act.filter(d=>days(d.due)!==null&&days(d.due)<0).length;
  $('meta').textContent=`${act.length} ta qarzdor`+(late?` · ${late} tasi muddati o‘tgan`:'');
  let list=db.filter(d=>{
    if(filter==='active'&&rest(d)===0)return false;
    if(filter==='paid'&&rest(d)>0)return false;
    if(filter==='late'&&!(rest(d)>0&&days(d.due)!==null&&days(d.due)<0))return false;
    return !q||d.name.toLowerCase().includes(q)||d.phone.replace(/\D/g,'').includes(q.replace(/\D/g,'')||'§');
  });
  list.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  $('list').innerHTML=list.length?list.map(d=>{
    const i=dueInfo(d);
    return `<div class="item ${i.cls}">
      <div class="row"><div class="name">${esc(d.name)}</div><div class="sum">${fmt(rest(d))} so‘m</div></div>
      <div class="sub"><a class="phone" href="tel:${esc(d.phone.replace(/[^\d+]/g,''))}">${esc(d.phone||'Raqam yo‘q')}</a>${d.paid>0&&rest(d)>0?` · jami ${fmt(d.amount)}, to‘landi ${fmt(d.paid)}`:''}</div>
      <div class="due">${i.txt}</div>
      <div class="acts">
        ${rest(d)>0?`<button class="pay" data-a="pay" data-id="${d.id}">To‘lov</button>`:''}
        <button data-a="edit" data-id="${d.id}">Tahrirlash</button>
        <button class="del" data-a="del" data-id="${d.id}">O‘chirish</button>
      </div></div>`}).join(''):`<div class="empty">${db.length?'Hech narsa topilmadi.':'Daftar hozircha bo‘sh. “Yangi qarz” tugmasini bosib birinchi qarzdorni yozing.'}</div>`;
}

function openForm(d){
  editId=d?d.id:null;
  $('dt').textContent=d?'Qarzni tahrirlash':'Yangi qarz';
  $('fn').value=d?d.name:'';$('fp').value=d?d.phone:'';
  $('fa').value=d?d.amount:'';$('fd').value=d?d.due:'';
  $('dlg').showModal();
}
$('add').onclick=()=>openForm();
$('cancel').onclick=()=>$('dlg').close();
$('save').onclick=()=>{
  const name=$('fn').value.trim(),amount=parseFloat($('fa').value);
  if(!name){$('fn').focus();return}
  if(!(amount>0)){$('fa').focus();return}
  const data={name,phone:$('fp').value.trim(),amount,due:$('fd').value};
  if(editId){const d=db.find(x=>x.id===editId);Object.assign(d,data)}
  else db.push({id:Date.now().toString(36),paid:0,...data});
  save();$('dlg').close();render();
};
$('list').onclick=e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;
  const d=db.find(x=>x.id===b.dataset.id);
  if(b.dataset.a==='edit')openForm(d);
  if(b.dataset.a==='del'&&confirm(`“${d.name}” yozuvi o‘chirilsinmi?`)){db=db.filter(x=>x!==d);save();render()}
  if(b.dataset.a==='pay'){
    const v=prompt(`${d.name}: qancha to‘ladi? (qoldiq ${fmt(rest(d))} so‘m)`,rest(d));
    const n=parseFloat(v);
    if(n>0){d.paid=Math.min(d.amount,d.paid+n);save();render()}
  }
};
$('tabs').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  filter=b.dataset.f;
  [...$('tabs').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  render();
};
$('q').oninput=render;
render();
