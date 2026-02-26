const he = require("he");

function normalizeHtml(rawHtml = "") {
  if (!rawHtml) return "";

  let html = rawHtml;

  if (html.includes("&lt;") || html.includes("&gt;")) {
    

    
    html = html.replace(/<\/p>\s*<p>/gi, " ");
    
    html = html.replace(/<p[^>]*>/gi, "");
    html = html.replace(/<\/p>/gi, "");
    
    html = html.replace(/<br\s*\/?>/gi, " ");
    
    html = html.replace(/&nbsp;/gi, " ");
  }

  html = he.decode(html);

  html = html.replace(/\s+/g, " ").trim();

  return html;
}

module.exports={
    normalizeHtml
}