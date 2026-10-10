/* Storage service: the ONLY file that touches localStorage.
   To move to Supabase/REST later, re-implement Store (make it async) and keep the API below. */
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
/* In-memory cache loaded once at startup; every write goes to Supabase in the background. */
const cache={transactions:[],budgets:[],contributors:[],categories:[],settings:{}};
const TBL={transactions:'id',budgets:'category',contributors:'id',categories:'name'};
const toRow=t=>({id:t.id,type:t.type,date:t.date,description:t.description,category:t.category,amount:t.amount,payment_method:t.paymentMethod,person:t.person,reference:t.reference,notes:t.notes,status:t.status,receipt_url:t.receipt||null});
const fromRow=r=>({...r,amount:Number(r.amount),paymentMethod:r.payment_method,receipt:r.receipt_url});
const run=async p=>{const r=await p;if(r.error)throw r.error;return r.data};
const bg=p=>Promise.resolve(p).then(r=>{if(r.error)throw r.error}).catch(e=>{console.error(e);window.toast&&toast('Save failed: '+e.message,'bad')});
const Store={
  get(k,d){return cache[k]??d},
  async load(){
    for(const t of Object.keys(TBL))cache[t]=await run(sb.from(t).select('*').limit(5000));
    cache.transactions=cache.transactions.map(fromRow);
    cache.settings=(await run(sb.from('settings').select('*').eq('id',1)))[0]||{mandal:'Ganesh Mandal',fy:'FY 2026-27'};
    if(!cache.categories.length){cache.categories=[...INCOME_CATS.map(n=>({name:n,type:'income',active:true})),...EXPENSE_CATS.map(n=>({name:n,type:'expense',active:true}))];await run(sb.from('categories').upsert(cache.categories))}
  },
  replace(t,rows){const k=TBL[t],keep=new Set(rows.map(r=>r[k])),gone=cache[t].filter(r=>!keep.has(r[k])).map(r=>r[k]);cache[t]=rows;if(gone.length)bg(sb.from(t).delete().in(k,gone));if(rows.length)bg(sb.from(t).upsert(rows))}
};
const INCOME_CATS=['Donation','Sponsorship','Member Contribution','Advertisement','Other Income'];
const EXPENSE_CATS=['Pandal','Decoration','Sound System','Lighting','Electricity','Food','Prasad','Flowers','Idol','Transportation','Security','Cultural Program','Cleaning','Miscellaneous'];
function demoData(){
  const out={};const Store={set:(k,v)=>{out[k]=v}};
  const names=['Rajesh Patil','Amit Shinde','Sanket Jadhav','Rohit Pawar','Sneha Kulkarni','Akshay More','Pranav Deshmukh','Neha Joshi','Vikram Gaikwad','Pooja Kale'];
  Store.set('contributors',names.map((n,i)=>({id:'C'+(i+1),name:n,mobile:'98'+String(76543210+i*1111).slice(0,8),email:'',address:'Pune',notes:''})));
  const M=['UPI','Cash','Bank Transfer','Cheque'];
  const inc=[[5000,'Donation'],[11000,'Donation'],[2100,'Donation'],[25000,'Sponsorship'],[7500,'Donation'],[3000,'Member Contribution'],[15000,'Sponsorship'],[1100,'Donation'],[4000,'Donation'],[10000,'Advertisement'],[2500,'Member Contribution'],[6000,'Donation'],[5100,'Donation'],[20000,'Sponsorship'],[7650,'Donation']];
  const exp=[['Pandal Bamboo & Cloth','Pandal',20000,'Shree Mandap Works'],['Flower Garlands','Flowers',3000,'Ganesh Flowers'],['Decoration Material','Decoration',3500,'Rang Decor'],['Decor Lights','Decoration',9500,'Rang Decor'],['Sound System Rental','Sound System',12000,'Beats Audio'],['Catering - Aarti Day','Food',9000,'Anna Purna Caterers'],['Prasad Sweets','Prasad',4500,'Chitale Sweets'],['LED Lighting','Lighting',3000,'Shine Electricals'],['Electricity Deposit','Electricity',2500,'MSEDCL'],['Idol Advance','Idol',6000,'Kumbhar Arts'],['Mahaprasad Groceries','Food',9000,'Patil Kirana'],['Backdrop Printing','Decoration',12000,'Print Hub'],['Security Guard','Security',2000,'Guard Co'],['Tempo Transport','Transportation',1800,'Jadhav Tempo'],['Cleaning Supplies','Cleaning',700,'Local Store'],['Prasad Packaging','Prasad',3000,'Pack Mart'],['Cultural Program Artists','Cultural Program',4000,'Sur Taal'],['Banners','Miscellaneous',1500,'Print Hub'],['Extra Wiring','Electricity',1200,'Shine Electricals'],['Stationery','Miscellaneous',500,'Local Store']];
  const t=[];
  inc.forEach((a,i)=>t.push({type:'income',date:new Date(Date.UTC(2026,7,22+i*3)).toISOString().slice(0,10),description:(a[1]=='Donation'?'Donation - ':a[1]+' - ')+names[i%10],category:a[1],amount:a[0],paymentMethod:M[i%4],person:names[i%10],reference:i%4==0?'UPI'+(1234500+i):'',notes:'Ganesh Utsav Contribution',status:'completed'}));
  exp.forEach((e,i)=>t.push({type:'expense',date:new Date(Date.UTC(2026,7,25+i*3)).toISOString().slice(0,10),description:e[0],category:e[1],amount:e[2],paymentMethod:M[(i+1)%4],person:e[3],reference:'',notes:'',status:i==19?'pending':'completed'}));
  t.sort((a,b)=>a.date.localeCompare(b.date)).forEach((x,i)=>x.id='TXN-'+String(i+1).padStart(5,'0'));
  Store.set('transactions',t);
  Store.set('budgets',[['Pandal',50000],['Decoration',40000],['Food',30000],['Sound System',20000],['Prasad',15000],['Lighting',15000],['Electricity',10000],['Miscellaneous',20000]].map(b=>({category:b[0],amount:b[1]})));
  Store.set('categories',[...INCOME_CATS.map(n=>({name:n,type:'income',active:true})),...EXPENSE_CATS.map(n=>({name:n,type:'expense',active:true}))]);
  Store.set('settings',{mandal:'Ganesh Mandal',fy:'FY 2026-27'});
  return out;
}
const getSettings=()=>cache.settings;
const saveSettings=x=>{cache.settings={id:1,...x};bg(sb.from('settings').upsert(cache.settings))};
async function loadDemo(){const d=demoData();
  for(const t of Object.keys(TBL))await run(sb.from(t).delete().neq(TBL[t],'__none__'));
  await run(sb.from('contributors').insert(d.contributors));await run(sb.from('categories').insert(d.categories));await run(sb.from('budgets').insert(d.budgets));await run(sb.from('transactions').insert(d.transactions.map(toRow)));
  await run(sb.from('settings').upsert({id:1,...d.settings}))}
