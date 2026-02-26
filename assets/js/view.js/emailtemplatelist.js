document.addEventListener('DOMContentLoaded', () => {
  const editors = {};

  // Initialize Quill editors & load content
  document.querySelectorAll('.tab-pane').forEach(tabPane => {
    const type = tabPane.querySelector('input[name="type"]').value;
    const quillDiv = tabPane.querySelector('.quillEditor');
    editors[type] = new Quill(quillDiv, { theme: 'snow' });

    
    // Load initial content
    const htmlContentInput = tabPane.querySelector('.htmlContent');
    editors[type].root.innerHTML = htmlContentInput.value;
  });

  // Copy shortcode
// Copy shortcode safely
document.querySelectorAll('.copy-var').forEach(el => {
  el.addEventListener('click', async () => {
    const textToCopy = el.innerText.trim();
    if (!textToCopy) return;

    // Check if clipboard API available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        Swal.fire(`Copied: ${textToCopy}`);
      } catch (err) {
        console.error("Clipboard write failed:", err);
        Swal.fire("Error", "Failed to copy to clipboard", "error");
      }
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        Swal.fire(`Copied: ${textToCopy}`);
      } catch (err) {
        console.error("Fallback copy failed:", err);
        Swal.fire("Error", "Failed to copy to clipboard", "error");
      }
      document.body.removeChild(textarea);
    }
  });
});


  // Form submission
  document.querySelectorAll('.emailTemplateForm').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const type = form.querySelector('input[name="type"]').value;
      const editor = editors[type];
        const quillBox = form.querySelector('.quillEditor');

    if (!editor) return;

      const htmlContent = editor.root.innerHTML.trim();

      //  QUILL REQUIRED VALIDATION
      if (!htmlContent || htmlContent === '<p><br></p>') {
        quillBox.classList.add('border-danger');

        Swal.fire('Message field cannot be empty');
        return;
      } else {
        quillBox.classList.remove('border-danger');
      }
      form.querySelector('.htmlContent').value = htmlContent;

      const payload = {
        type,
        subject: form.querySelector('.subject').value,
        from_name: form.querySelector('.from_name').value,
        from_email: form.querySelector('.from_email').value,
        htmlContent
      };

      try {
        const res = await fetch(`/updateemailtemplate/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        Swal.fire(data.success ? 'Template updated successfully!' : `Update failed: ${data.message || 'Unknown error'}`);
      } catch(err) {
        console.error(err);
        alert('Error updating template');
      }
    });
  });
});
