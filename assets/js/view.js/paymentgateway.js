$(document).ready(function () {

  const modal = new bootstrap.Modal("#gatewayModal");

    // Destroy if exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }
  const table = $("#zero_config").DataTable({
    ajax: { url: "/paymentgatewayjson", dataSrc: "data" },
    autoWidth: false,
    columns: [
      { data: "name" },
      { data: "fixedCharge" },
      {
        data: null,
        render: (row) => `
                  <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <button class="dropdown-item edit" data-id="${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>
              <li>
                <button class="dropdown-item delete" data-id="${row._id}">
                  <i class="fa-solid fa-trash me-2 text-danger"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        `
      }
    ]
  });

   $("#gatewayForm").submit(function (e) {
    e.preventDefault();

    $.post("/paymentgatewaysave", {
      id: $("#gatewayId").val(), // ID mandatory
      name: $("#name").val(),
      iconName: $("#iconName").val(),
      secretKey: $("#secretKey").val(),
      webhookUrl: $("#webhookUrl").val(),
      fixedCharge: $("#fixedCharge").val()
    }, (res) => {
      Swal.fire(
        res.success ? "Success" : "Error",
        res.message,
        res.success ? "success" : "error"
      );

      if (res.success) {
        modal.hide();
        table.ajax.reload();
      }
    });
  });

  // EDIT ONLY
  $("#zero_config").on("click", ".edit", function () {
    const row = table.row($(this).parents("tr")).data();

    $("#gatewayId").val(row._id);
    $("#name").val(row.name).prop("readonly", true); //  name locked
      $("#iconName").val(row.iconName);
    $("#secretKey").val(row.secretKey);
    $("#webhookUrl").val(row.webhookUrl);
    $("#fixedCharge").val(row.fixedCharge);

    modal.show();
  });
  $("#zero_config").on("click", ".delete", function () {
    const id = $(this).data("id");
    $.ajax({
      url: `/paymentgatewaydelete/${id}`,
      type: "DELETE",
      success: (res) => {
        Swal.fire("Deleted", res.message, "success");
        table.ajax.reload();
      }
    });
  });

});
