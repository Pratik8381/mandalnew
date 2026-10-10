PAGES.reports=()=>{
  $('#rfy').textContent=getSettings().fy||'';
  $('#rc').innerHTML='<option value="">All Categories</option>'+opts(getCategories().map(c=>c.name));
  const data=()=>getTransactions({type:$('#rt').value,category:$('#rc').value,from:$('#rf').value,to:$('#rto').value});
  const render=()=>{
    const l=data(),b=calculateBalance(l),tb=getBudgets().reduce((s,x)=>s+x.amount,0),spent=calculateBalance().expense;
    $('#cards').innerHTML=[['Total Income',fmt(b.income)],['Total Expenses',fmt(b.expense)],['Net Balance',fmt(b.balance)],['Budget',fmt(tb)],['Budget Utilization',(tb?Math.round(spent/tb*100):0)+'%']].map(a=>`<div class="card stat"><small>${a[0]}</small><div class="v">${a[1]}</div></div>`).join('');
    const ce=getCategoryExpenses(l),usage=calculateBudgetUsage(),names=[...new Set([...usage.map(u=>u.category),...Object.keys(ce)])];
    $('#cat').innerHTML=`<table><thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Difference</th><th>%</th></tr></thead><tbody>${names.map(n=>{const bu=usage.find(u=>u.category===n)?.amount||0,a=ce[n]||0;return`<tr><td>${esc(n)}</td><td>${fmt(bu)}</td><td>${fmt(a)}</td><td class="${bu-a<0?'down':''}">${fmt(bu-a)}</td><td>${bu?Math.round(a/bu*100)+'%':'—'}</td></tr>`}).join('')}</tbody></table>`;
    const ms=[...new Set(l.map(t=>t.date.slice(0,7)))].sort(),sum=(k,ty)=>l.filter(t=>t.type===ty&&t.date.startsWith(k)).reduce((s,t)=>s+t.amount,0);
    $('#mon').innerHTML=`<table><thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Balance</th></tr></thead><tbody>${ms.map(k=>`<tr><td>${new Date(k+'-15').toLocaleString('en',{month:'long',year:'numeric'})}</td><td>${fmt(sum(k,'income'))}</td><td>${fmt(sum(k,'expense'))}</td><td>${fmt(sum(k,'income')-sum(k,'expense'))}</td></tr>`).join('')}</tbody></table>`;
    drawChart('r1',{type:'line',data:{labels:ms,datasets:[{label:'Income',data:ms.map(k=>sum(k,'income')),borderColor:'#16a34a'},{label:'Expense',data:ms.map(k=>sum(k,'expense')),borderColor:'#f97316'}]},options:{maintainAspectRatio:false}});
    drawChart('r2',{type:'doughnut',data:{labels:Object.keys(ce),datasets:[{data:Object.values(ce),backgroundColor:PAL.concat(PAL)}]},options:{maintainAspectRatio:false}});
  };
  $$('.filters [id^=r]').forEach(e=>e.addEventListener('input',render));
  $('#csv').onclick=()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"',h=['ID','Date','Type','Description','Category','Person','Method','Amount','Status','Reference','Notes'];
    const csv=[h.join(','),...data().map(t=>[t.id,t.date,t.type,t.description,t.category,t.person,t.paymentMethod,t.amount,t.status,t.reference,t.notes].map(q).join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='mandal-report.csv';a.click();toast('CSV exported')};
  $('#print').onclick=()=>print();
  $('#pdf').onclick=()=>toast('PDF export coming soon — use Print → Save as PDF for now','warn'); // hook for a future PDF library/server
  render();
};
