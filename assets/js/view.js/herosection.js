$(document).ready(function () {

  // ===============================
  // LOAD HERO SECTION ON PAGE LOAD
  // Controller returns: { data: [] }
  // ===============================
  $.ajax({
    url: "/herosectionjson",
    type: "GET",
    success: (res) => {
      if (res.data && res.data.length > 0) {
        const row = res.data[0]; // ONLY FIRST RECORD

        $("#heroSectionId").val(row._id || "");
        $("#heroSectionTitle").val(row.title || "");
        $("#heroSectionDescription").val(row.description || "");

        if (row.backgroundImg) {
          $("#previewImage1").attr("src", row.backgroundImg).show();
        }

        if (row.mainImg) {
          $("#previewImage2").attr("src", row.mainImg).show();
        }
      }
    }
  });

  // ===============================
  // IMAGE PREVIEW
  // ===============================
  $("#heroSectionImage1").on("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      $("#previewImage1").attr("src", e.target.result).show();
    };
    reader.readAsDataURL(file);
  });

  $("#heroSectionImage2").on("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      $("#previewImage2").attr("src", e.target.result).show();
    };
    reader.readAsDataURL(file);
  });

  // ===============================
  // SAVE / UPDATE HERO SECTION
  // ===============================
  $("#heroSectionForm").on("submit", function (e) {
    e.preventDefault();

    const formData = new FormData();

    formData.append("id", $("#heroSectionId").val());
    formData.append("title", $("#heroSectionTitle").val());
    formData.append("description", $("#heroSectionDescription").val());

    const bgImg = $("#heroSectionImage1")[0].files[0];
    const mainImg = $("#heroSectionImage2")[0].files[0];

    if (bgImg) formData.append("backgroundImg", bgImg);
    if (mainImg) formData.append("mainImg", mainImg);

    $.ajax({
      url: "/herosectionsave",
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
  $("#generateAIHero").on("click", function () {
    const title = $("#heroSectionTitle").val().trim();

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
      data: JSON.stringify({ name: title, prompt: 'Generate a concise marketing description in exactly 31 words about AI automation delivering verified leads by industry and location for small businesses. Do not add extra sentences or explanations.' }),
      success: (res) => {
        Swal.close();

        if (!res.success) {
          return Swal.fire("Error", res.message, "error");
        }

        $("#heroSectionDescription").val(res.description);
        Swal.fire("Done", "Description generated", "success");
      },
      error: () => {
        Swal.close();
        Swal.fire("Error", "AI failed", "error");
      }
    });
  });

});
