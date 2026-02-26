$(document).ready(function () {
  const modal = new bootstrap.Modal(document.getElementById("countriesModal"));

  // --- DataTable with server-side pagination ---
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: {
      url: "/getcountriesjson",
      type: "GET"
    },
    columns: [
      { data: "name" },
      {
        data: "status",
        className: "text-center",
        render: (data) =>
          data
            ? `<span class="badge bg-success">Enabled</span>`
            : `<span class="badge bg-danger">Disabled</span>`
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
          </div>
        `
      },
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
  });

  // --- Add Country ---
  $("#addCountryBtn").click(() => {
    $("#countriesForm")[0].reset();
    $("#countryId").val("");
    $("#countryStatus").prop("checked", true);
    $("#countriesModalLabel").text("Add Country");
    modal.show();
  });

  // --- Submit Form ---
  $("#countriesForm").submit(function (e) {
    e.preventDefault();
    const data = {
      id: $("#countryId").val(),
      name: $("#countryTitle").val(),
      status: $("#countryStatus").is(":checked") ? "true" : "false"
    };

    $.ajax({
      url: "/savecountry",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: (res) => {
        if (res.success) {
          Swal.fire("Success", res.message, "success");
          modal.hide();
          table.ajax.reload(null, false);
        } else {
          Swal.fire("Error", res.message, "error");
        }
      },
      error: () => Swal.fire("Error", "Something went wrong!", "error"),
    });
  });

  // --- Edit Country ---
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return Swal.fire("Error", "Data not found!", "error");

    $("#countryId").val(row._id);
    $("#countryTitle").val(row.name);
    $("#countryStatus").prop("checked", row.status);
    $("#countriesModalLabel").text("Edit Country");
    modal.show();
  });

  // --- Delete Country ---
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");
    Swal.fire({
      title: "Delete this Country?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/countrydelete/${id}`,
          type: "DELETE",
          success: (res) => {
            if (res.success) {
              Swal.fire("Deleted!", res.message, "success");
              table.ajax.reload(null, false);
            } else Swal.fire("Error", res.message, "error");
          },
          error: () => Swal.fire("Error", "Failed to delete Country", "error"),
        });
      }
    });
  });

  // --- Toggle Enable/Disable Status ---
  $("#zero_config").on("click", ".status-btn", function () {
    const id = $(this).data("id");
    $.post(`/countrystatus/${id}`, {}, (res) => {
      if (res.success) {
        Swal.fire("Success", res.message, "success");
        table.ajax.reload(null, false);
      } else Swal.fire("Error", res.message, "error");
    });
  });
});
