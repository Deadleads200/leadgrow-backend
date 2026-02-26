$(document).ready(function () {

    // QUILL INIT
    var quill = new Quill('#quillEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    const modal = new bootstrap.Modal(document.getElementById("blogModal"));

    // RESET DATATABLE
    if ($.fn.DataTable.isDataTable("#zero_config")) {
        $("#zero_config").DataTable().clear().destroy();
    } 
 
    const table = $("#zero_config").DataTable({
    responsive: true,  
    autoWidth: false, 
        ajax: { url: "/blogjson", dataSrc: "data" },
        columns: [
            {
                data: "image",
                render: (img) =>
                    img ? `<img src="${img}" width="70" class="rounded">`
                        : `<span class="text-muted">No Image</span>`
            },
            { data: "title" },
            {
                data: "description",
                render: (d) => `<div class="small" style="max-width:350px; max-height:50px; overflow:hidden;">${d}</div>`
            },
            {
                data: null,
                render: (row) => `
                 <div class="dropdown dropstart">
                    <button class="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
                      <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow">
                      <li>
                        <button class="dropdown-item editBlog" data-id="${row._id}">
                          <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                        </button>
                      </li>
                      <li>
                        <button class="dropdown-item deleteBlog" data-id="${row._id}">
                          <i class="fa-solid fa-trash me-2 text-danger"></i> delete
                        </button>
                      </li>
                    </ul>
                  </div>`
            }
        ]
    });

    // IMAGE BOX CLICK → OPEN FILE INPUT (FIXED)
    $("#imageBox").click(() => {
        $("#image").trigger("click");
    });

    // IMAGE PREVIEW
    $("#image").change(function () {
        const reader = new FileReader();
        reader.onload = (e) => $("#previewImage").attr("src", e.target.result).show();
        reader.readAsDataURL(this.files[0]);
    });

    // ADD BLOG
  $("#addBlogBtn").click(() => {
    $("#blogForm")[0].reset();
    $("#blogId").val("");
    $("#previewImage").hide();
    $("#image").val(""); //  ADD THIS
    quill.root.innerHTML = "";
    $("#isRecent").prop("checked", false);

    $("#blogModalLabel").text("Add Blog");
    modal.show();
});


    // SAVE BLOG
    $("#saveBlogBtn").click(() => {

        // DESCRIPTION WRITE INSIDE HIDDEN INPUT
        $("#description").val(quill.root.innerHTML);

        const formData = new FormData();
        formData.append("id", $("#blogId").val());
        formData.append("title", $("#title").val());
        formData.append("shortDescription", $("#shortDescription").val());
        formData.append("description", $("#description").val());

        // isRecent VALUE (FIX ADDED)
        formData.append("isRecent", $("#isRecent").is(":checked"));

        if ($("#image")[0].files[0]) {
            formData.append("image", $("#image")[0].files[0]);
        }

        $.ajax({
            url: "/blogsave",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            success: (res) => {
        if(res.success){
            Swal.fire("Success", res.message, "success");
            modal.hide();
            table.ajax.reload(null, false);
        } else {
            Swal.fire("Error", res.message, "error");
        }
    },
    error: (xhr) => {
        // backend ka response read karo
        const res = xhr.responseJSON;
        const msg = res?.message || "Something went wrong!";
        Swal.fire("Error", msg, "error");
    }
        });
    });

    // EDIT BLOG
   
$("#zero_config").on("click", ".editBlog", function () {
    const data = table.row($(this).closest("tr")).data();

    $("#blogId").val(data._id);
    $("#title").val(data.title);
    $("#shortDescription").val(data.shortDescription);
    quill.root.innerHTML = data.description;

    //  Clear old image input ALWAYS
    $("#image").val("");  

    //  Remove old preview first
    $("#previewImage").attr("src", "").hide();

    //  Now show blog image if exists
    if (data.image) {
        $("#previewImage").attr("src", data.image).show();
    }

    // isRecent APPLY ON EDIT
    $("#isRecent").prop("checked", data.isRecent === true);

    $("#blogModalLabel").text("Edit Blog");
    modal.show();
});

// AI GENERATE DESCRIPTION
$("#generateAI").click(function () {

    const name = $("#title").val().trim();

    if (!name) {
        Swal.fire("Error", "Please enter Title first", "warning");
        return;
    }

    Swal.fire({
        title: "Generating...",
        text: "AI is writing description",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    $.ajax({
        url: "/generateDescription",
        type: "POST", //  POST
        contentType: "application/json",
        data: JSON.stringify({ name ,prompt:'Write a detailed, SEO-optimized blog description in about 45 to 60 words. Include clarity, examples if needed, and make it engaging'}), //  BODY
        success: (res) => {

            Swal.close();

            if (!res.success) {
                Swal.fire("Error", res.message, "error");
                return;
            }

            const fullDesc = res.description;

            // Short Description = first 30–35 words
            const shortDesc =
                fullDesc.split(" ").slice(0, 25).join(" ") + "...";

            $("#shortDescription").val(shortDesc);
            quill.root.innerHTML = fullDesc;

            Swal.fire("Success", "Description generated by AI", "success");
        },
        error: () => {
            Swal.close();
            Swal.fire("Error", "AI generation failed", "error");
        }
    });
});


    // DELETE BLOG
    $("#zero_config").on("click", ".deleteBlog", function () {
        const id = $(this).data("id");

        Swal.fire({
            title: "Delete this Blog?",
            icon: "warning",
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/blogdelete/${id}`,
                    type: "DELETE",
                    success: (res) => {
                        Swal.fire("Deleted!", res.message, "success");
                        table.ajax.reload(null, false);
                    }
                });
            }
        });
    });

});
