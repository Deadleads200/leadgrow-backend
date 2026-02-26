$(document).ready(function () {

  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: "/loginhistoryjson",
    columns: [
      { data: "user" },
      { data: "email", render: e => e ? `<small>${e}</small>` : "-" },
      { data: "ip" },
      { data: "location" },
      { data: "browser" },
      { data: "os" },
      { data: "loginAt", render: d => d ? new Date(d).toLocaleString() : "-" }
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    order: [[6, "desc"]], // sort by loginAt
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
