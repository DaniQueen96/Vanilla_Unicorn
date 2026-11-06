"use strict";const $=id=>document.getElementById(id),cash=n=>"$"+Number(n||0).toLocaleString("en-US",{maximumFractionDigits:2}),validPrice=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0;let data={drinks:[],recipes:[],services:[],limousines:[],bookings:[],resources:[]};let sharedSellingPrices={},packageEntries=[];const qty=(id)=>Math.max(0,Number($(id)?.value)||0);const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));function el(type,cls,text){let e=document.createElement(type);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}function line(parent,name,price,prefix){let row=el("div","item");let left=el("div");left.className="drink-line-details";const img=el("img","vu-item-icon");img.alt="";img.loading="lazy";img.src="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(String(prefix.startsWith("d-")||prefix.startsWith("p-")?prefix.slice(2):name).toLowerCase().replace(/-/g,"_"))+".png";img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";img.classList.add("icon-fallback")};left.append(img);const details=el("div");details.append(el("strong",null,name),el("div","muted",validPrice(price)?cash(price):"Price not set"));left.append(details);let input=el("input");input.type="number";input.min="0";input.step="1";input.value="0";input.id=prefix;input.disabled=!validPrice(price);input.addEventListener("input",update);row.append(left,input);parent.append(row)}function selections(prefix,items){return items.filter(x=>validPrice(x.price)&&qty(prefix+x.id)>0).map(x=>({...x,quantity:qty(prefix+x.id)}))}function update(){let drinks=selections("d-",data.drinks);$("drink-total").textContent=cash(drinks.reduce((s,x)=>s+x.quantity*x.price,0));let lines=packageEntries.filter(e=>e.quantity>0&&validPrice(e.price));$("package-total").textContent=cash(lines.reduce((s,x)=>s+x.quantity*x.price,0));let limo=data.limousines.find(x=>x.id===$("limo-choice")?.value);$("limo-total").textContent=validPrice(limo?.hourlyPrice)?cash(limo.hourlyPrice*Math.max(1,qty("limo-hours"))):"Price not set";let t=Math.max(0,Number($("tip-amount").value)||0),p=Math.min(100,Math.max(0,Number($("tip-percent").value)||0));$("tip-owner").textContent=cash(t*p/100);$("tip-staff").textContent=cash(t*(1-p/100))}function copyQuote(title,lines){if(!lines.length){alert("Select priced items first.");return}const total=lines.reduce((s,x)=>s+x.quantity*x.price,0),txt=title+"\n"+lines.map(x=>x.name+" × "+x.quantity+" = "+cash(x.price*x.quantity)).join("\n")+"\nTOTAL: "+cash(total);navigator.clipboard.writeText(txt).then(()=>alert("Quote copied")).catch(()=>prompt("Copy this quote:",txt))}const packageBaseCosts={whiskey:65,rum:78,vodka:50,tequila:25,absinthe:52,beer:12,cider:18,koka:10,frezzi:10,sprunk:10,tanga:10,"sweet-tea":12,"green-cow":20,"tomato-juice":15,"pigeon-milk":32,"almond-milk":28,water:4};
function packagePrice(item){
 const id=String(item.id||"").toLowerCase(),name=String(item.name||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 const matches=Object.entries(sharedSellingPrices).filter(([key,value])=>value!==null&&Number.isFinite(Number(value))&&Number(value)>=0&&!key.startsWith("__")&&(key.toLowerCase().endsWith("::"+id)||key.toLowerCase().replace(/[^a-z0-9]/g,"").endsWith(name)));
 if(matches.length)return {price:Number(matches[0][1]),estimated:false};
 if(validPrice(item.price))return {price:item.price,estimated:false};
 if(Object.hasOwn(packageBaseCosts,id))return {price:Math.ceil((packageBaseCosts[id]/0.7)/5)*5,estimated:true};
 return {price:null,estimated:false};
}
function renderPackageCreator(){
 const root=$("package-options");root.replaceChildren();packageEntries=[];
 const items=[...data.drinks.map(x=>({...x,kind:"drink"})),...data.services.map(x=>({...x,kind:"service"}))];
 for(const item of items){
  const pricing=packagePrice(item),entry={...item,price:pricing.price,quantity:0};packageEntries.push(entry);
  const card=el("article","vu-package-card"),top=el("div","vu-package-card-top"),image=el("img","vu-item-icon");
  image.alt="";image.loading="lazy";image.src="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(item.id.replace(/-/g,"_"))+".png";image.onerror=()=>{image.onerror=null;image.src="assets/vu-unicorn.svg"};
  const info=el("div","vu-package-info");info.append(el("strong",null,item.name),el("small","muted",validPrice(entry.price)?cash(entry.price)+(pricing.estimated?" · estimated":""):"Set price in Settings"));
  top.append(image,info);
  const priceRow=el("label","vu-package-price-row","Price per item ($)");
  const priceInput=el("input");priceInput.type="number";priceInput.min="0";priceInput.step="0.01";priceInput.placeholder="Enter price";priceInput.value=validPrice(entry.price)?String(entry.price):"";
  priceInput.setAttribute("aria-label",item.name+" price per item");
  priceInput.addEventListener("input",()=>{const n=Number(priceInput.value);entry.price=priceInput.value!==""&&Number.isFinite(n)&&n>=0?n:null;slider.disabled=!validPrice(entry.price);minus.disabled=plus.disabled=slider.disabled;if(!validPrice(entry.price)){entry.quantity=0;slider.value="0";count.textContent="0";}update();});
  priceRow.append(priceInput);
  const control=el("div","vu-package-control"),minus=el("button",null,"−"),plus=el("button",null,"+"),slider=el("input"),count=el("strong",null,"0");
  minus.type=plus.type="button";slider.type="range";slider.min="0";slider.max="30";slider.step="1";slider.value="0";slider.disabled=!validPrice(entry.price);minus.disabled=plus.disabled=slider.disabled;
  const setQuantity=n=>{entry.quantity=Math.max(0,Math.min(30,n));slider.value=String(entry.quantity);count.textContent=String(entry.quantity);update();};
  minus.onclick=()=>setQuantity(entry.quantity-1);plus.onclick=()=>setQuantity(entry.quantity+1);slider.oninput=()=>setQuantity(Number(slider.value));
  control.append(minus,slider,count,plus);card.append(top,priceRow,control);root.append(card);
 }
 $("package-price-note").textContent="Estimated drink prices use a 30% margin on listed store costs. Change any price directly here for this package quote. Final shared menu prices remain managed in Settings.";
 update();
}
document.addEventListener("vu:prices-updated",event=>{sharedSellingPrices=event.detail||{};if(data.drinks.length){renderPackageCreator();document.dispatchEvent(new Event("vu:tab-catalog-updated"));}});
function setupMonthCalendar(){
 const grid=$("vu-calendar-grid"),title=$("vu-calendar-title"),selected=$("vu-calendar-selected");
 if(!grid)return;
 let cursor=new Date(),chosen=null;cursor.setDate(1);
 const dayKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
 const paint=()=>{
  grid.replaceChildren();title.textContent=cursor.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  for(const name of ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"])grid.append(el("span","vu-calendar-weekday",name));
  const offset=(cursor.getDay()+6)%7,last=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate();
  for(let i=0;i<offset;i++)grid.append(el("span","vu-calendar-blank"));
  for(let d=1;d<=last;d++){
   const date=new Date(cursor.getFullYear(),cursor.getMonth(),d),key=dayKey(date);
   const bookings=data.bookings.filter(b=>String(b.start||"").slice(0,10)===key);
   const cell=el("button","vu-calendar-day",String(d));cell.type="button";
   if(bookings.length)cell.append(el("small",null,bookings.length+" booking"+(bookings.length===1?"":"s")));
   if(key===dayKey(new Date()))cell.classList.add("today");
   if(key===chosen)cell.classList.add("selected");
   cell.onclick=()=>{chosen=key;selected.textContent=bookings.length?key+": "+bookings.map(b=>b.title+" ("+b.start.slice(11,16)+")").join(" · "):key+": No published bookings.";paint();};
   grid.append(cell);
  }
 };
 $("vu-calendar-prev").onclick=()=>{cursor.setMonth(cursor.getMonth()-1);paint();};
 $("vu-calendar-next").onclick=()=>{cursor.setMonth(cursor.getMonth()+1);paint();};
 paint();
}
function render(){for(let x of data.drinks){line($("drink-list"),x.name,x.price,"d-"+x.id)}renderPackageCreator();if(!data.recipes.length)data.recipes=[{"name":"Whiskey Sour","ingredients":[{"name":"Lemon","quantity":1},{"name":"Whiskey","quantity":1},{"name":"Eggs","quantity":1},{"name":"Sugar","quantity":1}]},{"name":"Piña Colada","ingredients":[{"name":"Rum","quantity":1},{"name":"Pineapple","quantity":1},{"name":"Coconut","quantity":1}]},{"name":"Bloody Mary","ingredients":[{"name":"Lemon","quantity":1},{"name":"Chili Peppers","quantity":1},{"name":"Salt","quantity":1},{"name":"Vodka","quantity":1},{"name":"Tomato Juice","quantity":1}]},{"name":"Shirley Temple","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Cherry","quantity":1},{"name":"Grenadine","quantity":1}]},{"name":"Rainbow Rush","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Skittles","quantity":1},{"name":"Vodka","quantity":1}]},{"name":"Mojito","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Sugar","quantity":1},{"name":"Lime","quantity":1},{"name":"Rum","quantity":1},{"name":"Mint Leaves","quantity":1}]},{"name":"Old Fashioned","ingredients":[{"name":"Whiskey","quantity":1},{"name":"Orange","quantity":1},{"name":"Sugar","quantity":1},{"name":"Angostura Bitters","quantity":1}]},{"name":"Margarita","ingredients":[{"name":"Lime","quantity":1},{"name":"Tequila","quantity":1},{"name":"Orange","quantity":1},{"name":"Sugar","quantity":1}]},{"name":"Salty Pigeon","ingredients":[{"name":"Pigeon Milk","quantity":1},{"name":"Vodka","quantity":1},{"name":"Cocoa Powder","quantity":1},{"name":"Salt","quantity":1}]},{"name":"Virgin Mojito","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Sugar","quantity":1},{"name":"Lime","quantity":1},{"name":"Mint Leaves","quantity":1}]}];for(const r of data.recipes){
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
 }setupWasteCalculator(data.recipes);setupOrderCalculator(data);setupMonthCalendar();if(!data.bookings.length)$("booking-list").append(el("div","item","No bookings published yet."));for(let b of [...data.bookings].sort((a,b)=>a.start.localeCompare(b.start))){let box=el("div","item");box.append(el("div",null,b.title+" — "+b.start+" to "+b.end+" ("+(b.resources||[]).join(", ")+")"));$("booking-list").append(box)}for(let r of data.resources){let o=document.createElement("option");o.value=r.id;o.textContent=r.name;$("check-resource").append(o)}let sel=document.createElement("select");sel.id="limo-choice";sel.addEventListener("change",update);sel.append(new Option("Select a vehicle",""));for(let l of data.limousines){let o=new Option(l.name+(l.active?"":" (not active)"),l.id);o.disabled=!l.active||!validPrice(l.hourlyPrice);sel.append(o)}$("limo-list").append(sel);update()}function check(){let start=$("check-start").value,end=$("check-end").value,res=$("check-resource").value,out=$("availability-result");out.className="";if(!start||!end||start>=end){out.textContent="Select a valid start and end time.";out.className="warn";return}let conflicts=data.bookings.filter(b=>(b.resources||[]).includes(res)&&start<b.end&&end>b.start);out.textContent=conflicts.length?"Unavailable: "+conflicts.map(b=>b.title).join(", "):"No conflict found in published bookings. Confirm staff and resources with management.";out.className=conflicts.length?"warn":"ok"}document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(n=>n.classList.remove("active"));document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));b.classList.add("active");$(b.dataset.tab).classList.remove("hidden")}));$("copy-drinks").onclick=()=>copyQuote("VU DRINKS QUOTE",selections("d-",data.drinks));$("copy-package").onclick=()=>copyQuote("VU EVENT PACKAGE QUOTE",packageEntries.filter(e=>e.quantity>0&&validPrice(e.price)));$("check-availability").onclick=check;["tip-amount","tip-percent","limo-hours"].forEach(id=>$(id).addEventListener("input",update));fetch("data/public.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Data unavailable");return r.json()}).then(d=>{data=d;render()}).catch(()=>{$("drink-list").textContent="Could not load published prices. Refresh or contact VU management."});

