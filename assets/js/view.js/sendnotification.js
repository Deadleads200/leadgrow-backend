$(document).ready(function () {

    var toolbarOptions = [
        [{ 'font': [] }],
        [{ 'size': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ];

    var quill = new Quill('#quillEditor', {
        theme: 'snow',
        modules: { toolbar: toolbarOptions }
    });

var defaultContent = `<p>&lt;div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;"&gt;</p>
<p><br></p>
<p>&nbsp;&lt;table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;"&gt;</p>
<p>&nbsp;&nbsp;&lt;tr&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&lt;td align="center"&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&lt;table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 5px 15px rgba(0,0,0,0.08);"&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;!-- Header --&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;tr&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;td style="background:#0d6efd;padding:24px;text-align:center;"&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;h1 style="margin:0;color:#ffffff;font-size:22px;"&gt;GlowLead&lt;/h1&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;p style="margin:6px 0 0;color:#e9f1ff;font-size:14px;"&gt;System Notification&lt;/p&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/td&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/tr&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;!-- Body --&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;tr&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;td style="padding:30px;color:#333333;"&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;p style="font-size:14px;line-height:1.6;"&gt;
This is a notification from &lt;strong&gt;GlowLead&lt;/strong&gt;.
&lt;/p&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;div style="margin:25px 0;padding:18px;border-left:4px solid #0d6efd;background:#f8faff;"&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/div&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;p style="font-size:14px;line-height:1.6;"&gt;
Please log in to your dashboard for more details.
&lt;/p&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;p style="margin-top:30px;font-size:14px;"&gt;
Regards,&lt;br&gt;
&lt;strong&gt;GlowLead Team&lt;/strong&gt;
&lt;/p&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/td&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/tr&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;!-- Footer --&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;tr&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;td style="background:#f1f3f5;padding:15px;text-align:center;font-size:12px;color:#888;"&gt;
© GlowLead — All rights reserved
&lt;/td&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/tr&gt;</p>

<p>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/table&gt;</p>
<p>&nbsp;&nbsp;&nbsp;&lt;/td&gt;</p>
<p>&nbsp;&nbsp;&lt;/tr&gt;</p>
<p>&nbsp;&lt;/table&gt;</p>
<p>&lt;/div&gt;</p>`;

quill.clipboard.dangerouslyPasteHTML(defaultContent);

  // Sync hidden textarea on change
var hiddenTextarea = document.getElementById('messageEmail');

// initial
hiddenTextarea.value = quill.root.innerHTML;

// on change
quill.on('text-change', function () {
    hiddenTextarea.value = quill.root.innerHTML;
});
    $("#specificUsers").select2({
        width: "100%",
        placeholder: "Select users...",
        allowClear: true
    });

    $("#sentToEmail").change(function () {
        if ($(this).val() === "specific") {
            $("#specificUsersWrapper").removeClass("d-none");
            loadUsersList();
        } else {
            $("#specificUsersWrapper").addClass("d-none");
        }
    });

    function loadUsersList() {
        $.get("/fetch-users-email", function (res) {
            if (res.success) {
                let html = "";

                res.users.forEach(u => {
                    html += `<option value="${u.email}">${u.firstName} ${u.lastName} (${u.email})</option>`;
                });

                $("#specificUsers").html(html);
                $("#specificUsers").trigger("change");
            }
        });
    }

        $("form").submit(function (e) {
        e.preventDefault();
        
        // Sync Quill content to hidden textarea
        var fullHtml = quill.root.innerHTML;

        const data = {
            type: $("#sentToEmail").val(),
            subject: $("#subjectEmail").val(),
            message: fullHtml, // Pura HTML design bhej rahe hain
            users: $("#specificUsers").val() || []
        };

        $.post("/send-email", data, function (res) {
            if (res.success) {
                Swal.fire("Success", res.message, "success");
                // Reset content to default instead of empty
                quill.clipboard.dangerouslyPasteHTML(defaultContent);
            } else {
                Swal.fire("Error", res.message, "error");
            }
        });
    });
});