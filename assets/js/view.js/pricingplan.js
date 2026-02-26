$(document).ready(function () {

    // Destroy old datatable
    if ($.fn.DataTable.isDataTable("#zero_config")) {
        $("#zero_config").DataTable().clear().destroy();
    }

    // Init Datatable
    const table = $("#zero_config").DataTable({
        responsive: true,
        autoWidth: false,
        ajax: { url: "/pricingplanjson", dataSrc: "data" },
        columns: [
            { data: "name" },

            {
                data: "monthlyPrice",
                render: (d, type, row) => `${row.currencySymbol}${d}`
            },
            {
                data: "yearlyPrice",
                render: (d, type, row) => `${row.currencySymbol}${d} `
            },

            {
                data: null,
                render: row => `
          Monthly: ${row.monthlyCredit}<br>
          Yearly: ${row.yearlyCredit}
        `,
            },

            {
                data: "status",
                render: s =>
                    s ?
                        `<span class="badge bg-success">Enabled</span>` :
                        `<span class="badge bg-danger">Disabled</span>`,
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
                <a class="dropdown-item" href="/addpricingplan/${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </a>
              </li>

              <li>
<button class="dropdown-item toggle-btn"
        data-id="${row._id}">
  <i class="fa-regular ${row.status ? "fa-eye-slash" : "fa-eye"} me-2 text-warning"></i>
  <span>${row.status ? "Disable" : "Enable"}</span>
</button>

              </li>

              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash me-2 text-danger"></i>
                  Delete
                </button>
              </li>

            </ul>
          </div>

        `,
            },
        ],
        order: [],
    });

    // ---------------------------
    // ENABLE / DISABLE Button
    // ---------------------------
    $("#zero_config").on("click", ".toggle-btn", function () {
        const id = $(this).data("id");

        Swal.fire({
            title: "Change Status?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes",
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/pricingplans/toggle/${id}`,
                    type: "PATCH",

                    success: (res) => {
                        if (res.success) {
                            Swal.fire("Success", res.message, "success");
                            table.ajax.reload(null, false);
                        } else {
                            Swal.fire("Error", res.message, "error");
                        }
                    },
                    error: () => Swal.fire("Error", "Server error!", "error"),
                });
            }
        });
    });

    // ---------------------------
    // DELETE Button
    // ---------------------------
    $("#zero_config").on("click", ".delete-btn", function () {
        const id = $(this).data("id");
        const row = $(this).closest('tr');

        Swal.fire({
            title: "Delete this plan?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete"
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/pricingplans/delete/${id}`,
                    type: "DELETE",
                    success: res => {
                        if (res.success) {
                            Swal.fire("Deleted!", res.message, "success");

                            // Remove row from table DOM
                            table.row(row).remove().draw(false);

                        } else {
                            Swal.fire("Error", res.message, "error");
                        }
                    },
                    error: () => Swal.fire("Error", "Server error!", "error")
                });
            }
        });
    });

});