// Main navigation and nested settings sections.
(function(){
 const primary=["overview","recipes","transactions","packages","customer-tabs","tips","calendar","settings"];
 const nested=["staff","costing","pricing","drinks","limo","events","incidents"];
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
  planResults.replaceChildren();
  if(count){
   planResults.append(el("h4",null,"For "+count+" planned cocktails"));
   const shortage=names.filter(n=>(needed[n]||0)>have(n));
   const left=names.filter(n=>have(n)>(needed[n]||0));
   const buyText=shortage.length?"Buy: "+shortage.map(n=>n+" ×"+(needed[n]-have(n))).join(", "):"You have everything needed.";
   planResults.append(el("p",null,buyText));
   if(left.length){
    const leftText="Left over: "+left.map(n=>n+" ×"+(have(n)-(needed[n]||0))).join(", ");
    planResults.append(el("p","muted",leftText));
   }
  }
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
 const root=document.getElementById("order-categories"),tabs=document.getElementById("order-tabs"),pricing=document.getElementById("pricing-categories"),priceTabs=document.getElementById("pricing-tabs");
 if(!root||!tabs||!pricing||!priceTabs)return;
 const $id=id=>document.getElementById(id);
 const money=n=>"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 const iconId=item=>String(item.id||item.name).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"").replace("pi_a_colada","pina_colada");
 const picture=item=>{const img=el("img","vu-item-icon");img.alt=item.name;img.loading="lazy";img.src="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(iconId(item))+".png";img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";};return img;};
 const recipes=(data.recipes||[]).map(r=>({id:r.id||iconId(r),name:r.name}));
 const drinks=(data.drinks||[]).map(d=>({id:d.id,name:d.name,price:d.price}));
 const groups=[
  ["Cocktails",recipes],
  ["Soft Drinks",drinks.filter(x=>/koka|frezzi|sprunk|tanga|green.cow|water/i.test(x.id))],
  ["Beer & Cider",drinks.filter(x=>/beer|cider/i.test(x.id))],
  ["Spirits & Alcohol",drinks.filter(x=>/whiskey|rum|vodka|tequila|absinthe/i.test(x.id))],
  ["Other Drinks",drinks.filter(x=>/tea|juice|milk/i.test(x.id))],
  ["Food & Snacks",[{id:"nachos",name:"Nachos"},{id:"hotdog",name:"Hotdog"},{id:"ham_sandwich",name:"Ham Sandwich"},{id:"salted_peanuts",name:"Salted Peanuts"},{id:"smores",name:"S'mores"}]]
 ];
 const extra=drinks.filter(x=>!groups.some(g=>g[1].some(y=>y.id===x.id)));if(extra.length)groups.push(["More Drinks",extra]);
 let saved={};
 const fallbackPrices={Whiskey:65,Rum:78,Vodka:50,Tequila:25,Absinthe:52,Beer:12,Cider:18,Koka:10,Frezzi:10,Sprunk:10,Tanga:10,"Sweet Tea":12,"Green Cow":20,"Tomato Juice":15,"Pigeon Milk":32,"Almond Milk":28,Water:4,"Angostura Bitters":32,Grenadine:26,Sugar:6,Salt:8,"Cocoa Powder":10,Lemon:6,Lime:6,Orange:8,Cherry:4,Pineapple:14,Coconut:10,"Mint Leaves":6,Olives:14,"Chili Peppers":6,Eggs:8,"Hot Dog":10,"Ham Sandwich":16,Nachos:10,"Salted Peanuts":12,"S'mores":20,Skittles:10};
 const fallbackRecipes=[
 ["Whiskey Sour",1,["Lemon","Whiskey","Eggs","Sugar"]],
 ["Pina Colada",2,["Rum","Pineapple","Coconut"]],
 ["Bloody Mary",1,["Lemon","Chili Peppers","Salt","Vodka","Tomato Juice"]],
 ["Shirley Temple",2,["Sprunk","Cherry","Grenadine"]],
 ["Rainbow Rush",2,["Sprunk","Skittles","Vodka"]],
 ["Mojito",1,["Sprunk","Sugar","Lime","Rum","Mint Leaves"]],
 ["Old Fashioned",1,["Whiskey","Orange","Sugar","Angostura Bitters"]],
 ["Margarita",1,["Lime","Tequila","Orange","Sugar"]],
 ["Salty Pigeon",1,["Pigeon Milk","Vodka","Cocoa Powder","Salt"]],
 ["Virgin Mojito",1,["Sprunk","Sugar","Lime","Mint Leaves"]]
 ].map(([name,yieldCount,ingredients])=>({name,yieldCount,ingredients:ingredients.map(name=>({name,qty:1}))}));
 let costing={prices:fallbackPrices,recipes:fallbackRecipes};
 const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
 const getRecipe=item=>costing?.recipes?.find(r=>norm(r.name)===norm(item.name)||norm(r.name).startsWith(norm(item.name)));
 const unitCost=item=>{
  const recipe=getRecipe(item);if(!recipe||!costing?.prices)return null;
  const yieldCount=Number(recipe.yieldCount);if(!Number.isFinite(yieldCount)||yieldCount<=0)return null;
  let sum=0;
  for(const ingredient of recipe.ingredients||[]){
   const n=Number(costing.prices[ingredient.name]),q=Number(ingredient.qty);
   if(costing.prices[ingredient.name]===undefined||!Number.isFinite(n)||!Number.isFinite(q)||q<=0)return null;
   sum+=n*q;
  }
  return sum/yieldCount;
 };
 const marginFor=e=>Number(saved["__margin::"+e.key]??saved["__defaultMargin"]??30);
 const suggestedFor=e=>{const cost=unitCost(e.item),m=marginFor(e);return cost===null||m<10||m>90?null:Math.ceil((cost/(1-m/100))/5)*5;};
 let pricesLoaded=false,costsLoaded=true,seeded=new Set();
 const seedSuggested=()=>{
  if(!pricesLoaded||!costsLoaded||!costing?.recipes?.length)return;
  const updates={};
  for(const e of entries){
   if(e.group!=="Cocktails"||(Object.hasOwn(saved,e.key)&&saved[e.key]!==null)||seeded.has(e.key))continue;
   const amount=suggestedFor(e);
   if(amount===null)continue;
   updates[e.key]=amount;seeded.add(e.key);
   e.price.value=String(amount);saved[e.key]=amount;
  }
  if(Object.keys(updates).length)document.dispatchEvent(new CustomEvent("vu:seed-prices",{detail:updates}));
  calculate();
 };
 const entries=[];let active=groups[0][0],pricingActive=groups[0][0];
 const setActive=(group,isPricing)=>{
  if(isPricing)pricingActive=group;else active=group;
  const holder=isPricing?pricing:root,bar=isPricing?priceTabs:tabs;
  [...holder.children].forEach(p=>p.hidden=p.dataset.group!==group);
  [...bar.children].forEach(b=>{const on=b.dataset.group===group;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});
 };
 for(const [group,items] of groups){
  const tab=el("button","vu-order-tab",group);tab.type="button";tab.dataset.group=group;tab.setAttribute("role","tab");tab.onclick=()=>setActive(group,false);tabs.append(tab);
  const pt=el("button","vu-order-tab",group);pt.type="button";pt.dataset.group=group;pt.setAttribute("role","tab");pt.onclick=()=>setActive(group,true);priceTabs.append(pt);
  const panel=el("div","vu-order-items");panel.dataset.group=group;root.append(panel);
  const ppanel=el("div","vu-order-items");ppanel.dataset.group=group;pricing.append(ppanel);
  for(const item of items){
   const key=group+"::"+item.id;
   const row=el("div","vu-order-item");row.dataset.search=(item.name+" "+group).toLowerCase();
   const identity=el("div","vu-order-identity");identity.append(picture(item),el("strong",null,item.name));
   const priceDisplay=el("span","vu-order-price");
   const minus=el("button","vu-qty-btn","−"),plus=el("button","vu-qty-btn","+");minus.type=plus.type="button";minus.setAttribute("aria-label","Remove one "+item.name);plus.setAttribute("aria-label","Add one "+item.name);
   const qty=el("span","vu-qty-value","0");const controls=el("div","vu-qty-controls");controls.append(minus,qty,plus);
   row.append(identity,priceDisplay,controls);panel.append(row);
   const priceRow=el("div","vu-order-item vu-pricing-item");const priceIdentity=el("div","vu-order-identity");priceIdentity.append(picture(item),el("strong",null,item.name));
   const label=el("label",null,"Selling price ($)");const price=el("input");price.type="number";price.min="0";price.step="0.01";price.placeholder="Not set";price.setAttribute("aria-label",item.name+" selling price");
   if(typeof item.price==="number"&&Number.isFinite(item.price))price.value=item.price;
   label.append(price);
   const priceHeader=el("div","vu-price-card-header");
   const cardMain=el("div","vu-price-card-main");
   const cardPrice=el("strong","vu-price-card-amount","Calculating…");
   const editButton=el("button","vu-price-edit","Edit pricing");
   editButton.type="button";editButton.setAttribute("aria-expanded","false");
   cardMain.append(priceIdentity,cardPrice,editButton);priceHeader.append(cardMain);
   const editor=el("div","vu-price-editor");editor.hidden=true;editor.append(label);
   editButton.onclick=()=>{editor.hidden=!editor.hidden;editButton.setAttribute("aria-expanded",String(!editor.hidden));editButton.textContent=editor.hidden?"Edit pricing":"Close editor";};
   priceRow.append(priceHeader,editor);
   let pricingControls=null;
   if(group==="Cocktails"){
    pricingControls=el("div","vu-profit-controls");
    const costText=el("small","muted","Loading ingredient costs…");
    const sliderLabel=el("label",null,"Target profit margin");
    const slider=el("input");slider.type="range";slider.min="10";slider.max="90";slider.step="5";
    const sliderText=el("strong",null,"30%");
    const stepDown=el("button","vu-qty-btn","−5%"),stepUp=el("button","vu-qty-btn","+5%");
    stepDown.type=stepUp.type="button";
    const suggested=el("div","vu-profit-result");
    const apply=el("button",null,"Use suggested price");apply.type="button";
    const specialLabel=el("label","vu-special-toggle","Use special price");
    const specialOn=el("input");specialOn.type="checkbox";specialLabel.prepend(specialOn);
    const specialPrice=el("input");specialPrice.type="number";specialPrice.min="0";specialPrice.step="0.01";specialPrice.placeholder="Special price";specialPrice.setAttribute("aria-label",item.name+" special selling price");
    const specialRow=el("div","vu-special-row");specialRow.append(specialLabel,specialPrice);
    const steps=el("div","vu-margin-steps");steps.append(stepDown,sliderText,stepUp);
    sliderLabel.append(slider);pricingControls.append(costText,sliderLabel,steps,suggested,apply,specialRow);editor.append(pricingControls);
    const persist=(k,value)=>document.dispatchEvent(new CustomEvent("vu:save-price",{detail:{key:k,value}}));
    const updateMargin=val=>{const m=Math.min(90,Math.max(10,Number(val)));slider.value=String(m);saved["__margin::"+key]=m;persist("__margin::"+key,m);calculate();};
    slider.addEventListener("change",()=>updateMargin(slider.value));
    slider.addEventListener("input",()=>{sliderText.textContent=slider.value+"%";});
    stepDown.onclick=()=>updateMargin(Number(slider.value)-5);
    stepUp.onclick=()=>updateMargin(Number(slider.value)+5);
    apply.onclick=()=>{const amount=suggestedFor(entry);if(amount===null)return;price.value=String(amount);saved[key]=amount;persist(key,amount);calculate();};
    specialOn.addEventListener("change",()=>{saved["__specialActive::"+key]=specialOn.checked?1:0;persist("__specialActive::"+key,specialOn.checked?1:0);calculate();});
    specialPrice.addEventListener("change",()=>{const n=Number(specialPrice.value);const v=specialPrice.value!==""&&Number.isFinite(n)&&n>=0?n:null;saved["__special::"+key]=v;persist("__special::"+key,v);calculate();});
    pricingControls._ui={costText,slider,sliderText,suggested,apply,specialOn,specialPrice};
   }
   ppanel.append(priceRow);
   const entry={item,group,key,row,price,priceDisplay,qty:0,pricingControls,cardPrice};entries.push(entry);
   const change=delta=>{entry.qty=Math.max(0,entry.qty+delta);qty.textContent=String(entry.qty);calculate();};
   minus.onclick=()=>change(-1);plus.onclick=()=>change(1);
   price.addEventListener("input",()=>{const p=Number(price.value);if(price.value!==""&&Number.isFinite(p)&&p>=0)saved[key]=p;else delete saved[key];const status=$id("pricing-status");if(status)status.textContent="Saving…";document.dispatchEvent(new CustomEvent("vu:save-price",{detail:{key,value:price.value===""?null:p}}));calculate();});
  }
 }
 const globalMargin=$id("pricing-default-margin"),globalValue=$id("pricing-default-value");
 const updateDefault=()=>{const m=Number(globalMargin.value);globalValue.textContent=m+"%";};
 globalMargin.addEventListener("input",updateDefault);
 globalMargin.addEventListener("change",()=>{const m=Number(globalMargin.value);saved.__defaultMargin=m;document.dispatchEvent(new CustomEvent("vu:save-price",{detail:{key:"__defaultMargin",value:m}}));calculate();});
 $id("pricing-default-down").onclick=()=>{globalMargin.value=String(Math.max(10,Number(globalMargin.value)-5));globalMargin.dispatchEvent(new Event("change"));};
 $id("pricing-default-up").onclick=()=>{globalMargin.value=String(Math.min(90,Number(globalMargin.value)+5));globalMargin.dispatchEvent(new Event("change"));};
 function activePrice(e){
  const special=saved["__specialActive::"+e.key]===1||saved["__specialActive::"+e.key]===true;
  const sp=saved["__special::"+e.key];
  if(special&&sp!==null&&sp!==undefined&&Number.isFinite(Number(sp))&&Number(sp)>=0)return Number(sp);
  return e.price.value===""?(suggestedFor(e)??NaN):Number(e.price.value);
 }
 function lines(){return entries.filter(e=>e.qty>0);}
 function calculate(){
  let sum=0,count=0,missing=false;const summary=$id("order-summary");summary.replaceChildren();
  for(const e of entries){
   const p=activePrice(e),special=saved["__specialActive::"+e.key];
   const suggestion=suggestedFor(e);
   e.cardPrice.textContent=Number.isFinite(p)?money(p):suggestion!==null?money(suggestion)+" suggested":"Price not set";
   e.priceDisplay.textContent=Number.isFinite(p)&&p>=0?money(p)+(special?" · Special":""):(suggestion!==null?money(suggestion)+" suggested":"Price not set");
   const ui=e.pricingControls?._ui;
   if(ui){
    const cost=unitCost(e.item),m=marginFor(e),suggested=suggestedFor(e);
    ui.costText.textContent=cost===null?"Set up ingredient costs in Recipe & Store Costs first":"Cost per serving: "+money(cost);
    ui.slider.value=String(m);ui.sliderText.textContent=m+"%";
    ui.suggested.textContent=suggested===null?"Suggested price unavailable":"Suggested: "+money(suggested)+" · expected profit "+money(suggested-cost);
    ui.apply.disabled=suggested===null;
    ui.specialOn.checked=Boolean(special);
    if(document.activeElement!==ui.specialPrice)ui.specialPrice.value=saved["__special::"+e.key]??"";
   }
  }
  for(const e of lines()){
   const p=activePrice(e);count+=e.qty;
   if(Number.isFinite(p)&&p>=0)sum+=p*e.qty;else missing=true;
   const line=el("div","vu-order-summary-line");line.append(picture(e.item),el("span",null,e.item.name+" × "+e.qty),el("strong",null,Number.isFinite(p)&&p>=0?money(p*e.qty):"Price missing"));summary.append(line);
  }
  $id("order-count").textContent=String(count);$id("order-total").textContent=missing?"Incomplete — set prices":money(sum);
  if(!count)summary.append(el("p","muted","No items selected yet."));
 }
 $id("order-search").addEventListener("input",()=>{
  const q=$id("order-search").value.trim().toLowerCase();
  for(const e of entries)e.row.hidden=!e.row.dataset.search.includes(q);
  if(q){const first=entries.find(e=>!e.row.hidden);if(first)setActive(first.group,false);}
 });
 $id("order-clear").addEventListener("click",()=>{entries.forEach(e=>e.qty=0);root.querySelectorAll(".vu-qty-value").forEach(e=>e.textContent="0");calculate();});
 $id("order-copy").addEventListener("click",()=>{
  const selected=lines();if(!selected.length){alert("Add items to the order first.");return;}
  if(selected.some(e=>!Number.isFinite(activePrice(e)))){alert("Set prices in Settings → Pricing Management first.");return;}
  const result="VANILLA UNICORN — ORDER QUOTE\n"+selected.map(e=>e.item.name+" × "+e.qty+" @ "+money(activePrice(e))+" = "+money(activePrice(e)*e.qty)).join("\n")+"\nTOTAL: "+money(selected.reduce((s,e)=>s+activePrice(e)*e.qty,0));
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(result).then(()=>alert("Order copied.")).catch(()=>prompt("Copy your order:",result));else prompt("Copy your order:",result);
 });
 document.addEventListener("vu:prices-updated",event=>{
  saved=event.detail||{};pricesLoaded=true;
  for(const e of entries){
   if(Object.hasOwn(saved,e.key)&&saved[e.key]!==null)e.price.value=String(saved[e.key]);
   else e.price.value="";
  }
  globalMargin.value=String(saved.__defaultMargin??30);updateDefault();
  seedSuggested();
 });
 document.addEventListener("vu:costing-updated",event=>{if(event.detail?.recipes?.length){costing=event.detail;costsLoaded=true;seedSuggested();}else calculate();});
 setActive(active,false);setActive(pricingActive,true);calculate();document.dispatchEvent(new Event("vu:pricing-ready"));
}

