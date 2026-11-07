"use strict";const $=id=>document.getElementById(id),cash=n=>"$"+Number(n||0).toLocaleString("en-US",{maximumFractionDigits:2}),validPrice=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0;let data={drinks:[],recipes:[],services:[],limousines:[],bookings:[],resources:[]};let sharedSellingPrices={},packageEntries=[];const qty=(id)=>Math.max(0,Number($(id)?.value)||0);const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));function el(type,cls,text){let e=document.createElement(type);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}function line(parent,name,price,prefix){let row=el("div","item");let left=el("div");left.className="drink-line-details";const img=el("img","vu-item-icon");img.alt="";img.loading="lazy";img.src="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(String(prefix.startsWith("d-")||prefix.startsWith("p-")?prefix.slice(2):name).toLowerCase().replace(/-/g,"_"))+".png";img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";img.classList.add("icon-fallback")};left.append(img);const details=el("div");details.append(el("strong",null,name),el("div","muted",validPrice(price)?cash(price):"Price not set"));left.append(details);let input=el("input");input.type="number";input.min="0";input.step="1";input.value="0";input.id=prefix;input.disabled=!validPrice(price);input.addEventListener("input",update);row.append(left,input);parent.append(row)}function selections(prefix,items){return items.filter(x=>validPrice(x.price)&&qty(prefix+x.id)>0).map(x=>({...x,quantity:qty(prefix+x.id)}))}function update(){let drinks=selections("d-",data.drinks);$("drink-total").textContent=cash(drinks.reduce((s,x)=>s+x.quantity*x.price,0));updatePackageTotals();let limo=data.limousines.find(x=>x.id===$("limo-choice")?.value);$("limo-total").textContent=validPrice(limo?.hourlyPrice)?cash(limo.hourlyPrice*Math.max(1,qty("limo-hours"))):"Price not set";let t=Math.max(0,Number($("tip-amount").value)||0),p=Math.min(100,Math.max(0,Number($("tip-percent").value)||0));$("tip-owner").textContent=cash(t*p/100);$("tip-staff").textContent=cash(t*(1-p/100))}function copyQuote(title,lines){if(!lines.length){alert("Select priced items first.");return}const total=lines.reduce((s,x)=>s+x.quantity*x.price,0),txt=title+"\n"+lines.map(x=>x.name+" × "+x.quantity+" = "+cash(x.price*x.quantity)).join("\n")+"\nTOTAL: "+cash(total);navigator.clipboard.writeText(txt).then(()=>alert("Quote copied")).catch(()=>prompt("Copy this quote:",txt))}let liveCosting=null;
const costKey=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
function liveUnitCost(item){
 const source=liveCosting;if(!source?.prices)return null;
 const recipe=(source.recipes||[]).find(r=>costKey(r.name)===costKey(item.name));
 if(recipe){const yieldCount=Number(recipe.yieldCount);if(!Number.isFinite(yieldCount)||yieldCount<=0)return null;let total=0;
  for(const i of recipe.ingredients||[]){const raw=source.prices[i.name],n=Number(raw),q=Number(i.qty);if(raw===undefined||!Number.isFinite(n)||n<0||!Number.isFinite(q)||q<=0)return null;total+=n*q;}
  return total/yieldCount;
 }
 const match=Object.entries(source.prices).find(([name])=>costKey(name)===costKey(item.name));
 return match&&Number.isFinite(Number(match[1]))&&Number(match[1])>=0?Number(match[1]):null;
}
document.addEventListener("vu:costing-updated",e=>{liveCosting=e.detail||null;if(data.drinks.length)renderPackageCreator();});

