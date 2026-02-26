
$(document).ready(function() {

function syncAICredits() {
  const monthlyLead = $("#monthlyLeadLimit").val() || 0;
  const yearlyLead = $("#yearlyLeadLimit").val() || 0;

  // Only update preview box, NOT the editable input
  $("#monthlyCreditPreview").text(monthlyLead);
  $("#yearlyCreditPreview").text(yearlyLead);
}

// Trigger on input change for lead limits
$("#monthlyLeadLimit, #yearlyLeadLimit").on("input keyup change", syncAICredits);

// Run on page load
$(document).ready(syncAICredits);

$("#pricingForm").on("submit", function (e) {
    e.preventDefault();

    const form = this;

    if (!form.checkValidity()) {
        e.stopPropagation();
        $(form).addClass("was-validated");
        return;
    }

    const formData = $(form).serialize();

    $.ajax({
        url: "/pricingsave",
        method: "POST",
        data: formData,
        success: function (res) {

            // ⚠️ WARNING CASE (NO SAVE YET)
            if (res.warning) {
                Swal.fire({
                    icon: "warning",
                    title: "Confirmation Required",
                    text: res.warning,
                    showCancelButton: true,
                    confirmButtonText: "Yes, Save",
                    cancelButtonText: "Cancel",
                    allowOutsideClick: false
                }).then((result) => {

                    // ✅ USER CONFIRMED → FORCE SAVE
                    if (result.isConfirmed) {
                        $.ajax({
                            url: "/pricingsave",
                            method: "POST",
                            data: formData + "&forceSave=true",
                            success: function (finalRes) {
                                Swal.fire({
                                    icon: "success",
                                    title: "Success",
                                    text: finalRes.message,
                                    timer: 1500,
                                    showConfirmButton: false
                                }).then(() => {
                                    window.location.href = "/pricingplan";
                                });
                            }
                        });
                    }
                    // ❌ Cancel → NOTHING happens
                });

                return;
            }

            // ✅ NORMAL SUCCESS
            if (res.success) {
                Swal.fire({
                    icon: "success",
                    title: "Success",
                    text: res.message,
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = "/pricingplan";
                });
            }

            // ❌ ERROR
            if (!res.success && !res.warning) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: res.message
                });
            }
        }
    });
});


});

