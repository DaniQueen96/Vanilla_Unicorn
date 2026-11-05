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
 }setupWasteCalculator(data.recipes);setupOrderCalculator(data);if(!data.bookings.length)$("booking-list").append(el("div","item","No bookings published yet."));for(let b of [...data.bookings].sort((a,b)=>a.start.localeCompare(b.start))){let box=el("div","item");box.append(el("div",null,b.title+" — "+b.start+" to "+b.end+" ("+(b.resources||[]).join(", ")+")"));$("booking-list").append(box)}for(let r of data.resources){let o=document.createElement("option");o.value=r.id;o.textContent=r.name;$("check-resource").append(o)}let sel=document.createElement("select");sel.id="limo-choice";sel.addEventListener("change",update);sel.append(new Option("Select a vehicle",""));for(let l of data.limousines){let o=new Option(l.name+(l.active?"":" (not active)"),l.id);o.disabled=!l.active||!validPrice(l.hourlyPrice);sel.append(o)}$("limo-list").append(sel);update()}function check(){let start=$("check-start").value,end=$("check-end").value,res=$("check-resource").value,out=$("availability-result");out.className="";if(!start||!end||start>=end){out.textContent="Select a valid start and end time.";out.className="warn";return}let conflicts=data.bookings.filter(b=>(b.resources||[]).includes(res)&&start<b.end&&end>b.start);out.textContent=conflicts.length?"Unavailable: "+conflicts.map(b=>b.title).join(", "):"No conflict found in published bookings. Confirm staff and resources with management.";out.className=conflicts.length?"warn":"ok"}document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(n=>n.classList.remove("active"));document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));b.classList.add("active");$(b.dataset.tab).classList.remove("hidden")}));$("copy-drinks").onclick=()=>copyQuote("VU DRINKS QUOTE",selections("d-",data.drinks));$("copy-package").onclick=()=>copyQuote("VU EVENT PACKAGE QUOTE",[...selections("p-",data.drinks),...selections("s-",data.services)]);$("check-availability").onclick=check;["tip-amount","tip-percent","limo-hours"].forEach(id=>$(id).addEventListener("input",update));fetch("data/public.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Data unavailable");return r.json()}).then(d=>{data=d;render()}).catch(()=>{$("drink-list").textContent="Could not load published prices. Refresh or contact VU management."});

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


})();

