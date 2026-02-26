$(document).ready(function () {
  const modal = new bootstrap.Modal(document.getElementById("categoryModal"));

  // --- DataTable ---
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    responsive: true,
    autoWidth: false,
    ajax: { url: "/getcategoryjson", dataSrc: "data" },
    columns: [
      { data: "title" },
      {
        data: "status",
        render: (data) =>
          data
            ? `<span class="badge bg-success">Enabled</span>`
            : `<span class="badge bg-danger">Disabled</span>`,
        className: "text-center",
      },
      {
        data: null,
        className: "text-center",
        render: (row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <button class="dropdown-item edit-btn" data-id="${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>
              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash me-2 text-danger"></i>Delete
                </button>
              </li>
              <li>
             <button class="dropdown-item status-btn d-flex align-items-center"
                 data-id="${row._id}">
            <i class="fa-regular ${row.status ? "fa-eye-slash" : "fa-eye"} me-2 text-warning"></i>
           <span>${row.status ? "Disable" : "Enable"}</span>
              </button>

              </li>
            </ul>
          </div>`,
      },
    ],
    order: [],
  });

  // --- Add Category ---
  $("#addCategoryBtn").click(() => {
    $("#categoryForm")[0].reset();
    $("#categoryId").val("");
    $("#categoryStatus").prop("checked", true);
    $("#categoryModalLabel").text("Add Category");
    modal.show();
  });


  // --- Submit Form ---
  $("#categoryForm").submit(function (e) {
    e.preventDefault();

    const data = {
      id: $("#categoryId").val(),
      title: $("#title").val(),
      status: $("#categoryStatus").is(":checked") ? "true" : "false"
    };

    $.ajax({
      url: "/savecategory",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: (res) => {
        if (res.success) {
          Swal.fire("Success", res.message, "success");
          modal.hide();
          table.ajax.reload(null, false);
        } else Swal.fire("Error", res.message, "error");
      },
      error: () => Swal.fire("Error", "Something went wrong!", "error"),
    });
  });


  // --- Edit Category ---
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return Swal.fire("Error", "Data not found!", "error");

    $("#categoryId").val(row._id);
    $("#title").val(row.title);
    $("#categoryStatus").prop("checked", row.status);

    $("#categoryModalLabel").text("Edit Category");
    modal.show();
  });

  // --- Delete Category ---
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");
    Swal.fire({
      title: "Delete this Category?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/categorydelete/${id}`,
          type: "DELETE",
          success: (res) => {
            if (res.success) {
              Swal.fire("Deleted!", res.message, "success");
              table.ajax.reload(null, false);
            } else Swal.fire("Error", res.message, "error");
          },
          error: () => Swal.fire("Error", "Failed to delete Category", "error"),
        });
      }
    });
  });

  // --- Toggle Enable/Disable Status ---
  $("#zero_config").on("click", ".status-btn", function () {
    const id = $(this).data("id");
    $.post(`/categorystatus/${id}`, {}, (res) => {
      if (res.success) {
        Swal.fire("Success", res.message, "success");
        table.ajax.reload(null, false);
      } else Swal.fire("Error", res.message, "error");
    });
  });
});
