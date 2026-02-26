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
    ajax: "/allpaymentlist",
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

 // Amount column
{
  data: "amount",
  render: (amt, x, row) => {
    if (amt == null) return "-";
    const symbol = row.currencySymbol  || row.currencyCode;
    return `${symbol} ${amt}`;
  }
},

// Conversion column
{
  data: "conversion",
  render: (c, x, row) => {
    if (!c) return "-";
    const symbol = row.currencySymbol;
    return `${symbol}${c.fromAmount} ${c.fromCurrency} +${c.totalCharge} ${c.fromCurrency} → ${symbol}${c.totalAmount} ${c.toCurrency}`;
  }
},


  {
  data: "status",
  className: "text-center",
  render: s => {
    if (!s) return "-";

    let st = s.toLowerCase();

    // pending
    if (st === "open") {
      return `<span class="badge bg-secondary">open</span>`;
    }

    // approved
    if (st === "approved") {
      return `<span class="badge bg-primary">Approved</span>`;
    }

    // success
    if (st === "success") {
      return `<span class="badge bg-success">Success</span>`;
    }

    // failed
    if (st === "failed") {
      return `<span class="badge bg-danger">Failed</span>`;
    }

    // initiated
    if (st === "initiated") {
      return `<span class="badge bg-info text-dark">Initiated</span>`;
    }

    // fallback
    return `<span class="badge bg-secondary">${s}</span>`;
  }
}
,

{
  data: "_id",
  className: "text-center",
  render: (id, type, row) => `
    <div class="dropdown dropstart">
      <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>

      <ul class="dropdown-menu dropdown-menu-end shadow">
        <li>
          <a href="/paymenthistorydetails/${id}" class="dropdown-item">
            <i class="fa-solid fa-eye text-info me-2"></i>Details
          </a>
        </li>
        ${row.invoiceUrl ? `
        <li>
          <a href="${row.invoiceUrl}" download target="_blank" class="dropdown-item" >
          <i class="fa-solid fa-download text-info me-2"></i> Download Invoice
          </a>
        </li>
        ` : ""}
      </ul>
    </div>
  `
}

],


    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],

  });


  /* --------------------------
     REFRESH BUTTON
  ----------------------------*/
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
