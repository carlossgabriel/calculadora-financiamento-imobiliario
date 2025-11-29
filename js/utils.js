// Money mask functions
function formatCurrency(value) {
  // Remove non-numeric characters except comma and dot
  let numValue = value.replace(/[^\d,]/g, "");
  numValue = numValue.replace(",", ".");

  // Format as currency
  const num = parseFloat(numValue) || 0;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(value) {
  if (!value) return 0;
  // Remove currency formatting and convert to number
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}

function applyMoneyMask(input) {
  input.addEventListener("input", function (e) {
    let value = e.target.value;
    // Remove all non-numeric characters
    value = value.replace(/\D/g, "");
    // Convert to cents
    const cents = parseInt(value) || 0;
    // Convert to reais
    const reais = cents / 100;
    // Format
    e.target.value = reais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  input.addEventListener("focus", function (e) {
    // If value is 0.00, clear it
    if (parseCurrency(e.target.value) === 0) {
      e.target.value = "";
    }
  });

  input.addEventListener("blur", function (e) {
    // If empty, set to 0.00
    if (!e.target.value) {
      e.target.value = "0,00";
    }
  });
}

function fmt(v) {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
