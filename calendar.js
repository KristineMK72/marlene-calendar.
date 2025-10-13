import { subscribeToAuthChanges, logoutUser, auth, db } from "./auth.js";
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

const calendarEl = document.getElementById("calendar");
const logoutBtn = document.getElementById("logout-btn");

let userId = null;

// Initialize FullCalendar
const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  events: [], // Will be populated dynamically
  dateClick: function(info) {
    if (userId) {
      const title = prompt("Enter event title:");
      if (title) {
        addEvent(title, info.dateStr);
      }
    } else {
      alert("Please log in to add events.");
    }
  },
  eventClick: function(info) {
    const comments = info.event.extendedProps.comments || ["No comments yet."];
    alert(`Comments for "${info.event.title}":\n${comments.join("\n")}`);
  }
});
calendar.render();

async function addEvent(title, date) {
  try {
    const eventData = { 
      userId: auth.currentUser.uid, 
      title: title, 
      date: date, 
      time: '', 
      location: '', 
      comments: ["No comments yet."], 
      createdBy: auth.currentUser.email,
      timestamp: new Date()
    };
    const docRef = await addDoc(collection(db, "events"), eventData);
    console.log("Event added with ID: ", docRef.id);
    loadEvents();
  } catch (error) {
    console.error("Error adding event: ", error);
    alert("Could not save event to database.");
  }
}

async function loadEvents() {
  try {
    const q = query(collection(db, "events"));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({
      title: doc.data().title,
      start: doc.data().date,
      extendedProps: { id: doc.id, comments: doc.data().comments }
    }));
    calendar.removeAllEvents();
    calendar.addEventSource(events);
  } catch (error) {
    console.error("Error loading events:", error.message);
    calendarEl.innerHTML = `<p>Failed to load events: ${error.message}</p>`;
  }
}

async function deleteEvent(eventId) {
  try {
    await deleteDoc(doc(db, "events", eventId));
    loadEvents();
  } catch (error) {
    console.error("Error deleting event:", error);
    alert("Failed to delete event.");
  }
}

// Keep the deletion logic but add comment display option
calendarEl.addEventListener('click', (e) => {
  if (e.target.classList.contains('fc-event-title')) {
    const event = e.target.closest('.fc-event');
    const eventId = event.getAttribute('data-event-id');
    if (eventId) {
      if (confirm("Delete this event?")) {
        deleteEvent(eventId);
      } else {
        // Option to view comments instead of deleting
        const eventData = calendar.getEventById(eventId);
        const comments = eventData.extendedProps.comments || ["No comments yet."];
        alert(`Comments for "${eventData.title}":\n${comments.join("\n")}`);
      }
    }
  }
});

subscribeToAuthChanges((user) => {
  const logoutBtnEl = document.getElementById("logout-btn");
  if (user) {
    userId = user.uid;
    console.log("User logged in:", user.email);
    loadEvents();
    if (logoutBtnEl) logoutBtnEl.style.display = 'block';
  } else {
    userId = null;
    console.log("User logged out");
    if (logoutBtnEl) logoutBtnEl.style.display = 'none';
    window.location.href = "index.html"; // Redirect to login on logout
  }
});

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