function packagePrice(item){
 const id=String(item.id||"").toLowerCase(),name=String(item.name||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 const matches=Object.entries(sharedSellingPrices).filter(([key,value])=>value!==null&&Number.isFinite(Number(value))&&Number(value)>=0&&!key.startsWith("__")&&(key.toLowerCase().endsWith("::"+id)||key.toLowerCase().replace(/[^a-z0-9]/g,"").endsWith(name)));
 if(matches.length)return {price:Number(matches[0][1]),estimated:false};
 if(validPrice(item.price))return {price:item.price,estimated:false};
 const cost=liveUnitCost(item);if(cost!==null){const margin=Math.min(90,Math.max(0,Number(sharedSellingPrices.__defaultMargin??30)));return {price:Math.ceil(cost/(1-margin/100)/5)*5,estimated:true};}
 return {price:null,estimated:false};
}

let packageImages={};
function pkgImageKey(item){return item.kind+":"+item.id}
function pkgImageFor(item){return packageImages[pkgImageKey(item)]||""}
function pkgApplyImage(img,item){
 const custom=pkgImageFor(item),id=String(item.id||item.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 const existing="https://p17.admin.opfw.me/images/icons/items/"+encodeURIComponent(id)+".png";img.src=custom||existing;img.classList.remove("vu-pkg-photo-placeholder");
 img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";img.classList.add("vu-pkg-photo-placeholder")};
}
function setupPackageMedia(){
 const select=$("vu-media-item");if(!select)return;
 const items=[...data.recipes.map(x=>({...x,id:x.id||x.name,kind:"cocktail"})),...data.drinks.map(x=>({...x,kind:"drink"})),...data.services.map(x=>({...x,kind:"service"})),{id:"mobile-bar",name:"Mobile cocktail bar van",kind:"feature"},{id:"limo-hire",name:"Limousine hire",kind:"feature"}];
 select.replaceChildren(new Option("Choose an item",""));for(const x of items)select.append(new Option(x.name,pkgImageKey(x)));
 const preview=()=>{const url=$("vu-media-url").value.trim(),img=$("vu-media-preview");img.src=url||"assets/vu-unicorn.svg";$("vu-media-placeholder").hidden=!!url;img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";$("vu-media-placeholder").hidden=false}};
 select.onchange=()=>{$("vu-media-url").value=packageImages[select.value]||"";preview()};

 let pastedImage=null;
 const pasteZone=$("vu-media-paste-zone");
 pasteZone.onclick=()=>pasteZone.focus();
 pasteZone.addEventListener("paste",async e=>{
   const file=Array.from(e.clipboardData?.items||[]).find(i=>i.type.startsWith("image/"))?.getAsFile();
   if(!file)return;e.preventDefault();
   if(!select.value){$("vu-media-status").textContent="Choose a package item first.";return}
   try{
     const bitmap=await createImageBitmap(file),factor=Math.min(1,640/Math.max(bitmap.width,bitmap.height));
     const canvas=document.createElement("canvas");
     canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));
     canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
     pastedImage=canvas.toDataURL("image/jpeg",0.65);
     if(pastedImage.length>350000)throw Error("Image too large. Crop and try again.");
     $("vu-media-url").value=pastedImage;preview();
     $("vu-media-status").textContent="Screenshot ready. Click Save image.";
   }catch(error){$("vu-media-status").textContent=error.message}
 });
 $("vu-media-url").oninput=preview;
 $("vu-media-save").onclick=()=>{if(!select.value){$("vu-media-status").textContent="Choose an item first.";return}const url=$("vu-media-url").value.trim();if(url&&!/^https:\/\//i.test(url)&&!/^data:image\/jpeg;base64,/i.test(url)){$("vu-media-status").textContent="Paste a valid HTTPS image URL.";return}document.dispatchEvent(new CustomEvent("vu:package-image-save",{detail:{key:select.value,url}}));$("vu-media-status").textContent="Saving…"};
 $("vu-media-clear").onclick=()=>{$("vu-media-url").value="";preview();$("vu-media-save").click()};
 document.addEventListener("vu:package-images-updated",e=>{packageImages=e.detail||{};if(select.value){$("vu-media-url").value=packageImages[select.value]||"";preview()}renderPackageCreator();});
 document.addEventListener("vu:package-image-saved",()=>{$("vu-media-status").textContent="Image saved for all devices."});
 document.addEventListener("vu:package-image-error",e=>{$("vu-media-status").textContent="Could not save: "+e.detail});
 document.dispatchEvent(new Event("vu:package-media-ready"));
}
let pkgCategory="Cocktails",pkgCustom=[],pkgDraftId=null,pkgDrafts=[],pkgStep="plan";
const pkgFields=["vu-plan-name","vu-plan-customer","vu-pkg-occasion","vu-plan-guests","vu-pkg-start","vu-pkg-end","vu-pkg-location","vu-plan-budget","vu-pkg-requests","vu-plan-discount","vu-pkg-room-fee","vu-pkg-room-expenses","vu-pkg-van-colour","vu-pkg-van-location","vu-pkg-limo-colour","vu-pkg-limo-route","vu-pkg-limo-requests","vu-pkg-event-theme","vu-pkg-event-style","vu-pkg-van-enabled","vu-pkg-van-fee","vu-pkg-van-hours","vu-pkg-van-cost","vu-pkg-van-expenses","vu-pkg-limo-enabled","vu-pkg-limo-fee","vu-pkg-limo-hours","vu-pkg-limo-expenses","vu-pkg-extra-cost","vu-pkg-adjustment","vu-pkg-bartenders","vu-pkg-dancers","vu-pkg-djs","vu-pkg-security","vu-pkg-drivers","vu-pkg-status","vu-pkg-itinerary","vu-pkg-checklist"];
const pkgNum=id=>Number($(id)?.value||0)||0;
function pkgTotals(){
 const lines=packageEntries.filter(x=>x.quantity>0&&validPrice(x.price));
 const customs=pkgCustom.filter(x=>x.quantity>0);
 const van=$("vu-pkg-van-enabled")?.checked,limo=$("vu-pkg-limo-enabled")?.checked;
 const room=packageEntries.find(x=>x.id==="vu-room-hire"&&x.quantity>0);
 const extras=[...(van?[{name:"Mobile cocktail bar hire",quantity:1,price:pkgNum("vu-pkg-van-fee")}]:[]),...(limo?[{name:"Limousine hire",quantity:1,price:pkgNum("vu-pkg-limo-fee")}]:[]),...(room?[{name:"Room / venue hire",quantity:room.quantity,price:pkgNum("vu-pkg-room-fee")}]:[])];
 const catering=pkgCatering.filter(x=>x.quantity>0);
 const all=[...lines.filter(x=>x.kind!=="special"),...customs,...catering,...extras];
 const subtotal=all.reduce((s,x)=>s+x.price*x.quantity,0),discount=pkgNum("vu-plan-discount"),adjustment=pkgNum("vu-pkg-adjustment"),total=Math.max(0,subtotal*(1-discount/100)+adjustment);
 const known=lines.filter(x=>x.kind!=="special").reduce((s,x)=>s+((liveUnitCost(x)??0)*x.quantity),0)+customs.reduce((s,x)=>s+x.cost*x.quantity,0)+catering.reduce((s,x)=>s+x.cost*x.quantity,0)+(van?pkgNum("vu-pkg-van-expenses"):0)+(limo?pkgNum("vu-pkg-limo-expenses"):0)+(room?pkgNum("vu-pkg-room-expenses"):0)+pkgNum("vu-pkg-extra-cost");
 const missing=lines.filter(x=>x.kind!=="special"&&liveUnitCost(x)===null).length;
 return {all,subtotal,discount,total,known,missing,profit:missing?null:total-known,van,limo};
}
function updatePackageTotals(){
 if(!$("package-total"))return;
 pkgShowStaffSuggestion();const t=pkgTotals(),guests=Math.max(1,pkgNum("vu-plan-guests")),budget=pkgNum("vu-plan-budget");
 const set=(id,v)=>{if($(id))$(id).textContent=v};
 set("package-total",cash(t.total));set("vu-plan-subtotal",cash(t.subtotal));set("vu-plan-savings","−"+cash(t.subtotal*t.discount/100));set("vu-plan-per-guest",cash(t.total/guests));set("vu-plan-discount-label",t.discount+"%");
 set("vu-pkg-known-costs",cash(t.known));set("vu-pkg-profit",t.missing?"Unknown — "+t.missing+" item cost(s) missing":cash(t.profit));set("vu-pkg-margin",t.missing?"Unknown":t.total?(100*t.profit/t.total).toFixed(1)+"%":"—");
 set("vu-pkg-summary-name",$("vu-plan-name")?.value||"New package");set("vu-pkg-item-count",String(t.all.reduce((s,x)=>s+x.quantity,0)));set("vu-pkg-summary-subtotal",cash(t.subtotal));set("vu-pkg-summary-discount","−"+cash(t.subtotal*t.discount/100));
 const budgetText=budget?(t.total<=budget?"Within budget · "+cash(budget-t.total)+" remaining":"Over budget by "+cash(t.total-budget)):"Set a budget to compare your quote.";
 set("vu-plan-feedback",budgetText);set("vu-pkg-budget-note",budgetText);
 set("package-price-note","Profit is an estimate using known item costs only. "+(t.missing?t.missing+" selected item type(s) have unknown costs. ":"")+"Van and limo purchase prices are not charged to customers and are excluded from event costs.");
 const summary=$("vu-pkg-summary-items");if(summary){summary.replaceChildren();for(const x of t.all)summary.append(el("p",null,x.quantity+" × "+x.name+" · "+cash(x.price*x.quantity)));if(!t.all.length)summary.append(el("p","muted","No items selected yet."));}
 const vanCost=pkgNum("vu-pkg-van-cost"),vanNet=pkgNum("vu-pkg-van-fee")-pkgNum("vu-pkg-van-expenses"),limoNet=pkgNum("vu-pkg-limo-fee")-pkgNum("vu-pkg-limo-expenses");
 set("vu-pkg-limo-break-even",t.limo?"Limo purchase: $69,000 · "+(limoNet>0?"About "+Math.ceil(69000/limoNet)+" hires to recover purchase price at this net hire contribution (excluding other costs).":"Enter a hire fee above running costs to estimate purchase payback."):"Limo purchase budget: $69,000. Select hire to calculate.");
 const review=$("vu-pkg-review");if(review){review.replaceChildren();for(const x of t.all)review.append(el("p",null,x.name+" × "+x.quantity+" = "+cash(x.price*x.quantity)));review.append(el("strong",null,"Customer quote: "+cash(t.total)));review.append(el("p","muted","Occasion: "+($("vu-pkg-occasion")?.value||"")+" · Guests: "+guests+" · Status: "+($("vu-pkg-status")?.value||"Draft")));}
}
let pkgRecipeUnitCost=null;
function pkgCocktailPrice(item){
 const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
 const match=Object.entries(sharedSellingPrices).find(([key,v])=>key.startsWith("Cocktails::")&&v!==null&&Number.isFinite(Number(v))&&norm(key.split("::").slice(1).join("::"))===norm(item.name));
 if(match)return {price:Number(match[1]),estimated:false};
 const cost=liveUnitCost(item),margin=Number(sharedSellingPrices.__defaultMargin??30);
 return {price:cost===null||!Number.isFinite(cost)?null:Math.ceil(cost/(1-Math.min(90,Math.max(0,margin))/100)/5)*5,estimated:true};
}
function renderPackageCreator(){
 const root=$("package-options");if(!root)return;
 const old=new Map(packageEntries.map(x=>[x.kind+":"+x.id,x]));root.replaceChildren();packageEntries=[];
 const items=[...data.recipes.map(x=>({...x,id:x.id||x.name,kind:"cocktail"})),...data.drinks.map(x=>({...x,kind:"drink"})),...data.services.map(x=>({...x,kind:"service"}))];
 const categories=["Cocktails","Alcohol","Soft Drinks","Food & Snacks","Event services"];const tabs=$("vu-pkg-category-tabs");tabs.replaceChildren();
 const search=$("vu-pkg-search"),selectedOnly=$("vu-pkg-selected-only");if(search&&!search.dataset.wired){search.dataset.wired="1";search.addEventListener("input",()=>renderPackageCreator())}if(selectedOnly&&!selectedOnly.dataset.wired){selectedOnly.dataset.wired="1";selectedOnly.addEventListener("change",()=>renderPackageCreator())}
 for(const cat of categories){const b=el("button",cat===pkgCategory?"active":"",cat);b.type="button";b.onclick=()=>{pkgCategory=cat;renderPackageCreator()};tabs.append(b);}
 if(!items.some(x=>/venue|room/i.test(x.name)))items.push({id:"vu-room-hire",name:"Room / venue hire",kind:"special"});
 for(const snack of [{id:"vu-hotdog",name:"Hot dog",category:"Food & Snacks"},{id:"vu-chips",name:"Chips / fries",category:"Food & Snacks"},{id:"vu-snack-platter",name:"Snack platter",category:"Food & Snacks"}])if(!items.some(x=>x.name.toLowerCase()===snack.name.toLowerCase()))items.push({...snack,kind:"food",price:null});
 for(const item of items){
  const pricing=item.kind==="cocktail"?pkgCocktailPrice(item):item.kind==="special"?{price:0}:packagePrice(item),prev=old.get(item.kind+":"+item.id),entry={...item,price:prev?.manualPrice?prev.price:pricing.price,manualPrice:prev?.manualPrice||false,quantity:prev?.quantity||0};if(item.kind==="special"){entry.price=pkgNum("vu-pkg-room-fee");}packageEntries.push(entry);
  const category=item.kind==="cocktail"?"Cocktails":(item.kind==="service"||item.kind==="special")?"Event services":(/food|snack|chips|burger|pizza|sandwich|salad|meal|fries|hotdog|chocolate|candy|donut|cake/i.test(item.category||"")?"Food & Snacks":/whiskey|whisky|vodka|rum|tequila|gin|beer|cider|wine|absinthe|bourbon|brandy|champagne|liquor|spirits/i.test(item.name+" "+(item.category||""))?"Alcohol":"Soft Drinks");
  if(category!==pkgCategory)continue;
  if(search?.value.trim()&&!item.name.toLowerCase().includes(search.value.trim().toLowerCase()))continue;

  if(item.kind==="service"||item.kind==="special"){
   const card=el("article","vu-package-card vu-service-choice"),head=el("div","vu-package-card-top"),img=el("img","vu-item-icon");img.alt="";pkgApplyImage(img,item);
   const label=el("strong",null,item.name),toggle=el("button","vu-service-toggle",entry.quantity>0?"✓ Added":"＋ Add service");toggle.type="button";toggle.setAttribute("aria-pressed",String(entry.quantity>0));
   toggle.onclick=()=>{entry.quantity=entry.quantity?0:1;toggle.textContent=entry.quantity?"✓ Added":"＋ Add service";toggle.setAttribute("aria-pressed",String(entry.quantity>0));card.classList.toggle("vu-pkg-picked",!!entry.quantity);pkgUpdateServiceDetails();updatePackageTotals();};
   head.append(img,label);card.append(head,toggle);card.classList.toggle("vu-pkg-picked",!!entry.quantity);root.append(card);continue;
  }
  const card=el("article","vu-package-card"),top=el("div","vu-package-card-top"),image=el("img","vu-item-icon");image.alt=item.name;image.loading="lazy";pkgApplyImage(image,item);
  const info=el("div","vu-package-info");info.append(el("strong",null,item.name));top.append(image,info);
  const priceRow=el("label","vu-package-price-row",item.kind==="special"?"Hire charge ($)":"Quote price ($)"),priceInput=el("input");priceInput.type="number";priceInput.min="0";priceInput.step="0.01";priceInput.value=validPrice(entry.price)?String(entry.price):"";priceInput.setAttribute("aria-label",item.name+" price");
  const control=el("div","vu-package-control"),minus=el("button",null,"−"),plus=el("button",null,"+"),slider=el("input"),count=el("strong",null,String(entry.quantity));
  minus.type=plus.type="button";slider.type="range";slider.min="0";slider.max="100";slider.step="1";slider.value=String(entry.quantity);
  const sync=()=>{card.classList.toggle("vu-pkg-picked",entry.quantity>0);slider.disabled=!validPrice(entry.price);minus.disabled=plus.disabled=slider.disabled;slider.value=String(entry.quantity);count.textContent=String(entry.quantity);updatePackageTotals();};
  priceInput.oninput=()=>{entry.manualPrice=true;entry.price=priceInput.value===""?null:Number(priceInput.value);if(item.kind==="special"){const field=item.id==="vu-mobile-bar"?"vu-pkg-van-fee":item.id==="vu-limousine"?"vu-pkg-limo-fee":"vu-pkg-room-fee";$(field).value=priceInput.value;}if(!validPrice(entry.price))entry.quantity=0;sync();};
  const set=n=>{entry.quantity=Math.max(0,Math.min(item.kind==="special"?1:100,n));if(item.kind==="special"){const id=item.id==="vu-mobile-bar"?"vu-pkg-van-enabled":item.id==="vu-limousine"?"vu-pkg-limo-enabled":null;if(id)$(id).checked=entry.quantity>0;}sync();pkgUpdateServiceDetails()};minus.onclick=()=>set(entry.quantity-1);plus.onclick=()=>set(entry.quantity+1);slider.oninput=()=>set(Number(slider.value));
  priceRow.append(priceInput);control.append(minus,slider,count,plus);card.append(top,priceRow,control);root.append(card);sync();
 }
 updatePackageTotals();pkgUpdateServiceDetails();
}
function pkgUpdateServiceDetails(){
 const root=$("vu-pkg-service-fields"),wrap=$("vu-pkg-service-detail");if(!root||!wrap)return;
 const selected=packageEntries.filter(x=>(x.kind==="service"||x.kind==="special")&&x.quantity>0);wrap.hidden=!selected.length;
 const panels=["vu-pkg-room-details"];for(const id of panels){const panel=$(id);if(panel){panel.hidden=true;$("vu-pkg-service-parking")?.append(panel);}}root.replaceChildren();for(const item of selected){
  const row=el("div","vu-pkg-service-row");row.append(el("strong",null,item.name+" · Booking details"));
  const priceLabel=el("label",null,"Customer booking charge ($)"),price=el("input");price.type="number";price.min="0";price.step="0.01";price.placeholder="Set booking charge";price.value=validPrice(item.price)?item.price:"";price.oninput=()=>{item.price=price.value===""?null:Number(price.value);if(item.kind==="special")$("vu-pkg-room-fee").value=price.value;updatePackageTotals()};priceLabel.append(price);row.append(priceLabel);
  const opts=el("div","vu-pkg-service-options");const presets=item.id==="vu-room-hire"||/venue|room/i.test(item.name)?["Main venue","Private room","VIP area","Entire venue"]: /dancer/i.test(item.name)?["Standard performance","VIP performance","Private booking","Themed request"]: /dj/i.test(item.name)?["Club set","Private event","Requested genre","Custom playlist"]:item.id==="vu-mobile-bar"?["Van only","VU then off-site","Off-site event"]:item.id==="vu-limousine"?["One-way transfer","Return journey","Hourly hire"]:["Standard","Custom requirements"];
  const choice=el("select"),keyChoice="choice:"+item.id;for(const opt of ["Choose option",...presets])choice.append(new Option(opt,opt==="Choose option"?"":opt));choice.value=pkgServiceNotes[keyChoice]||"";choice.onchange=()=>pkgServiceNotes[keyChoice]=choice.value;opts.append(choice);row.append(opts);
  const label=el("label",null,"Timing, requests or requirements"),input=el("textarea");input.rows=2;input.placeholder="Optional details";
  if(item.kind==="special"){const panel=$("vu-pkg-room-details");if(panel){panel.hidden=false;row.append(panel);}}const key="vu-pkg-service-note-"+String(item.id).replace(/[^a-z0-9]/gi,"-");input.value=pkgServiceNotes[key]||"";input.oninput=()=>{pkgServiceNotes[key]=input.value};label.append(input);row.append(label);root.append(row);
 }
}
let pkgServiceNotes={},pkgCatering=[];
function pkgStaffSuggestion(){
 const services=packageEntries.filter(x=>(x.kind==="service"||x.kind==="special")&&x.quantity>0);
 const has=s=>services.reduce((n,x)=>n+(x.name.toLowerCase().includes(s)?x.quantity:0),0);
 const van=$("vu-pkg-van-enabled")?.checked,limo=$("vu-pkg-limo-enabled")?.checked;
 return { "vu-pkg-bartenders":van?1:0,"vu-pkg-dancers":has("dancer"),"vu-pkg-djs":has("dj"),"vu-pkg-security":has("venue")?1:0,"vu-pkg-drivers":limo?1:0 };
}
function pkgShowStaffSuggestion(){
 const elmt=$("vu-pkg-staff-suggestion");if(!elmt)return;
 const s=pkgStaffSuggestion();elmt.textContent="Suggested: "+Object.entries(s).map(([id,n])=>id.replace("vu-pkg-","")+": "+n).join(" · ")+". Adjust for your event.";
}
function pkgSnapshot(){return {pricingSnapshot:true,quotedTotal:pkgTotals().total,fields:Object.fromEntries(pkgFields.map(id=>[id,$(id)?.type==="checkbox"?$(id).checked:$(id)?.value])),items:packageEntries.filter(x=>x.quantity>0).map(x=>({id:x.id,kind:x.kind,quantity:x.quantity,price:x.price,manualPrice:x.manualPrice===true})),custom:pkgCustom,catering:pkgCatering,serviceNotes:pkgServiceNotes,updatedAt:new Date().toISOString()};}
function pkgLoad(d){
 const fields=d.fields||{};for(const id of pkgFields){const input=$(id);if(!input)continue;if(input.type==="checkbox")input.checked=Boolean(fields[id]);else if(fields[id]!=null)input.value=fields[id];}
 pkgCustom=Array.isArray(d.custom)?d.custom:[];pkgCatering=Array.isArray(d.catering)?d.catering:[];pkgRenderCatering();pkgServiceNotes=d.serviceNotes||{};const map=new Map((d.items||[]).map(x=>[x.kind+":"+x.id,x]));for(const x of packageEntries){const saved=map.get(x.kind+":"+x.id);x.quantity=saved?.quantity||0;if(saved){x.price=saved.price;x.manualPrice=true;}}
 renderPackageCreator();pkgRenderCustom();$("vu-pkg-van-details").hidden=!$("vu-pkg-van-enabled").checked;$("vu-pkg-limo-details").hidden=!$("vu-pkg-limo-enabled").checked;if($("vu-pkg-van-toggle"))$("vu-pkg-van-toggle").checked=$("vu-pkg-van-enabled").checked;if($("vu-pkg-limo-toggle"))$("vu-pkg-limo-toggle").checked=$("vu-pkg-limo-enabled").checked;updatePackageTotals();
}
function pkgRenderCatering(){
 const root=$("vu-pkg-catering-list");if(!root)return;root.replaceChildren();
 pkgCatering.forEach((x,i)=>{const row=el("div","vu-pkg-custom-row");row.append(el("span",null,x.quantity+" × "+x.name+" · "+cash(x.price*x.quantity)+" (supplier cost "+cash(x.cost*x.quantity)+")"));const b=el("button",null,"Remove");b.type="button";b.onclick=()=>{pkgCatering.splice(i,1);pkgRenderCatering();updatePackageTotals()};row.append(b);root.append(row)});
}
function pkgRenderCustom(){
 const root=$("vu-pkg-custom-list");root.replaceChildren();pkgCustom.forEach((x,i)=>{const row=el("div","vu-pkg-custom-row");row.append(el("span",null,x.quantity+" × "+x.name+" · "+cash(x.price*x.quantity)+" (cost "+cash(x.cost*x.quantity)+")"));const b=el("button",null,"Remove");b.type="button";b.onclick=()=>{pkgCustom.splice(i,1);pkgRenderCustom();updatePackageTotals()};row.append(b);root.append(row);});
}
function pkgSetStep(step){
 pkgStep=step;document.querySelectorAll("[data-pkg-panel]").forEach(x=>x.hidden=x.dataset.pkgPanel!==step);
 document.querySelectorAll("[data-pkg-step]").forEach(x=>x.classList.toggle("active",x.dataset.pkgStep===step));
 const steps=["plan","build","price","organise","confirm"],index=steps.indexOf(step);$("vu-pkg-back").disabled=index===0;$("vu-pkg-next").hidden=index===steps.length-1;
}
function setupPackagePlanner(){
 const apply=$("vu-pkg-apply-staff");if(apply)apply.onclick=()=>{for(const [id,n] of Object.entries(pkgStaffSuggestion()))if($(id))$(id).value=n;updatePackageTotals()};
 for(const [toggle,actual,panel] of [["vu-pkg-van-toggle","vu-pkg-van-enabled","vu-pkg-van-details"],["vu-pkg-limo-toggle","vu-pkg-limo-enabled","vu-pkg-limo-details"]]){const t=$(toggle);if(t){t.checked=$(actual).checked;t.onchange=()=>{$(actual).checked=t.checked;$(panel).hidden=!t.checked;$(actual).dispatchEvent(new Event("input",{bubbles:true}));};}}
 const cateringAdd=$("vu-pkg-catering-add");if(cateringAdd)cateringAdd.onclick=()=>{
 const name=$("vu-pkg-catering-name").value.trim(),quantity=Math.max(1,Math.floor(pkgNum("vu-pkg-catering-qty"))),price=pkgNum("vu-pkg-catering-price"),cost=pkgNum("vu-pkg-catering-cost");
 if(!name){alert("Enter a food or supplier name.");return;}pkgCatering.push({name,quantity,price,cost});$("vu-pkg-catering-name").value="";pkgRenderCatering();updatePackageTotals();
 };
 const cocktail=$("vu-pkg-van-cocktail");if(cocktail){for(const item of data.recipes)cocktail.append(new Option(item.name,item.name));cocktail.onchange=()=>{const item=data.recipes.find(x=>x.name===cocktail.value);if(!item)return;$("vu-pkg-custom-name").value=item.name;const p=pkgCocktailPrice(item);if(validPrice(p.price))$("vu-pkg-custom-price").value=p.price;const cost=typeof pkgRecipeUnitCost==="function"?pkgRecipeUnitCost(item):null;if(validPrice(cost)){$("vu-pkg-custom-cost").value=cost.toFixed(2);$("vu-pkg-van-cost-note").textContent="Recipe ingredient cost: "+cash(cost)+" per cocktail, included in package profit calculations.";}else{$("vu-pkg-custom-cost").value="";$("vu-pkg-van-cost-note").textContent="Ingredient cost unavailable: check the Recipe Book costing before confirming profit.";}};}

 if(!$("vu-pkg-save"))return;
 const steps=["plan","build","price","organise","confirm"];
 document.querySelectorAll("[data-pkg-step]").forEach(b=>b.onclick=()=>pkgSetStep(b.dataset.pkgStep));
 $("vu-pkg-back").onclick=()=>pkgSetStep(steps[Math.max(0,steps.indexOf(pkgStep)-1)]);
 $("vu-pkg-next").onclick=()=>pkgSetStep(steps[Math.min(4,steps.indexOf(pkgStep)+1)]);
 pkgFields.forEach(id=>$(id)?.addEventListener("input",()=>{const van=$("vu-pkg-van-enabled")?.checked,limo=$("vu-pkg-limo-enabled")?.checked;for(const [id,enabled,fee] of [["vu-mobile-bar",van,"vu-pkg-van-fee"],["vu-limousine",limo,"vu-pkg-limo-fee"]]){const entry=packageEntries.find(x=>x.id===id);if(entry){entry.quantity=enabled?1:0;entry.price=pkgNum(fee);}}$("vu-pkg-van-details").hidden=!van;$("vu-pkg-limo-details").hidden=!limo;updatePackageTotals();pkgUpdateServiceDetails();}));
 $("vu-pkg-custom-add").onclick=()=>{
  const name=$("vu-pkg-custom-name").value.trim(),quantity=Math.max(1,Math.floor(pkgNum("vu-pkg-custom-qty"))),price=pkgNum("vu-pkg-custom-price"),cost=pkgNum("vu-pkg-custom-cost");
  if(!name){alert("Choose or enter a drink name.");return}if($("vu-pkg-van-cocktail").value&&$("vu-pkg-custom-cost").value===""){alert("Ingredient cost is missing. Check recipe costing first.");return}pkgCustom.push({name,quantity,price,cost});$("vu-pkg-custom-name").value="";pkgRenderCustom();updatePackageTotals();
 };
 document.querySelectorAll("[data-pkg-template]").forEach(b=>b.onclick=()=>{
  const kind=b.dataset.pkgTemplate,settings={birthday:["Birthday celebration","Birthday",20],vip:["VIP night","VIP night",10],mobile:["Mobile cocktail experience","Mobile bar event",30],limo:["Limousine night out","Limo experience",6],party:["Private celebration","Private party",25],wedding:["Wedding reception","Wedding",40],corporate:["Corporate gathering","Corporate event",30],theme:["Themed event","Themed night",30]}[kind];
  if(kind==="mobile"||kind==="limo"){const toggle=$(kind==="mobile"?"vu-pkg-van-toggle":"vu-pkg-limo-toggle");if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event("change"));}}$("vu-plan-name").value=settings[0];$("vu-pkg-occasion").value=settings[1];$("vu-plan-guests").value=settings[2];if(kind==="mobile")$("vu-pkg-van-enabled").checked=true;if(kind==="limo")$("vu-pkg-limo-enabled").checked=true;updatePackageTotals();pkgSetStep("build");
 });
 const save=()=>{const payload=pkgSnapshot();const id=pkgDraftId||("pkg-"+Date.now()+"-"+Math.random().toString(36).slice(2,7));pkgDraftId=id;document.dispatchEvent(new CustomEvent("vu:package-save",{detail:{id,...payload}}));$("vu-pkg-save-status").textContent="Saving…";};
 $("vu-pkg-save").onclick=save;$("vu-pkg-save-confirm").onclick=save;
 $("vu-pkg-new").onclick=()=>{pkgDraftId=null;pkgLoad({fields:Object.fromEntries(pkgFields.map(id=>[id,$(id)?.type==="checkbox"?false:""])),items:[],custom:[]});$("vu-plan-guests").value=1;$("vu-plan-discount").value=0;$("vu-pkg-occasion").value="Birthday";$("vu-pkg-status").value="Draft";$("vu-pkg-saved").value="";pkgSetStep("plan");};
 $("vu-pkg-saved").onchange=()=>{const d=pkgDrafts.find(x=>x.id===$("vu-pkg-saved").value);if(d){pkgDraftId=d.id;pkgLoad(d);pkgSetStep("plan");}};
 document.addEventListener("vu:packages-updated",e=>{pkgDrafts=e.detail||[];const sel=$("vu-pkg-saved");sel.replaceChildren(new Option("New package",""));for(const d of pkgDrafts.sort((x,y)=>String(y.updatedAt).localeCompare(String(x.updatedAt))))sel.append(new Option((d.fields?.["vu-plan-name"]||"Untitled")+" · "+(d.fields?.["vu-pkg-status"]||"Draft"),d.id));if(pkgDraftId)sel.value=pkgDraftId;});
 document.addEventListener("vu:package-saved",()=>{$("vu-pkg-save-status").textContent="Saved for your owner account."});
 document.addEventListener("vu:package-error",e=>{$("vu-pkg-save-status").textContent="Save failed: "+e.detail});
 $("vu-pkg-open-calendar").onclick=()=>document.querySelector('[data-tab="calendar"]')?.click();
 $("copy-package").onclick=()=>{
  const t=pkgTotals(),lines=["VANILLA UNICORN · EVENT QUOTE","Package: "+($("vu-plan-name").value||"Custom package"),"Customer: "+$("vu-plan-customer").value,"Occasion: "+$("vu-pkg-occasion").value,"Guests: "+$("vu-plan-guests").value,"Start: "+$("vu-pkg-start").value,"End: "+$("vu-pkg-end").value,"Venue: "+$("vu-pkg-location").value,"",...t.all.map(x=>x.quantity+" × "+x.name+" @ "+cash(x.price)+" = "+cash(x.quantity*x.price)),"","Subtotal: "+cash(t.subtotal),"Discount: "+t.discount+"%","TOTAL: "+cash(t.total),"Status: "+$("vu-pkg-status").value,"Requests: "+$("vu-pkg-requests").value,"Note: Quote only; booking and payment to be confirmed."];
  navigator.clipboard.writeText(lines.join("\n")).then(()=>alert("Detailed quote copied")).catch(()=>prompt("Copy quote:",lines.join("\n")));
 };
 pkgSetStep("plan");document.dispatchEvent(new Event("vu:package-ready"));
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
function render(){for(let x of data.drinks){line($("drink-list"),x.name,x.price,"d-"+x.id)}renderPackageCreator();setupPackageMedia();setupPackagePlanner();if(!data.recipes.length)data.recipes=[{"name":"Whiskey Sour","ingredients":[{"name":"Lemon","quantity":1},{"name":"Whiskey","quantity":1},{"name":"Eggs","quantity":1},{"name":"Sugar","quantity":1}]},{"name":"Piña Colada","ingredients":[{"name":"Rum","quantity":1},{"name":"Pineapple","quantity":1},{"name":"Coconut","quantity":1}]},{"name":"Bloody Mary","ingredients":[{"name":"Lemon","quantity":1},{"name":"Chili Peppers","quantity":1},{"name":"Salt","quantity":1},{"name":"Vodka","quantity":1},{"name":"Tomato Juice","quantity":1}]},{"name":"Shirley Temple","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Cherry","quantity":1},{"name":"Grenadine","quantity":1}]},{"name":"Rainbow Rush","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Skittles","quantity":1},{"name":"Vodka","quantity":1}]},{"name":"Mojito","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Sugar","quantity":1},{"name":"Lime","quantity":1},{"name":"Rum","quantity":1},{"name":"Mint Leaves","quantity":1}]},{"name":"Old Fashioned","ingredients":[{"name":"Whiskey","quantity":1},{"name":"Orange","quantity":1},{"name":"Sugar","quantity":1},{"name":"Angostura Bitters","quantity":1}]},{"name":"Margarita","ingredients":[{"name":"Lime","quantity":1},{"name":"Tequila","quantity":1},{"name":"Orange","quantity":1},{"name":"Sugar","quantity":1}]},{"name":"Salty Pigeon","ingredients":[{"name":"Pigeon Milk","quantity":1},{"name":"Vodka","quantity":1},{"name":"Cocoa Powder","quantity":1},{"name":"Salt","quantity":1}]},{"name":"Virgin Mojito","ingredients":[{"name":"Sprunk","quantity":1},{"name":"Sugar","quantity":1},{"name":"Lime","quantity":1},{"name":"Mint Leaves","quantity":1}]}];for(const r of data.recipes){
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
 const priceLine=el("p","vu-recipe-price");priceLine.dataset.recipe=r.name;priceLine.textContent="Calculating selling price…";body.append(title,subtitle,priceLine,ingredients);
 card.append(visual,body);$("recipes-list").append(card);
 }setupWasteCalculator(data.recipes);setupOrderCalculator(data);setupMonthCalendar();if(!data.bookings.length)$("booking-list").append(el("div","item","No bookings published yet."));for(let b of [...data.bookings].sort((a,b)=>a.start.localeCompare(b.start))){let box=el("div","item");box.append(el("div",null,b.title+" — "+b.start+" to "+b.end+" ("+(b.resources||[]).join(", ")+")"));$("booking-list").append(box)}for(let r of data.resources){let o=document.createElement("option");o.value=r.id;o.textContent=r.name;$("check-resource").append(o)}let sel=document.createElement("select");sel.id="limo-choice";sel.addEventListener("change",update);sel.append(new Option("Select a vehicle",""));for(let l of data.limousines){let o=new Option(l.name+(l.active?"":" (not active)"),l.id);o.disabled=!l.active||!validPrice(l.hourlyPrice);sel.append(o)}$("limo-list").append(sel);update()}function check(){let start=$("check-start").value,end=$("check-end").value,res=$("check-resource").value,out=$("availability-result");out.className="";if(!start||!end||start>=end){out.textContent="Select a valid start and end time.";out.className="warn";return}let conflicts=data.bookings.filter(b=>(b.resources||[]).includes(res)&&start<b.end&&end>b.start);out.textContent=conflicts.length?"Unavailable: "+conflicts.map(b=>b.title).join(", "):"No conflict found in published bookings. Confirm staff and resources with management.";out.className=conflicts.length?"warn":"ok"}// Navigation is managed by the unified openTab/openSettings controller below.$("copy-drinks").onclick=()=>copyQuote("VU DRINKS QUOTE",selections("d-",data.drinks));$("check-availability").onclick=check;["tip-amount","tip-percent","limo-hours"].forEach(id=>$(id).addEventListener("input",update));fetch("data/public.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Data unavailable");return r.json()}).then(d=>{data=d;render()}).catch(()=>{$("drink-list").textContent="Could not load published prices. Refresh or contact VU management."});

