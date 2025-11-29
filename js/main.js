function validateEntrada() {
  const valorImovel = parseCurrency(
    document.getElementById("valorImovel").value
  );
  const entradaTipo = document.getElementById("entradaTipo").value;
  const entradaInput = document.getElementById("entradaPercent");
  const minimo = valorImovel * 0.2;

  if (entradaTipo === "percent") {
    const percent = parseFloat(entradaInput.value) || 0;
    if (percent < 20) {
      entradaInput.setCustomValidity(
        "A entrada mínima é de 20% do valor do imóvel"
      );
      return false;
    } else {
      entradaInput.setCustomValidity("");
    }
  } else {
    const valorEntrada = parseCurrency(entradaInput.value);
    if (valorEntrada < minimo) {
      entradaInput.setCustomValidity(
        `A entrada mínima é de R$ ${formatCurrency(minimo.toString())}`
      );
      return false;
    } else {
      entradaInput.setCustomValidity("");
    }
  }
  return true;
}

function handleEntradaTipoChange() {
  const tipo = document.getElementById("entradaTipo").value;
  const label = document.getElementById("entradaLabel");
  const input = document.getElementById("entradaPercent");

  if (tipo === "percent") {
    label.textContent = "Percentual da entrada (%)";
    input.value = "20";
    input.step = "1";
    input.min = "20";
    input.max = "100";
    input.type = "number";
  } else {
    label.textContent = "Valor da entrada (R$)";
    input.value = "0,00";
    input.type = "text";
    input.removeAttribute("step");
    input.removeAttribute("min");
    input.removeAttribute("max");
    applyMoneyMask(input);
  }
  validateEntrada();
}

function toggleTooltip(event) {
  event.stopPropagation();
  const icon = event.currentTarget;

  // Close other tooltips
  document.querySelectorAll(".info-icon.active").forEach((el) => {
    if (el !== icon) el.classList.remove("active");
  });

  // Toggle current tooltip
  icon.classList.toggle("active");
}

function getLoanParamsFromInputs() {
  // Helper para normalizar valores (mesma lógica do calcular)
  const norm = (v) => String(v).replace(",", ".");

  const valor = parseCurrency(document.getElementById("valorImovel").value);
  const entradaTipo = document.getElementById("entradaTipo").value;
  const entradaInput =
    entradaTipo === "percent"
      ? parseFloat(document.getElementById("entradaPercent").value || 0)
      : parseCurrency(document.getElementById("entradaPercent").value);

  const prazo = parseInt(document.getElementById("prazo").value || 0, 10);
  const juros = parseFloat(
    norm(document.getElementById("faixaMCMV").value) || 0
  );

  const entradaValor =
    entradaTipo === "percent" ? valor * (entradaInput / 100) : entradaInput;

  const financiado = Math.max(0, valor - entradaValor);

  return {
    principal: financiado,
    termMonths: prazo,
    annualRate: juros,
    startDate: new Date(), // Data atual como início
  };
}

function updateSimulation() {
  const loanParams = getLoanParamsFromInputs();

  const extraValor = Number(
    document.getElementById("inputExtraValor").value || "0"
  );
  const extraFreq = Number(
    document.getElementById("inputExtraFrequencia").value || "0"
  );
  const tipo = document.getElementById("selectTipoAmortizacao").value;

  const params = {
    ...loanParams,
    extraAmount: extraValor,
    extraEveryMonths: extraFreq,
    mode: tipo,
  };

  const schedule = buildSchedule(params);
  updateCharts(schedule);
}

