$(document).ready(function () {

    if ($.fn.DataTable.isDataTable("#zero_config")) {
        $("#zero_config").DataTable().clear().destroy();
    }

    const table = $("#zero_config").DataTable({
        serverSide: true,
        processing: true,
        responsive: true,
        autoWidth: false,
        ajax: "/notificationhistoryjson",
        columns: [
    // Sender
            { data: "message" },
            // User
            {
                data: "userId",
                render: u => u ? `${u.firstName || ''} ${u.lastName || ''}<br><small>${u.email || ''}</small>` : "-"
            },
        

            // Subject
            { data: "subject" },

            // Created At
            {
                data: "createdAt",
                render: d => d ? new Date(d).toLocaleString() : "-"
            },

            // Action Dropdown
           {
    data: null,
    className: "text-center",
    render: (data, type, row) => `
        <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
                <li>
                    <a href="javascript:void(0);" 
                       class="dropdown-item viewNotificationBtn"
                       data-user="${row.userId ? row.userId.firstName + ' ' + row.userId.lastName : ''}" 
                       data-email="${row.userId ? row.userId.email : ''}"
                       data-message="${row.message || ''}">
                        <i class="fa-solid fa-eye text-info me-2"></i>View
                    </a>
                </li>
            </ul>
        </div>
    `
}

        ],

        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        order: [[3, "desc"]],
    });

    // --------------------------
    // REFRESH BUTTON
    // --------------------------
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

    // --------------------------
    // SHOW MODAL
    // --------------------------
    $(document).on("click", ".viewNotificationBtn", function () {
        const user = $(this).data("user");
        const email = $(this).data("email");
        const message = $(this).data("message");

        $("#notificationDetailsModal .modal-body").html(`
            <div class="mb-4">
                <h5 class="fw-bold text-dark">To</h5>
                <p class="fs-5">${user} <br><small>${email}</small></p>
            </div>
            <div>
                <h5 class="fw-bold text-dark">Message</h5>
                <p class="fs-5">${message}</p>
            </div>
        `);

        const modal = new bootstrap.Modal(document.getElementById('notificationDetailsModal'));
        modal.show();
    });

});
