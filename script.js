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
    console.log("Query Snapshot: ", querySnapshot.size, "documents");

    list.innerHTML = "";
    
    if (querySnapshot.empty) {
      list.innerHTML = "<p>No events scheduled. Time for treats!</p>";
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const ev = docSnap.data();
      // Robustly handle comments, ensuring it's always an array
      const comments = Array.isArray(ev.comments) 
        ? ev.comments 
        : ev.comments === undefined || ev.comments === null 
          ? ["No comments yet."]
          : [ev.comments.toString() || "No comments yet."];
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
          <button class="add-comment-btn" data-doc-id="${docSnap.id}">Add Comment</button>
        </div>
      `;
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading events:", error.message);
    list.innerHTML = `<p>Failed to load events: ${error.message}. Check Firebase rules or internet connection.</p>`;
  }
}

// --- 3. Click-to-Expand, Delete, and Add Comment Logic ---
list.addEventListener('click', (e) => {
  const summary = e.target.closest('.event-summary');
  if (summary) {
    const details = summary.nextElementSibling;
    const indicator = summary.querySelector('.expand-indicator');
    details.classList.toggle('hidden');
    indicator.textContent = details.classList.contains('hidden') ? '+' : '–';
    return; 
  }
  
  if (e.target.classList.contains('delete-btn')) {
    const docId = e.target.dataset.docId;
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEvent(docId);
    }
  }

  if (e.target.classList.contains('add-comment-btn')) {
    const docId = e.target.dataset.docId;
    addComment(docId);
  }
});

// --- 4. Delete Event Function ---
async function deleteEvent(docId) {
  try {
    await deleteDoc(doc(db, "events", docId));
    loadAndDisplayEvents();
  } catch (error) {
    console.error("Error deleting document:", error);
    alert("Failed to delete event.");
  }
}

// --- 5. Add Comment Function ---
async function addComment(docId) {
  const newComment = prompt('Add a comment:');
  if (newComment) {
    try {
      const eventDoc = await getDoc(doc(db, "events", docId));
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        const updatedComments = [...(Array.isArray(data.comments) 
          ? data.comments 
          : [data.comments || "No comments yet."]), newComment];
        await updateDoc(doc(db, "events", docId), { comments: updatedComments });
        loadAndDisplayEvents();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment.");
    }
  }
}

// --- 6. Authentication Listener ---
subscribeToAuthChanges((user) => {
  const logoutBtnEl = document.getElementById("logout-btn");
  const loginLinkEl = document.getElementById("login-link");
  const onProtectedPage = window.location.pathname.endsWith("index.html");

  if (user) {
    userId = user.uid; 
    console.log("User logged in:", user.email);
    loadAndDisplayEvents(); 
    if (logoutBtnEl) logoutBtnEl.style.display = 'block'; 
    if (loginLinkEl) loginLinkEl.style.display = 'none';
  } else {
    userId = null;
    console.log("User logged out");
    loadAndDisplayEvents();

    if (logoutBtnEl) logoutBtnEl.style.display = 'none';
    if (loginLinkEl) loginLinkEl.style.display = 'block';
    
    if (onProtectedPage) {
      window.location.href = "login.html";
    }
  }
});

// --- 7. Logout Functionality ---
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  });
}
