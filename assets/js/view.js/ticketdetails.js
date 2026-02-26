// CLOSE TICKET
document.querySelectorAll(".update-status").forEach(item => {
  item.addEventListener("click", async (e) => {
    e.preventDefault();

    const ticketId = item.dataset.id;
    const status = item.dataset.status;

    if (!ticketId || !status) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ticket ID or status missing' });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to change the ticket status to "${status}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/ticket/update-status/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: data.message,
          timer: 2000,
          showConfirmButton: false
        });

        // Update status badge dynamically
        const badge = document.querySelector(".badge");
        badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

        // Change badge class based on status
        let badgeClass = "badge rounded-pill me-2 p-2 ";
        if (status === "open") badgeClass += "bg-success-subtle text-success border border-success-subtle";
        if (status === "answered") badgeClass += "bg-primary-subtle text-primary border border-primary-subtle";
        if (status === "closed") badgeClass += "bg-danger-subtle text-danger border border-danger-subtle";

        badge.className = badgeClass;

      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Server error' });
    }
  });
});


// REPLY TO TICKET
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("ticketReplyForm");
  const messagesContainer = document.getElementById("ticketMessages");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        form.reset();
        const msg = data.newMessage;
        const ticketId = data.ticketId;

        const card = document.createElement("div");
        card.classList.add("card", "border-primary", "mb-3");

card.innerHTML = `
  <div class="card-body d-flex justify-content-between">
    <!-- Left side: Message content -->
    <div class="me-3 flex-grow-1">
      <h5 class="fw-bold">${msg.sender?.name || "Unknown"}</h5>
      <p class="text-muted mb-2">Posted on ${new Date(msg.createdAt).toLocaleString()}</p>
      <p>${msg.message}</p>
      ${
        msg.attachments && msg.attachments.length > 0
          ? `<strong>Attachments:</strong><br>${msg.attachments
              .map(
                (a) => `<a href="${a.url}" target="_blank" class="badge bg-info text-dark mb-1 d-inline-block">View Attachment</a>`
              )
              .join('')}`
          : ''
      }
    </div>

    <!-- Right side: Delete button -->
    <div class="d-flex align-items-center border-start ps-3">
      <a href="/ticket/message/delete/${ticketId}/${msg._id}" class="btn btn-danger btn-sm">
        <i class="fas fa-trash me-2"></i>Delete
      </a>
    </div>
  </div>
`;


        messagesContainer.appendChild(card);
        // scroll to bottom after reply
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.message || "Failed to submit reply." });
      }
    } catch (err) {
      console.error("Reply AJAX Error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Server error while submitting reply." });
    }
  });

  // DELETE MESSAGE
  messagesContainer.addEventListener("click", async function (e) {
    const btn = e.target.closest(".btn-danger");
    if (!btn) return;
    e.preventDefault();

Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the message permanently.",
      icon: 'warning',  
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (!result.isConfirmed) return;

    const url = btn.getAttribute("href");

    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        btn.closest(".card").remove();
      } else {
        alert(data.message || "Failed to delete message.");
      }
    } catch (err) {
      console.error("Delete message error:", err);
      alert("Something went wrong while deleting the message.");
    }
  });
});


});