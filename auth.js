import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase web app identifiers are public; passwords and admin credentials are never stored here.
const firebaseConfig = {
  apiKey: "AIzaSyBGCbNm6DFrHhqeUOy6DtPVaLziFt33JNw",
  authDomain: "vanilla-unicorn-e415a.firebaseapp.com",
  projectId: "vanilla-unicorn-e415a",
  storageBucket: "vanilla-unicorn-e415a.firebasestorage.app",
  messagingSenderId: "1075155939608",
  appId: "1:1075155939608:web:f118f9b96382028e8fae6d"
};
const OWNER_UID = "MdjPO1WYwlb97hitjqUXLWHOXd12";
const OWNER_EMAIL = "vu-owner@staff.vu";
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
let stopStaffListener = null;
let stopIncidentListener = null;
let costingInitialized = false;
let incidentsInitialized = false;
let staffInitialized = false;
let eventsInitialized = false;
let stopEventsListener = null;
const screen = document.getElementById("auth-screen");
const app = document.getElementById("protected-app");
const logout = document.getElementById("logout-button");
const status = document.getElementById("login-message");
let appLoaded = false;
let stopPricingListener = null;
let sharedPrices = {};
const pricingDoc = doc(db,"businessSettings","sellingPrices");
function beginPricingSync(){
 if(stopPricingListener)return;
 stopPricingListener=onSnapshot(pricingDoc,snapshot=>{
  const raw=snapshot.exists()?snapshot.data().prices:{};
  sharedPrices=raw&&typeof raw==="object"?raw:{};
  document.dispatchEvent(new CustomEvent("vu:prices-updated",{detail:sharedPrices}));
  const status=document.getElementById("pricing-status");
  if(status)status.textContent="Prices synced across devices.";
 },error=>{
  const status=document.getElementById("pricing-status");
  if(status)status.textContent="Price sync failed: "+error.message;
 });
}
document.addEventListener("vu:pricing-ready",()=>document.dispatchEvent(new CustomEvent("vu:prices-updated",{detail:sharedPrices})));
document.addEventListener("vu:save-price",async event=>{
 if(auth.currentUser?.uid!==OWNER_UID)return;
 const {key,value}=event.detail||{};
 if(typeof key!=="string"||!key.includes("::"))return;
 const status=document.getElementById("pricing-status");
 if(value!==null&&(!Number.isFinite(value)||value<0)){if(status)status.textContent="Enter a valid price.";return;}
 try{
  await setDoc(pricingDoc,{prices:{[key]:value===null?null:value}}, {merge:true});
  if(status)status.textContent="Price saved for all devices.";
 }catch(error){if(status)status.textContent="Save failed: "+error.message;}
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  if (username !== "vu-owner") {
    status.textContent = "This account is not enabled yet.";
    return;
  }
  status.textContent = "Signing in…";
  try {
    const result = await signInWithEmailAndPassword(auth, OWNER_EMAIL, password);
    if (result.user.uid !== OWNER_UID) {
      await signOut(auth);
      throw new Error("This account is not authorised as the owner.");
    }
  } catch (error) {
    status.textContent = error.code === "auth/invalid-credential" ? "Incorrect password or account details." : (error.message || "Unable to sign in.");
  }
  document.getElementById("login-password").value = "";
});

logout.addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, (user) => {
  const owner = user?.uid === OWNER_UID;
  screen.classList.toggle("hidden", owner);
  app.classList.toggle("hidden", !owner);
  logout.classList.toggle("hidden", !owner);
  document.getElementById("signed-in-label").textContent = owner ? "VU Owner" : "Drinks · Events · Bookings";
  if (owner) beginPricingSync();
  if (!owner && stopPricingListener) { stopPricingListener(); stopPricingListener=null; sharedPrices={}; }
  if (owner && !costingInitialized) { costingInitialized = true; setupCosting(); }
  if (!owner) costingInitialized = false;
  if (owner && !incidentsInitialized) { incidentsInitialized = true; setupIncidents(); }
  if (!owner && stopIncidentListener) { stopIncidentListener(); stopIncidentListener = null; incidentsInitialized = false; document.getElementById("incident-list").replaceChildren(); }
  if (owner && !eventsInitialized) { eventsInitialized = true; setupEvents(); }
  if (!owner && stopEventsListener) { stopEventsListener(); stopEventsListener = null; eventsInitialized = false; }
  if (owner && !staffInitialized) {
    staffInitialized = true;
    setupStaffManagement();
  }
  if (!owner && stopStaffListener) {
    stopStaffListener(); stopStaffListener = null; staffInitialized = false;
    document.getElementById("staff-list").replaceChildren();
  }
  if (owner && !appLoaded) {
    appLoaded = true;
    const script = document.createElement("script");
    script.src = "app.js?v=20261105-shared-pricing1";
    document.body.append(script);
  }
  if (user && !owner) signOut(auth);
  if (!owner) status.textContent = "";
}, (error) => {
  status.textContent = "Could not connect to Firebase. Check the Firebase configuration.";
  console.error("Authentication state error:", error);
});

