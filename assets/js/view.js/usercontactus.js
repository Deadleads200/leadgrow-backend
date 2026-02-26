$(document).ready(function () {

  // Destroy if already exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: "/contactusjson",
    columns: [
      { data: "name" },
      { data: "email" },
      { data: "subject" },
      { data: "message" },
      {
        data: null,
        className: "text-center",
        render: row => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
              
              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash text-danger me-2"></i>Delete
                </button>
              </li>

            </ul>
          </div>
        `
      }
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
  });

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


  // DELETE ACTION
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");

    Swal.fire({
      title: "Delete this contact?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/contactusdelete/${id}`,
          type: "DELETE",
          success: (res) => {
            if (res.success) {
              Swal.fire("Deleted!", res.message, "success");
              table.ajax.reload(null, false);
            } else {
              Swal.fire("Error", res.message, "error");
            }
          },
          error: () => Swal.fire("Error", "Failed to delete", "error")
        });
      }
    });
  });

});
