$(document).ready(function () {

  const DEFAULT_LOGO = "/images/logos/logo.png";
  const DEFAULT_FAVICON = "/images/logos/favicon(1).png";

  $.get("/getContactjson", function (res) {


    $(".dark-logo, .light-logo").attr("src", DEFAULT_LOGO);

    $("#dynamic-favicon, #login-favicon").attr("href", DEFAULT_FAVICON);

    $("#dynamic-favicon-loader, #login-loader").attr("src", DEFAULT_FAVICON);

    $(".responsive-light, .responsive-dark").attr("src", DEFAULT_FAVICON);

    if (!res.success || !res.data) return;

    const { logo, favicon } = res.data;

 
    if (logo && logo.trim() !== "") {
      $(".dark-logo, .light-logo").attr("src", logo);
    }


    if (favicon && favicon.trim() !== "") {
      $("#dynamic-favicon, #login-favicon").attr("href", favicon);
      $("#dynamic-favicon-loader, #login-loader").attr("src", favicon);
      $(".responsive-light, .responsive-dark").attr("src", favicon);
    }

  });

});
