$(document).ready(function () {
  // Destroy table if it exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  // Initialize DataTable
  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,  
    autoWidth: false, 

    ajax: "/getuserjson",
    columns: [
      { data: "firstName" },
      { data: "email" },
      { data: "country" },
      { data: "ip" },
     {
  data: null,
  className: "text-center",
  render: function (data, type, row) {
    if (!row.status) {
      return '<span class="badge bg-danger">Banned</span>';
    }

    if (row.status && !row.emailVerified) {
      return '<span class="badge bg-warning text-dark">Unverified</span>';
    }

    return '<span class="badge bg-success">Active</span>';
  }
},
{
  data: "_id",
  className: "text-center",
  orderable: false,
  searchable: false,
  render: function (id, type, row) {

    // id itself is USER ID here
    const userId = id;

    return `
      <div class="dropdown dropstart">
        <button 
          class="btn btn-sm btn-light rounded-circle" 
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>

        <ul class="dropdown-menu dropdown-menu-end shadow">
          <li>
            <a href="/userdetails/${userId}" class="dropdown-item">
              <i class="fa-solid fa-eye text-info me-2"></i> Details
            </a>
          </li>

          <li>
            <a href="/loginhistory/${userId}" class="dropdown-item">
              <i class="fa-solid fa-clock-rotate-left text-primary me-2"></i> Login History
            </a>
          </li>
               <li>
                  <a href="javascript:void(0)"
                     class="dropdown-item text-danger delete-btn"
                     data-id="${userId}">
                    <i class="fa-solid fa-trash me-2"></i> Delete
                  </a>
                </li>
        </ul>
      </div>
    `;
  }
}

    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
  });

  // Add refresh button manually next to search input
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



 $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");

    Swal.fire({
      title: "Delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/userdelete/${id}`,
          type: "DELETE",
          success: res => {
            if (res.success) {
              Swal.fire("Deleted!", res.message, "success");
              table.ajax.reload(null, false);
            } else {
              Swal.fire("Error", res.message, "error");
            }
          },
          error: () => {
            Swal.fire("Error", "Failed to delete user", "error");
          }
        });
      }
    });
  });

  // --- Details ---
  $("#zero_config").on("click", ".details-btn", function () {
    const id = $(this).data("id");
    // open details modal or show info
    console.log("Show details for user", id);
  });
});
