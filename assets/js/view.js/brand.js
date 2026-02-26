$(document).ready(function () {

  const modal = new bootstrap.Modal(document.getElementById("brandModal"));

  // Reset table if exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  const table = $("#zero_config").DataTable({
    responsive: true,
    autoWidth: false,
    searching: false,
    ajax: { url: "/brandgetjson", dataSrc: "data" },
    columns: [
      {
        data: "image",
        render: (img) =>
          img
            ? `<img src="${img}" width="auto" height="60" class="rounded border">`
            : `<span class="text-muted">No Image</span>`
      },
      {
        data: null,
        className: "text-center",
        render: (row) => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
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
                  <i class="fa-solid fa-trash me-2 text-danger"></i> delete
                </button>
              </li>
            </ul>
          </div>`
      }
    ],
     order: [], 
  });

  // ========== ADD BRAND BUTTON ==========
  $("#addBrandBtn").click(() => {
    $("#brandForm")[0].reset();
    $("#brandId").val("");
    $("#previewBrandImage").attr("src", "").hide(); // CLEAR OLD IMAGE
    $("#brandModalLabel").text("Add Brand");
    modal.show();
  });

  // ========== IMAGE PREVIEW ==========
  $("#brandImage").change(function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) =>
        $("#previewBrandImage").attr("src", e.target.result).show();
      reader.readAsDataURL(file);
    } else {
      $("#previewBrandImage").attr("src", "").hide();
    }
  });

  // ========== SUBMIT FORM ==========
  $("#brandForm").submit(function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const id = $("#brandId").val();
    if (id) formData.append("id", id);
 
    $.ajax({
      url: "/brandsave",
      type: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: (res) => {
        if (res.success) {
          Swal.fire("Success", res.message, "success");
          modal.hide();
          $("#brandForm")[0].reset();  
          $("#previewBrandImage").hide();  
          table.ajax.reload(null, false);
        } else {
          Swal.fire("Error", res.message, "error");
        }
      },
  error: (xhr) => {
    // backend ka JSON parse karo
    const res = xhr.responseJSON;
    const msg = res?.message || "Something went wrong!";
    Swal.fire("Error", msg, "error");
  },
    });



  });

  // ========== EDIT BRAND ==========
  $("#zero_config").on("click", ".edit-btn", function () {
    const row = table.row($(this).closest("tr")).data();
    if (!row) return Swal.fire("Error", "Data not found", "error");

    $("#brandForm")[0].reset();
    $("#previewBrandImage").hide();

    $("#brandId").val(row._id);

    if (row.image) {
      $("#previewBrandImage").attr("src", row.image).show();
    }

    $("#brandModalLabel").text("Edit Brand");
    modal.show();
  });

  // ========== DELETE BRAND ==========
  $("#zero_config").on("click", ".delete-btn", function () {
    const id = $(this).data("id");

    Swal.fire({
      title: "Disable this Brand?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/deletebrand/${id}`,
          type: "DELETE",
          success: (res) => {
            if (res.success) {
              Swal.fire("Done!", res.message, "success");
              table.ajax.reload(null, false);
            } else Swal.fire("Error", res.message, "error");
          },
          error: () => Swal.fire("Error", "Failed to delete", "error"),
        });
      }
    });
  });

});
