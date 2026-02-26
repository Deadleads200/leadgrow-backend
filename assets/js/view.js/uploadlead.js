let table;
document.getElementById("uploadLeadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Loading alert
  Swal.fire({
    title: "Uploading...",
    text: "Please wait while leads are being uploaded",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    Swal.close();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Upload Successful",
        html: `
          <b>Total Rows:</b> ${data.total}<br>
          <b>Inserted:</b> ${data.inserted}<br>
          <b>Skipped (Duplicate / Invalid):</b> ${data.skipped}
        `,
        confirmButtonText: "OK"
        
      }).then(() => {
    if (table) {
      table.ajax.reload(null, false); 
    }
  });

  

      // Reset form after success
      form.reset();
    } else {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: data.message || "Something went wrong"
      });
    }

  } catch (error) {
    Swal.close();
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "Unable to upload file. Please try again."
    });
    console.error(error);
  }
});


$(document).ready(function () {

  if ($.fn.DataTable.isDataTable("#zero_config")) {
    $("#zero_config").DataTable().clear().destroy();
  }

   table = $("#zero_config").DataTable({
    serverSide: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: "/manualleadsjson",

    columns: [
      { data: "category", defaultContent: "-" },
      {
        data: "email",
        render: e => e.length ? e.join("<br>") : "-"
      },


      { data: "name" },
      { data: "city", defaultContent: "-" },
      { data: "state", defaultContent: "-" },
      { data: "country", defaultContent: "-" },

     {
  data: "_id",
  className: "text-center",
  render: id => `
    <div class="dropdown dropstart">
      <button class="btn btn-sm btn-light rounded-circle"
        data-bs-toggle="dropdown"
        aria-expanded="false">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>

      <ul class="dropdown-menu dropdown-menu-end shadow">
        <li>
          <button class="dropdown-item viewLeadBtn" data-id="${id}">
            <i class="fa-solid fa-eye text-info me-2"></i>View Details
          </button>
        </li>
      </ul>
    </div>
  `
}

    ],

    pageLength: 10,
    lengthMenu: [10, 25, 50, 100]
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

$(document).on("click", ".viewLeadBtn", function () {

  const leadId = $(this).data("id");
  $("#leadDetailBody").html(`
    <tr><td colspan="2" class="text-center">Loading...</td></tr>
  `);

  $("#leadViewModal").modal("show");

  $.get(`/manuallead/${leadId}`, function (res) {

    if (!res.success) {
      $("#leadDetailBody").html(`
        <tr><td colspan="2" class="text-center text-danger">Lead not found</td></tr>
      `);
      return;
    }

    const d = res.data;
    const row = (k, v) => `
      <tr>
        <th width="30%" class="bg-light">${k}</th>
        <td>${v || "-"}</td>
      </tr>
    `;

    $("#leadDetailBody").html(`
      ${row("Category", d.category)} 
      ${row("Name", d.name)}
      ${row("Email", d.email.join("<br>"))}
      ${row("Phone", d.phone.join("<br>"))}
      ${row("Website", d.website)}
      ${row("Street", d.street)}
      ${row("City", d.city)}
      ${row("State", d.state)}
      ${row("Country", d.country)}
      ${row("Postcode", d.postcode)}
      ${row("Opening Hours", d.openingHours)}
      ${row("Latitude", d.lat)}
      ${row("Longitude", d.lon)}
      ${row("Created At", new Date(d.createdAt).toLocaleString())}
    `);

  });

});
