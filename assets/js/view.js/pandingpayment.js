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
  ajax: "/pandingpaymentlist",
  columns: [
    { data: "gateway" },

    {
      data: "transactionId",
      render: id => {
        if (!id) return "-";
        const shortId = `${id.slice(0, 6)}...${id.slice(-4)}`;
        return shortId;
      }
    },

    {
      data: "initiatedAt",
      render: d => d ? moment(d).format("DD MMM YYYY, hh:mm A") : "-"
    },

    {
      data: "userId",
      render: u => {
        if (!u) return "-";
        return `${u.firstName ?? ''} ${u.lastName ?? ''}<br><small>${u.email ?? ''}</small>`;
      }
    },

    // Amount column with dynamic currency
    {
      data: "amount",
      render: (amt, type, row) => {
        if (amt == null) return "-";
        const symbol = row.currencySymbol || row.currencyCode; // use backend symbol, fallback $
        return `${symbol} ${amt}`;
      }
    },

    // Conversion column using the top-level currencySymbol
    {
      data: "conversion",
      render: (c, type, row) => {
        if (!c) return "-";
        const symbol = row.currencySymbol; // use top-level currencySymbol

        return `${symbol}${c.fromAmount} ${c.fromCurrency} +${c.totalCharge} ${c.fromCurrency} → ${symbol}${c.totalAmount} ${c.toCurrency}`;
      }
    },

    {
      data: "status",
      className: "text-center",
      render: s => {
        if (!s) return "-";
        const st = s.toLowerCase();
        if (st === "open") return `<span class="badge bg-secondary">Open</span>`;
        if (st === "approved") return `<span class="badge bg-primary">Approved</span>`;
        if (st === "success") return `<span class="badge bg-success">Success</span>`;
        if (st === "failed") return `<span class="badge bg-danger">Failed</span>`;
        if (st === "initiated") return `<span class="badge bg-info text-dark">Initiated</span>`;
        return `<span class="badge bg-secondary">${s}</span>`;
      }
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
              <a href="/paymentdetails/${id}" class="dropdown-item">
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
});




   // -----------------------------
  // FIXED REFRESH BUTTON
  // -----------------------------
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
