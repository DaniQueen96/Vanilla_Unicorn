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
  const potential=el("div","vu-potential");potential.append(el("h4",null,"What can I make with my pockets?"));
  const intro=el("p","muted","Each drink is calculated separately using your current ingredients. Missing amounts are for ONE cocktail, not all cocktails together.");potential.append(intro);
  const grid=el("div","vu-potential-grid");
  for(const r of recipes){
   const ingredients=r.ingredients||[];
   const max=ingredients.length?Math.min(...ingredients.map(i=>Math.floor((have[i.name]||0)/Number(i.quantity||1)))):0;
   const missing=ingredients.filter(i=>(have[i.name]||0)<Number(i.quantity||1)).map(i=>i.name+" ×"+(Number(i.quantity||1)-(have[i.name]||0)));
   const card=el("div","vu-potential-card");
   const top=el("div","vu-potential-top");top.append(el("strong",null,r.name),el("span",max?"Can make "+max:"Need "+missing.length+" ingredients"));card.append(top);
   const detail=el("small",null,max?"Enough ingredients for "+max+" cocktail"+(max===1?"":"s"): "To make 1: "+missing.join(", "));
   card.append(detail);grid.append(card);
  }
  potential.append(grid);results.append(potential);
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
