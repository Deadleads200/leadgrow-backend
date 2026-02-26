$(document).ready(function () {
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    processing: true,
    searching: false,
    responsive: true,
    autoWidth: false,

    ajax: {
      url: `/loginhistoryjson/${USER_ID}`, // USER_ID must be defined in template
      type: "GET"
    },

    columns: [
      {
        data: "loginAt",
        render: function(d, type, row) {
          return `${row.loginAtFormatted}<br><small class="text-muted">${row.timeAgo}</small>`;
        }
      },
      { data: "ip" },
      { data: "location" },
      { data: "browser" },
      { data: "os" }
    ],

    order: [[0, "desc"]],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],

    // language: {
    //   searchPlaceholder: ""
    // }
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
