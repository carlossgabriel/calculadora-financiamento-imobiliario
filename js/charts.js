// Referências dos gráficos Chart.js
let chartSaldo = null;
let chartPrestacao = null;
let chartGeral = null;

function createOrUpdateChart(ctxId, existingChart, labelSeries, datasets) {
  const ctx = document.getElementById(ctxId).getContext("2d");
  if (existingChart) {
    existingChart.data.labels = labelSeries;
    existingChart.data.datasets = datasets;
    existingChart.update();
    return existingChart;
  }
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: labelSeries,
      datasets,
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function updateCharts(schedule) {
  const labels = schedule.map((r) => r.dateLabel);
  const saldo = schedule.map((r) => r.balance.toFixed(2));
  const prestacao = schedule.map((r) => r.installment.toFixed(2));
  const pagoAcum = schedule.map((r) => r.cumulativePaid.toFixed(2));

  // Gráfico 1: Saldo devedor
  chartSaldo = createOrUpdateChart("graficoSaldo", chartSaldo, labels, [
    {
      label: "Saldo devedor (R$)",
      data: saldo,
      borderColor: "#d4af37",
      backgroundColor: "rgba(212, 175, 55, 0.1)",
      fill: true,
    },
  ]);

  // Gráfico 2: Prestação mensal
  chartPrestacao = createOrUpdateChart(
    "graficoPrestacao",
    chartPrestacao,
    labels,
    [
      {
        label: "Prestação mensal (R$)",
        data: prestacao,
        borderColor: "#48bb78",
        backgroundColor: "rgba(72, 187, 120, 0.1)",
        fill: true,
      },
    ]
  );

  // Gráfico 3: Visão geral (saldo + pago + prestação)
  chartGeral = createOrUpdateChart("graficoGeral", chartGeral, labels, [
    {
      label: "Saldo devedor (R$)",
      data: saldo,
      borderColor: "#d4af37",
      yAxisID: "y",
    },
    {
      label: "Pago acumulado (R$)",
      data: pagoAcum,
      borderColor: "#2d3748",
      yAxisID: "y",
    },
    {
      label: "Prestação mensal (R$)",
      data: prestacao,
      borderColor: "#48bb78",
      yAxisID: "y",
    },
  ]);
}
