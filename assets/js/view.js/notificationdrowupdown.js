async function loadNotifications() {
  const res = await fetch("/latestnotification");
  const data = await res.json();

  const list = document.getElementById("notificationList");
  const notifyDot = document.getElementById("notifyDot");
  const newCount = document.getElementById("newCount");

  list.innerHTML = "";

  // Show unread count
  if (data.unreadCount > 0) {
    notifyDot.style.display = "block";
    newCount.innerText = `${data.unreadCount} new`;
  } else {
    notifyDot.style.display = "none";
    newCount.innerText = "0 new";
  }

  data.notifications.forEach(n => {
    list.innerHTML += `
      <a href="/readnotification/${n._id}" 
         class="py-3 px-7 d-block d-flex align-items-center gap-3 border-bottom text-dark text-decoration-none">
        <div>
          <h6 class="fw-semibold mb-1">${n.subject}</h6>
          <p class="mb-0 small">${n.message}</p>
        </div>
        ${n.isRead ? "" : `<span class="badge bg-primary rounded-circle p-1 ms-auto"></span>`}
      </a>
    `;
  });
}

// Page load → Auto load notifications
document.addEventListener("DOMContentLoaded", loadNotifications);


