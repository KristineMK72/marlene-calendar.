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
    updateDoc, // Added for updating comments
    getDoc // Added for retrieving event data to update comments
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("add-event-form"); // Updated ID to match index.html
const list = document.getElementById("event-list");
const logoutBtn = document.getElementById("logout-btn");
const loginLink = document.getElementById("login-link"); // Link to Login/Register page

let userId = null; // Stores the logged-in user's ID

// --- 1. Event Submission Logic (SAVE to Firestore) ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!userId) {
      alert("Please log in to add events.");
      return;
  }
  
  const title = document.getElementById("event-title").value;
  const date = document.getElementById("event-date").value;
  const time = document.getElementById("event-time").value; // New time field
  const location = document.getElementById("event-location").value;
  const initialComment = document.getElementById("event-comments").value || "No comments yet."; // New comments field

  const eventData = { 
    userId: userId, 
    title: title, 
    date: date, 
    time: time || '', // Optional time
    location: location || '', 
    comments: initialComment ? [initialComment] : ["No comments yet."], // Array for multiple comments
    createdBy: auth.currentUser.email, // Track who created the event
    timestamp: new Date()
  };
  
  try {
    await addDoc(collection(db, "events"), eventData);
    alert(`Event "${title}" added and saved!`);
    loadAndDisplayEvents(); // Refresh the list with all events
    form.reset();
  } catch (error) {
    console.error("Error saving event: ", error);
    alert("Could not save event to database.");
  }
});

// --- 2. Event Loading and Display Logic (LOAD from Firestore) ---
async function loadAndDisplayEvents() {
  if (!userId) {
    list.innerHTML = "";
    return;
  }
  
  try {
    const dbInstance = db;
    // Query Firestore: get all events (remove where clause to show all authenticated users' events)
    const q = query(collection(dbInstance, "events"));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = "";
    
    if (querySnapshot.empty) {
        list.innerHTML = "<p>No events scheduled. Time for treats!</p>";
        return;
    }

    querySnapshot.forEach((docSnap) => {
        const ev = docSnap.data();
        const li = document.createElement("li");
        li.classList.add('event-item');

        li.innerHTML = `
            <div class="event-summary">
                <strong>${ev.date} ${ev.time ? `- ${ev.time}` : ''} — ${ev.title}</strong>
                <span class="expand-indicator">+</span>
            </div>
            <div class="event-details hidden">
                <p><span class="label">Location:</span> ${ev.location || 'N/A'}</p>
                <p><span class="label">Notes:</span> ${ev.comments && ev.comments.length > 0 ? ev.comments.join(', ') : 'N/A'}</p>
                <p><span class="label">Added by:</span> ${ev.createdBy || 'Unknown'}</p>
                <button class="delete-btn" data-doc-id="${docSnap.id}">Delete</button>
                <button class="add-comment-btn" data-doc-id="${docSnap.id}">Add Comment</button>
            </div>
        `;
        list.appendChild(li);
    });

  } catch (error) {
    console.error("Error loading events:", error);
    alert("Failed to load events from the database.");
  }
}

// --- 3. Click-to-Expand, Delete, and Add Comment Logic ---
list.addEventListener('click', (e) => {
    // 3a. Handle Click-to-Expand
    const summary = e.target.closest('.event-summary');
    if (summary) {
        const details = summary.nextElementSibling;
        const indicator = summary.querySelector('.expand-indicator');
        
        details.classList.toggle('hidden');
        indicator.textContent = details.classList.contains('hidden') ? '+' : '–';
        return; 
    }
    
    // 3b. Handle Delete Button Click
    if (e.target.classList.contains('delete-btn')) {
        const docId = e.target.dataset.docId;
        if (confirm("Are you sure you want to delete this event?")) {
            deleteEvent(docId);
        }
    }

    // 3c. Handle Add Comment Button Click
    if (e.target.classList.contains('add-comment-btn')) {
        const docId = e.target.dataset.docId;
        addComment(docId);
    }
});

// --- 4. Delete Event Function (FIREBASE) ---
async function deleteEvent(docId) {
    try {
        const dbInstance = db;
        await deleteDoc(doc(dbInstance, "events", docId));
        loadAndDisplayEvents(); // Refresh list after deletion
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
                const updatedComments = [...(data.comments || []), newComment];
                await updateDoc(doc(db, "events", docId), { comments: updatedComments });
                loadAndDisplayEvents();
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment.");
        }
    }
}

// --- 6. Authentication Listener (Shows/Hides Content & Redirects) ---
subscribeToAuthChanges((user) => {
    const logoutBtnEl = document.getElementById("logout-btn");
    const loginLinkEl = document.getElementById("login-link");
    const onProtectedPage = window.location.pathname.endsWith("index.html");

    if (user) {
        // USER IS LOGGED IN
        userId = user.uid; 
        loadAndDisplayEvents(); 
        if (logoutBtnEl) logoutBtnEl.style.display = 'block'; 
        if (loginLinkEl) loginLinkEl.style.display = 'none';
    } else {
        // USER IS LOGGED OUT
        userId = null;
        loadAndDisplayEvents(); // Clear all events from the list

        if (logoutBtnEl) logoutBtnEl.style.display = 'none';
        if (loginLinkEl) loginLinkEl.style.display = 'block'; // Show the Log In / Sign Up link
        
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