function calcular() {
  // Validate entrada first
  if (!validateEntrada()) {
    alert("Por favor, corrija os erros antes de calcular.");
    return;
  }

  // inputs
  const norm = (v) => String(v).replace(",", ".");

  const valor = parseCurrency(document.getElementById("valorImovel").value);
  const entradaTipo = document.getElementById("entradaTipo").value;
  const entradaInput =
    entradaTipo === "percent"
      ? parseFloat(document.getElementById("entradaPercent").value || 0)
      : parseCurrency(document.getElementById("entradaPercent").value);
  const prazo = parseInt(document.getElementById("prazo").value || 0, 10);
  const juros = parseFloat(
    norm(document.getElementById("faixaMCMV").value) || 0
  );

  const itbiP = parseFloat(norm(document.getElementById("itbi").value) || 0);
  const escritP = parseFloat(
    norm(document.getElementById("escritura").value) || 0
  );
  const taxaCaixaP = parseFloat(
    norm(document.getElementById("taxaCaixa").value) || 0
  );
  const seguridadeCaixa = parseCurrency(
    document.getElementById("seguridadeCaixa").value
  );
  const taxaEngenharia = parseCurrency(
    document.getElementById("taxaEngenharia").value
  );

  // cálculos principais
  const entradaValor =
    entradaTipo === "percent" ? valor * (entradaInput / 100) : entradaInput;
  const entradaPercent =
    entradaTipo === "percent" ? entradaInput : (entradaValor / valor) * 100;
  const financiado = Math.max(0, valor - entradaValor);
  const parcelaPrice = calcPrice(financiado, juros, prazo);
  const primeiraSAC = calcSACFirst(financiado, juros, prazo);

  const itbi = valor * (itbiP / 100);
  const escritura = valor * (escritP / 100);
  const taxaCaixaValor = financiado * (taxaCaixaP / 100);
  const transfer =
    itbi + escritura + taxaCaixaValor + seguridadeCaixa + taxaEngenharia;

  const desembolsoInicialSemExtras = entradaValor + transfer;

  // preencher resultados

  document.getElementById("entradaResumo").innerHTML = `
<div class="kv-item">
<div class="kv-label">Valor da entrada (${entradaPercent.toFixed(1)}%)</div>
<div class="kv-value">${fmt(entradaValor)}</div>
</div>
<div class="kv-item">
<div class="kv-label">Valor a ser financiado</div>
<div class="kv-value">${fmt(financiado)}</div>
</div>
`;

  document.getElementById("financiadoResumo").innerHTML = `
<div class="kv-item">
<div class="kv-label">Prazo do financiamento</div>
<div class="kv-value">${prazo} meses</div>
</div>
<div class="kv-item">
<div class="kv-label">Taxa de juros anual</div>
<div class="kv-value">${juros.toFixed(2)}% a.a.</div>
</div>
`;

  document.getElementById("parcelasResumo").innerHTML = `
<div class="kv-item kv-highlight">
<div class="kv-label">
  Primeira parcela (Sistema SAC)
  <span class="info-icon" onclick="toggleTooltip(event)">
    i
    <span class="tooltip">
      <strong>Sistema SAC</strong>
      Amortização constante e juros decrescentes. As parcelas começam mais altas e diminuem ao longo do tempo. Total de juros pagos é menor que o Price.
      <br><br>
      <strong>Fórmula 1ª parcela:</strong> PMT = (PV / n) + (PV × i)
      <br>
      Onde i = taxa mensal e n = número de parcelas
    </span>
  </span>
</div>
<div class="kv-value">${fmt(primeiraSAC)}</div>
</div>
<div class="kv-item">
<div class="kv-label">
  Parcela (Sistema Price)
  <span class="info-icon" onclick="toggleTooltip(event)">
    i
    <span class="tooltip">
      <strong>Sistema PRICE</strong>
      Parcelas fixas durante todo o financiamento. O valor da amortização cresce e os juros diminuem ao longo do tempo, mas a parcela permanece constante.
      <br><br>
      <strong>Fórmula:</strong> PMT = PV × i / (1 - (1 + i)^-n)
      <br>
      Onde i = taxa mensal e n = número de parcelas
    </span>
  </span>
</div>
<div class="kv-value">${fmt(parcelaPrice)}</div>
</div>
`;

  document.getElementById("transferResumo").innerHTML = `
<div class="kv-item kv-highlight">
<div class="kv-label">Total custos de transferência</div>
<div class="kv-value">${fmt(transfer)}</div>
</div>
<div class="kv-item">
<div class="kv-label">ITBI</div>
<div class="kv-value">${fmt(itbi)}</div>
</div>
<div class="kv-item">
<div class="kv-label">Escritura</div>
<div class="kv-value">${fmt(escritura)}</div>
</div>
<div class="kv-item">
<div class="kv-label">Taxa da Caixa Economica</div>
<div class="kv-value">${fmt(taxaCaixaValor)}</div>
</div>
<div class="kv-item">
<div class="kv-label">Seguridade de relacionamento Caixa</div>
<div class="kv-value">${fmt(seguridadeCaixa)}</div>
</div>
<div class="kv-item">
<div class="kv-label">Taxa de engenharia</div>
<div class="kv-value">${fmt(taxaEngenharia)}</div>
</div>
`;

  document.getElementById("desembolsoInicialSemExtras").innerHTML = `
<div class="kv-item kv-highlight">
<div class="kv-label">Desembolso inicial (entrada + transferência)</div>
<div class="kv-value">${fmt(desembolsoInicialSemExtras)}</div>
</div>
`;

  document.getElementById("saldoResumo").innerHTML = `
<div class="kv-item kv-highlight">
<div class="kv-label">Total a desembolsar</div>
<div class="kv-value">${fmt(desembolsoInicialSemExtras)}</div>
</div>
`;

  document.getElementById("aviso").textContent = "";

  document.getElementById("result").style.display = "block";
  document
    .getElementById("result")
    .scrollIntoView({ behavior: "smooth", block: "start" });

  // Atualiza e mostra os gráficos
  if (typeof updateSimulation === "function") {
    updateSimulation();
    document.getElementById("graficosCard").style.display = "block";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Apply money masks to all currency inputs
  const moneyInputs = ["valorImovel", "seguridadeCaixa", "taxaEngenharia"];

  moneyInputs.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.type = "text";
      input.value = "0,00";
      applyMoneyMask(input);
    }
  });

  // Setup entrada type handler
  const select = document.getElementById("entradaTipo");
  select.addEventListener("change", handleEntradaTipoChange);

  // Add validation on entrada and valorImovel changes
  const valorImovel = document.getElementById("valorImovel");
  const entradaInput = document.getElementById("entradaPercent");

  if (valorImovel) {
    valorImovel.addEventListener("blur", validateEntrada);
  }

  if (entradaInput) {
    entradaInput.addEventListener("blur", validateEntrada);
    entradaInput.addEventListener("input", validateEntrada);
  }

  // Ensure initial UI state matches default selection
  handleEntradaTipoChange();

  // Close tooltips when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".info-icon")) {
      document.querySelectorAll(".info-icon.active").forEach((el) => {
        el.classList.remove("active");
      });
    }
  });

  // Add click listeners to info icons
  document.querySelectorAll(".info-icon").forEach((icon) => {
    icon.addEventListener("click", toggleTooltip);
  });

  // Add click listener to Calculate button
  const btnCalcular = document.getElementById("btnCalcular");
  if (btnCalcular) {
    btnCalcular.addEventListener("click", calcular);
  }

  // Formulário para o usuário alterar X meses / X reais / tipo de amortização
  const form = document.getElementById("formAmortizacaoExtra");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateSimulation();
  });
});
