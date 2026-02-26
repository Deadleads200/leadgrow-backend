$(document).ready(function () {

    /* ============================
       USER BAN / ACTIVE SWITCH
    ============================= */
    const banSwitch = $("#banSwitch");
    const banText = $("#banText");
    let userStatus = banSwitch.prop("checked"); // true = Active
    const userId = banSwitch.data("userid");

    banSwitch.on("change", function () {

        Swal.fire({
            title: userStatus ? "Ban this user?" : "Activate this user?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: userStatus ? "Yes, ban!" : "Yes, activate!"
        }).then((result) => {

            if (!result.isConfirmed) {
                // Revert switch back if cancelled
                banSwitch.prop("checked", userStatus);
                return;
            }

            $.post(`/userstatus/${userId}`, {}, function (res) {

                if (res.success) {

                    userStatus = !userStatus; // Flip value

                    // Update label text
                    banText.text(userStatus ? "Active" : "Banned");

                    Swal.fire("Success", res.message, "success");

                } else {
                    // If server error → revert switch
                    banSwitch.prop("checked", userStatus);
                    Swal.fire("Error", res.message, "error");
                }

            }).fail(() => {
                banSwitch.prop("checked", userStatus);
                Swal.fire("Error", "Server error occurred", "error");
            });

        });

    });



    /* ============================
       EMAIL VERIFICATION SWITCH
    ============================= */
    const emailSwitch = $("#emailVerifySwitch");
    const emailText = $("#emailVerifyText");
    let emailStatus = emailSwitch.prop("checked");

    emailSwitch.on("change", function () {

        $.post(`/emailverify/${emailSwitch.data("userid")}`, {}, function (res) {

            if (res.success) {

                emailStatus = !emailStatus; // flip

                emailText.text(emailStatus ? "Verified" : "Not Verified");

                Swal.fire("Success", res.message, "success");

            } else {
                // revert back on fail
                emailSwitch.prop("checked", emailStatus);
                Swal.fire("Error", res.message, "error");
            }

        }).fail(() => {
            emailSwitch.prop("checked", emailStatus);
            Swal.fire("Error", "Server error occurred", "error");
        });

    });

});
