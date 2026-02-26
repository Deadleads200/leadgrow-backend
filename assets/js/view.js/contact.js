function loadContact() {
  $.get("/getContactjson", function (res) {
    if (res.success && res.data) {

      $("#contactId").val(res.data._id);
      $("#companyName").val(res.data.companyName);
      $("#contactAddress").val(res.data.contactAddress);
      $("#contactNumber").val(res.data.contactNumber);
      $("#emailAddress").val(res.data.emailAddress);
      $("#googleMapLink").val(res.data.googleMapLink);
      $("#currency").val(res.data.currency || "");
      $("#currencySymbol").val(res.data.currencySymbol || "");
      $("#facebook").val(res.data.facebook || "");
      $("#instagram").val(res.data.instagram || "");
      $("#twitter").val(res.data.twitter || "");
      $("#linkedin").val(res.data.linkedin || "");
      $("#email").val(res.data.email || "");
      $("#password").val(res.data.password || "");
      if (res.data.logo) $("#logoPreview").attr("src", res.data.logo);
      if (res.data.favicon) $("#faviconPreview").attr("src", res.data.favicon);

    }

  });
}

loadContact();
// LOGO PREVIEW
$("#logo").on("change", function () {
  const file = this.files[0];
  if (file) $("#logoPreview").attr("src", URL.createObjectURL(file));
});

$("#favicon").on("change", function () {
  const file = this.files[0];
  if (file) {
    $("#faviconPreview").attr("src", URL.createObjectURL(file));
    $("#contactForm").append('<input type="hidden" name="faviconUpdated" value="1">');
  }
});
$("#contactForm").on("submit", function (e) {
  e.preventDefault();

  let formData = new FormData(this);


  // remove logo if no new file
  if ($("#logo")[0].files.length === 0) formData.delete("logo");
  if ($("#favicon")[0].files.length === 0) formData.delete("favicon");

  $.ajax({
    url: "/saveContact",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,

    success: function (res) {


      if (!res.success) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.msg || res.message || "Something went wrong!",
        });
        return;
      }

      // real success
      Swal.fire({
        icon: "success",
        title: "Saved Successfully!",
        text: res.msg,
        timer: 1500,
        showConfirmButton: false,
      });

      loadContact();
    },

    error: function (xhr) {
      const res = xhr.responseJSON;
      Swal.fire(
        "Error",
        res?.msg || res?.message || "Server error",
        "error"
      );
    }
  });
});
