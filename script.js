// script.js - Final Logic with Full Functionality

// Import authentication and database accessors
import { 
    subscribeToAuthChanges, 
    logoutUser, // CRITICAL: Imported function for sign out
    auth, // For accessing the Firebase app instance
    db // For accessing the Firestore instance
} from "./auth.js"; 

// Import necessary Firestore functions 
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const form = document.getElementById("event-form");
const list = document.getElementById("event-list");
const logoutBtn = document.getElementById("logout-btn");
const loginLink = document.getElementById("login-link"); // Link to Login/Register page

let userId = null; // Stores the logged-in user's ID

// Helper function to get the database instance
function getDb() {
    // This is technically unnecessary now that 'db' is exported, but it's safe.
    return db;
}


// --- 1. Event Submission Logic (SAVE to Firestore) ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!userId) {
      alert("Please log in to add events.");
      return;
  }
  
  const title = document.getElementById("event-title").value;
  const date = document.getElementById("event-date").value;
  const location = document.getElementById("event-location").value;

  const eventData = { 
    userId: userId, 
    title: title, 
    date: date, 
    location: location, 
    comments: "No comments yet.",
    timestamp: new Date()
  };
  
  try {
    await addDoc(collection(getDb(), "events"), eventData);
    alert(`Event "${title}" added and saved!`);
    loadAndDisplayEvents(userId); // Refresh the list
    form.reset();
  } catch (error) {
    console.error("Error saving event: ", error);
    alert("Could not save event to database.");
  }
});


// --- 2. Event Loading and Display Logic (LOAD from Firestore) ---
async function loadAndDisplayEvents(uid) {
  if (!uid) {
    list.innerHTML = "";
    return;
  }
  
  try {
    const dbInstance = getDb();
    // Query Firestore: get all events where userId matches the current user's ID
    const q = query(collection(dbInstance, "events"), where("userId", "==", uid));
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
                <strong>${ev.date} — ${ev.title}</strong>
                <span class="expand-indicator">+</span>
            </div>
            <div class="event-details hidden">
                <p><span class="label">Location:</span> ${ev.location || 'N/A'}</p>
                <p><span class="label">Notes:</span> ${ev.comments}</p>
                <button class="delete-btn" data-doc-id="${docSnap.id}">Delete</button>
            </div>
        `;
        list.appendChild(li);
    });

  } catch (error) {
    console.error("Error loading events:", error);
    alert("Failed to load events from the database.");
  }
}


// --- 3. Click-to-Expand and Delete Logic ---
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
});

// --- 4. Delete Event Function (FIREBASE) ---
async function deleteEvent(docId) {
    try {
        const dbInstance = getDb();
        await deleteDoc(doc(dbInstance, "events", docId));
        loadAndDisplayEvents(userId); // Refresh list after deletion
    } catch (error) {
        console.error("Error deleting document:", error);
        alert("Failed to delete event.");
    }
}


// --- 5. Authentication Listener (Shows/Hides Content & Redirects) ---
subscribeToAuthChanges((user) => {
    // Get the navigation links
    const logoutBtnEl = document.getElementById("logout-btn");
    const loginLinkEl = document.getElementById("login-link");
    const onProtectedPage = window.location.pathname.endsWith("index.html");

    if (user) {
        // USER IS LOGGED IN
        userId = user.uid; 
        loadAndDisplayEvents(userId); 
        if (logoutBtnEl) logoutBtnEl.style.display = 'block'; 
        if (loginLinkEl) loginLinkEl.style.display = 'none';
        
    } else {
        // USER IS LOGGED OUT
        userId = null;
        loadAndDisplayEvents(null); // Clear all events from the list

        if (logoutBtnEl) logoutBtnEl.style.display = 'none';
        if (loginLinkEl) loginLinkEl.style.display = 'block'; // Show the Log In / Sign Up link
        
        // Final Navigation Check: If the user is on the calendar page, redirect them.
        if (onProtectedPage) {
             window.location.href = "login.html";
        }
    }
});


// --- 6. Logout Functionality (Attached to the button click) ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await logoutUser();
            // The subscribeToAuthChanges listener handles UI updates and redirection after successful logout.
        } catch (error) {
            console.error("Error logging out:", error);
            alert("Failed to log out. Please try again.");
        }
    });
}
