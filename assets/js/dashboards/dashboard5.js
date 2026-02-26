document.addEventListener("DOMContentLoaded", function () {

  const osData = window.osChartData || { labels: [], series: [] };

  const labels = osData.labels?.length ? osData.labels : ["Unknown"];
  const series = osData.series?.length ? osData.series.map(Number) : [0];

  const colors = [
    "var(--bs-primary)",
    "var(--bs-success)",
    "var(--bs-warning)",
    "var(--bs-danger)",
    "var(--bs-secondary)"
  ];

  const chartOptions = {
    chart: {
      type: "radialBar", 
      height: 350
    },

    series: series,
    labels: labels,
    colors: colors.slice(0, labels.length),

    plotOptions: {
      radialBar: {
        hollow: { size: "50%" },

        dataLabels: {
          name: { show: true },

          value: {
            show: true,
            formatter: function (val, opts) {
               if (opts && opts.seriesIndex !== undefined) {
                 return series[opts.seriesIndex];
               }
               return val;
            }
          },

          total: {
            show: true,
            label: labels.length === 1 ? labels[0] : "Total Logins",
            
            formatter: function (w) {
              if (series.length === 1) {
                  return series[0];
              }
              return series.reduce((a, b) => a + b, 0);
            }
          }
        }
      }
    },

    tooltip: {
      y: {
        formatter: function (val, opts) {
           // Tooltip fix
           if (opts && opts.seriesIndex !== undefined) {
             return series[opts.seriesIndex] + " logins";
           }
           if (series.length === 1) {
             return series[0] + " logins";
           }
           return val + " logins";
        }
      }
    }
  };

  new ApexCharts(
    document.querySelector("#team-performance"),
    chartOptions
  ).render();
});