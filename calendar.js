import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 🔧 Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAQPGLsHeBe4V5drTqgNmXQtcNGR8t1P-c",
    authDomain: "marlene-calendar-e9146.firebaseapp.com",
    projectId: "marlene-calendar-e9146",
    storageBucket: "marlene-calendar-e9146.firebasestorage.app",
    messagingSenderId: "532816579589",
    appId: "1:532816579589:web:a6eec356844a6d45c9206c"
  };

  // 🔌 Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // 📅 Initialize FullCalendar
  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: await fetchEvents(db),
    eventClick: showEventDetails
  });
  calendar.render();

  // 📝 Handle event form submission
  document.getElementById("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const comments = document.getElementById("comments").value;

    await addDoc(collection(db, "events"), {
      title,
      start: date,
      time,
      comments
    });

    calendar.addEvent({
      title,
      start: date,
      extendedProps: { time, comments }
    });

    e.target.reset();
  });

  // ❌ Close modal on button click
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("eventModal").style.display = "none";
  });
});

// 🔄 Fetch events from Firestore
async function fetchEvents(db) {
  const snapshot = await getDocs(collection(db, "events"));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      title: data.title,
      start: data.start,
      extendedProps: {
        time: data.time,
        comments: data.comments
      }
    };
  });
}

// 🔍 Show event details in modal
function showEventDetails(info) {
  const modal = document.getElementById("eventModal");
  const { title, extendedProps } = info.event;

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalTime").textContent = extendedProps.time || "No time set";
  document.getElementById("modalComments").textContent = extendedProps.comments || "No comments";

  modal.style.display = "block";
}
