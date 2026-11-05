"use strict";const $=id=>document.getElementById(id),cash=n=>"$"+Number(n||0).toLocaleString("en-US",{maximumFractionDigits:2}),validPrice=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0;let data={drinks:[],recipes:[],services:[],limousines:[],bookings:[],resources:[]};const qty=(id)=>Math.max(0,Number($(id)?.value)||0);const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));function el(type,cls,text){let e=document.createElement(type);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}function line(parent,name,price,prefix){let row=el("div","item");let left=el("div");left.className="drink-line-details";const img=el("img","vu-item-icon");img.alt="";img.loading="lazy";img.src="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(String(prefix.startsWith("d-")||prefix.startsWith("p-")?prefix.slice(2):name).toLowerCase().replace(/-/g,"_"))+".png";img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";img.classList.add("icon-fallback")};left.append(img);const details=el("div");details.append(el("strong",null,name),el("div","muted",validPrice(price)?cash(price):"Price not set"));left.append(details);let input=el("input");input.type="number";input.min="0";input.step="1";input.value="0";input.id=prefix;input.disabled=!validPrice(price);input.addEventListener("input",update);row.append(left,input);parent.append(row)}function selections(prefix,items){return items.filter(x=>validPrice(x.price)&&qty(prefix+x.id)>0).map(x=>({...x,quantity:qty(prefix+x.id)}))}function update(){let drinks=selections("d-",data.drinks);$("drink-total").textContent=cash(drinks.reduce((s,x)=>s+x.quantity*x.price,0));let lines=[...selections("p-",data.drinks),...selections("s-",data.services)];$("package-total").textContent=cash(lines.reduce((s,x)=>s+x.quantity*x.price,0));let limo=data.limousines.find(x=>x.id===$("limo-choice")?.value);$("limo-total").textContent=validPrice(limo?.hourlyPrice)?cash(limo.hourlyPrice*Math.max(1,qty("limo-hours"))):"Price not set";let t=Math.max(0,Number($("tip-amount").value)||0),p=Math.min(100,Math.max(0,Number($("tip-percent").value)||0));$("tip-owner").textContent=cash(t*p/100);$("tip-staff").textContent=cash(t*(1-p/100))}function copyQuote(title,lines){if(!lines.length){alert("Select priced items first.");return}const total=lines.reduce((s,x)=>s+x.quantity*x.price,0),txt=title+"\n"+lines.map(x=>x.name+" × "+x.quantity+" = "+cash(x.price*x.quantity)).join("\n")+"\nTOTAL: "+cash(total);navigator.clipboard.writeText(txt).then(()=>alert("Quote copied")).catch(()=>prompt("Copy this quote:",txt))}function render(){for(let x of data.drinks){line($("drink-list"),x.name,x.price,"d-"+x.id);line($("package-options"),x.name,x.price,"p-"+x.id)}for(let x of data.services)line($("package-options"),x.name,x.price,"s-"+x.id);if(!data.recipes.length)data.recipes=[{"name":"Whiskey Sour","ingredients":[{"name":"Lemon","quantity":1},{"name":"Whiskey","quantity":1},{"name":"Eggs","quantity":1},{"name":"Sugar","quantity":1}]},{"name":"Piña Colada","ingredients":[{"name":"Rum","quantity":1},{"name":"Pineapple","quantity":1},{"name":"Coconut","quantity":1}]},{"name":"Bloody Mary","ingredients":[{"name":"Lemon","quantity":1},{"name":"Chili Peppers","quantity":1},{"name":"Salt","quantity":1},{"name":"Vodka","quantity":1},{"name":"Tomato Juice","quantity":1}]},{"name":"Shirley Temple","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Cherry","quantity":1},{"name":"Grenadine","quantity":1}]},{"name":"Rainbow Rush","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Skittles","quantity":1},{"name":"Vodka","quantity":1}]},{"name":"Mojito","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Sugar","quantity":1},{"name":"Lime","quantity":1},{"name":"Rum","quantity":1},{"name":"Mint Leaves","quantity":1}]},{"name":"Old Fashioned","ingredients":[{"name":"Whiskey","quantity":1},{"name":"Orange","quantity":1},{"name":"Sugar","quantity":1},{"name":"Angostura Bitters","quantity":1}]},{"name":"Margarita","ingredients":[{"name":"Lime","quantity":1},{"name":"Tequila","quantity":1},{"name":"Orange","quantity":1},{"name":"Sugar","quantity":1}]},{"name":"Salty Pigeon","ingredients":[{"name":"Pigeon Milk","quantity":1},{"name":"Vodka","quantity":1},{"name":"Cocoa Powder","quantity":1},{"name":"Salt","quantity":1}]},{"name":"Virgin Mojito","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Sugar","quantity":1},{"name":"Lime","quantity":1},{"name":"Mint Leaves","quantity":1}]}];for(const r of data.recipes){
 const card=el("article","vu-recipe-card");
 const visual=el("div","vu-recipe-visual");
 const img=el("img","vu-recipe-image");img.alt=r.name+" cocktail";img.loading="lazy";
 const id=(r.id||r.name.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/_$/,"")).replace("pi_a_colada","pina_colada");
 const imageBase="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(id);
 img.src=imageBase+".png";
 img.onerror=()=>{if(img.dataset.tried==="1"){img.onerror=null;img.src="assets/vu-unicorn.svg";img.alt="Vanilla Unicorn logo — cocktail image unavailable";visual.classList.add("vu-recipe-image-fallback");}else{img.dataset.tried="1";img.src=imageBase;}};
 visual.append(img);
 const body=el("div","vu-recipe-body");
 const title=el("h3",null,r.name);
 const subtitle=el("p","vu-recipe-subtitle","INGREDIENTS · 1 COCKTAIL");
 const ingredients=el("ul","vu-recipe-ingredients");
 for(const i of r.ingredients||[]){const item=el("li");item.append(el("span",null,i.name),el("strong",null,String(i.quantity||1)+" ×"));ingredients.append(item);}
 body.append(title,subtitle,ingredients);
 card.append(visual,body);$("recipes-list").append(card);
 }setupWasteCalculator(data.recipes);if(!data.bookings.length)$("booking-list").append(el("div","item","No bookings published yet."));for(let b of [...data.bookings].sort((a,b)=>a.start.localeCompare(b.start))){let box=el("div","item");box.append(el("div",null,b.title+" — "+b.start+" to "+b.end+" ("+(b.resources||[]).join(", ")+")"));$("booking-list").append(box)}for(let r of data.resources){let o=document.createElement("option");o.value=r.id;o.textContent=r.name;$("check-resource").append(o)}let sel=document.createElement("select");sel.id="limo-choice";sel.addEventListener("change",update);sel.append(new Option("Select a vehicle",""));for(let l of data.limousines){let o=new Option(l.name+(l.active?"":" (not active)"),l.id);o.disabled=!l.active||!validPrice(l.hourlyPrice);sel.append(o)}$("limo-list").append(sel);update()}function check(){let start=$("check-start").value,end=$("check-end").value,res=$("check-resource").value,out=$("availability-result");out.className="";if(!start||!end||start>=end){out.textContent="Select a valid start and end time.";out.className="warn";return}let conflicts=data.bookings.filter(b=>(b.resources||[]).includes(res)&&start<b.end&&end>b.start);out.textContent=conflicts.length?"Unavailable: "+conflicts.map(b=>b.title).join(", "):"No conflict found in published bookings. Confirm staff and resources with management.";out.className=conflicts.length?"warn":"ok"}document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(n=>n.classList.remove("active"));document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));b.classList.add("active");$(b.dataset.tab).classList.remove("hidden")}));$("copy-drinks").onclick=()=>copyQuote("VU DRINKS QUOTE",selections("d-",data.drinks));$("copy-package").onclick=()=>copyQuote("VU EVENT PACKAGE QUOTE",[...selections("p-",data.drinks),...selections("s-",data.services)]);$("check-availability").onclick=check;["tip-amount","tip-percent","limo-hours"].forEach(id=>$(id).addEventListener("input",update));fetch("data/public.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Data unavailable");return r.json()}).then(d=>{data=d;render()}).catch(()=>{$("drink-list").textContent="Could not load published prices. Refresh or contact VU management."});

