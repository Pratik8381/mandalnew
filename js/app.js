const PAGES={};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0);
const fdate=d=>new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const charts={};
function drawChart(id,cfg){charts[id]?.destroy();charts[id]=new Chart($('#'+id),cfg)}
const PAL=['#f97316','#991b1b','#eab308','#16a34a','#0ea5e9','#8b5cf6','#ec4899','#64748b'];
function toast(msg,type=''){let c=$('#toasts');if(!c){c=document.createElement('div');c.id='toasts';c.setAttribute('aria-live','polite');document.body.append(c)}const t=document.createElement('div');t.className='toast '+type;t.textContent=(type==='bad'?'✕ ':type==='warn'?'⚠ ':'✓ ')+msg;c.append(t);setTimeout(()=>t.remove(),3200)}
/* Accessible modal. onSave(root) returns false to stay open. */
function modal(title,body,{onSave,saveText='Save',danger}={}){
  const o=document.createElement('div');o.className='overlay';
  o.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3>${esc(title)}</h3><form novalidate>${body}<div class="foot"><button type="button" class="btn" data-x>${onSave?'Cancel':'Close'}</button>${onSave?`<button class="btn ${danger?'danger':'primary'}">${saveText}</button>`:''}</div></form></div>`;
  const close=()=>{o.remove();document.removeEventListener('keydown',onKey)};const onKey=e=>e.key==='Escape'&&close();
  document.addEventListener('keydown',onKey);o.addEventListener('click',e=>{if(e.target===o||e.target.dataset.x!==undefined)close()});
  $('form',o).addEventListener('submit',async e=>{e.preventDefault();if(onSave&&(await onSave(o))!==false)close()});
  document.body.append(o);($('input,select,textarea,button',o)).focus();return o;
}
const field=(label,name,input)=>`<div class="f"><label for="${name}">${label}</label>${input}<span class="err" data-err="${name}"></span></div>`;
function showErrors(root,errs){$$('[data-err]',root).forEach(e=>e.textContent=errs[e.dataset.err]||'');return Object.keys(errs).length===0}
const opts=(arr,sel)=>arr.map(a=>`<option ${a===sel?'selected':''}>${esc(a)}</option>`).join('');
const statusLabel=t=>t.status==='pending'?'Pending':t.type==='income'?'Received':'Paid';
function txnRows(list){
  return list.map(t=>`<tr><td>${fdate(t.date)}</td><td>${t.id}</td><td><span class="badge b-${t.type}">${t.type=='income'?'Income':'Expense'}</span></td><td>${esc(t.description)}</td><td>${esc(t.category)}</td><td class="hide-m">${esc(t.person)}</td><td>${esc(t.paymentMethod)}</td><td><b class="${t.type=='income'?'up':'down'}">${t.type=='income'?'+':'−'}${fmt(t.amount)}</b></td><td><span class="badge ${t.status=='pending'?'b-pending':'b-ok'}">${statusLabel(t)}</span></td><td><button class="btn icon" data-act="view" data-id="${t.id}" aria-label="View ${t.id}">👁</button><button class="btn icon" data-act="edit" data-id="${t.id}" aria-label="Edit ${t.id}">✏️</button><button class="btn icon" data-act="del" data-id="${t.id}" aria-label="Delete ${t.id}">🗑</button></td></tr>`).join('');
}
const txnHead='<th>Date</th><th>ID</th><th>Type</th><th>Description</th><th>Category</th><th class="hide-m">Contributor/Vendor</th><th>Method</th><th>Amount</th><th>Status</th><th>Actions</th>';
function bindActions(root,refresh){root.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const t=getTransactionById(b.dataset.id);if(b.dataset.act==='view')viewTxn(t);if(b.dataset.act==='edit')txnForm(t,refresh);if(b.dataset.act==='del')modal('Delete Transaction?',`<p>Are you sure you want to delete <b>${t.id}</b>?</p><p>This action cannot be undone.</p>`,{saveText:'Delete',danger:1,onSave(){deleteTransaction(t.id);toast('Transaction deleted');refresh()}})})}
function viewTxn(t){modal('Transaction Details',`<dl><dt>Transaction ID</dt><dd>${t.id}</dd><dt>Date</dt><dd>${fdate(t.date)}</dd><dt>Type</dt><dd>${t.type}</dd><dt>Description</dt><dd>${esc(t.description)}</dd><dt>Category</dt><dd>${esc(t.category)}</dd><dt>Amount</dt><dd>${fmt(t.amount)}</dd><dt>Payment Method</dt><dd>${esc(t.paymentMethod)}</dd><dt>Contributor/Vendor</dt><dd>${esc(t.person)||'—'}</dd><dt>Reference</dt><dd>${esc(t.reference)||'—'}</dd><dt>Status</dt><dd>${statusLabel(t)}</dd><dt>Notes</dt><dd>${esc(t.notes)||'—'}</dd>${t.receipt?`<dt>Receipt</dt><dd><img src="${t.receipt}" alt="Receipt" style="max-width:100%;border-radius:8px"></dd>`:''}</dl>`)}
function txnForm(t,after,preType='income'){
  const e=!!t;t=t||{type:preType,date:new Date().toISOString().slice(0,10),paymentMethod:'Cash',status:'completed'};
  const o=modal(e?'Edit Transaction':'Add Transaction',`
  <div class="f"><label>Transaction Type</label><div class="radios"><label><input type="radio" name="type" value="income" ${t.type=='income'?'checked':''}>Income</label><label><input type="radio" name="type" value="expense" ${t.type=='expense'?'checked':''}>Expense</label></div><span class="err" data-err="type"></span></div>
  <div class="row2">${field('Date','date',`<input type="date" id="date" value="${t.date}">`)}${field('Amount (₹)','amount',`<input type="number" id="amount" min="0" step="0.01" placeholder="Enter amount" value="${t.amount??''}">`)}</div>
  ${field('Description','description',`<input id="description" placeholder="Enter transaction description" value="${esc(t.description)}">`)}
  <div class="row2">${field('Category','category',`<select id="category"></select>`)}${field('Payment Method','paymentMethod',`<select id="paymentMethod">${opts(['Cash','UPI','Bank Transfer','Cheque','Other'],t.paymentMethod)}</select>`)}</div>
  <div class="row2">${field('Contributor / Vendor','person',`<input id="person" list="people" value="${esc(t.person)}"><datalist id="people">${getContributors().map(c=>`<option>${esc(c.name)}`).join('')}</datalist>`)}${field('Reference Number','reference',`<input id="reference" placeholder="Optional" value="${esc(t.reference)}">`)}</div>
  <div class="row2">${field('Status','status',`<select id="status"><option value="completed" ${t.status!='pending'?'selected':''}>Received / Paid</option><option value="pending" ${t.status=='pending'?'selected':''}>Pending</option></select>`)}${field('Receipt (image, &lt;300KB)','receipt','<input type="file" id="receipt" accept="image/*">')}</div>
  ${field('Notes','notes',`<textarea id="notes" rows="2" placeholder="Additional notes">${esc(t.notes)}</textarea>`)}`,
  {saveText:'Save Transaction',async onSave(r){
    const g=id=>$('#'+id,r).value.trim(),type=$('[name=type]:checked',r)?.value,errs={};
    if(!type)errs.type='Select a type';if(!g('date'))errs.date='Date is required';if(!g('description'))errs.description='Description is required';if(!g('category'))errs.category='Category is required';
    const amt=parseFloat(g('amount'));if(!g('amount'))errs.amount='Amount is required';else if(!(amt>0))errs.amount='Amount must be greater than 0';
    if(!showErrors(r,errs))return false;
    let receipt=t.receipt;const f=$('#receipt',r).files[0];
    if(f){if(f.size>300000){showErrors(r,{receipt:'File too large'});return false}receipt=await new Promise(ok=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.readAsDataURL(f)})}
    const d={type,date:g('date'),description:g('description'),category:g('category'),amount:amt,paymentMethod:g('paymentMethod'),person:g('person'),reference:g('reference'),notes:g('notes'),status:g('status'),receipt};
    if(e){updateTransaction(t.id,d);toast('Transaction updated successfully')}else{addTransaction(d);toast('Transaction added successfully')}
    if(type==='expense'){const b=calculateBudgetUsage().find(x=>x.category===d.category);if(b&&b.pct>=80)toast(`${b.category} budget is ${b.pct}% utilized`,'warn')}
    after?.();
  }});
  const fill=()=>{const ty=$('[name=type]:checked',o)?.value||'income';$('#category',o).innerHTML='<option value="">Select Category</option>'+opts(getCategories(ty).filter(c=>c.active||c.name===t.category).map(c=>c.name),t.category)};
  $$('[name=type]',o).forEach(x=>x.addEventListener('change',()=>{t.category='';fill()}));fill();
}
function layout(){
  const page=document.body.dataset.page,type=new URLSearchParams(location.search).get('type');
  const S=getSettings();
  const nav=[['index.html','📊 Dashboard','dashboard'],['transactions.html','💰 Transactions','transactions'],['transactions.html?type=income','📥 Income','income'],['transactions.html?type=expense','📤 Expenses','expense'],['budget.html','🎯 Budget','budget'],['contributors.html','👥 Contributors','contributors'],['reports.html','📈 Reports','reports'],['settings.html#categories','🗂 Categories','categories'],['settings.html','⚙ Settings','settings']];
  const cur=page==='transactions'?(type||'transactions'):page==='settings'&&location.hash==='#categories'?'categories':page;
  $('#sidebar').innerHTML=`<div class="brand"><b>🕉 ${esc(S.mandal||'Ganesh Mandal').toUpperCase()}</b><small>Financial Management</small></div><nav class="nav" aria-label="Main">${nav.map(n=>`<a href="${n[0]}" class="${n[2]===cur?'active':''}">${n[1]}</a>`).join('')}</nav><div class="side-foot">${esc(S.fy)}<br><span class="dot">●</span> Live · Supabase</div>`;
  const h=new Date().getHours(),gr=h<12?'Morning':h<17?'Afternoon':'Evening';
  $('#topbar').innerHTML=`<button class="btn menu-btn" aria-label="Menu" id="menu">☰</button><div><h1>Good ${gr}, Admin</h1><p class="hide-m">Manage your Ganesh Mandal finances</p></div><span class="grow"></span><form id="gsearch" style="max-width:220px" class="hide-m"><input type="search" placeholder="Search transactions…" aria-label="Search"></form><button class="btn" id="theme" aria-label="Toggle theme"></button><button class="btn" aria-label="Notifications" id="bell">🔔</button><span class="hide-m" style="font-size:12px;color:var(--muted)">${esc(window.userEmail)}</span><button class="btn" id="logout">Logout</button>`;
  $('#logout').onclick=async()=>{await sb.auth.signOut();location.href='login.html'};
  $('#menu').onclick=()=>$('#sidebar').classList.toggle('open');
  $('#gsearch').onsubmit=e=>{e.preventDefault();location.href='transactions.html?q='+encodeURIComponent($('input',e.target).value)};
  $('#bell').onclick=()=>{const over=calculateBudgetUsage().filter(b=>b.pct>=80);toast(over.length?over.map(b=>b.category+' '+b.pct+'%').join(', ')+' near/over budget':'No alerts',over.length?'warn':'')};
  const setTheme=t=>{document.documentElement.dataset.theme=t;localStorage.setItem('gm_theme',t);$('#theme').textContent=t==='dark'?'☀ Light':'🌙 Dark'};
  setTheme(localStorage.getItem('gm_theme')||'light');$('#theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
}
const emptyState=()=>`<div class="empty"><h3>No transactions yet</h3><p>Start recording your Mandal's financial activity.</p><button class="btn primary" data-add>+ Add First Transaction</button></div>`;
PAGES.dashboard=()=>{
  const render=()=>{
    const all=getTransactions(),b=calculateBalance(all),u=calculateBudgetUsage(),tb=u.reduce((s,x)=>s+x.amount,0),pct=tb?Math.round(b.expense/tb*100):0;
    const now=new Date(),mk=now.toISOString().slice(0,7),pm=new Date(now.getFullYear(),now.getMonth()-1,15).toISOString().slice(0,7);
    const m=(k,ty)=>all.filter(t=>t.type===ty&&t.date.startsWith(k)).reduce((s,t)=>s+t.amount,0);
    const ch=ty=>{const a=m(mk,ty),p=m(pm,ty);if(!p)return 'vs last month: —';const c=((a-p)/p*100).toFixed(1);return `<span class="${(ty=='income')==(c>=0)?'up':'down'}">${c>=0?'+':''}${c}%</span> from last month`};
    $('#cards').innerHTML=`<div class="card stat hero"><small>Current Balance</small><div class="v">${fmt(b.balance)}</div><div class="d">Income − Expenses</div></div><div class="card stat"><small>Total Income</small><div class="v up">${fmt(b.income)}</div><div class="d">${ch('income')}</div></div><div class="card stat"><small>Total Expenses</small><div class="v down">${fmt(b.expense)}</div><div class="d">${ch('expense')}</div></div><div class="card stat"><small>Total Budget</small><div class="v">${fmt(tb)}</div><div class="bar"><i class="${pct>100?'over':pct>=80?'warn':''}" style="width:${Math.min(pct,100)}%"></i></div><div class="d">${pct}% utilized · ${fmt(tb-b.expense)} remaining</div></div>`;
    const months=[...new Set(all.map(t=>t.date.slice(0,7)))].sort().slice(-6);
    drawChart('c1',{type:'bar',data:{labels:months.map(k=>new Date(k+'-15').toLocaleString('en',{month:'short'})),datasets:[{label:'Income',data:months.map(k=>m(k,'income')),backgroundColor:'#16a34a'},{label:'Expense',data:months.map(k=>m(k,'expense')),backgroundColor:'#f97316'}]},options:{maintainAspectRatio:false}});
    const ce=getCategoryExpenses(all);drawChart('c2',{type:'doughnut',data:{labels:Object.keys(ce),datasets:[{data:Object.values(ce),backgroundColor:PAL.concat(PAL)}]},options:{maintainAspectRatio:false,plugins:{legend:{position:'right'}}}});
    $('#bud').innerHTML=u.slice(0,6).map(x=>`<div class="brow"><div><span>${esc(x.category)}</span><span>${fmt(x.spent)} / ${fmt(x.amount)} · ${x.pct}%</span></div><div class="bar"><i class="${x.pct>100?'over':x.pct>=80?'warn':''}" style="width:${Math.min(x.pct,100)}%"></i></div></div>`).join('');
    const rec=all.slice(0,8);$('#recent').innerHTML=rec.length?`<table><thead><tr>${txnHead}</tr></thead><tbody>${txnRows(rec)}</tbody></table>`:emptyState();
  };
  $('#qa').innerHTML='<button class="btn primary" data-add="income">+ Add Income</button><button class="btn primary" data-add="expense">+ Add Expense</button><a class="btn" href="transactions.html">View Transactions</a><a class="btn" href="budget.html">Manage Budget</a>';
  document.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a)txnForm(null,render,a.dataset.add||'income')});
  bindActions($('#recent'),render);render();
};
PAGES.contributors=()=>{
  const render=()=>{
    const tx=getTransactions({type:'income'}),cs=getContributors().map(c=>{const mine=tx.filter(t=>t.person===c.name);return{...c,total:mine.reduce((s,t)=>s+t.amount,0),last:mine[0],count:mine.length}});
    const tot=cs.reduce((s,c)=>s+c.total,0),n=tx.length;
    $('#cards').innerHTML=`<div class="card stat"><small>Total Contributors</small><div class="v">${cs.length}</div></div><div class="card stat"><small>Total Contributions</small><div class="v">${fmt(tot)}</div></div><div class="card stat"><small>Average Contribution</small><div class="v">${fmt(n?Math.round(tot/n):0)}</div></div>`;
    $('#list').innerHTML=cs.length?`<table><thead><tr><th>Name</th><th>Mobile</th><th>Contribution</th><th>Payments</th><th>Last Payment</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead><tbody>${cs.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.mobile)}</td><td><b>${fmt(c.total)}</b></td><td>${c.count}</td><td>${c.last?fdate(c.last.date):'—'}</td><td>${c.last?esc(c.last.paymentMethod):'—'}</td><td><span class="badge ${c.count?'b-ok':'b-pending'}">${c.count?'Active':'No payments'}</span></td><td><button class="btn icon" data-e="${c.id}" aria-label="Edit">✏️</button><a class="btn icon" href="transactions.html?q=${encodeURIComponent(c.name)}" aria-label="Transactions">👁</a><button class="btn icon" data-d="${c.id}" aria-label="Delete">🗑</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty"><h3>No contributors yet</h3></div>';
  };
  const form=c=>{c=c||{};modal(c.id?'Edit Contributor':'Add Contributor',field('Name','name',`<input id="name" value="${esc(c.name)}">`)+field('Mobile Number','mobile',`<input id="mobile" inputmode="numeric" value="${esc(c.mobile)}">`)+field('Email','email',`<input id="email" type="email" value="${esc(c.email)}">`)+field('Address','address',`<input id="address" value="${esc(c.address)}">`)+field('Notes','notes',`<textarea id="notes">${esc(c.notes)}</textarea>`),{onSave(r){
    const g=i=>$('#'+i,r).value.trim(),er={};if(!g('name'))er.name='Name is required';if(g('mobile')&&!/^[6-9]\d{9}$/.test(g('mobile')))er.mobile='Enter a valid 10-digit mobile number';if(g('email')&&!/^\S+@\S+\.\S+$/.test(g('email')))er.email='Invalid email';
    if(!showErrors(r,er))return false;const all=getContributors(),d={name:g('name'),mobile:g('mobile'),email:g('email'),address:g('address'),notes:g('notes')};
    if(c.id)Object.assign(all.find(x=>x.id===c.id),d);else all.push({id:'C'+Date.now(),...d});saveContributors(all);toast('Contributor saved successfully');render()}})};
  $('#add').onclick=()=>form();
  $('#list').onclick=e=>{const ed=e.target.closest('[data-e]'),dl=e.target.closest('[data-d]');if(ed)form(getContributors().find(c=>c.id===ed.dataset.e));if(dl)modal('Delete Contributor?','<p>Their past transactions are kept.</p>',{saveText:'Delete',danger:1,onSave(){saveContributors(getContributors().filter(c=>c.id!==dl.dataset.d));toast('Contributor deleted');render()}})};
  render();
};
PAGES.settings=()=>{
  const S=getSettings();$('#mandal').value=S.mandal;$('#fy').value=S.fy;
  $('#saveS').onclick=()=>{saveSettings({mandal:$('#mandal').value.trim()||S.mandal,fy:$('#fy').value.trim()||S.fy});toast('Settings saved');layout()};
  $('#reset').onclick=()=>modal('Load demo data?','<p>This DELETES all current data and replaces it with sample data.</p>',{saveText:'Replace with demo',danger:1,async onSave(){await loadDemo();toast('Demo data loaded');setTimeout(()=>location.reload(),600)}});
  const render=()=>{$('#cats').innerHTML=`<table><thead><tr><th>Category</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>${getCategories().map((c,i)=>`<tr><td>${esc(c.name)}</td><td><span class="badge b-${c.type}">${c.type}</span></td><td>${c.active?'Active':'Inactive'}</td><td><button class="btn icon" data-e="${i}" aria-label="Edit">✏️</button><button class="btn icon" data-d="${i}" aria-label="Delete">🗑</button></td></tr>`).join('')}</tbody></table>`};
  const form=i=>{const all=getCategories(),c=all[i]||{type:'expense',active:true};modal(i>=0?'Edit Category':'Add Category',field('Name','name',`<input id="name" value="${esc(c.name)}">`)+field('Type','type',`<select id="type">${opts(['income','expense'],c.type)}</select>`)+field('Status','active',`<select id="active"><option value="1" ${c.active?'selected':''}>Active</option><option value="0" ${!c.active?'selected':''}>Inactive</option></select>`),{onSave(r){
    const n=$('#name',r).value.trim();if(!n){showErrors(r,{name:'Name is required'});return false}
    if(all.some((x,j)=>j!=i&&x.name.toLowerCase()===n.toLowerCase())){showErrors(r,{name:'Category already exists'});return false}
    const d={name:n,type:$('#type',r).value,active:$('#active',r).value==='1'};if(i>=0)all[i]=d;else all.push(d);saveCategories(all);toast('Category saved');render()}})};
  $('#addCat').onclick=()=>form(-1);
  $('#cats').onclick=e=>{const ed=e.target.closest('[data-e]'),dl=e.target.closest('[data-d]');if(ed)form(+ed.dataset.e);if(dl){const all=getCategories();modal('Delete Category?',`<p>Delete <b>${esc(all[dl.dataset.d].name)}</b>? Existing transactions keep their category text.</p>`,{saveText:'Delete',danger:1,onSave(){all.splice(+dl.dataset.d,1);saveCategories(all);toast('Category deleted');render()}})}};
  render();
};
document.addEventListener('DOMContentLoaded',async()=>{
  const {data}=await sb.auth.getSession();if(!data.session){location.href='login.html';return}
  window.userEmail=data.session.user.email;
  try{await Store.load()}catch(e){console.error(e);document.querySelector('main').innerHTML='<div class="card empty"><h3>Could not load data</h3><p>'+esc(e.message)+'</p></div>';return}
  layout();PAGES[document.body.dataset.page]?.()});
