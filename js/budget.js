PAGES.budget=()=>{
  const render=()=>{
    const u=calculateBudgetUsage(),tb=u.reduce((s,x)=>s+x.amount,0),sp=u.reduce((s,x)=>s+x.spent,0);
    $('#cards').innerHTML=[['Total Budget',tb],['Allocated',tb],['Spent',sp],['Remaining',tb-sp]].map(a=>`<div class="card stat"><small>${a[0]}</small><div class="v">${fmt(a[1])}</div></div>`).join('');
    $('#list').innerHTML=u.length?`<table><thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th style="min-width:180px">Used</th><th>Actions</th></tr></thead><tbody>${u.map(x=>`<tr><td>${esc(x.category)}</td><td>${fmt(x.amount)}</td><td>${fmt(x.spent)}</td><td class="${x.remaining<0?'down':''}">${fmt(x.remaining)}</td><td><div class="bar"><i class="${x.pct>100?'over':x.pct>=80?'warn':''}" style="width:${Math.min(x.pct,100)}%"></i></div>${x.pct}% ${x.pct>100?'<span class="badge b-bad">Budget Exceeded</span>':x.pct>=80?'<span class="badge b-warn">⚠ Over 80%</span>':''}</td><td><button class="btn" data-e="${esc(x.category)}">Edit Budget</button> <a class="btn" href="transactions.html?type=expense&category=${encodeURIComponent(x.category)}">View Expenses</a></td></tr>`).join('')}</tbody></table>`:'<div class="empty"><h3>No budget categories</h3></div>';
  };
  const form=cat=>{const all=getBudgets(),b=all.find(x=>x.category===cat)||{};modal(cat?'Edit Budget':'Add Budget Category',field('Category','category',cat?`<input id="category" value="${esc(cat)}" disabled>`:`<select id="category"><option value="">Select</option>${opts(getCategories('expense').map(c=>c.name).filter(n=>!all.some(x=>x.category===n)))}</select>`)+field('Budget Amount (₹)','amount',`<input id="amount" type="number" min="0" value="${b.amount??''}">`),{onSave(r){
    const c=$('#category',r).value,a=parseFloat($('#amount',r).value),er={};if(!c)er.category='Category is required';if(!(a>0))er.amount='Enter an amount greater than 0';if(!showErrors(r,er))return false;
    if(cat)b.amount=a;else all.push({category:c,amount:a});saveBudgets(all);toast('Budget updated successfully');render()}})};
  $('#add').onclick=()=>form();$('#list').onclick=e=>{const b=e.target.closest('[data-e]');if(b)form(b.dataset.e)};render();
};
