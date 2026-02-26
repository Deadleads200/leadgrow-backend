const checkboxes = document.querySelectorAll(".leadCheck");

// ONLY ONE checkbox allowed
checkboxes.forEach(cb => {
  cb.addEventListener("change", () => {
    if (cb.checked) {
      checkboxes.forEach(other => {
        if (other !== cb) other.checked = false;
      });
    }
  });
});

// SAVE ON BUTTON CLICK
document.getElementById("saveBtn").addEventListener("click", () => {
  const data = {};
  let isValid = true;

  checkboxes.forEach(cb => {
    const key = cb.dataset.key;
    let apiKey = "";

    // only fetch input for APIs other than manualData
    if(key !== "manualData") {
      const apiKeyInput = document.querySelector(`.apiKeyInput[data-key="${key}"]`);
      apiKey = apiKeyInput.value.trim();

      // VALIDATION: if checkbox ON, API key must not be empty
      if (cb.checked && apiKey === "") {
        isValid = false;
        apiKeyInput.classList.add("is-invalid");
      } else {
        apiKeyInput.classList.remove("is-invalid");
      }
    }

    data[key] = {
      enabled: cb.checked,
      apiKey: apiKey
    };
  });

  if (!isValid) return;

  fetch("/leadsettingupdate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Settings Updated',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text:  res.message || 'Something went wrong. Try again.'
      });
    }
  })
  .catch(() => {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: 'Something went wrong. Try again.'
    });
  });
});
