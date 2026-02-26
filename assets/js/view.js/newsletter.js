$(document).ready(function () {

    if ($.fn.DataTable.isDataTable("#zero_config")) {
        $("#zero_config").DataTable().clear().destroy();
    }

    const table = $("#zero_config").DataTable({  // <-- assign to table
        serverSide: true,
        processing: true,
        autoWidth: false,
        ajax: {
            url: "/newsletterjson",
            type: "GET",
            dataSrc: "data"
        },
     columns: [
        { data: "email" },
        { 
          data: "subscribedAt",
          render: (d) => new Date(d).toLocaleString()
        }
    ],
        pageLength: 10,
        order: [[1, "desc"]]
    });

    // =====================
    // Add Refresh Button
    // =====================
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
        table.ajax.reload(null, false); // <-- now table is defined
    });

});