function getTransactions(f={}){
  const q=(f.q||'').toLowerCase();
  let l=Store.get('transactions',[]).filter(t=>(!f.type||t.type===f.type)&&(!f.category||t.category===f.category)&&(!f.method||t.paymentMethod===f.method)&&(!f.from||t.date>=f.from)&&(!f.to||t.date<=f.to)&&(!q||[t.description,t.person,t.id].some(s=>(s||'').toLowerCase().includes(q))));
  const s=f.sort||'date-desc';
  l.sort((a,b)=>s==='date-asc'?a.date.localeCompare(b.date):s==='amount-desc'?b.amount-a.amount:s==='amount-asc'?a.amount-b.amount:b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  return l;
}
const getTransactionById=id=>Store.get('transactions',[]).find(t=>t.id===id);
function addTransaction(t){const all=cache.transactions;const n=all.reduce((m,x)=>Math.max(m,parseInt(x.id.slice(4))||0),0)+1;t.id='TXN-'+String(n).padStart(5,'0');if(all.some(x=>x.id===t.id))throw new Error('Duplicate ID');all.push(t);bg(sb.from('transactions').insert(toRow(t)));return t}
function updateTransaction(id,patch){const i=cache.transactions.findIndex(t=>t.id===id);if(i<0)return;cache.transactions[i]={...cache.transactions[i],...patch,id};bg(sb.from('transactions').update(toRow(cache.transactions[i])).eq('id',id))}
function deleteTransaction(id){cache.transactions=cache.transactions.filter(t=>t.id!==id);bg(sb.from('transactions').delete().eq('id',id))}
/* Balance = Income - Expenses */
function calculateBalance(list=getTransactions()){const sum=ty=>list.filter(t=>t.type===ty).reduce((s,t)=>s+t.amount,0);const income=sum('income'),expense=sum('expense');return{income,expense,balance:income-expense}}
function getCategoryExpenses(list=getTransactions()){const o={};list.filter(t=>t.type==='expense').forEach(t=>o[t.category]=(o[t.category]||0)+t.amount);return o}
/* Remaining = Budget - Spent ; Utilization % = Spent / Budget * 100 */
function calculateBudgetUsage(){const spent=getCategoryExpenses();return getBudgets().map(b=>{const s=spent[b.category]||0;return{...b,spent:s,remaining:b.amount-s,pct:b.amount?Math.round(s/b.amount*100):0}})}
const getBudgets=()=>[...cache.budgets];
const saveBudgets=b=>Store.replace('budgets',b);
const getContributors=()=>[...cache.contributors];
const saveContributors=c=>Store.replace('contributors',c);
const getCategories=(type)=>Store.get('categories',[]).filter(c=>!type||c.type===type);
const saveCategories=c=>Store.replace('categories',c);
