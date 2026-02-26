$(document).ready(function () {

  // Destroy existing table if exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,  
    autoWidth: false, 
    ajax: "/subscriptionhistoryjson", // backend route
      columns: [
      { data: "plan" },

      {
        data: "user",
        render: u =>
          u
            ? `${u.firstName ?? ""} ${u.lastName ?? ""}<br>
               <small class="text-muted">${u.email ?? ""}</small>`
            : "-"
      },

      {
        data: "billingType",
        render: b => `<span class="badge bg-info">${b}</span>`
      },

      {
        data: "endDate",
        render: d => d ? new Date(d).toLocaleDateString() : "-"
      },

      {
        data: "status",
        className: "text-center",
        render: s =>
          s === "active"
            ? `<span class="badge bg-success">Active</span>`
            : `<span class="badge bg-secondary">Expired</span>`
      },

      {
        data: "createdAt",
        render: d => d ? new Date(d).toLocaleString() : "-"
      }
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    order: [], // sort by purchasedAt
  });
  
  // -----------------------------
  // FIXED REFRESH BUTTON
  // -----------------------------
  setTimeout(() => {
    const searchContainer = $("#zero_config_filter");
    if (searchContainer.length && !$("#refreshTableBtn").length) {
      searchContainer.addClass("d-flex justify-content-end gap-2").append(`
        <button id="refreshTableBtn" class="btn btn-sm btn-outline-secondary ms-2" title="Refresh Table">
          <i class="fa fa-rotate"></i>
        </button>
      `);
    }
  }, 300);

  // Refresh table on button click
  $(document).on("click", "#refreshTableBtn", function () {
    table.ajax.reload(null, false); // reload without resetting pagination
  });
});
