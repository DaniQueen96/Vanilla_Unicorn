import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
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
const auth = getAuth(initializeApp(firebaseConfig));
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