function setupStaffManagement() {
  const list = document.getElementById("staff-list");
  const message = document.getElementById("staff-message");
  const form = document.getElementById("staff-form");
  let employees = [];
  stopStaffListener = onSnapshot(collection(db, "staffProfiles"), (snapshot) => {
    employees = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    employees.sort((a,b) => a.name.localeCompare(b.name));
    list.replaceChildren();
    if (!employees.length) {
      const empty = document.createElement("p");
      empty.textContent = "No employees added yet. You're currently the only VU staff member.";
      list.append(empty);
    }
    for (const employee of employees) {
      const row = document.createElement("div"); row.className = "item";
      const details = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = employee.name;
      const sub = document.createElement("div"); sub.className = "muted";
      sub.textContent = employee.username + " · " + (employee.roles || []).join(", ") + " · Profile only (login not activated)";
      details.append(title, sub);
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", async () => {
        if (!confirm("Remove the profile for " + employee.name + "?")) return;
        try { await deleteDoc(doc(db, "staffProfiles", employee.id)); }
        catch (e) { message.textContent = "Could not remove employee: " + e.message; }
      });
      row.append(details, remove); list.append(row);
    }
  }, (error) => {
    list.textContent = "Unable to load staff records. Check your Firestore rules.";
    console.error(error);
  });
  if (form.dataset.bound) return;
  form.dataset.bound = "true";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const name = document.getElementById("staff-name").value.trim();
    const username = document.getElementById("staff-username").value.trim();
    const roles = [...form.querySelectorAll('input[name="staff-role"]:checked')].map(e => e.value);
    if (!name || !/^[-_a-zA-Z0-9]{3,32}$/.test(username) || !roles.length) {
      message.textContent = "Enter a name, valid username and at least one role."; return;
    }
    if (username.toLowerCase() === "vu-owner" || employees.some(e => e.username.toLowerCase() === username.toLowerCase())) {
      message.textContent = "That username is already reserved or in use."; return;
    }
    try {
      await addDoc(collection(db, "staffProfiles"), { name, username, roles, status: "pending", createdAt: serverTimestamp() });
      form.reset(); message.textContent = "Employee profile saved. Login activation is not available yet.";
    } catch (error) { message.textContent = "Could not save: " + error.message; }
  });
}

function setupEvents() {
  const form = document.getElementById("event-form");
  const msg = document.getElementById("event-message");
  const list = document.getElementById("owner-events");
  stopEventsListener = onSnapshot(collection(db,"publicEvents"), snap => {
    list.replaceChildren();
    const entries = snap.docs.map(d => ({id:d.id,...d.data()})).sort((a,b)=>a.start.localeCompare(b.start));
    if (!entries.length) list.textContent = "No events published yet.";
    for (const e of entries) {
      const row = document.createElement("div"); row.className = "item";
      const details = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = e.title;
      const sub = document.createElement("div"); sub.className = "muted"; sub.textContent = e.start.replace("T"," ") + " · " + e.roles;
      details.append(title,sub);
      const remove = document.createElement("button"); remove.textContent = "Unpublish";
      remove.onclick = async () => { if (confirm("Remove this event from the public calendar?")) await deleteDoc(doc(db,"publicEvents",e.id)); };
      row.append(details,remove); list.append(row);
    }
  }, e => {list.textContent = "Unable to load events: " + e.message;});
  const interestList = document.getElementById("event-interest-list");
  const stopInterest = onSnapshot(collection(db,"eventInterest"), snap => {
    interestList.replaceChildren();
    const records = snap.docs.map(d => d.data());
    if (!records.length) { interestList.textContent = "No expressions of interest yet."; return; }
    for (const entry of records) {
      const row = document.createElement("div"); row.className = "item";
      const details = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = entry.name + " · " + entry.role;
      const sub = document.createElement("div"); sub.className = "muted"; sub.textContent = "Discord: " + entry.contact + " · Event ID: " + entry.eventId;
      details.append(title,sub); row.append(details); interestList.append(row);
    }
  },err => {interestList.textContent = "Could not load interest: " + err.message;});
  const originalStop = stopEventsListener;
  stopEventsListener = () => {originalStop();stopInterest();};
  if (form.dataset.bound) return;
  form.dataset.bound = "true";
  form.addEventListener("submit",async ev => {
    ev.preventDefault();
    const title = document.getElementById("event-title").value.trim();
    const start = document.getElementById("event-start").value;
    const end = document.getElementById("event-end").value;
    const description = document.getElementById("event-description").value.trim();
    const roles = document.getElementById("event-roles").value.trim();
    if (!title || !start || !end || end <= start) {msg.textContent = "Check the title and event times.";return;}
    try {
      await addDoc(collection(db,"publicEvents"),{title,start,end,description,roles,createdAt:serverTimestamp()});
      msg.textContent = "Event published. It will appear on the public events page.";
      form.reset();
    } catch(e) {msg.textContent = "Could not publish: " + e.message;}
  });
}


