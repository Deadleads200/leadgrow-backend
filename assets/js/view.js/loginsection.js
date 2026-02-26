$(document).ready(function () {

  // ===============================
  // LOAD LOGIN SECTION ON PAGE LOAD
  // Controller returns: { data: [] }
  // ===============================
  $.ajax({
    url: "/loginsectionjson",
    type: "GET",
    success: (res) => {
      if (res.data && res.data.length > 0) {
        const row = res.data[0]; //  ONLY FIRST RECORD

        $("#loginSectionTitle").val(row.title || "");
        $("#loginSectionDescription").val(row.description || "");

        if (row.image) {
          $("#previewLoginImage").attr("src", row.image).show();
        }
      }
    }
  });

  // ===============================
  // IMAGE PREVIEW
  // ===============================
  $("#loginSectionImage").on("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      $("#previewLoginImage").attr("src", e.target.result).show();
    };
    reader.readAsDataURL(file);
  });

  // ===============================
  // SAVE / UPDATE LOGIN SECTION
  // ===============================
  $("#loginSectionForm").on("submit", function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", $("#loginSectionTitle").val());
    formData.append("description", $("#loginSectionDescription").val());

    const imageFile = $("#loginSectionImage")[0].files[0];
    if (imageFile) {
      formData.append("image", imageFile);
    }

    $.ajax({
      url: "/loginsectionsave",
      type: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: (res) => {
        if (res.success) {
          Swal.fire("Success", res.message, "success");
        } else {
          Swal.fire("Error", res.message, "error");
        }
      },
      error: () => {
        Swal.fire("Error", "Something went wrong", "error");
      }
    });
  });

  // ===============================
  // AI DESCRIPTION
  // ===============================
  $("#generateLoginSectionAI").on("click", function () {
    const title = $("#loginSectionTitle").val().trim();

    if (!title) {
      return Swal.fire("Warning", "Enter title first", "warning");
    }

    Swal.fire({
      title: "Generating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    $.ajax({
      url: "/generateDescription",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ name: title, prompt: 'Generate exactly 17 to 20 words in one sentence. Describe automation tools, capturing leads, boosting conversions, and business growth. Do not add extra sentences.' }),
      success: (res) => {
        Swal.close();

        if (!res.success) {
          return Swal.fire("Error", res.message, "error");
        }

        $("#loginSectionDescription").val(res.description);
        Swal.fire("Done", "Description generated", "success");
      },
      error: () => {
        Swal.close();
        Swal.fire("Error", "AI failed", "error");
      }
    });
  });

});
