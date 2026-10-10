PAGES.transactions=()=>{
  const P=new URLSearchParams(location.search),PS=10;let page=1;
  const type0=P.get('type')||'';
  $('#title').textContent=type0==='income'?'Income':type0==='expense'?'Expenses':'Transactions';
  $('#fq').value=P.get('q')||'';$('#ft').value=type0;
  const cats=()=>{const ty=$('#ft').value;$('#fc').innerHTML='<option value="">All Categories</option>'+opts(getCategories(ty||undefined).map(c=>c.name))};cats();
  if(P.get('category'))$('#fc').value=P.get('category');
  $('#fm').innerHTML='<option value="">All Methods</option>'+opts(['Cash','UPI','Bank Transfer','Cheque','Other']);
  const render=()=>{
    const f={q:$('#fq').value,type:$('#ft').value,category:$('#fc').value,method:$('#fm').value,from:$('#ffrom').value,to:$('#fto').value,sort:$('#fs').value};
    const all=getTransactions(f),pages=Math.max(1,Math.ceil(all.length/PS));page=Math.min(page,pages);const s=(page-1)*PS,rows=all.slice(s,s+PS);
    $('#table').innerHTML=Store.get('transactions',[]).length===0?emptyState():rows.length?`<table><thead><tr>${txnHead}</tr></thead><tbody>${txnRows(rows)}</tbody></table>`:'<div class="empty"><h3>No matching transactions</h3></div>';
    $('#pager').innerHTML=all.length?`<span>Showing ${s+1}–${s+rows.length} of ${all.length} transactions</span><div><button class="btn" id="pv" ${page<=1?'disabled':''}>Prev</button><button class="btn" id="nx" ${page>=pages?'disabled':''}>Next</button></div>`:'';
    $('#pv')&&($('#pv').onclick=()=>{page--;render()});$('#nx')&&($('#nx').onclick=()=>{page++;render()});
  };
  $$('.filters [id^=f]').forEach(el=>el.addEventListener('input',()=>{if(el.id==='ft')cats();page=1;render()}));
  document.addEventListener('click',e=>{if(e.target.closest('[data-add]')||e.target.id==='add')txnForm(null,render,$('#ft').value||'income')});
  bindActions($('#table'),render);render();
};
