function calcPrice(PV, annualRate, n) {
  const i = annualRate / 100 / 12;
  if (i === 0) return PV / n;
  return (PV * i) / (1 - Math.pow(1 + i, -n));
}

function calcSACFirst(PV, annualRate, n) {
  const i = annualRate / 100 / 12;
  const amort = PV / n;
  return amort + PV * i;
}

function buildSchedule(params) {
  const {
    principal,
    termMonths,
    annualRate,
    startDate,
    extraAmount,
    extraEveryMonths,
    mode,
  } = params;

  const i = annualRate / 100 / 12; // taxa mensal
  let remaining = principal;
  let month = 0;
  let A = principal / termMonths; // amortização base SAC
  let cumulativePaid = 0;

  const rows = [];

  while (remaining > 0.01 && month < 1000) {
    month += 1;
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + (month - 1));

    const interest = remaining * i;
    const amort = Math.min(A, remaining);
    const installment = interest + amort;
    remaining = Math.max(0, remaining - amort);

    let extra = 0;

    // Amortização extra a cada "extraEveryMonths" meses
    if (
      extraEveryMonths > 0 &&
      month % extraEveryMonths === 0 &&
      remaining > 0
    ) {
      const pay = Math.min(extraAmount, remaining);
      remaining = Math.max(0, remaining - pay);
      extra = pay;

      if (mode === "parcela") {
        // Recalcula A para manter prazo, reduzindo a parcela
        const monthsLeft = termMonths - month;
        if (monthsLeft > 0 && remaining > 0) {
          A = remaining / monthsLeft;
        }
      }
      // Se mode === 'prazo', não mexe em A -> prazo encurta
    }

    cumulativePaid += installment + extra;

    rows.push({
      month,
      dateLabel: date.toLocaleDateString("pt-BR", {
        month: "2-digit",
        year: "numeric",
      }),
      balance: remaining,
      installment,
      interest,
      amort,
      extra,
      cumulativePaid,
    });

    if (mode === "parcela" && month >= termMonths) break; // prazo fixo
  }

  return rows;
}