// Main navigation and nested settings sections.
(function(){
 const primary=["overview","recipes","transactions","packages","tips","calendar","settings"];
 const nested=["staff","costing","drinks","limo","events","incidents"];
 const settingsContent=document.getElementById("settings-content");
 nested.forEach(id=>{const node=document.getElementById(id);if(node){node.classList.add("settings-panel");settingsContent.append(node);}});
 const nav=[...document.querySelectorAll("nav [data-tab]")];
 const settingsButtons=[...document.querySelectorAll("[data-settings-tab]")];
 function openSettings(id){
   const target=nested.includes(id)?id:"staff";
   settingsButtons.forEach(b=>b.classList.toggle("active",b.dataset.settingsTab===target));
   nested.forEach(k=>{const el=document.getElementById(k);if(el)el.classList.toggle("hidden",k!==target);});
   try{sessionStorage.setItem("vu-settings-tab",target)}catch(_){}
 }
 function openTab(id){
   if(nested.includes(id)){openTab("settings");openSettings(id);return;}
   if(!primary.includes(id))id="overview";
   nav.forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
   primary.forEach(k=>{const el=document.getElementById(k);if(el)el.classList.toggle("hidden",k!==id);});
   if(id==="settings"){let sub="staff";try{sub=sessionStorage.getItem("vu-settings-tab")||sub}catch(_){}openSettings(sub);}
   try{sessionStorage.setItem("vu-active-tab",id)}catch(_){}
 }
 nav.forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.tab)));
 settingsButtons.forEach(b=>b.addEventListener("click",()=>openSettings(b.dataset.settingsTab)));
 document.querySelectorAll("[data-open-tab]").forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.openTab)));
 let last="overview";try{last=sessionStorage.getItem("vu-active-tab")||last}catch(_){}openTab(last);

 const $bar=id=>document.getElementById("bar-"+id),form=$bar("transaction-form"),list=$bar("transactions-list"),key="vu-bar-transactions-local-v1";
 let records=[];try{records=JSON.parse(localStorage.getItem(key)||"[]");if(!Array.isArray(records))records=[]}catch(_){}
 let editing=-1;
 const money=n=>"$"+Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 const total=r=>Number(r.amount||0)*Number(r.quantity||1);
 function preview(){$bar("preview").textContent=money(Number($bar("quantity").value||0)*Number($bar("amount").value||0))}
 ["quantity","amount"].forEach(id=>$bar(id).addEventListener("input",preview));
 function reset(){editing=-1;form.reset();$bar("quantity").value="1";$bar("save").textContent="Save transaction";$bar("cancel").classList.add("hidden");preview();}
 $bar("cancel").addEventListener("click",reset);
 function draw(){
  list.replaceChildren();
  const sales=records.filter(r=>r.type==="sale").reduce((s,r)=>s+total(r),0),expenses=records.filter(r=>r.type==="expense").reduce((s,r)=>s+total(r),0);
  $bar("sales").textContent=money(sales);$bar("expenses").textContent=money(expenses);$bar("net").textContent=money(sales-expenses);
  const filter=$bar("filter").value,search=$bar("search").value.toLowerCase();
  const shown=records.map((r,i)=>({...r,index:i})).filter(r=>(filter==="all"||r.type===filter)&&(r.description+" "+r.date).toLowerCase().includes(search));
  if(!shown.length){const p=document.createElement("p");p.textContent="No matching transactions.";list.append(p);}
  shown.forEach(r=>{
   const row=document.createElement("div");row.className="item";const info=document.createElement("div");
   const name=document.createElement("strong");name.textContent=r.description;const meta=document.createElement("div");meta.className="muted";meta.textContent=r.date+" · "+r.type+" · "+(r.quantity||1)+" × "+money(r.amount)+" = "+money(total(r));info.append(name,meta);
   const actions=document.createElement("div");actions.style.display="flex";actions.style.gap="6px";
   const edit=document.createElement("button");edit.type="button";edit.textContent="Edit";edit.onclick=()=>{editing=r.index;$bar("date").value=r.date;$bar("type").value=r.type;$bar("description").value=r.description;$bar("amount").value=r.amount;$bar("quantity").value=r.quantity||1;$bar("save").textContent="Save changes";$bar("cancel").classList.remove("hidden");preview();form.scrollIntoView({behavior:"smooth"});};
   const del=document.createElement("button");del.type="button";del.textContent="Delete";del.onclick=()=>{if(!confirm("Delete this transaction?"))return;records.splice(r.index,1);save();};
   actions.append(edit,del);row.append(info,actions);list.append(row);
  });
 }
 function save(){try{localStorage.setItem(key,JSON.stringify(records))}catch(e){alert("Unable to save on this device.");}draw();}
 form.addEventListener("submit",e=>{e.preventDefault();const amount=Number($bar("amount").value),quantity=Number($bar("quantity").value),description=$bar("description").value.trim();if(!description||!Number.isFinite(amount)||amount<=0||!Number.isInteger(quantity)||quantity<1)return;
 const record={date:$bar("date").value,type:$bar("type").value,description,amount,quantity};
 if(editing>=0)records[editing]=record;else records.unshift(record);save();reset();});
 ["filter","search"].forEach(id=>$bar(id).addEventListener("input",draw));
 $bar("export").addEventListener("click",()=>{const fields=["date","type","description","quantity","amount"];const csv=[fields.join(","),...records.map(r=>fields.map(k=>'"'+String(r[k]??"").replace(/"/g,'""')+'"').join(","))].join("\r\n");const blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="vanilla-unicorn-bar.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 draw();preview();
})();

function setupWasteCalculator(recipes){
 const ingredientNames=[...new Set(recipes.flatMap(r=>(r.ingredients||[]).map(i=>i.name)))].sort((a,b)=>a.localeCompare(b));
 const stock=$("waste-ingredients"),choices=$("waste-recipes"),results=$("waste-results");
 if(!stock||!choices||!results)return;
 const inputs=new Map(),planned=new Map();
 for(const name of ingredientNames){const label=el("label",null,name);const input=document.createElement("input");input.type="number";input.min="0";input.step="1";input.value="0";input.setAttribute("aria-label",name+" in pockets");label.append(input);stock.append(label);inputs.set(name,input);input.addEventListener("input",calculate);}
 for(const r of recipes){const row=el("div","item"),label=el("label",null,r.name+" ");const input=document.createElement("input");input.type="number";input.min="0";input.step="1";input.value="0";input.setAttribute("aria-label",r.name+" quantity to make");label.append(input);row.append(label);choices.append(row);planned.set(r.name,input);input.addEventListener("input",calculate);}
 function available(){return Object.fromEntries([...inputs].map(([name,input])=>[name,Math.max(0,Math.floor(Number(input.value)||0))]));}
 function plan(){return recipes.map(r=>({r,count:Math.max(0,Math.floor(Number(planned.get(r.name).value)||0))}));}
 function calculate(){
  const have=available(),needed={};let drinks=0;
  for(const {r,count} of plan()){drinks+=count;for(const ing of r.ingredients||[])needed[ing.name]=(needed[ing.name]||0)+count*Number(ing.quantity||1);}
  const shortage=ingredientNames.filter(n=>(needed[n]||0)>(have[n]||0)),left=ingredientNames.filter(n=>(have[n]||0)>(needed[n]||0));
  results.replaceChildren();const heading=el("h3",null,"Your ingredient plan");results.append(heading);
  results.append(el("p",null,drinks+" cocktails planned · "+(shortage.length?shortage.length+" ingredients to buy":"Enough ingredients for this plan")));
  const makeList=(title,names,format)=>{results.append(el("h4",null,title));if(!names.length){results.append(el("p","muted","None"));return;}const ul=el("ul");for(const name of names){ul.append(el("li",null,format(name)));}results.append(ul);};
  makeList("Missing — buy from the store",shortage,n=>n+": "+(needed[n]-have[n]));
  makeList("Left over after making these drinks",left,n=>n+": "+(have[n]-(needed[n]||0)));
  const used=ingredientNames.filter(n=>(needed[n]||0)>0&&!shortage.includes(n));
  if(drinks&&!shortage.length)results.append(el("p",null,"This plan can be made with your current ingredients."));
 }
 $("waste-clear").addEventListener("click",()=>{inputs.forEach(input=>input.value="0");calculate();});
 $("waste-reset").addEventListener("click",()=>{planned.forEach(input=>input.value="0");calculate();});
 $("waste-suggest").addEventListener("click",()=>{
  const remain=available(),counts=new Map(recipes.map(r=>[r.name,0]));let iterations=0;
  // Greedy heuristic: prefer drinks using ingredients with fewer alternative uses,
  // then choose the recipe consuming the most currently available ingredients.
  const uses=Object.fromEntries(ingredientNames.map(n=>[n,recipes.filter(r=>r.ingredients.some(i=>i.name===n)).length]));
  while(iterations++<1000){
   const candidates=recipes.filter(r=>r.ingredients?.length&&r.ingredients.every(i=>(remain[i.name]||0)>=Number(i.quantity||1)));
   if(!candidates.length)break;
   candidates.sort((a,b)=>{const score=r=>r.ingredients.reduce((sum,i)=>sum+Number(i.quantity||1)/(uses[i.name]||1),0);return score(b)-score(a)||a.name.localeCompare(b.name);});
   const chosen=candidates[0];counts.set(chosen.name,counts.get(chosen.name)+1);
   chosen.ingredients.forEach(i=>remain[i.name]-=Number(i.quantity||1));
  }
  counts.forEach((count,name)=>planned.get(name).value=String(count));calculate();
  results.prepend(el("p","muted","Suggested combination uses a greedy no-waste approach; other combinations may use more ingredients."));
 });
 calculate();
}