function setupVehicleManagement(){
 const form=$("vehicle-form"),list=$("vehicle-records");if(!form)return;
 let records=[],editing="";
 const clear=()=>{editing="";form.reset();$("vehicle-status").textContent="";const preview=$("vehicle-preview");if(preview)preview.style.display="none"};
 $("vehicle-cancel").onclick=()=>{clear();photoPreview.style.display="none"};
 const pasteZone=$("vehicle-paste"),photoField=$("vehicle-photo"),photoPreview=$("vehicle-preview");
 const showPhoto=()=>{const url=photoField.value.trim();photoPreview.style.display=url?"block":"none";if(url)photoPreview.src=url};
 photoField.addEventListener("input",showPhoto);
 pasteZone.onclick=()=>pasteZone.focus();
 pasteZone.addEventListener("paste",async event=>{
  const file=Array.from(event.clipboardData?.items||[]).find(i=>i.type.startsWith("image/"))?.getAsFile();
  if(!file)return;event.preventDefault();
  try{
   const bitmap=await createImageBitmap(file),scale=Math.min(1,600/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const url=canvas.toDataURL("image/jpeg",0.6);
   if(url.length>250000)throw Error("Image too large; crop and paste again.");
   photoField.value=url;showPhoto();$("vehicle-status").textContent="Photo ready. Save the vehicle.";
  }catch(error){$("vehicle-status").textContent="Photo paste failed: "+error.message}
 });

 form.onsubmit=e=>{
  e.preventDefault();
  const v={id:editing,name:$("vehicle-name").value.trim(),type:$("vehicle-type").value,fee:Number($("vehicle-fee").value),cost:Number($("vehicle-cost").value),purchase:Number($("vehicle-purchase").value||0),capacity:Number($("vehicle-capacity").value),plate:$("vehicle-plate").value.trim().toUpperCase(),colours:$("vehicle-colours").value.split(",").map(s=>s.trim()).filter(Boolean),notes:$("vehicle-notes").value.trim(),photo:$("vehicle-photo").value.trim()};
  if(!v.name||!Number.isFinite(v.fee)||v.fee<0||!Number.isFinite(v.cost)||v.cost<0||v.purchase<0||v.capacity<1)return;
  $("vehicle-status").textContent="Saving…";
  document.dispatchEvent(new CustomEvent("vu:vehicle-save",{detail:v}));
 };
 document.addEventListener("vu:vehicles-updated",e=>{
  records=e.detail||[];data.limousines=records.filter(v=>v.type==="limo").map(v=>({id:v.id,name:v.name,hourlyPrice:Number(v.fee),active:true}));const legacy=$("limo-choice");if(legacy){const selected=legacy.value;legacy.replaceChildren(new Option("Select a vehicle",""));for(const v of data.limousines)legacy.append(new Option(v.name,v.id));legacy.value=selected;update();}list.replaceChildren();
  if(!records.length)list.textContent="No vehicles added yet.";
  for(const v of records){
   const row=document.createElement("div");row.className="item";
   const details=document.createElement("div");const name=document.createElement("strong");name.textContent=v.name;
   const info=document.createElement("div");info.className="muted";info.textContent=v.type+" · Hire "+cash(v.fee)+" · Cost "+cash(v.cost)+" · Purchase "+cash(v.purchase||0)+" · Plate "+(v.plate||"Not set")+" · Capacity "+v.capacity+" · "+(v.colours||[]).join(", ");
   details.append(name,info);if(v.photo){const img=document.createElement("img");img.src=v.photo;img.alt=v.name;img.style.cssText="width:100px;height:65px;object-fit:cover;border-radius:8px";details.prepend(img)}
   const edit=document.createElement("button");edit.type="button";edit.textContent="Edit";edit.onclick=()=>{
    editing=v.id;
    for(const key of ["name","type","fee","cost","purchase","capacity","plate","notes","photo"]){const field=$("vehicle-"+key);if(field)field.value=v[key]??""}
    $("vehicle-colours").value=(v.colours||[]).join(", ");
    showPhoto();form.scrollIntoView({block:"nearest"});
   };
   const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";remove.onclick=()=>{if(confirm("Remove "+v.name+"?"))document.dispatchEvent(new CustomEvent("vu:vehicle-delete",{detail:v.id}))};
   row.append(details,edit,remove);list.append(row);
  }
  for(const [type,id,fee,cost,colour] of [["limo","vu-pkg-limo-vehicle","vu-pkg-limo-fee","vu-pkg-limo-expenses","vu-pkg-limo-colour"],["van","vu-pkg-van-vehicle","vu-pkg-van-fee","vu-pkg-van-expenses","vu-pkg-van-colour"]]){
   const select=$(id);if(!select)continue;
   const selected=select.value;select.replaceChildren(new Option("Manual price",""));
   for(const v of records.filter(x=>x.type===type))select.append(new Option(v.name+" — "+cash(v.fee),v.id));
   select.value=selected;
   select.onchange=()=>{
    const v=records.find(x=>x.id===select.value);if(!v)return;
    $(fee).value=v.fee;$(cost).value=v.cost;
    const colourSelect=$(colour);
    if(colourSelect&&v.colours?.length)colourSelect.replaceChildren(new Option("Choose colour",""),...v.colours.map(c=>new Option(c,c)));
    updatePackageTotals();
   };
  }
 });
 document.addEventListener("vu:vehicle-saved",()=>{clear();$("vehicle-status").textContent="Vehicle saved."});
 document.addEventListener("vu:vehicles-error",e=>{$("vehicle-status").textContent="Error: "+e.detail});
 document.dispatchEvent(new Event("vu:vehicles-ready"));
}
(function(){const $g=id=>document.getElementById(id),file=$g("gallery-file"),url=$g("gallery-url"),preview=$g("gallery-preview"),status=$g("gallery-status"),list=$g("gallery-list");if(!file)return;
const show=()=>{preview.style.display=url.value?"block":"none";if(url.value)preview.src=url.value;};url.oninput=show;
async function photo(blob){const bitmap=await createImageBitmap(blob);let result="";for(const width of [1600,1400,1200,1000,900]){const scale=Math.min(1,width/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);for(const quality of [.84,.76,.68,.58]){result=canvas.toDataURL("image/jpeg",quality);if(result.length<=260000)break;}if(result.length<=260000)break;}bitmap.close();if(result.length>260000)throw Error("Photo too large; crop it or use an image URL.");url.value=result;show();}
file.onchange=async()=>{try{if(file.files[0])await photo(file.files[0]);}catch(e){status.textContent=e.message;}};
const paste=$g("gallery-paste");paste.onclick=()=>paste.focus();paste.onpaste=async e=>{const blob=Array.from(e.clipboardData?.items||[]).find(x=>x.type.startsWith("image/"))?.getAsFile();if(blob){e.preventDefault();try{await photo(blob);}catch(err){status.textContent=err.message;}}};
$g("gallery-save").onclick=()=>{const image=url.value.trim(),caption=$g("gallery-caption").value.trim();if(!image||image.length>270000||(!image.startsWith("https://")&&!image.startsWith("data:image/jpeg;base64,"))){status.textContent="Choose a valid photo.";return;}status.textContent="Publishing…";document.dispatchEvent(new CustomEvent("vu:gallery-save",{detail:{image,caption}}));};
const gallerySort=(a,b)=>{const av=Number.isFinite(a.order)?a.order:null,bv=Number.isFinite(b.order)?b.order:null;if(av!==null&&bv!==null&&av!==bv)return av-bv;if(av!==null&&bv===null)return -1;if(bv!==null&&av===null)return 1;return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)||a.id.localeCompare(b.id);};let galleryRows=[];
document.addEventListener("vu:gallery-updated",e=>{galleryRows=[...e.detail].sort(gallerySort);list.replaceChildren();galleryRows.forEach((x,index)=>{const row=document.createElement("div");row.className="item vu-gallery-admin-row";const img=document.createElement("img");img.src=x.image;img.alt=x.caption||"Club photo";img.style.cssText="width:110px;height:75px;object-fit:cover;border-radius:8px";const controls=document.createElement("div");controls.className="vu-gallery-admin-controls";const caption=document.createElement("input");caption.value=x.caption||"";caption.maxLength=90;caption.setAttribute("aria-label","Photo caption");const save=document.createElement("button");save.type="button";save.textContent="Save caption";save.onclick=()=>{status.textContent="Saving caption…";document.dispatchEvent(new CustomEvent("vu:gallery-edit",{detail:{id:x.id,caption:caption.value.trim()}}));};const move=document.createElement("div");move.className="vu-gallery-admin-actions";for(const [label,delta] of [["↑ Up",-1],["↓ Down",1]]){const btn=document.createElement("button");btn.type="button";btn.textContent=label;btn.disabled=index+delta<0||index+delta>=galleryRows.length;btn.onclick=()=>{const ids=galleryRows.map(y=>y.id);[ids[index],ids[index+delta]]=[ids[index+delta],ids[index]];status.textContent="Saving photo order…";document.dispatchEvent(new CustomEvent("vu:gallery-reorder",{detail:ids}));};move.append(btn);}const del=document.createElement("button");del.type="button";del.textContent="Remove";del.onclick=()=>{if(confirm("Remove photo?"))document.dispatchEvent(new CustomEvent("vu:gallery-delete",{detail:x.id}));};move.append(del);controls.append(caption,save,move);row.append(img,controls);list.append(row);});if(!galleryRows.length)list.textContent="No photos yet.";});
document.addEventListener("vu:gallery-changed",e=>{status.textContent=e.detail||"Gallery updated.";});
document.addEventListener("vu:gallery-saved",()=>{status.textContent="Photo published.";url.value="";file.value="";show();});document.addEventListener("vu:gallery-error",e=>status.textContent=e.detail);document.dispatchEvent(new Event("vu:gallery-ready"));})();
// Main navigation and nested settings sections.
setupVehicleManagement();
(function(){
 const primary=["overview","recipes","transactions","packages","tips","calendar","gallery","settings"];
 const nested=["staff","costing","pricing","limo","events","package-media","incidents"];
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
 const quick=$id("waste-quick"),search=$id("waste-search");
 const renderQuick=()=>{quick.replaceChildren();const query=search.value.trim().toLowerCase();for(const name of names.filter(n=>n.toLowerCase().includes(query)).slice(0,18)){const b=el("button","vu-waste-quick-button",name+" +1");b.type="button";b.onclick=()=>{stock.set(name,have(name)+1);render();};quick.append(b);}};
 search.addEventListener("input",renderQuick);renderQuick();
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
 pkgRecipeUnitCost=unitCost;
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
 const clearOrder=()=>{entries.forEach(e=>e.qty=0);root.querySelectorAll(".vu-qty-value").forEach(e=>e.textContent="0");calculate();};
 document.addEventListener("vu:clear-order",clearOrder);
 $id("vu-order-paid")?.addEventListener("click",()=>{
  const selected=lines();
  if(!selected.length){$id("vu-order-paid-message").textContent="Add items before checkout.";return;}
  if(selected.some(e=>!Number.isFinite(activePrice(e)))){$id("vu-order-paid-message").textContent="Some items need a selling price in Settings.";return;}
  const total=selected.reduce((sum,e)=>sum+activePrice(e)*e.qty,0);
  if(!confirm("Confirm bill paid in city for "+money(total)+"?"))return;
  clearOrder();$id("vu-order-paid-message").textContent="Paid · "+money(total)+" · order completed.";
 });
 document.addEventListener("vu:order-request-items",event=>{const callback=event.detail?.callback;if(typeof callback!=="function")return;callback(entries.filter(e=>e.qty>0&&e.price.value!==""&&Number.isFinite(Number(e.price.value))).map(e=>({name:e.item.name,quantity:e.qty,price:Number(e.price.value)})));});
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
 $id("order-clear").addEventListener("click",clearOrder);
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
 const createToggle=$("vu-create-tab-toggle"),newOrder=$("vu-new-order");
 if(createToggle)createToggle.onclick=()=>{create.hidden=false;$("vu-tab-name").focus();};

 if(newOrder)newOrder.onclick=()=>{document.dispatchEvent(new Event("vu:clear-order"));$("order-search").focus();};
 if(!create)return;
 let tabs=[],customers=[],selected=null,selectedCustomer=null,costing=null;
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
  const customerList=$("vu-customer-list"),profile=$("vu-customer-profile"),term=String($("vu-customer-search")?.value||"").trim().toLowerCase();
  if(customerList){
   customerList.replaceChildren();
   for(const c of [...customers].sort((x,y)=>x.name.localeCompare(y.name)).filter(c=>c.name.toLowerCase().includes(term))){
    const open=tabs.find(t=>t.customerId===c.id&&t.status!=="paid");
    const b=button(c.name+(open?" · Open bill":" · No open bill"),()=>{selectedCustomer=c.id;selected=open?.id||null;draw();});
    if(c.id===selectedCustomer)b.classList.add("active");
    customerList.append(b);
   }
   if(!customers.length)customerList.append(el("p","muted","No saved customers yet. Add your first customer."));
   else if(!customerList.children.length)customerList.append(el("p","muted","No matching customers."));
  }
  if(profile){
   profile.replaceChildren();
   const c=customers.find(c=>c.id===selectedCustomer);
   if(c){
    profile.append(el("h4",null,c.name));
    const history=tabs.filter(t=>t.customerId===c.id).sort((x,y)=>String(y.createdAt||"").localeCompare(String(x.createdAt||"")));
    const open=history.find(t=>t.status!=="paid");
    if(open)profile.append(button("Use this bill in till",()=>{selected=open.id;const picker=$("vu-order-tab-target");if(picker){picker.value=open.id;picker.dispatchEvent(new Event("change"));}document.querySelector(".vu-till-basket")?.scrollIntoView({behavior:"smooth",block:"center"});draw();}));
    else profile.append(button("+ Start new bill",()=>send("newBill",{customerId:c.id})));
    profile.append(el("p","muted",history.length+" bill(s) · "+history.filter(t=>t.status==="paid").length+" paid"));
    for(const t of history){
     const total=(t.items||[]).reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);
     profile.append(button((t.status==="paid"?"Paid":"Open")+" · "+cash(total)+" · "+new Date(t.createdAt||t.updatedAt||Date.now()).toLocaleDateString(),()=>{selected=t.id;draw();}));
    }
   }else profile.append(el("p","muted","Select a saved customer to see their current bill and past visits."));
  }
  list.replaceChildren();
  const ordered=[...tabs].filter(t=>!t.customerId&&t.status!=="paid").sort((x,y)=>(x.status==="paid")-(y.status==="paid")||String(y.updatedAt||"").localeCompare(String(x.updatedAt||"")));
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
  detail.append(el("p","muted","Add more items using the Bar Till above. Select this customer in the till dropdown."));
 }
 create.onsubmit=e=>{e.preventDefault();const name=$("vu-tab-name").value.trim();if(!name)return;send("createCustomer",{name});$("vu-tab-name").value="";create.hidden=true;};
 $("vu-customer-search")?.addEventListener("input",draw);
 document.addEventListener("vu:customers-updated",e=>{customers=Array.isArray(e.detail)?e.detail:[];draw();});
 document.addEventListener("vu:tabs-updated",e=>{
  tabs=Array.isArray(e.detail)?e.detail:[];
  if(selected&&!tabs.some(t=>t.id===selected))selected=null;
  const picker=$("vu-package-tab-target");
  if(picker){const current=picker.value;picker.replaceChildren(new Option("Select open customer tab",""));for(const t of tabs.filter(t=>t.status!=="paid"))picker.append(new Option(customers.find(c=>c.id===t.customerId)?.name||t.name,t.id));picker.value=tabs.some(t=>t.id===current&&t.status!=="paid")?current:"";}
  const orderPicker=$("vu-order-tab-target");if(orderPicker){const previous=orderPicker.value;orderPicker.replaceChildren(new Option("Walk-in / quick order",""));for(const t of tabs.filter(t=>t.status!=="paid"))orderPicker.append(new Option(customers.find(c=>c.id===t.customerId)?.name||t.name,t.id));orderPicker.value=tabs.some(t=>t.id===previous&&t.status!=="paid")?previous:"";}
  draw();
  if(selectedCustomer){const open=tabs.find(t=>t.customerId===selectedCustomer&&t.status!=="paid");if(open&&!orderPicker?.value){orderPicker.value=open.id;orderPicker.dispatchEvent(new Event("change"));}}
 });
 document.addEventListener("vu:tab-error",e=>say(e.detail||"Unable to save tab."));
 document.addEventListener("vu:tab-success",e=>say(e.detail||"Saved."));
 document.addEventListener("vu:costing-updated",e=>{if(e.detail?.recipes)costing=e.detail;});
 document.addEventListener("vu:tab-catalog-updated",draw);
 const tillPicker=$("vu-order-tab-target"),tillPaid=$("vu-order-paid"),tillSettle=$("vu-till-settle"),tillHint=$("vu-till-hint");
 const syncTill=()=>{
  const id=tillPicker?.value||"",tab=tabs.find(t=>t.id===id&&t.status!=="paid");
  if(tillPaid)tillPaid.hidden=Boolean(tab);
  if(tillSettle)tillSettle.hidden=!tab;
  if(orderSend)orderSend.hidden=!tab;
  if(tillHint)tillHint.textContent=tab?"Adding items to "+(customers.find(c=>c.id===tab.customerId)?.name||tab.name)+"'s bill. Save items first; Paid closes the full bill.":"Walk-in order: add items and mark paid. For a running tab, select an existing open customer bill.";
 };
 tillPicker?.addEventListener("change",syncTill);
 tillSettle?.addEventListener("click",()=>{
  const tab=tabs.find(t=>t.id===tillPicker?.value&&t.status!=="paid");
  if(!tab)return;
  const total=(tab.items||[]).reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);
  if(confirm("Confirm "+tab.name+"'s complete bill of "+cash(total)+" was paid in city?"))send("settle",{id:tab.id});
 });
 document.addEventListener("vu:tabs-updated",()=>setTimeout(syncTill,0));
 const orderSend=$("vu-order-add-tab");
 if(orderSend)orderSend.onclick=()=>{
  const id=$("vu-order-tab-target").value,message=$("vu-order-tab-message");
  if(!id){message.textContent="Select an open customer bill first.";return;}
  document.dispatchEvent(new CustomEvent("vu:order-request-items",{detail:{callback:items=>{
   if(!items.length){message.textContent="Add priced items to the order first.";return;}
   send("addMany",{id,items});message.textContent="Adding "+items.length+" order lines to tab…";document.dispatchEvent(new Event("vu:clear-order"));
  }}}));
 };
 const packageSend=$("vu-package-add-to-tab");
 if(packageSend)packageSend.onclick=()=>{
  const id=$("vu-package-tab-target").value,items=packageEntries.filter(x=>x.quantity>0&&validPrice(x.price));
  if(!id){$("vu-package-tab-status").textContent="Choose a customer tab first.";return;}
  if(!items.length){$("vu-package-tab-status").textContent="Select at least one priced package item.";return;}
  send("addMany",{id,items:items.map(item=>({name:item.name,quantity:item.quantity,price:item.price}))});
  $("vu-package-tab-status").textContent="Adding "+items.length+" item(s) to customer tab…";
 };
 document.dispatchEvent(new Event("vu:tab-ready"));
})();

(function recipePricingAndPlanner(){
 const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
 const refresh=()=>{
  for(const node of document.querySelectorAll(".vu-recipe-price")){
   const name=node.dataset.recipe,key=norm(name);
   const entry=Object.entries(sharedSellingPrices).find(([k,v])=>k.startsWith("Cocktails::")&&v!==null&&Number.isFinite(Number(v))&&norm(k.split("::").slice(1).join("::"))===key);
   node.textContent=entry?"Selling price: "+cash(Number(entry[1])):"Selling price not configured";
  }
 };
 document.addEventListener("vu:prices-updated",refresh);
 document.addEventListener("vu:pricing-ready",()=>setTimeout(refresh,0));
 setTimeout(refresh,800);
})();
