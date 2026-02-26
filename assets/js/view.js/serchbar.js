document.addEventListener("DOMContentLoaded", function () {
  const pages = [
    { title: "Dashboard", path: "/" },
    { title: "Active Users", path: "/activeusers" },
    { title: "All Users", path: "/allusers" },
    { title: "Banned Users", path: "/bannedusers" },
    { title: "Initiated Payment", path: "/pendingpayment" },
    { title: "SuccessFul Payment", path: "/successfulpayment" },
    { title: "Rejected Payment", path: "/rejectedpayment" },
    { title: "All Payment", path: "/paymenthistory" },
    { title: "Open Tickets", path: "/pendingtickets" },
    { title: "Closed Tickets", path: "/closedtickets" },
    { title: "Answered Tickets", path: "/answeredtickets" },
    { title: "All Tickets", path: "/alltickets" },
    { title: "Subscription History", path: "/subscriptionhistory" },
    { title: "Lead History", path: "/leadhistory" },
    { title: "Login History", path: "/loginhistory" },
    { title: "See All Notification", path: "/notificationhistory" },
    { title: "Manage Brand", path: "/addbrand" },
    { title: "Subscription Plans", path: "/pricingplan" },
    { title: "Manage Faq", path: "/faq" },
    { title: "Manage Reviews", path: "/reviews" },
    { title: "Manage Blogs", path: "/blogs" },
    { title: "Setting", path: "/contact" },
    { title: "Categories", path: "/category" },
    { title: "Countries", path: "/countries" },
    { title: "Send Notification", path: "/sendnotification" },
    { title: "Inquiry", path: "/contactus" },
    { title: "Email Subscriber", path: "/newsletter" },
    { title: "Profile", path: "/profile" },
    { title: "Import Lead Data", path: "/uploadleads" },
    { title: "Manage Hero Section", path: "/herosection" },
    { title: "Manage Growing", path: "/growing" },
    { title: "Manage Login Section", path: "/loginsection" },
    { title: "Manage How it work", path: "/growingworking" },
    { title: "Manage Features", path: "/growingtool" },
    { title: "Payment Gateway", path: "/paymentgateway" },
    { title: "Seo Setting", path: "/seo" },
    { title: "Email Templeat", path: "/emailtemplates" },
    { title: "Lead Setting", path: "/getleadsetting" },
    { title: "State", path: "/state" },

    




  ];

  const searchInput = document.getElementById("searchInput");
  const searchList = document.getElementById("searchList");
  const noResults = document.getElementById("noResults");

  // Render list
  function renderList(items) {
    searchList.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "p-2 mb-2 bg-hover-light-black rounded";
      li.innerHTML = `
        <a href="${item.path}" class="d-block text-decoration-none">
          <span class="fw-semibold">${item.title}</span><br>
          <span class="text-muted small">${item.path}</span>
        </a>`;
      searchList.appendChild(li);
    });

    noResults.style.display = items.length ? "none" : "block";
  }

  // Initial render
  renderList(pages);

  // Search (ONLY static pages)
  let debounceTimer;
  searchInput.addEventListener("keyup", function () {
    clearTimeout(debounceTimer);
    const query = this.value.toLowerCase().trim();

    debounceTimer = setTimeout(() => {
      if (!query) {
        renderList(pages);
        return;
      }

      const matches = pages.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.path.toLowerCase().includes(query)
      );

      renderList(matches);
    }, 300);
  });

  // Enter → open first result
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const first = searchList.querySelector("a");
      if (first) window.location.href = first.href;
    }
  });
});