// Private management records. Firestore rules restrict the collection to the owner.
function setupIncidents() {
  const form = document.getElementById("incident-form");
  const list = document.getElementById("incident-list");
  const message = document.getElementById("incident-message");
  const get = id => document.getElementById("incident-" + id).value.trim();
  const format = record => [
    "VANILLA UNICORN — " + record.type.toUpperCase(),
    "Date/time: " + record.when,
    "Subject: " + record.title,
    "People: " + (record.people || "Not recorded"),
    "Details: " + record.details,
    "Action: " + (record.action || "Not recorded"),
    "Status: " + record.status
  ].join("\n");
  stopIncidentListener = onSnapshot(collection(db, "managementIncidents"), snapshot => {
    const entries = snapshot.docs.map(d => ({id:d.id,...d.data()})).sort((a,b) => (b.when || "").localeCompare(a.when || ""));
    list.replaceChildren();
    if (!entries.length) { const p=document.createElement("p");p.textContent="No reports recorded yet.";list.append(p); }
    for (const entry of entries) {
      const row=document.createElement("article");row.className="item incident-row";
      const info=document.createElement("div");const title=document.createElement("strong");title.textContent=entry.title;
      const meta=document.createElement("p");meta.className="muted";meta.textContent=entry.type+" · "+entry.when+" · "+entry.status;
      const details=document.createElement("p");details.className="muted";details.textContent=entry.details;
      info.append(title,meta,details);
      const controls=document.createElement("div");controls.className="incident-actions";
      const copy=document.createElement("button");copy.type="button";copy.textContent="Copy Report";
      copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(format(entry));message.textContent="Report copied. Paste it into Discord manually."; }catch{message.textContent="Clipboard unavailable; use a secure browser connection."; }});
      const remove=document.createElement("button");remove.type="button";remove.textContent="Delete";
      remove.addEventListener("click",async()=>{if(!confirm("Permanently delete this report?"))return;try{await deleteDoc(doc(db,"managementIncidents",entry.id));message.textContent="Report deleted."}catch(e){message.textContent="Delete failed: "+e.message}});
      controls.append(copy,remove);row.append(info,controls);list.append(row);
    }
  }, error => {list.textContent="Unable to load reports: "+error.message;});
  if (form.dataset.bound) return;
  form.dataset.bound="true";
  form.addEventListener("submit",async e=>{
    e.preventDefault();message.textContent="Saving report…";
    const data={type:get("type"),when:get("when"),title:get("title"),people:get("people"),details:get("details"),action:get("action"),status:get("status"),createdAt:serverTimestamp()};
    if (!data.when || !data.title || !data.details) {message.textContent="Complete the date, title and details.";return;}
    try{await addDoc(collection(db,"managementIncidents"),data);form.reset();message.textContent="Private report saved.";}
    catch(error){message.textContent="Save failed: "+error.message;}
  });
}


