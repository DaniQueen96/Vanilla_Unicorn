import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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
let stopTabsListener=null;
let tabCache=[];
let stopPricingCostingListener = null;
let currentCosting = null;
let sharedPrices = {};
const pricingDoc = doc(db,"businessSettings","sellingPrices");
function beginPricingSync(){
 if(stopPricingListener)return;
 stopPricingCostingListener=onSnapshot(doc(db,"ownerSettings","recipeCosting"),snapshot=>{
  if(snapshot.exists()&&snapshot.data()?.recipes?.length){currentCosting=snapshot.data();document.dispatchEvent(new CustomEvent("vu:costing-updated",{detail:currentCosting}));}
 });
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
document.addEventListener("vu:pricing-ready",()=>{
 document.dispatchEvent(new CustomEvent("vu:prices-updated",{detail:sharedPrices}));
 if(currentCosting)document.dispatchEvent(new CustomEvent("vu:costing-updated",{detail:currentCosting}));
});
document.addEventListener("vu:seed-prices",async event=>{
 if(auth.currentUser?.uid!==OWNER_UID)return;
 const values=event.detail;
 if(!values||typeof values!=="object")return;
 const valid=Object.fromEntries(Object.entries(values).filter(([key,value])=>key.startsWith("Cocktails::")&&typeof value==="number"&&Number.isFinite(value)&&value>=0));
 if(!Object.keys(valid).length)return;
 const status=document.getElementById("pricing-status");
 try{
  await setDoc(pricingDoc,{prices:valid},{merge:true});
  if(status)status.textContent="Calculated cocktail prices saved for all devices.";
 }catch(error){if(status)status.textContent="Automatic price saving failed: "+error.message;}
});
document.addEventListener("vu:save-price",async event=>{
 if(auth.currentUser?.uid!==OWNER_UID)return;
 const {key,value}=event.detail||{};
 if(typeof key!=="string"||(!key.includes("::")&&key!=="__defaultMargin"))return;
 const status=document.getElementById("pricing-status");
 if(value!==null&&(!Number.isFinite(value)||value<0)){if(status)status.textContent="Enter a valid price.";return;}
 try{
  await setDoc(pricingDoc,{prices:{[key]:value===null?null:value}}, {merge:true});
  if(status)status.textContent="Price saved for all devices.";
 }catch(error){if(status)status.textContent="Save failed: "+error.message;}
});


const galleryCollection=collection(db,"publicGallery");let galleryStop=null;
document.addEventListener("vu:gallery-ready",()=>{if(!galleryStop)galleryStop=onSnapshot(galleryCollection,s=>document.dispatchEvent(new CustomEvent("vu:gallery-updated",{detail:s.docs.map(d=>({id:d.id,...d.data()}))})),e=>document.dispatchEvent(new CustomEvent("vu:gallery-error",{detail:e.message})));});
document.addEventListener("vu:gallery-save",async e=>{if(auth.currentUser?.uid!==OWNER_UID)return;const {image,caption,category}=e.detail||{};if(typeof image!=="string"||image.length>270000||typeof caption!=="string"||caption.length>90||!["Venue","Events","Entertainment","Drinks & Food","VIP & Parties"].includes(category))return;try{await addDoc(galleryCollection,{image,caption,category,createdAt:serverTimestamp()});document.dispatchEvent(new Event("vu:gallery-saved"));}catch(err){document.dispatchEvent(new CustomEvent("vu:gallery-error",{detail:err.message}));}});
document.addEventListener("vu:gallery-delete",async e=>{if(auth.currentUser?.uid!==OWNER_UID)return;try{await deleteDoc(doc(db,"publicGallery",e.detail));}catch(err){document.dispatchEvent(new CustomEvent("vu:gallery-error",{detail:err.message}));}});
document.addEventListener("vu:gallery-edit",async e=>{if(auth.currentUser?.uid!==OWNER_UID)return;const {id,caption,category}=e.detail||{};if(typeof id!=="string"||typeof caption!=="string"||caption.length>90||!["Venue","Events","Entertainment","Drinks & Food","VIP & Parties"].includes(category))return;try{await setDoc(doc(db,"publicGallery",id),{caption,category},{merge:true});document.dispatchEvent(new CustomEvent("vu:gallery-changed",{detail:"Caption saved."}));}catch(err){document.dispatchEvent(new CustomEvent("vu:gallery-error",{detail:err.message}));}});
document.addEventListener("vu:gallery-reorder",async e=>{if(auth.currentUser?.uid!==OWNER_UID)return;const ids=e.detail;if(!Array.isArray(ids)||ids.length>450||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=="string"||!id))return;try{const batch=writeBatch(db);ids.forEach((id,index)=>batch.update(doc(db,"publicGallery",id),{order:index}));await batch.commit();document.dispatchEvent(new CustomEvent("vu:gallery-changed",{detail:"Photo order saved."}));}catch(err){document.dispatchEvent(new CustomEvent("vu:gallery-error",{detail:err.message}));}});
const vehicleCollection=collection(db,"vuVehicles");
let vehicleStop=null;
document.addEventListener("vu:vehicles-ready",()=>{
 if(vehicleStop)return;
 vehicleStop=onSnapshot(vehicleCollection,s=>document.dispatchEvent(new CustomEvent("vu:vehicles-updated",{detail:s.docs.map(d=>({id:d.id,...d.data()}))})),e=>document.dispatchEvent(new CustomEvent("vu:vehicles-error",{detail:e.message})));
});
document.addEventListener("vu:vehicle-save",async e=>{
 if(auth.currentUser?.uid!==OWNER_UID)return;
 const v=e.detail;const {id,...fields}=v;
 if(!v.name||!["limo","van","other"].includes(v.type)||!Number.isFinite(v.fee)||v.fee<0||!Number.isFinite(v.cost)||v.cost<0||!Number.isFinite(v.purchase)||v.purchase<0||!Number.isInteger(v.capacity)||v.capacity<1||typeof v.photo!=="string"||(v.photo&&!/^https:\/\//i.test(v.photo)&&!/^data:image\/jpeg;base64,/i.test(v.photo))||v.photo.length>260000){document.dispatchEvent(new CustomEvent("vu:vehicles-error",{detail:"Invalid vehicle details or image."}));return;}
 try{
  if(id)await setDoc(doc(db,"vuVehicles",id),fields,{merge:true});
  else await addDoc(vehicleCollection,{...fields,createdAt:serverTimestamp()});
  document.dispatchEvent(new Event("vu:vehicle-saved"));
 }catch(error){document.dispatchEvent(new CustomEvent("vu:vehicles-error",{detail:error.message}))}
});
document.addEventListener("vu:vehicle-delete",async e=>{
 if(auth.currentUser?.uid!==OWNER_UID)return;
 try{await deleteDoc(doc(db,"vuVehicles",e.detail));}
 catch(error){document.dispatchEvent(new CustomEvent("vu:vehicles-error",{detail:error.message}))}
});
const packageImagesDoc=doc(db,"businessSettings","packageImages");let stopPackageImages=null;
function beginPackageImageSync(){if(stopPackageImages)return;stopPackageImages=onSnapshot(packageImagesDoc,s=>document.dispatchEvent(new CustomEvent("vu:package-images-updated",{detail:s.exists()?(s.data().images||{}):{}})),e=>document.dispatchEvent(new CustomEvent("vu:package-image-error",{detail:e.message})))}
document.addEventListener("vu:package-media-ready",beginPackageImageSync);
document.addEventListener("vu:package-image-save",async e=>{if(auth.currentUser?.uid!==OWNER_UID)return;const {key,url}=e.detail||{};if(!key||typeof url!=="string"||(url&&!/^https:\/\//i.test(url)&&!/^data:image\/jpeg;base64,/i.test(url)))return;try{await setDoc(packageImagesDoc,{images:{[key]:url}},{merge:true});document.dispatchEvent(new Event("vu:package-image-saved"))}catch(error){document.dispatchEvent(new CustomEvent("vu:package-image-error",{detail:error.message}))}});
const packageCollection=collection(db,"packagePlans");let packagePlans=[],stopPackagePlans=null;
function beginPackageSync(){if(stopPackagePlans)return;stopPackagePlans=onSnapshot(packageCollection,s=>{packagePlans=s.docs.map(d=>({id:d.id,...d.data()}));document.dispatchEvent(new CustomEvent("vu:packages-updated",{detail:packagePlans}));},error=>document.dispatchEvent(new CustomEvent("vu:package-error",{detail:error.message})))}
document.addEventListener("vu:package-ready",()=>{beginPackageSync();document.dispatchEvent(new CustomEvent("vu:packages-updated",{detail:packagePlans}))});
document.addEventListener("vu:package-save",async e=>{if(auth.currentUser?.uid!==OWNER_UID)return;const {id,fields,items,custom,updatedAt}=e.detail||{};if(!id||!fields)return;try{await setDoc(doc(db,"packagePlans",id),{fields,items,custom,updatedAt},{merge:true});document.dispatchEvent(new Event("vu:package-saved"));}catch(error){document.dispatchEvent(new CustomEvent("vu:package-error",{detail:error.message}))}});
const tabCollection=collection(db,"customerTabs");
const customerCollection=collection(db,"customers");
let customerCache=[];let stopCustomersListener=null;
function beginTabSync(){
 if(!stopCustomersListener)stopCustomersListener=onSnapshot(customerCollection,snapshot=>{customerCache=snapshot.docs.map(d=>({id:d.id,...d.data()}));document.dispatchEvent(new CustomEvent("vu:customers-updated",{detail:customerCache}));},error=>document.dispatchEvent(new CustomEvent("vu:tab-error",{detail:"Unable to load customers: "+error.message})));
 if(stopTabsListener)return;
 stopTabsListener=onSnapshot(tabCollection,snapshot=>{
  tabCache=snapshot.docs.map(d=>({id:d.id,...d.data()}));
  document.dispatchEvent(new CustomEvent("vu:tabs-updated",{detail:tabCache}));
 },error=>document.dispatchEvent(new CustomEvent("vu:tab-error",{detail:"Unable to load customer tabs: "+error.message})));
}
document.addEventListener("vu:tab-ready",()=>{document.dispatchEvent(new CustomEvent("vu:tabs-updated",{detail:tabCache}));document.dispatchEvent(new CustomEvent("vu:customers-updated",{detail:customerCache}));});
document.addEventListener("vu:tab-command",async e=>{
 if(auth.currentUser?.uid!==OWNER_UID)return;
 const {action,id,name,item,items:incomingItems,lineId,customerId}=e.detail||{};
 try{
  if(action==="createCustomer"){
   const clean=typeof name==="string"?name.trim():"";
   if(!clean||clean.length>80)return;
   if(customerCache.some(c=>c.name.toLocaleLowerCase()===clean.toLocaleLowerCase())){document.dispatchEvent(new CustomEvent("vu:tab-error",{detail:"Customer already exists. Select their saved profile instead."}));return;}
   await addDoc(customerCollection,{name:clean,createdAt:new Date().toISOString()});
  }else if(action==="newBill"){
   const customer=customerCache.find(c=>c.id===customerId);if(!customer)return;
   if(tabCache.some(t=>t.customerId===customerId&&t.status!=="paid")){document.dispatchEvent(new CustomEvent("vu:tab-error",{detail:"This customer already has an open bill."}));return;}
   await addDoc(tabCollection,{customerId,name:customer.name,status:"open",items:[],updatedAt:new Date().toISOString(),createdAt:new Date().toISOString()});
  }else if(action==="create"){
   if(typeof name!=="string"||!name.trim()||name.length>80)return;
   await addDoc(tabCollection,{name:name.trim(),status:"open",items:[],updatedAt:new Date().toISOString(),createdAt:new Date().toISOString()});
  }else{
   const current=tabCache.find(t=>t.id===id);if(!current||current.status==="paid")return;
   let items=Array.isArray(current.items)?[...current.items]:[];
   if(action==="add"){
    if(!item||typeof item.name!=="string"||!Number.isInteger(item.quantity)||item.quantity<1||!Number.isFinite(item.price)||item.price<0)return;
    items.push({lineId:Date.now().toString(36)+Math.random().toString(36).slice(2,8),name:item.name.slice(0,100),quantity:item.quantity,price:item.price});
   }else if(action==="addMany"){
    if(!Array.isArray(incomingItems)||!incomingItems.length||incomingItems.length>100)return;
    for(const entry of incomingItems){
     if(typeof entry.name!=="string"||!Number.isInteger(entry.quantity)||entry.quantity<1||!Number.isFinite(entry.price)||entry.price<0)return;
    }
    for(const entry of incomingItems)items.push({lineId:Date.now().toString(36)+Math.random().toString(36).slice(2,8),name:entry.name.slice(0,100),quantity:entry.quantity,price:entry.price});
   }else if(action==="remove"){items=items.filter(i=>i.lineId!==lineId);}
   else if(action!=="settle")return;
   await setDoc(doc(db,"customerTabs",id),{items,status:action==="settle"?"paid":"open",updatedAt:new Date().toISOString(),...(action==="settle"?{paidAt:new Date().toISOString()}: {})},{merge:true});
  }
  document.dispatchEvent(new CustomEvent("vu:tab-success",{detail:"Customer tab saved."}));
 }catch(error){document.dispatchEvent(new CustomEvent("vu:tab-error",{detail:"Tab save failed: "+error.message}));}
});
document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  if (!/^[a-z0-9_-]{3,32}$/.test(username)) { status.textContent="Invalid VU username."; return; }
  status.textContent = "Signing in…";
  try {
    const result = await signInWithEmailAndPassword(auth, username==="vu-owner"?OWNER_EMAIL:username+"@staff.vu", password);

  } catch (error) {
    status.textContent = error.code === "auth/invalid-credential" ? "Incorrect password or account details." : (error.message || "Unable to sign in.");
  }
  document.getElementById("login-password").value = "";
});

logout.addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, async (user) => {
  const owner = user?.uid === OWNER_UID;
  screen.classList.toggle("hidden", !!user);
  document.getElementById("staff-onboarding").classList.add("hidden");
  document.getElementById("staff-portal").classList.add("hidden");
  app.classList.toggle("hidden", !owner);
  logout.classList.toggle("hidden", !owner);
  document.getElementById("signed-in-label").textContent = owner ? "VU Owner" : "Drinks · Events · Bookings";
  if (owner) { beginPricingSync(); beginTabSync(); }
  if (!owner && stopTabsListener) {stopTabsListener();stopTabsListener=null;tabCache=[];}
  if (!owner && stopPricingListener) { stopPricingListener(); stopPricingListener=null; sharedPrices={}; }
  if (!owner && stopPricingCostingListener) { stopPricingCostingListener(); stopPricingCostingListener=null; currentCosting=null; }
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
    script.src = "app.js?v=20261107-gallery7";
    document.body.append(script);
  }
  if(user&&!owner){
    try{
      const snap=await getDoc(doc(db,"staffAccounts",user.uid));
      const staff=snap.exists()?snap.data():null;
      if(!staff||staff.status!=="active"){await signOut(auth);status.textContent="Account not activated. Contact the VU owner.";return;}
      if(auth.currentUser?.uid!==user.uid)return;
      logout.classList.remove("hidden");
      document.getElementById("signed-in-label").textContent=staff.username||"VU Staff";
      if(staff.mustChangePassword)document.getElementById("staff-onboarding").classList.remove("hidden");
      else{
        document.getElementById("staff-portal").classList.remove("hidden");
        document.getElementById("staff-welcome").textContent="Welcome, "+(staff.name||staff.username);
        document.getElementById("staff-portal-permissions").textContent="Assigned sections: "+(staff.access||[]).join(", ");
      }
    }catch(error){await signOut(auth);status.textContent="Staff access verification failed.";}
  }
  if (!owner) status.textContent = "";
}, (error) => {
  status.textContent = "Could not connect to Firebase. Check the Firebase configuration.";
  console.error("Authentication state error:", error);
});

document.getElementById("staff-password-form").addEventListener("submit",async event=>{
 event.preventDefault();
 const password=document.getElementById("staff-new-password").value,confirmPassword=document.getElementById("staff-confirm-password").value,message=document.getElementById("staff-password-message");
 if(password.length<12||password!==confirmPassword){message.textContent="Passwords must match and be at least 12 characters.";return;}
 try{await updatePassword(auth.currentUser,password);await setDoc(doc(db,"staffAccounts",auth.currentUser.uid),{mustChangePassword:false},{merge:true});message.textContent="Password changed. Sign in again.";await signOut(auth);}
 catch(error){message.textContent="Could not update password: "+error.message;}
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
      sub.textContent = employee.username + " · " + (employee.roles || []).join(", ") + " · Access: " + (employee.access || []).join(", ") + " · Profile only (login not activated)";
      details.append(title, sub);
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", async () => {
        if (!confirm("Remove the profile for " + employee.name + "?")) return;
        try { await deleteDoc(doc(db, "staffProfiles", employee.id)); }
        catch (e) { message.textContent = "Could not remove employee: " + e.message; }
      });
      const toggle=document.createElement("button");toggle.type="button";toggle.textContent=employee.status==="active"?"Suspend":"Activate";
      toggle.onclick=async()=>{
        if(!employee.authUid){message.textContent="Link the employee Firebase UID first.";return;}
        const next=employee.status==="active"?"suspended":"active";
        try{
          await setDoc(doc(db,"staffAccounts",employee.authUid),{name:employee.name,username:employee.username,roles:employee.roles||[],access:employee.access||[],status:next,...(employee.status==="pending"?{mustChangePassword:true}:{})},{merge:true});
          await setDoc(doc(db,"staffProfiles",employee.id),{status:next},{merge:true});
        }catch(error){message.textContent=error.message;}
      };
      row.append(details,toggle,remove);list.append(row);
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
    const access = [...form.querySelectorAll('input[name="staff-access"]:checked')].map(e => e.value);
    if (!name || !/^[-_a-zA-Z0-9]{3,32}$/.test(username) || !roles.length || !access.length) {
      message.textContent = "Enter a name, valid username and at least one role and access permission."; return;
    }
    if (username.toLowerCase() === "vu-owner" || employees.some(e => e.username.toLowerCase() === username.toLowerCase())) {
      message.textContent = "That username is already reserved or in use."; return;
    }
    const authUid=document.getElementById("staff-auth-uid").value.trim();
    if(authUid&&!/^[a-zA-Z0-9]{20,128}$/.test(authUid)){message.textContent="Invalid Firebase UID.";return;}
    if(authUid&&employees.some(e=>e.authUid===authUid)){message.textContent="UID already linked.";return;}
    try {
      await addDoc(collection(db, "staffProfiles"), { name, username, roles, access, authUid, status: "pending", createdAt: serverTimestamp() });
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
  // Publish effective recipe costs even when the Firestore costing document has not been created yet.
  // This supplies the order calculator with the same defaults shown in Recipe & Store Costs.
  currentCosting={prices:state.prices,recipes:state.recipes};
  document.dispatchEvent(new CustomEvent("vu:costing-updated",{detail:currentCosting}));
  if(!Object.keys(state.prices).length)status.textContent="Ingredient prices are missing.";

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
  function save(){const snapshot=JSON.parse(JSON.stringify(state));currentCosting=snapshot;document.dispatchEvent(new CustomEvent("vu:costing-updated",{detail:currentCosting}));status.textContent="Saving…";saveChain=saveChain.catch(()=>{}).then(async()=>{try{await setDoc(ref,{...snapshot,updatedAt:serverTimestamp()});status.textContent="Saved to your private owner account.";}catch(e){status.textContent="Save failed: "+e.message;}});return saveChain;}
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
      box.append(editor);recipesEl.append(box);
    });
  }
  render();
}
