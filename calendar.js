import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "marlene-calendar-e9146.firebaseapp.com",
    projectId: "marlene-calendar-e9146",
    storageBucket: "marlene-calendar-e9146.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: await fetchEvents(db),
    eventClick: showEventDetails
  });

  calendar.render();

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

    calendar.addEvent({ title, start: date, extendedProps: { time, comments } });
    e.target.reset();
  });
});

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

function showEventDetails(info) {
  const modal = document.getElementById("eventModal");
  const { title, extendedProps } = info.event;

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalTime").textContent = extendedProps.time || "No time set";
  document.getElementById("modalComments").textContent = extendedProps.comments || "No comments";
  modal.style.display = "block";
}
