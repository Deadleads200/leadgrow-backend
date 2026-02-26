$(document).ready(function () {
  const modal = new bootstrap.Modal(document.getElementById("stateModal"));

  // --- Load countries into dropdown ---
  function loadCountries(selectedId) {
    $.get("/getcountries", (res) => {
      if (res.success) {
        let options = '<option selected disabled>Select Country</option>';
        res.data.forEach(c => {
          options += `<option value="${c._id}" ${selectedId == c._id ? 'selected' : ''}>${c.name}</option>`;
        });
        $("#countrySelect").html(options);
      }
    });
  }
  // --- Destroy table if already initialized ---
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  // --- DataTable ---
  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,  
    autoWidth: false, 
    ajax: "/getstatesjson",
    columns: [
      { data: "country" },
      { data: "name" },
      {
        data: "status",
        render: (data) =>
          data
            ? '<span class="badge bg-success">Enabled</span>'
            : '<span class="badge bg-danger">Disabled</span>',
        className: "text-center"
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
          </div>`
      }
    ],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50]
  });

  // --- Add State ---
  $("#addStateBtn").click(() => {
    $("#stateForm")[0].reset();
    $("#stateId").val("");
    $("#stateStatus").prop("checked", true);
    $("#stateModalLabel").text("Add State");
    loadCountries();
    modal.show();
  });

  // --- Submit Form ---
  $("#stateForm").submit(function (e) {
    e.preventDefault();
    const data = {
      id: $("#stateId").val(),
      name: $("#stateTitle").val(),
      country: $("#countrySelect").val(),
      status: $("#stateStatus").is(":checked") ? "true" : "false"
    };
    $.ajax({
      url: "/savestate",
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
      error: () => Swal.fire("Error", "Something went wrong!", "error")
    });
  });

  // --- Edit State ---
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return Swal.fire("Error", "Data not found!", "error");

    $("#stateId").val(row._id);
    $("#stateTitle").val(row.name);
    $("#stateStatus").prop("checked", row.status);
    loadCountries(row.countryId); // Set selected country
    $("#stateModalLabel").text("Edit State");
    modal.show();
  });

  // --- Delete State ---
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");
    Swal.fire({
      title: "Delete this state?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/statedelete/${id}`,
          type: "DELETE",
          success: (res) => {
            if (res.success) {
              Swal.fire("Deleted!", res.message, "success");
              table.ajax.reload(null, false);
            } else Swal.fire("Error", res.message, "error");
          },
          error: () => Swal.fire("Error", "Failed to delete state", "error")
        });
      }
    });
  });

  // --- Toggle Status ---
  $("#zero_config").on("click", ".status-btn", function () {
    const id = $(this).data("id");
    $.post(`/statestatus/${id}`, {}, (res) => {
      if (res.success) {
        Swal.fire("Success", res.message, "success");
        table.ajax.reload(null, false);
      } else Swal.fire("Error", res.message, "error");
    });
  });
});
