$(document).ready(function () {
  const modalEl = document.getElementById('reviewModal');
  const reviewModal = new bootstrap.Modal(modalEl);

  // init datatable
  if ($.fn.DataTable.isDataTable("#review_table")) {
    $("#review_table").DataTable().clear().destroy();
  }

  const table = $("#review_table").DataTable({
    ajax: { url: "/reviewsjson", dataSrc: "data" },
    columns: [
      {
        data: "image",
        render: img => img ? `<img src="${img}" style="height:60px; width:auto;">` : `<span class="text-muted">No Image</span>`
      },
      { data: "name" },
      { data: "username" },
      { data: "review" },
      { data: "rating" },
      {
        data: null,
        className: 'text-center',
        render: row => `
          <div class="dropdown dropstart">
            <button class="btn btn-sm btn-light rounded-circle" type="button" data-bs-toggle="dropdown">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <button class="dropdown-item edit-btn" data-id="${row._id}">
                  <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Edit
                </button>
              </li>
              <li>
                <button class="dropdown-item delete-btn" data-id="${row._id}">
                  <i class="fa-solid fa-trash me-2 text-danger"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        `
      }
    ],
    order: [],
    responsive: true,
    autoWidth: false
  });

  // Add button
  $('#addReviewBtn').click(() => {
    $('#reviewForm')[0].reset();
    $('#reviewId').val('');
    $('#previewImage').hide().attr('src','');
    $('#reviewModalLabel').text('Add Review');
    reviewModal.show();
  });

  // Image preview
  $('#reviewImage').change(function () {
    const f = this.files[0];
    if (!f) { $('#previewImage').hide().attr('src',''); return; }
    const reader = new FileReader();
    reader.onload = e => $('#previewImage').attr('src', e.target.result).show();
    reader.readAsDataURL(f);
  });

  // Edit: fill from row data
  $('#review_table').on('click', '.edit-btn', function () {
    const row = table.row($(this).closest('tr')).data();
    if (!row) return Swal.fire('Error', 'Data not found', 'error');

    $('#reviewForm')[0].reset();
    $('#reviewId').val(row._id);
    $('#name').val(row.name);
    $('#username').val(row.username);
    $('#reviewText').val(row.review);
    $('#rating').val(row.rating || 5);

    if (row.image) $('#previewImage').attr('src', row.image).show();
    else $('#previewImage').hide();

    $('#reviewModalLabel').text('Edit Review');
    reviewModal.show();
  });

  // Save (add/edit) via AJAX (multipart)
  $('#reviewForm').submit(function (e) {
    e.preventDefault();
    const fd = new FormData(this);
    const id = $('#reviewId').val();
    if (id) fd.append('id', id);

    $.ajax({
      url: '/reviewssave',
      type: 'POST',
      data: fd,
      contentType: false,
      processData: false,
      success: res => {
        if (res.success) {
          Swal.fire('Success', res.message, 'success');
          reviewModal.hide();
          $('#reviewForm')[0].reset();
          $('#previewImage').hide().attr('src','');
          table.ajax.reload(null, false);
        } else {
          Swal.fire('Error', res.message || 'Server error', 'error');
        }
      },
  error: (xhr) => {
    // backend ka JSON parse karo
    const res = xhr.responseJSON;
    const msg = res?.message || "Something went wrong!";
    Swal.fire("Error", msg, "error");
  },
    });
  });

  // Delete
  $('#review_table').on('click', '.delete-btn', function () {
    const id = $(this).data('id');
    Swal.fire({
      title: 'Delete this review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then(result => {
      if (!result.isConfirmed) return;
      $.ajax({
        url: `/reviewsdelete/${id}`,
        type: 'DELETE',
        success: res => {
          if (res.success) {
            Swal.fire('Deleted!', res.message, 'success');
            table.ajax.reload(null, false);
          } else Swal.fire('Error', res.message, 'error');
        },
        error: () => Swal.fire('Error', 'Server error', 'error')
      });
    });
  });

    $('#generateAIReview').click(() => {
    const name = $('#name').val().trim();

    if (!name) {
      Swal.fire('Error', 'Please enter Name first', 'warning');
      return;
    }

    Swal.fire({
      title: 'Generating...',
      text: 'AI is writing review',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    $.ajax({
      url: '/generateDescription', // POST API (temporary AI)
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name,prompt:'Generate exactly 40 to 42 words in one or two sentences describing company growth, smart automation, accurate lead generation, and measurable results using GrowLead. Do not add extra explanations.' }),
      success: res => {
        Swal.close();
        if (!res.success) return Swal.fire('Error', res.message, 'error');

        const fullDesc = res.description;
        const shortDesc = fullDesc.split(' ').slice(0, 35).join(' ') + '...';

        $('#reviewText').val(shortDesc);

        Swal.fire('Success', 'Review generated by AI', 'success');
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'AI generation failed', 'error');
      }
    });
  });

});
