$(document).ready(function () {

  // Destroy if exists
  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

  // Init Table
  const table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,  
    autoWidth: false, 
    ajax: "/opensupportticketjson",  // your backend route
    columns: [

      { data: "subject" },

      {
        data: "submittedBy",
        render: u => {
          if (!u) return "-";
          return `${u.firstName ?? ''}${u.lastName ?? ''}<br><small>${u.email ?? ''}</small>`;
        }
      },



      {
        data: "status",
        className: "text-center",
        render: s => {
          if (!s) return "-";
          let st = s.toLowerCase();
          if (st === "open") return `<span class="badge bg-info text-dark">Open</span>`;
          if (st === "closed") return `<span class="badge bg-primary">Closed</span>`;
          if (st === "answered") return `<span class="badge bg-success">Answered</span>`;
          return `<span class="badge bg-secondary">${s}</span>`;
        }
      },
            {
        data: "priority",
        className: "text-center",
        render: p => {
          if (!p) return "-";
          let pr = p.toLowerCase();
          if (pr === "low") return `<span class="badge bg-success">Low</span>`;
          if (pr === "medium") return `<span class="badge bg-warning text-dark">Medium</span>`;
          if (pr === "high") return `<span class="badge bg-danger">High</span>`;
          return `<span class="badge bg-secondary">${p}</span>`;
        }
      },

      {
        data: "lastReply",
        render: d => d ? moment(d).format("DD MMM YYYY, hh:mm A") : "-"
      },

      {
        data: "_id",
        className: "text-center",
        render: id => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <a href="/ticketdetails/${id}" class="dropdown-item">
                  <i class="fa-solid fa-eye text-info me-2"></i>Details
                </a>
              </li>
            </ul>
          </div>
        `
      }

    ],

    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    order: [], // order by lastReply desc
  });


  /* --------------------------
     REFRESH BUTTON
  ----------------------------*/
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

});
