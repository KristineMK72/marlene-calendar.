// script.js - Updated Logic with Full Functionality

// Import authentication and database accessors
import { 
    subscribeToAuthChanges, 
    logoutUser, 
    auth, 
    db 
} from "./auth.js"; 

// Import necessary Firestore functions 
import { 
    collection, 
    addDoc, 
    query, 
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("add-event-form");
const list = document.getElementById("event-list");
const logoutBtn = document.getElementById("logout-btn");
const loginLink = document.getElementById("login-link");

let userId = null;

// --- 1. Event Submission Logic (SAVE to Firestore) ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth.currentUser) {
      alert("Please log in to add events.");
      return;
  }
  
  const title = document.getElementById("event-title").value;
  const date = document.getElementById("event-date").value;
  const time = document.getElementById("event-time").value;
  const location = document.getElementById("event-location").value;
  const initialComment = document.getElementById("event-comments").value || "No comments yet.";

  const eventData = { 
    userId: auth.currentUser.uid, 
    title: title, 
    date: date, 
    time: time || '', 
    location: location || '', 
    comments: initialComment ? [initialComment] : ["No comments yet."], 
    createdBy: auth.currentUser.email,
    timestamp: new Date()
  };
  
  try {
    const docRef = await addDoc(collection(db, "events"), eventData);
    console.log("Event added with ID: ", docRef.id);
    alert(`Event "${title}" added and saved!`);
    loadAndDisplayEvents();
    form.reset();
  } catch (error) {
    console.error("Error saving event: ", error);
    alert("Could not save event to database. Check console for details.");
  }
});

// --- 2. Event Loading and Display Logic (LOAD from Firestore) ---
async function loadAndDisplayEvents() {
  if (!auth.currentUser) {
    list.innerHTML = "<p>Please log in to view events.</p>";
    return;
  }
  
  try {
    console.log("Attempting to load events...");
    const q = query(collection(db, "events")); // Fetch all events
    const querySnapshot = await getDocs(q);
    console.log("Query Snapshot: ", querySnapshot);

    list.innerHTML = "";
    
    if (querySnapshot.empty) {
      list.innerHTML = "<p>No events scheduled. Time for treats!</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const ev = docSnap.data();
      // Ensure comments is an array, converting string or null to array if needed
      const comments = Array.isArray(ev.comments) ? ev.comments : [ev.comments || "No comments yet."];
      const li = document.createElement("li");
      li.classList.add('event-item');

      li.innerHTML = `
        <div class="event-summary">
          <strong>${ev.date} ${ev.time ? `- ${ev.time}` : ''} — ${ev.title}</strong>
          <span class="expand-indicator">+</span>
        </div>
        <div class="event-details hidden">
          <p><span class="label">Location:</span> ${ev.location || 'N/A'}</p>
          <p><span class="label">Notes:</span> ${comments.length > 0 ? comments.join(', ') : 'N/A'}</p>
          <p><span class="label">Added by:</span> ${ev.createdBy || 'Unknown'}</p>
          <button class="delete-btn" data-doc-id="${docSnap.id}">Delete</button>
          <button class="add-comment-btn" data-doc-id="${docSnap.id}">Add Comment
