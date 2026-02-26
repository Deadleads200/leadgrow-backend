document.addEventListener("DOMContentLoaded", function () {

  /* =========================================
     GLOBAL VARIABLES FOR CHART INSTANCES
  ========================================= */
  let salesBarChart = null; // To store Bar Chart instance
  
  // Elements
  const filterSelect = document.getElementById("paymentFilter");
  const customContainer = document.getElementById("customDateContainer");
  const startDateInput = document.getElementById("customStart");
  const endDateInput = document.getElementById("customEnd");
  const applyBtn = document.getElementById("applyCustomFilter");

  /* =========================================
     1. HELPER: RENDER DONUT CHART
  ========================================= */
  function renderDonutChart(el, series, labels, centerLabel, colors) {
    if (!el) return;
    // Donut charts usually static on filter unless logic added on backend, 
    // keeping standard render here.
    const options = {
      series: series.length ? series : [1],
      labels: labels.length ? labels : ["No Data"],
      chart: { type: "donut", fontFamily: "inherit", foreColor: "#adb0bb" },
      plotOptions: {
        pie: { donut: { size: "88%", labels: { show: true, name: { show: true, offsetY: 7 }, value: { show: false }, total: { show: true, fontSize: "18px", fontWeight: "600", label: centerLabel, color: "#2077faff" } } } }
      },
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: { theme: "dark", fillSeriesColor: false },
      colors,
    };
    new ApexCharts(el, options).render();
  }

  /* =========================================
     2. HELPER: RENDER/UPDATE BAR CHART
  ========================================= */
  function renderOrUpdateBarChart(data) {
    const barEl = document.querySelector("#salary");
    if (!barEl) return;

    if (salesBarChart) {
      // UPDATE existing chart (No Refresh)
      salesBarChart.updateSeries([{ data: data }]);
    } else {
      // CREATE new chart (First Load)
      const options = {
        series: [{ name: "Payments", data: data }],
        chart: {
          type: "bar",
          height: 250,
          toolbar: { show: false },
          fontFamily: "inherit",
          foreColor: "#adb0bb"
        },
        plotOptions: { bar: { borderRadius: 5, columnWidth: "55%", distributed: true } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: false } } },
        xaxis: {
          categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: { labels: { show: false } },
        colors: ["var(--bs-primary)"],
        tooltip: { theme: "dark" }
      };
      salesBarChart = new ApexCharts(barEl, options);
      salesBarChart.render();
    }
  }

  /* =========================================
     3. AJAX DATA FETCH FUNCTION
  ========================================= */
  function fetchDashboardData(url) {
    // Optional: Add loading opacity
    const barEl = document.querySelector("#salary");
    if(barEl) barEl.style.opacity = "0.5";

    fetch(url, {
      headers: { "X-Requested-With": "XMLHttpRequest" } // Important for backend detection
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // 1. Update Bar Chart
        renderOrUpdateBarChart(data.yearlySales || []);
        }
    })
    .catch(err => console.error("Error fetching data:", err))
    .finally(() => {
      if(barEl) barEl.style.opacity = "1";
    });
  }

  /* =========================================
     4. EVENT LISTENERS
  ========================================= */
  
  // A. Filter Dropdown Change
  if (filterSelect) {
    filterSelect.addEventListener("change", function () {
      const value = this.value;

      if (value === "custom") {
        // Show Inputs only
        customContainer.classList.remove("d-none");
        customContainer.classList.add("d-flex");
      } else {
        // Hide Inputs
        customContainer.classList.add("d-none");
        customContainer.classList.remove("d-flex");
        
        // CALL AJAX (No Refresh)
        fetchDashboardData(`/?filter=${value}`);
      }
    });
  }

  // B. Custom "Go" Button Click
  if (applyBtn) {
    applyBtn.addEventListener("click", function () {
      const start = startDateInput.value;
      const end = endDateInput.value;

      if (!start || !end) {
        Swal.fire("Please select both Start and End dates.");
        return;
      }

      // CALL AJAX (No Refresh)
      fetchDashboardData(`/?filter=custom&start=${start}&end=${end}`);
    });
  }


  /* =========================================
     5. INITIAL RENDER (ON PAGE LOAD)
  ========================================= */
  
  // Render Bar Chart with Initial Window Data
  renderOrUpdateBarChart(window.YEARLY_SALES_DATA || []);

  // Render Donut Charts (Static Data from Window)
// ===============================
// TOP USED PLANS DONUT CHART
// ===============================
const topPlans = window.topPlans || [];

const planSeries = [];
const planLabels = [];

if (Array.isArray(topPlans)) {
  topPlans.forEach(p => {
    planSeries.push(Number(p.totalUsers || 0));
    planLabels.push(p.planName || "Unknown Plan");
  });
}

renderDonutChart(
  document.querySelector("#sales-overview-three"),
  planSeries,
  planLabels,
  "Top Used Plans",
  ["var(--bs-primary)", "#8dbeeeff", "var(--bs-secondary)", "#20c997", "#ffc107"]
);

  const categories = window.TOP_CATEGORIES || [];
  renderDonutChart(document.querySelector("#sales-overview"), categories.map(c => c.totalRequests), categories.map(c => c.categoryName), "Categories", ["var(--bs-primary)", "#8dbeeeff", "var(--bs-secondary)"]);

  const countries = window.TOP_COUNTRIES_PER_CATEGORY || [];
  renderDonutChart(document.querySelector("#sales-overview-two"), countries.map(c => c.totalRequests), countries.map(c => `${c.countryName})`), "Countries", ["var(--bs-primary)", "#8dbeeeff", "var(--bs-secondary)"]);

});