(function customerTabs(){
 const create=$("vu-tab-create"),list=$("vu-tab-list"),detail=$("vu-tab-detail"),status=$("vu-tab-status");
 if(!create)return;
 let tabs=[],selected=null,costing=null;
 const say=s=>status.textContent=s;
 const send=(action,payload)=>document.dispatchEvent(new CustomEvent("vu:tab-command",{detail:{action,...payload}}));
 const key=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
 const recipeCost=r=>{
  if(!costing?.prices)return null;
  let sum=0;
  for(const i of r.ingredients||[]){const n=costing.prices[i.name];if(n===undefined)return null;sum+=Number(n)*Number(i.qty??i.quantity??1);}
  return sum/Math.max(1,Number(r.yieldCount)||1);
 };
 const catalog=()=>{
  const drinks=data.drinks.map(d=>{const p=packagePrice(d);return {id:"drink:"+d.id,name:d.name,price:p.price};});
  const cocktails=(costing?.recipes?.length?costing.recipes:data.recipes).map(r=>{
   const matching=Object.entries(sharedSellingPrices).find(([k,v])=>k.startsWith("Cocktails::")&&k.toLowerCase().includes(key(r.name))&&v!==null);
   const cost=recipeCost(r),margin=Number(sharedSellingPrices.__defaultMargin??30);
   const price=matching?Number(matching[1]):cost===null?null:Math.ceil(cost/(1-margin/100)/5)*5;
   return {id:"cocktail:"+key(r.name),name:r.name,price};
  });
  const services=data.services.map(d=>({id:"service:"+d.id,name:d.name,price:packagePrice(d).price}));
  return [...cocktails,...drinks,...services];
 };
 const button=(text,handler)=>{const b=el("button",null,text);b.type="button";b.onclick=handler;return b;};
 function draw(){
  list.replaceChildren();
  const ordered=[...tabs].sort((x,y)=>(x.status==="paid")-(y.status==="paid")||String(y.updatedAt||"").localeCompare(String(x.updatedAt||"")));
  for(const t of ordered){
   const total=(t.items||[]).reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);
   const b=button(t.name+" · "+cash(total)+(t.status==="paid"?" · Paid":""),()=>{selected=t.id;draw();});
   if(t.id===selected)b.classList.add("active");
   list.append(b);
  }
  const tab=tabs.find(t=>t.id===selected);
  detail.replaceChildren();
  if(!tab){detail.append(el("p","muted","Select or create a customer tab."));return;}
  detail.append(el("h3",null,tab.name),el("p","muted",tab.status==="paid"?"Paid · read-only":"Open · running bill"));
  const lines=el("div","vu-tab-lines");
  for(const item of tab.items||[]){
   const row=el("div","vu-tab-line");
   row.append(el("span",null,item.name+" × "+item.quantity+" @ "+cash(item.price)),el("strong",null,cash(item.quantity*item.price)));
   if(tab.status!=="paid")row.append(button("Remove",()=>send("remove",{id:tab.id,lineId:item.lineId})));
   lines.append(row);
  }
  if(!tab.items?.length)lines.append(el("p","muted","No items on this tab yet."));
  detail.append(lines);
  const total=(tab.items||[]).reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);
  const summary=el("div","summary");summary.append(el("span",null,"Total due"),el("strong",null,cash(total)));detail.append(summary);
  if(tab.status==="paid")return;
  const form=el("form","vu-tab-add"),select=el("select"),count=el("input"),custom=el("input"),add=el("button",null,"Add to tab");
  count.type="number";count.min="1";count.step="1";count.value="1";count.setAttribute("aria-label","Quantity");
  custom.type="number";custom.min="0";custom.step="0.01";custom.placeholder="Price";custom.setAttribute("aria-label","Unit price");
  const options=catalog();
  for(const o of options){const option=new Option(o.name+(o.price===null?" · price needed":" · "+cash(o.price)),o.id);select.append(option);}
  const setPrice=()=>{const item=options.find(x=>x.id===select.value);custom.value=item&&validPrice(item.price)?String(item.price):"";};
  select.onchange=setPrice;setPrice();
  form.append(select,count,custom,add);
  form.onsubmit=e=>{e.preventDefault();const item=options.find(x=>x.id===select.value),n=Number(count.value),p=Number(custom.value);if(!item||!Number.isInteger(n)||n<1||custom.value===""||!Number.isFinite(p)||p<0){say("Choose an item, valid quantity and price.");return;}send("add",{id:tab.id,item:{name:item.name,quantity:n,price:p}});};
  detail.append(form,button("Mark paid & close tab",()=>{if(confirm("Mark "+tab.name+"'s bill as paid for "+cash(total)+"?"))send("settle",{id:tab.id});}));
 }
 create.onsubmit=e=>{e.preventDefault();const name=$("vu-tab-name").value.trim();if(!name)return;send("create",{name});$("vu-tab-name").value="";};
 document.addEventListener("vu:tabs-updated",e=>{tabs=Array.isArray(e.detail)?e.detail:[];if(!tabs.some(t=>t.id===selected))selected=tabs.find(t=>t.status!=="paid")?.id||tabs[0]?.id||null;draw();});
 document.addEventListener("vu:tab-error",e=>say(e.detail||"Unable to save tab."));
 document.addEventListener("vu:tab-success",e=>say(e.detail||"Saved."));
 document.addEventListener("vu:costing-updated",e=>{if(e.detail?.recipes)costing=e.detail;});
 document.addEventListener("vu:tab-catalog-updated",draw);
 document.dispatchEvent(new Event("vu:tab-ready"));
})();
