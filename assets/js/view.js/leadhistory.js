$(document).ready(function () {

  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    autoWidth: false, 
    ajax: "/leadhistoryjson",
    columns: [

      // User
      {
        data: "user",
        render: u => u ? `${u}` : "-"
      },

      // Category
      {
        data: "category",
        render: c => c ? c : "-"
      },

      // Country
      {
        data: "country",
        render: c => c ? c : "-"
      },
      {
        data: "state",
        render: c => c ? c : "-"
      },

      // Location
      {
        data: "NumberOfData",
        render: d => d ? d : "-"
      },
      {
        data: "downloadType",
        render: d => d ? d : "-"
      },
      // Created At
      {
        data: "createdAt",
        render: d => d ? new Date(d).toLocaleString() : "-"
      },

      // Action Dropdown
      {
        data: "_id",
        className: "text-center",
        render: (id,type,row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
          ${
            row.generatedFilePath 
            ? `<a href="${row.generatedFilePath}" class="dropdown-item" download>
                 <i class="fa-solid fa-download text-info me-2"></i>Download
               </a>` 
            : "-"
          }
        </li>
            </ul>
          </div>
        `
      }

    ],

    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    order: [[5, "desc"]],
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
