document.getElementById("sectionForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;

  const data = {
    type: form.type.value.trim(),
    label: form.label.value.trim(),
    title: form.title.value.trim(),
    shortDescription: form.shortDescription.value.trim()
  };

  try {
    const res = await fetch("/savesection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: result.message,
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      Swal.fire("Error", result.message, "error");
    }
  } catch (err) {
    Swal.fire("Error", "Server error", "error");
  }
});