function setupWasteCalculator(recipes){
 const $id=id=>document.getElementById(id),names=[...new Set(recipes.flatMap(r=>(r.ingredients||[]).map(i=>i.name)))].sort((a,b)=>a.localeCompare(b));
 const stock=new Map(),targets=new Map(),pick=$id("waste-pick"),chips=$id("waste-ingredients"),results=$id("waste-results"),planResults=$id("waste-plan-results");
 if(!pick||!chips||!results||!planResults)return;
 for(const name of names){const option=document.createElement("option");option.value=name;option.textContent=name;pick.append(option);}
 for(const r of recipes){const label=el("label",null,r.name);const input=document.createElement("input");input.type="number";input.min="0";input.step="1";input.value="0";input.setAttribute("aria-label",r.name+" quantity");input.addEventListener("input",render);label.append(input);$id("waste-recipes").append(label);targets.set(r.name,input);}
 const have=name=>stock.get(name)||0;
 function render(){
  chips.replaceChildren();let total=0;
  for(const [name,qty] of [...stock].sort((a,b)=>a[0].localeCompare(b[0]))){if(qty<=0)continue;total+=qty;
   const chip=el("div","vu-pocket-chip"),label=el("span",null,name+" ×"+qty),minus=document.createElement("button"),plus=document.createElement("button"),remove=document.createElement("button");
   minus.type=plus.type=remove.type="button";minus.textContent="−";plus.textContent="+";remove.textContent="×";
   minus.setAttribute("aria-label","Remove one "+name);plus.setAttribute("aria-label","Add one "+name);remove.setAttribute("aria-label","Remove "+name);
   minus.onclick=()=>{stock.set(name,Math.max(0,have(name)-1));render();};plus.onclick=()=>{stock.set(name,have(name)+1);render();};remove.onclick=()=>{stock.delete(name);render();};
   chip.append(label,minus,plus,remove);chips.append(chip);
  }
  $id("waste-stock-count").textContent="("+total+")";
  if(!total)chips.append(el("p","muted","Nothing added yet. Select an ingredient above."));
  results.replaceChildren();
  const ready=[],missing=[];
  for(const r of recipes){
   const req=r.ingredients||[],max=req.length?Math.min(...req.map(i=>Math.floor(have(i.name)/Number(i.quantity||1)))):0;
   const short=req.filter(i=>have(i.name)<Number(i.quantity||1)).map(i=>i.name+" ×"+(Number(i.quantity||1)-have(i.name)));
   (max?ready:missing).push({r,max,short});
  }
  const readyPanel=el("div","vu-waste-result-section");readyPanel.append(el("h3",null,"Ready to make · "+ready.length));
  if(!ready.length)readyPanel.append(el("p","muted","No complete cocktails yet. Add ingredients to see your options."));
  for(const x of ready){const line=el("div","vu-waste-result-row");line.append(el("strong",null,x.r.name),el("span",null,"Up to "+x.max));readyPanel.append(line);}
  results.append(readyPanel);
  const details=document.createElement("details");details.className="vu-waste-missing";const summary=document.createElement("summary");summary.textContent="Almost there · "+missing.length+" other cocktails (show what's missing)";details.append(summary);
  for(const x of missing){const line=el("div","vu-waste-result-row");line.append(el("strong",null,x.r.name),el("span",null,x.short.join(", ")));details.append(line);}
  results.append(details);
  const needed={};let count=0;
  for(const r of recipes){const n=Math.max(0,Math.floor(Number(targets.get(r.name).value)||0));count+=n;for(const i of r.ingredients||[])needed[i.name]=(needed[i.name]||0)+n*Number(i.quantity||1);}
  planResults.replaceChildren();if(count){planResults.append(el("h4",null,"For "+count+" planned cocktails"));const shortage=names.filter(n=>(needed[n]||0)>have(n)),left=names.filter(n=>have(n)>(needed[n]||0));planResults.append(el("p",null,shortage.length?"Buy: "+shortage.map(n=>n+" ×"+(needed[n]-have(n))).join(", "):"You have everything needed."));if(left.length)planResults.append(el("p","muted","Left over: "+left.map(n=>n+" ×"+(have(n)-(needed[n]||0))).join(", "));}
 }
 $id("waste-add").onclick=()=>{const qty=Number($id("waste-add-quantity").value);if(!Number.isInteger(qty)||qty<1)return;stock.set(pick.value,have(pick.value)+qty);$id("waste-add-quantity").value="1";render();};
 $id("waste-clear").onclick=()=>{stock.clear();render();};
 $id("waste-reset").onclick=()=>{targets.forEach(i=>i.value="0");render();};
 $id("waste-suggest").onclick=()=>{
  const remain=Object.fromEntries(names.map(n=>[n,have(n)])),counts=new Map(recipes.map(r=>[r.name,0]));
  for(let j=0;j<1000;j++){const possible=recipes.filter(r=>r.ingredients?.length&&r.ingredients.every(i=>(remain[i.name]||0)>=Number(i.quantity||1)));if(!possible.length)break;
   possible.sort((a,b)=>b.ingredients.length-a.ingredients.length||a.name.localeCompare(b.name));const r=possible[0];counts.set(r.name,counts.get(r.name)+1);r.ingredients.forEach(i=>remain[i.name]-=Number(i.quantity||1));}
  counts.forEach((n,name)=>targets.get(name).value=String(n));render();
 };
 render();
}

function setupOrderCalculator(data){
 const root=document.getElementById("order-categories");if(!root)return;
 const $id=id=>document.getElementById(id),money=n=>"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 const recipes=(data.recipes||[]).map(r=>({id:r.id||r.name.toLowerCase().replace(/[^a-z0-9]+/g,"_"),name:r.name}));
 const drinks=(data.drinks||[]).map(d=>({id:d.id,name:d.name,price:d.price}));
 const seen=new Set(),groups=[
  ["Cocktails",recipes],
  ["Soft Drinks",drinks.filter(x=>/koka|frezzi|sprunk|tanga|green.cow|water/i.test(x.id))],
  ["Beer & Cider",drinks.filter(x=>/beer|cider/i.test(x.id))],
  ["Spirits & Alcohol",drinks.filter(x=>/whiskey|rum|vodka|tequila|absinthe/i.test(x.id))],
  ["Other Drinks",drinks.filter(x=>/tea|juice|milk/i.test(x.id))],
  ["Food & Snacks",[{id:"nachos",name:"Nachos"},{id:"hotdog",name:"Hotdog"}]]
 ];
 const extra=drinks.filter(x=>!groups.some(g=>g[1].some(y=>y.id===x.id)));if(extra.length)groups.push(["More Drinks",extra]);
 let saved={};try{saved=JSON.parse(localStorage.getItem("vu-order-prices-v1")||"{}")||{}}catch(_){}
 const entries=[];
 for(const [group,items] of groups){
  const panel=document.createElement("details");panel.className="vu-order-category";panel.open=group==="Cocktails";
  const summary=document.createElement("summary");summary.textContent=group+" ("+items.length+")";panel.append(summary);
  const content=document.createElement("div");content.className="vu-order-items";
  for(const item of items){
   const key=group+"::"+item.id;if(seen.has(key))continue;seen.add(key);
   const row=document.createElement("div");row.className="vu-order-item";row.dataset.search=(item.name+" "+group).toLowerCase();
   const name=document.createElement("strong");name.textContent=item.name;
   const priceLabel=document.createElement("label");priceLabel.textContent="Price $";
   const price=document.createElement("input");price.type="number";price.min="0";price.step="0.01";price.placeholder="Set price";price.setAttribute("aria-label",item.name+" unit price");
   if(Object.hasOwn(saved,key))price.value=saved[key];else if(typeof item.price==="number"&&Number.isFinite(item.price))price.value=item.price;
   priceLabel.append(price);
   const qtyLabel=document.createElement("label");qtyLabel.textContent="Qty";
   const qty=document.createElement("input");qty.type="number";qty.min="0";qty.step="1";qty.value="0";qty.setAttribute("aria-label",item.name+" quantity");qtyLabel.append(qty);
   const total=document.createElement("strong");total.className="vu-order-line-total";total.textContent="$0.00";
   row.append(name,priceLabel,qtyLabel,total);content.append(row);entries.push({item,group,key,row,price,qty,total});
   price.addEventListener("input",()=>{const p=Number(price.value);if(price.value!==""&&Number.isFinite(p)&&p>=0){saved[key]=p;}else delete saved[key];try{localStorage.setItem("vu-order-prices-v1",JSON.stringify(saved))}catch(_){}calculate();});
   qty.addEventListener("input",calculate);
  }
  panel.append(content);root.append(panel);
 }
 function lines(){return entries.filter(e=>Number(e.qty.value)>0&&Number.isInteger(Number(e.qty.value)));}
 function calculate(){
  let sum=0,count=0;const selected=lines(),summary=$id("order-summary");summary.replaceChildren();
  for(const e of entries){const p=e.price.value===""?NaN:Number(e.price.value),q=Number(e.qty.value);e.total.textContent=q>0?(Number.isFinite(p)&&p>=0?money(q*p):"Set price"):"$0.00";}
  for(const e of selected){const p=e.price.value===""?NaN:Number(e.price.value),q=Number(e.qty.value);count+=q;if(Number.isFinite(p)&&p>=0)sum+=p*q;
   const line=document.createElement("div");line.className="vu-order-summary-line";line.textContent=e.item.name+" × "+q+" — "+(Number.isFinite(p)&&p>=0?money(p*q):"Price missing");summary.append(line);
  }
  $id("order-count").textContent=String(count);$id("order-total").textContent=selected.some(e=>e.price.value===""||!Number.isFinite(Number(e.price.value)))?"Incomplete — set prices":money(sum);
  if(!selected.length){const msg=document.createElement("p");msg.className="muted";msg.textContent="No items selected yet.";summary.append(msg);}
 }
 $id("order-search").addEventListener("input",()=>{const q=$id("order-search").value.trim().toLowerCase();for(const e of entries)e.row.hidden=!e.row.dataset.search.includes(q);for(const panel of root.children){const visible=[...panel.querySelectorAll(".vu-order-item")].some(row=>!row.hidden);panel.hidden=!visible;if(q&&visible)panel.open=true;}});
 $id("order-clear").addEventListener("click",()=>{entries.forEach(e=>e.qty.value="0");calculate();});
 $id("order-copy").addEventListener("click",()=>{
  const selected=lines();if(!selected.length){alert("Add items to the order first.");return;}
  if(selected.some(e=>e.price.value==="")){alert("Set prices for every selected item first.");return;}
  const total=selected.reduce((s,e)=>s+Number(e.price.value)*Number(e.qty.value),0);
  const result="VANILLA UNICORN — ORDER QUOTE\n"+selected.map(e=>e.item.name+" × "+e.qty.value+" @ "+money(Number(e.price.value))+" = "+money(Number(e.price.value)*Number(e.qty.value))).join("\n")+"\nTOTAL: "+money(total);
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(result).then(()=>alert("Order copied.")).catch(()=>prompt("Copy your order:",result));else prompt("Copy your order:",result);
 });
 calculate();
}
