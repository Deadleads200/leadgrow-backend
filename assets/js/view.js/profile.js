$(document).ready(function () {

  $("#updateNameForm").on("submit", function (e) {
    e.preventDefault();

    $.ajax({
      url: "/changepassword",
      method: "POST",
      data: $(this).serialize(),
      success: function (res) {
        if (res.success && res.name) {
          $("#adminName, #adminNavName, #adminProfileName").text(res.name);
          $("#nameinput").val(res.name);

          Swal.fire("Success", res.message, "success");
        } else {
          Swal.fire("Error", res.message, "error");
        }
      }
    });
  });

});
$(document).ready(function () {

  $("#changePasswordForm").on("submit", function (e) {
    e.preventDefault();

    $.ajax({
      url: "/changepassword",
      method: "POST",
      data: $(this).serialize(),
      success: function (res) {
        if (res.success) {
          Swal.fire("Success", res.message, "success");
          $("#changePasswordForm")[0].reset();
        } else {
          Swal.fire("Error", res.message, "error");
        }
      },
      error: function () {
        Swal.fire("Error", "Something went wrong", "error");
      }
    });
  });

});


const cameraBtn = document.getElementById("cameraBtn");
const profileInput = document.getElementById("profileInput");
const profilePreview = document.querySelectorAll(".profilePreview");

// Camera click → open file chooser
cameraBtn.addEventListener("click", () => {
    profileInput.click();
});

// File select → preview + upload
profileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const oldImages = [];
    profilePreview.forEach(p => oldImages.push(p.src));

    // temp preview
    const reader = new FileReader();
    reader.onload = () => {
        profilePreview.forEach(p => p.src = reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch("/adminimage", {
            method: "PUT",
            body: formData
        });

        const data = await res.json();

        console.log(data);
        
        //  STRICT SUCCESS CHECK
        const isSuccess =
            res.status === 200 &&
            data.success === true;

        // ❌ ERROR
        if (!isSuccess) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: data.message || "Image upload failed"
            });

            profilePreview.forEach((p, i) => p.src = oldImages[i]);
            profileInput.value = "";
            return;
        }

        // ✅ SUCCESS
        if (data.profile) {
            profilePreview.forEach(p => p.src = data.profile);
        }

        Swal.fire({
            icon: "success",
            title: "Success",
            text: "Profile image updated successfully"
        });

    } catch (err) {
        profilePreview.forEach((p, i) => p.src = oldImages[i]);

        Swal.fire({
            icon: "error",
            title: "Server Error",
            text: "Something went wrong"
        });
    }
});

