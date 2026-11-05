import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,signInAnonymously} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,onSnapshot,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const app=initializeApp({apiKey:"AIzaSyBGCbNm6DFrHhqeUOy6DtPVaLziFt33JNw",authDomain:"vanilla-unicorn-e415a.firebaseapp.com",projectId:"vanilla-unicorn-e415a",appId:"1:1075155939608:web:f118f9b96382028e8fae6d"});
const auth=getAuth(app),db=getFirestore(app),list=document.getElementById("public-events"),error=document.getElementById("public-error");
try {
 await signInAnonymously(auth);
 onSnapshot(collection(db,"publicEvents"),snap=>{
  list.replaceChildren();
  const events=snap.docs.map(d=>({id:d.id,...d.data()})).filter(e=>e.end>new Date().toISOString().slice(0,16)).sort((a,b)=>a.start.localeCompare(b.start));
  if(!events.length){list.textContent="No upcoming events have been announced yet.";return;}
  for(const e of events){
   const card=document.createElement("article");card.className="event-card";
   const title=document.createElement("h3");title.textContent=e.title;
   const time=document.createElement("p");time.textContent=e.start.replace("T"," ")+" – "+e.end.replace("T"," ");
   const description=document.createElement("p");description.textContent=e.description||"";
   const roles=document.createElement("p");roles.textContent="Performers welcome: "+(e.roles||"Enquiries welcome");
   const form=document.createElement("form");form.className="interest-form";
   const name=document.createElement("input");name.placeholder="Your in-city name";name.required=true;name.maxLength=60;
   const contact=document.createElement("input");contact.placeholder="Discord username (for contact)";contact.required=true;contact.maxLength=60;
   const role=document.createElement("select");for(const v of ["Dancer","DJ","Driver","Other"]){const o=new Option(v,v);role.add(o);}
   const button=document.createElement("button");button.textContent="Register interest";button.type="submit";
   const result=document.createElement("p");result.setAttribute("role","status");
   form.append(name,contact,role,button,result);
   form.onsubmit=async ev=>{
    ev.preventDefault();button.disabled=true;result.textContent="Submitting…";
    try {await addDoc(collection(db,"eventInterest"),{eventId:e.id,name:name.value.trim(),contact:contact.value.trim(),role:role.value,createdAt:serverTimestamp()});result.textContent="Interest registered. VU will contact you if needed.";form.reset();}
    catch(err){result.textContent="Could not register interest. Please try again.";button.disabled=false;}
   };
   card.append(title,time,description,roles,form);list.append(card);
  }
 },err=>{list.textContent="Events are not available yet. Firebase security rules may need updating.";console.error(err);});
}catch(err){list.textContent="Event sign-up is not enabled yet. Please contact VU management.";console.error(err);}
