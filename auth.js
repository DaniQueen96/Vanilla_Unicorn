import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
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
let staffInitialized = false;
let eventsInitialized = false;
let stopEventsListener = null;
const screen = document.getElementById("auth-screen");
const app = document.getElementById("protected-app");
const logout = document.getElementById("logout-button");
const status = document.getElementById("login-message");
let appLoaded = false;

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
    script.src = "app.js";
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