// Recipe data from the owner's in-city list. The trailing ×2 Cocktail Name denotes yield.
async function setupCosting() {
  const status=document.getElementById("costing-status");
  const pricesEl=document.getElementById("costing-prices");
  const recipesEl=document.getElementById("costing-recipes");
  const defaults=[
    ["Whiskey Sour",1,["Lemon","Whiskey","Eggs","Sugar"]],
    ["Pina Colada",2,["Rum","Pineapple","Coconut"]],
    ["Bloody Mary",1,["Lemon","Chili Peppers","Salt","Vodka","Tomato Juice"]],
    ["Shirley Temple (N/A)",2,["Sprunk","Cherry","Grenadine"]],
    ["Rainbow Rush",2,["Sprunk","Skittles","Vodka"]],
    ["Mojito",1,["Sprunk","Sugar","Lime","Rum","Mint Leaves"]],
    ["Old Fashioned",1,["Whiskey","Orange","Sugar","Angostura Bitters"]],
    ["Margarita",1,["Lime","Tequila","Orange","Sugar"]],
    ["Salty Pigeon",1,["Pigeon Milk","Vodka","Cocoa Powder","Salt"]]
  ];
  const storeItems=[
    ["Whiskey",65,2],["Rum",78,2],["Vodka",50,2],["Tequila",25,2],["Absinthe",52,2],
    ["Beer",12,1],["Cider",18,2],["Koka",10,1],["Frezzi",10,1],["Sprunk",10,1],
    ["Tanga",10,1],["Sweet Tea",12,1],["Green Cow",20,3],["Tomato Juice",15,2],
    ["Pigeon Milk",32,1],["Almond Milk",28,1],["Water",4,1],["Angostura Bitters",32,3],
    ["Grenadine",26,3],["Sugar",6,8],["Salt",8,2],["Cocoa Powder",10,2],
    ["Lemon",6,1],["Lime",6,1],["Orange",8,1],["Cherry",4,1],["Pineapple",14,5],
    ["Coconut",10,6],["Mint Leaves",6,2],["Olives",14,2],["Chili Peppers",6,1],
    ["Eggs",8,2],["Hot Dog",10,1],["Ham Sandwich",16,1],["Nachos",10,2],
    ["Salted Peanuts",12,2],["S'mores",20,1],["Skittles",10,2],["Paper Straw",1,1]
  ];
  const canonicalNames={"Sprite":"Sprunk","Hot Pepper":"Chili Peppers","Egg":"Eggs","Mint Leaf":"Mint Leaves","Coco Powder":"Cocoa Powder"};
  const storePrices=Object.fromEntries(storeItems.map(([name,price])=>[name,price]));
  const storeSU=Object.fromEntries(storeItems.map(([name,,su])=>[name,su]));
  const ref=doc(db,"ownerSettings","recipeCosting");
  let state={prices:{},recipes:defaults.map(([name,yieldCount,ingredients])=>({name,yieldCount,ingredients:ingredients.map(name=>({name,qty:1}))}))};
  try{const snap=await getDoc(ref);if(snap.exists()){const d=snap.data();if(d.prices&&d.recipes)state={prices:d.prices,recipes:d.recipes};}}catch(e){status.textContent="Unable to load saved prices: "+e.message;}
  for(const recipe of state.recipes)for(const ingredient of recipe.ingredients)ingredient.name=canonicalNames[ingredient.name]||ingredient.name;
  for(const [oldName,newName] of Object.entries(canonicalNames)){if(state.prices[oldName]!==undefined&&state.prices[newName]===undefined)state.prices[newName]=state.prices[oldName];delete state.prices[oldName];}
  for(const [name,price] of Object.entries(storePrices))if(state.prices[name]===undefined)state.prices[name]=price;
  const money=n=>Number.isFinite(n)?"$"+n.toFixed(2):"Not priced";
  const iconBase="https://p17.admin.opfw.me/images/icons/items/";
  const iconAliases={"Mint Leaves":"mint_leaves","Chili Peppers":"chili_peppers","Tomato Juice":"tomato_juice","Pigeon Milk":"pigeon_milk","Cocoa Powder":"cocoa_powder","Angostura Bitters":"angostura_bitters"};
  function itemIcon(name){
    const raw=iconAliases[name]||String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
    return iconBase+encodeURIComponent(raw)+".png";
  }
  function imageFor(name){
    const img=document.createElement("img");img.className="vu-item-icon";img.alt="";
    img.loading="lazy";img.src=itemIcon(name);
    img.onerror=()=>{img.onerror=null;img.src="assets/vu-unicorn.svg";img.classList.add("icon-fallback")};
    return img;
  }
  const ingredients=()=>storeItems.map(([name])=>name);
  let saveChain=Promise.resolve();
  function save(){const snapshot=JSON.parse(JSON.stringify(state));status.textContent="Saving…";saveChain=saveChain.catch(()=>{}).then(async()=>{try{await setDoc(ref,{...snapshot,updatedAt:serverTimestamp()});status.textContent="Saved to your private owner account.";}catch(e){status.textContent="Save failed: "+e.message;}});return saveChain;}
  function field(label,value,change,type="text"){const l=document.createElement("label");l.textContent=label;const input=document.createElement("input");input.type=type;input.value=value;input.addEventListener("change",()=>change(input.value));l.append(input);return l;}
  function render(){
    pricesEl.replaceChildren();recipesEl.replaceChildren();
    for(const name of ingredients()){
      const row=document.createElement("div");row.className="item";
      row.classList.add("ingredient-price-row");row.prepend(imageFor(name));
      row.append(field(name+" · "+storeSU[name]+" SU — purchase cost ($)",state.prices[name]??"",v=>{if(v==="")delete state.prices[name];else if(Number.isFinite(Number(v))&&Number(v)>=0)state.prices[name]=Number(v);save();render()},"number"));
      pricesEl.append(row);
    }
    state.recipes.forEach((recipe,index)=>{
      const box=document.createElement("details");box.className="costing-recipe";
      const heading=document.createElement("summary");heading.className="cocktail-heading";heading.append(imageFor(recipe.ingredients.find(i=>["Whiskey","Rum","Vodka","Tequila"].includes(i.name))?.name||recipe.ingredients[0]?.name||"Water"));
      const headingInfo=document.createElement("span");const headingName=document.createElement("strong");headingName.textContent=recipe.name;const headingCost=document.createElement("small");headingCost.className="cocktail-price";const initialMissing=recipe.ingredients.some(i=>state.prices[i.name]===undefined);const initialCost=recipe.ingredients.reduce((sum,i)=>sum+(Number(state.prices[i.name])||0)*Number(i.qty),0);headingCost.textContent=initialMissing?"Needs ingredient pricing":"Cost per serving · "+money(initialCost/recipe.yieldCount);headingInfo.append(headingName,headingCost);heading.append(headingInfo);box.append(heading);const editor=document.createElement("div");editor.className="cocktail-editor";
      const recipeMeta=document.createElement("p");recipeMeta.className="muted";recipeMeta.textContent=recipe.ingredients.length+" ingredients · Editable recipe";editor.append(recipeMeta);
      editor.append(field("Servings produced",recipe.yieldCount,v=>{const n=Number(v);if(Number.isInteger(n)&&n>0){recipe.yieldCount=n;save();render()}},"number"));
      const ingredientWrap=document.createElement("div");ingredientWrap.className="costing-ingredients";
      recipe.ingredients.forEach((item,j)=>{
        const line=document.createElement("div");line.className="costing-ingredient";line.append(imageFor(item.name));
        line.append(field("Ingredient",item.name,v=>{item.name=canonicalNames[v.trim()]||v.trim();save();render()}));
        line.append(field("Quantity",item.qty,v=>{const n=Number(v);if(Number.isFinite(n)&&n>0){item.qty=n;save();render()}},"number"));
        const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";remove.onclick=()=>{recipe.ingredients.splice(j,1);save();render()};line.append(remove);ingredientWrap.append(line);
      });editor.append(ingredientWrap);
      const add=document.createElement("button");add.type="button";add.textContent="Add ingredient";add.onclick=()=>{recipe.ingredients.push({name:"New ingredient",qty:1});save();render()};editor.append(add);
      const missing=recipe.ingredients.filter(i=>state.prices[i.name]===undefined);
      const cost=recipe.ingredients.reduce((sum,i)=>sum+(Number(state.prices[i.name])||0)*Number(i.qty),0);
      const total=document.createElement("p");total.className="costing-total";
      total.textContent=missing.length?"Awaiting store prices: "+missing.map(i=>i.name).join(", "):"Batch cost: "+money(cost)+" · Per serving: "+money(cost/recipe.yieldCount);
      editor.append(total);
      if(!missing.length){const pricing=document.createElement("div");pricing.className="cocktail-pricing";const label=document.createElement("label");label.textContent="Target gross profit margin (%)";const slider=document.createElement("input");slider.type="range";slider.min="10";slider.max="90";slider.step="5";slider.value="50";const result=document.createElement("strong");const hint=document.createElement("p");hint.className="muted";hint.textContent="Suggested selling price only — not published to your customer menu.";const calculate=()=>{const margin=Number(slider.value)/100;const unitCost=cost/recipe.yieldCount;const suggested=unitCost/(1-margin);result.textContent="At "+slider.value+"% margin: sell for "+money(suggested)+" · profit "+money(suggested-unitCost)+" per serving";};slider.addEventListener("input",calculate);calculate();label.append(slider);pricing.append(label,result,hint);editor.append(pricing);}
      box.append(editor);recipesEl.append(box);
    });
  }
  render();
}
