import { state, save, KEY } from "./state.js";
import { fmt, uid, today, addMonths, download } from "./utils.js";
import {
  cicloAtualLabel,
  cicloDeData,
  saldoFundo,
  totalCotas,
  passivo10,
  jurosRecebidos
} from "./calc.js";
import {
  renderHeader,
  renderKPIs,
  renderPessoas,
  renderCotas,
  renderEmprestimos,
  renderRetornos,
  renderCiclosPayout
} from "./render.js";

/* =============================
          HELPERS GERAIS
   ============================= */

let toastTimer = null;
let lastResumoRows = [];

export function showToast(msg, warn = false) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span>${msg}</span>`;
  if (warn) t.style.borderColor = "#7f1d1d";

  document.body.appendChild(t);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2600);
}

export function ensureNotLocked() {
  if (state.lock && state.lock.locked) {
    alert("Edição bloqueada por PIN. Desbloqueie em Config.");
    return false;
  }
  return true;
}

export function renderLockStatus() {
  const el = document.getElementById("lockStatus");
  if (!el) return;
  const hasPin = state.lock && state.lock.pin;
  const lbl = state.lock && state.lock.locked ? "Bloqueado" : "Desbloqueado";
  el.textContent = `${lbl} • ${hasPin ? "PIN definido" : "sem PIN"}`;
}

export function confirmDialog(message, title = "Confirmar ação") {
  return new Promise(resolve => {
    const ov = document.getElementById("confirmOverlay");
    const txt = document.getElementById("confirmText");
    const ttl = document.getElementById("confirmTitle");
    const yes = document.getElementById("confirmYes");
    const no = document.getElementById("confirmNo");

    function close(v) {
      yes.onclick = no.onclick = null;
      ov.style.display = "none";
      ov.setAttribute("aria-hidden", "true");
      resolve(v);
    }

    ttl.textContent = title;
    txt.textContent = message;
    ov.style.display = "flex";
    ov.setAttribute("aria-hidden", "false");
    yes.focus();

    yes.onclick = () => close(true);
    no.onclick = () => close(false);

    ov.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(false); }
      if (e.key === "Enter") { e.preventDefault(); close(true); }
    }, { once: true });
  });
}

/* =============================
         RENDER GLOBAL
   ============================= */

export function populateFilterCombos() {
  const tSel = document.getElementById("filtroTomador");
  const cSel = document.getElementById("filtroCorrentista");

  if (!tSel || !cSel) return;

  const setTom = new Set(state.emprestimos.map(e => e.tomador).filter(Boolean));
  const setCor = new Set(state.pessoas.map(p => p.nome).filter(Boolean));

  function refill(sel, items) {
    const cur = sel.value || "todos";
    sel.innerHTML = "";
    sel.innerHTML += `<option value="todos">Todos</option>`;
    Array.from(items)
      .sort((a, b) => a.localeCompare(b))
      .forEach(v => {
        sel.innerHTML += `<option value="${v}">${v}</option>`;
      });
    if (Array.from(items).includes(cur)) sel.value = cur;
    else sel.value = "todos";
  }

  refill(tSel, setTom);
  refill(cSel, setCor);
}

export function renderAll() {
  renderHeader();
  renderKPIs();
  renderPessoas();
  renderCotas();
  renderEmprestimos();
  renderRetornos();
  renderCiclosPayout();
  populateFilterCombos();
  renderLockStatus();
}

/* =============================
        FILTROS & RESUMO
   ============================= */

function totalCashbackPorPessoa() {
  const resumo = {};
  state.cashbacks.forEach(cb => {
    if (!resumo[cb.tomador]) resumo[cb.tomador] = 0;
    resumo[cb.tomador] += Number(cb.valor);
  });
  return resumo;
}

export function aplicarFiltros() {
  const de = document.getElementById("filtroDe").value || "0000-01-01";
  const ate = document.getElementById("filtroAte").value || "9999-12-31";
  const tipo = document.getElementById("filtroTipo").value;
  const tomSel = document.getElementById("filtroTomador").value || "todos";
  const corSel = document.getElementById("filtroCorrentista").value || "todos";

  const linhas = [];
  let totIn = 0;
  let totOut = 0;

  // COTAS
  if (tipo === "todos" || tipo === "cotas") {
    state.cotas
      .filter(c => c.data >= de && c.data <= ate)
      .forEach(c => {
        const p = state.pessoas.find(x => x.id === c.pessoaId);
        const nome = p ? p.nome : "—";
        if (corSel !== "todos" && nome !== corSel) return;
        linhas.push({
          data: c.data,
          tipo: "Cota",
          desc: nome,
          valor: Number(c.valor)
        });
        totIn += Number(c.valor);
      });
  }

  // EMPRÉSTIMOS
  if (["todos", "emprestimos", "emp_vencidos", "emp_avencer"].includes(tipo)) {
    const hoje = today();
    state.emprestimos.forEach(e => {
      if (tomSel !== "todos" && e.tomador !== tomSel) return;

      const juros = Number(e.principal) * Number(e.percentual);
      const total = Number(e.principal) + juros;
      const pagos = state.retornos
        .filter(r => r.emprestimoId === e.id)
        .reduce((s, r) => s + Number(r.valor), 0);

      const aberto = pagos + 0.01 < total;
      const vencimento = e.vencimento || e.data;
      const vencido = aberto && vencimento < hoje;
      const avencer =
        aberto &&
        !vencido &&
        (new Date(vencimento) - new Date(hoje) <= 7 * 24 * 3600 * 1000);

      const dentroJanela =
        (tipo === "emprestimos" && e.data >= de && e.data <= ate) ||
        (tipo === "emp_vencidos" && vencido && vencimento >= de && vencimento <= ate) ||
        (tipo === "emp_avencer" && avencer && vencimento >= de && vencimento <= ate) ||
        (tipo === "todos" && e.data >= de && e.data <= ate);

      if (!dentroJanela) return;

      let rotulo = "Empréstimo";
      if (tipo === "emp_vencidos") rotulo = "Empréstimo (Vencido)";
      if (tipo === "emp_avencer") rotulo = "Empréstimo (A vencer)";

      linhas.push({
        data: (tipo === "emp_vencidos" || tipo === "emp_avencer") ? vencimento : e.data,
        tipo: rotulo,
        desc: `[${e.codigo}] ${e.tomador}`,
        valor: -Number(e.principal)
      });
      totOut += Number(e.principal);
    });
  }

  // RETORNOS
  if (tipo === "todos" || tipo === "retornos") {
    state.retornos
      .filter(r => r.data >= de && r.data <= ate)
      .forEach(r => {
        const e = state.emprestimos.find(x => x.id === r.emprestimoId);
        if (tomSel !== "todos" && e && e.tomador !== tomSel) return;

        linhas.push({
          data: r.data,
          tipo: `Retorno ${r.tipo}`,
          desc: e ? `[${e.codigo}] ${e.tomador}` : "—",
          valor: Number(r.valor)
        });
        totIn += Number(r.valor);
      });
  }

  // BAIXAS FINAIS
  if (tipo === "todos" || tipo === "payouts") {
    state.payouts
      .filter(p => p.data >= de && p.data <= ate)
      .forEach(p => {
        const pes = state.pessoas.find(x => x.id === p.pessoaId);
        linhas.push({
          data: p.data,
          tipo: "Baixa Final",
          desc: pes ? pes.nome : "—",
          valor: -Number(p.valor)
        });
        totOut += Number(p.valor);
      });
  }

  linhas.sort((a, b) => a.data.localeCompare(b.data));
  lastResumoRows = linhas.slice();

  const tbody = document.querySelector("#tabelaMovimentos tbody");
  tbody.innerHTML = "";
  linhas.forEach(l => {
    const cls = l.valor >= 0 ? "val-in" : "val-out";
    tbody.innerHTML += `
      <tr>
        <td>${l.data}</td>
        <td>${l.tipo}</td>
        <td>${l.desc}</td>
        <td class="${cls}">${fmt(l.valor)}</td>
      </tr>
    `;
  });

  const ul = document.getElementById("totaisPeriodo");
  ul.innerHTML = "";
  ul.innerHTML += `<li>Entradas: <b>${fmt(totIn)}</b></li>`;
  ul.innerHTML += `<li>Saídas: <b>${fmt(totOut)}</b></li>`;
  ul.innerHTML += `<li>Saldo Líquido: <b>${fmt(totIn - totOut)}</b></li>`;

  // Cashback por correntista
  const cb = totalCashbackPorPessoa();
  const nomes = Object.keys(cb);
  if (nomes.length) {
    ul.innerHTML += `<li style="margin-top:6px;"><b>Cashbacks acumulados:</b></li>`;
    nomes.forEach(n => {
      ul.innerHTML += `<li>${n}: <b>${fmt(cb[n])}</b></li>`;
    });
  }
}

export function exportResumo(mode) {
  if (!lastResumoRows || !lastResumoRows.length) {
    alert("Nenhum movimento filtrado para exportar.");
    return;
  }

  if (mode === "csv") {
    const header = ["Data", "Tipo", "Descrição", "Valor"];
    const csv = [header.join(";")].concat(
      lastResumoRows.map(r =>
        [
          r.data,
          r.tipo.replace(/;/g, ","),
          r.desc.replace(/;/g, ","),
          (Number(r.valor) || 0).toFixed(2).replace(".", ",")
        ].join(";")
      )
    ).join("\n");
    download("resumo_movimentos.csv", csv, "text/csv;charset=utf-8;");
  } else {
    const rows = lastResumoRows.map(r =>
      `<tr>
        <td>${r.data}</td>
        <td>${r.tipo}</td>
        <td>${r.desc}</td>
        <td>${(Number(r.valor) || 0).toFixed(2)}</td>
      </tr>`
    ).join("");

    const table = `<table border="1">
      <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th></tr>
      ${rows}
    </table>`;

    download("resumo_movimentos.xls", table, "application/vnd.ms-excel");
  }
}

/* =============================
          BAIXA FINAL
   ============================= */

function getPayoutRows(ciclo) {
  const porPessoa = new Map();
  state.cotas
    .filter(c => c.ciclo === ciclo)
    .forEach(c => {
      porPessoa.set(c.pessoaId, (porPessoa.get(c.pessoaId) || 0) + Number(c.valor));
    });

  const rows = [];
  state.pessoas.forEach(p => {
    const tot = porPessoa.get(p.id) || 0;
    if (tot <= 0) return;
    const dez = tot * 0.10;
    const devolver = tot + dez;
    rows.push({ pessoaId: p.id, nome: p.nome, total: tot, dez, devolver });
  });
  return rows;
}

export function gerarTabelaPayout() {
  const ciclo = document.getElementById("cicloPayout").value;
  const tbody = document.querySelector("#tabelaPayouts tbody");
  tbody.innerHTML = "";

  if (!ciclo) return;

  const rows = getPayoutRows(ciclo);
  rows.forEach(r => {
    const ja = state.payouts.some(p => p.pessoaId === r.pessoaId && p.ciclo === ciclo);
    tbody.innerHTML += `
      <tr>
        <td>${r.nome} ${ja ? '<span class="pill in" style="margin-left:6px;">PAGO</span>' : ""}</td>
        <td class="val-in">${fmt(r.total)}</td>
        <td class="muted">${fmt(r.dez)}</td>
        <td class="val-out"><b>${fmt(r.devolver)}</b></td>
        <td>
          ${
            ja
              ? `<button class="btn btn-ghost" data-estornar="${r.pessoaId}::${ciclo}">Estornar</button>`
              : `<button class="btn btn-primary" data-payout="${r.pessoaId}::${ciclo}::${r.devolver}">Registrar Baixa</button>`
          }
        </td>
      </tr>
    `;
  });
}

export function exportPayout(ciclo, mode) {
  if (!ciclo) {
    alert("Selecione um ciclo.");
    return;
  }
  const rows = getPayoutRows(ciclo);
  if (!rows.length) {
    alert("Não há dados para exportar neste ciclo.");
    return;
  }

  if (mode === "csv") {
    const header = ["Correntista", "Total Cotas", "10%", "Devolver"];
    const csv = [header.join(";")].concat(
      rows.map(r =>
        [
          r.nome,
          r.total.toFixed(2).replace(".", ","),
          r.dez.toFixed(2).replace(".", ","),
          r.devolver.toFixed(2).replace(".", ",")
        ].join(";")
      )
    ).join("\n");
    download(`baixa_final_${ciclo}.csv`, csv, "text/csv;charset=utf-8;");
  } else {
    const body = rows.map(r =>
      `<tr>
        <td>${r.nome}</td>
        <td>${r.total.toFixed(2)}</td>
        <td>${r.dez.toFixed(2)}</td>
        <td>${r.devolver.toFixed(2)}</td>
      </tr>`
    ).join("");
    const table = `<table border="1">
      <tr><th>Correntista</th><th>Total Cotas</th><th>10%</th><th>Devolver</th></tr>
      ${body}
    </table>`;
    download(`baixa_final_${ciclo}.xls`, table, "application/vnd.ms-excel");
  }
}

/* =============================
          BACKUP / PIN
   ============================= */

export function exportBackup() {
  const json = JSON.stringify(state, null, 2);
  download("backup_plataforma.json", json, "application/json;charset=utf-8;");
}

export function importBackup(file) {
  if (!(state.lock && !state.lock.locked)) {
    alert("Desbloqueie com PIN para importar.");
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !data.config) throw new Error("Formato inválido");
      localStorage.setItem(KEY, JSON.stringify(data));
      location.reload();
    } catch (err) {
      alert("Falha ao importar: " + err.message);
    }
  };
  reader.readAsText(file);
}

/* =============================
        REGISTRO DE EVENTOS
   ============================= */

export function setupTabs() {
  const nav = document.querySelector("header nav");
  nav.addEventListener("click", e => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    const id = btn.dataset.tab;

    document.querySelectorAll(".tab-btn").forEach(b =>
      b.classList.toggle("active", b === btn)
    );
    document.querySelectorAll("main section.card").forEach(sec => {
      sec.hidden = (sec.id !== id);
    });
  });
}

export function setupEventHandlers() {
  /* COTAS */
  document.addEventListener("click", async e => {
    const t = e.target;

    if (t.id === "btnAddCota") {
      if (!ensureNotLocked()) return;
      const pessoaId = document.getElementById("cotistaSelect").value;
      const valor = Number(document.getElementById("valorCota").value || 0);
      const data = document.getElementById("dataCota").value || today();
      if (!pessoaId || valor <= 0) {
        alert("Selecione o correntista e informe um valor > 0");
        return;
      }
      state.cotas.push({
        id: uid(),
        pessoaId,
        valor,
        data,
        ciclo: cicloDeData(data)
      });
      save();
      renderAll();
      showToast("Cota lançada.");
    }

    if (t.dataset.delCota) {
      if (!ensureNotLocked()) return;
      const id = t.dataset.delCota;
      const ok = await confirmDialog("Excluir este lançamento de cota?", "Excluir cota");
      if (!ok) return;
      state.cotas = state.cotas.filter(c => c.id !== id);
      save();
      renderAll();
      showToast("Lançamento de cota removido.", true);
    }
  });

  /* EMPRÉSTIMOS */
  document.addEventListener("click", async e => {
    const t = e.target;

    if (t.id === "btnAddEmprestimo") {
      if (!ensureNotLocked()) return;
      const tomador = document.getElementById("emprestTomador").value.trim();
      const principal = Number(document.getElementById("emprestPrincipal").value || 0);
      const percentual = Number(document.getElementById("emprestPercentual").value || 0.2);
      const data = document.getElementById("emprestData").value || today();
      let venc = document.getElementById("emprestVenc").value;
      const status = document.getElementById("emprestStatus").value || "aberto";

      if (!tomador || principal <= 0) {
        alert("Informe tomador e valor > 0.");
        return;
      }
      if (!venc) venc = addMonths(data, 1);

      const codigo = "EMP-" + String(state.seqEmprestimo++).padStart(4, "0");
      const id = uid();

      state.emprestimos.push({
        id,
        codigo,
        tomador,
        principal,
        percentual,
        data,
        status,
        vencimento: venc
      });

      // Cashback 5% para empréstimos > 250
      if (principal > 250) {
        const cbValor = Number((principal * 0.05).toFixed(2));
        state.cashbacks.push({
          id: uid(),
          emprestimoId: id,
          tomador,
          valor: cbValor,
          data
        });
        showToast(`Cashback de ${fmt(cbValor)} gerado para ${tomador}.`);
      }

      save();
      renderAll();
      showToast("Empréstimo registrado.");
    }

    if (t.dataset.closeEmp) {
      if (!ensureNotLocked()) return;
      const id = t.dataset.closeEmp;
      const emp = state.emprestimos.find(x => x.id === id);
      if (emp) {
        emp.status = emp.status === "aberto" ? "fechado" : "aberto";
        save();
        renderEmprestimos();
      }
    }

    if (t.dataset.delEmp) {
      if (!ensureNotLocked()) return;
      const id = t.dataset.delEmp;
      const ok = await confirmDialog("Excluir este empréstimo?", "Excluir empréstimo");
      if (!ok) return;
      state.emprestimos = state.emprestimos.filter(e2 => e2.id !== id);
      state.retornos = state.retornos.filter(r => r.emprestimoId !== id);
      save();
      renderAll();
      showToast("Empréstimo removido.", true);
    }
  });

  /* RETORNOS */
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "retornoEmprestimo" || t.id === "retornoTipo") {
      const id = document.getElementById("retornoEmprestimo").value;
      const tipo = document.getElementById("retornoTipo").value;
      const emp = state.emprestimos.find(x => x.id === id);
      const el = document.getElementById("retornoValor");
      if (!emp) { el.value = ""; return; }

      const juros = Number(emp.principal) * Number(emp.percentual);
      const total = Number(emp.principal) + juros;
      const pagos = state.retornos
        .filter(r => r.emprestimoId === emp.id)
        .reduce((s, r) => s + Number(r.valor), 0);
      const outstanding = Math.max(0, total - pagos);

      if (tipo === "juros") {
        el.value = Math.min(juros, outstanding).toFixed(2);
      } else if (tipo === "misto") {
        el.value = outstanding.toFixed(2);
      } else {
        el.value = Math.min(emp.principal, outstanding).toFixed(2);
      }
    }
  });

  document.addEventListener("click", async e => {
    const t = e.target;

    if (t.id === "btnAddRetorno") {
      if (!ensureNotLocked()) return;

      const emprestimoId = document.getElementById("retornoEmprestimo").value;
      const valorTotal = Number(document.getElementById("retornoValor").value || 0);
      const data = document.getElementById("retornoData").value || today();
      const tipo = document.getElementById("retornoTipo").value;

      if (!emprestimoId || valorTotal <= 0) {
        alert("Selecione o empréstimo e um valor > 0.");
        return;
      }

      const emp = state.emprestimos.find(x => x.id === emprestimoId);
      if (!emp) { alert("Empréstimo não encontrado."); return; }

      const juros = Number(emp.principal) * Number(emp.percentual);
      const total = Number(emp.principal) + juros;
      const pagosAntes = state.retornos
        .filter(r => r.emprestimoId === emp.id)
        .reduce((s, r) => s + Number(r.valor), 0);
      const outstanding = Math.max(0, total - pagosAntes);

      let msg = "Retorno registrado.";

      if (tipo === "juros") {
        state.retornos.push({
          id: uid(),
          emprestimoId,
          valor: valorTotal,
          data,
          tipo: "juros"
        });
        msg = "Retorno (juros) registrado.";
      } else if (tipo === "principal") {
        state.retornos.push({
          id: uid(),
          emprestimoId,
          valor: valorTotal,
          data,
          tipo: "principal"
        });
        msg = "Retorno (principal) registrado.";
      } else {
        // misto: abate juros primeiro, depois principal
        const jurosJaPagos = state.retornos
          .filter(r => r.emprestimoId === emp.id && r.tipo.trim() !== "principal")
          .reduce((s, r) => s + Number(r.valor), 0);
        const jurosRestantes = Math.max(0, juros - jurosJaPagos);

        const parteJuros = Math.min(valorTotal, jurosRestantes);
        const partePrincipal = Math.max(0, valorTotal - parteJuros);

        if (parteJuros > 0) {
          state.retornos.push({
            id: uid(),
            emprestimoId,
            valor: parteJuros,
            data,
            tipo: "juros"
          });
        }
        if (partePrincipal > 0) {
          state.retornos.push({
            id: uid(),
            emprestimoId,
            valor: partePrincipal,
            data,
            tipo: "principal"
          });
        }
        msg = "Retorno (misto) registrado.";
      }

      const pagosDepois = pagosAntes + valorTotal;
      if (pagosDepois + 0.01 >= total) {
        emp.status = "fechado";
        emp.vencimento = data;
      }

      save();
      renderAll();
      showToast(msg);
    }

    if (t.dataset.delRet) {
      if (!ensureNotLocked()) return;
      const id = t.dataset.delRet;
      const ok = await confirmDialog("Excluir este retorno?", "Excluir retorno");
      if (!ok) return;
      state.retornos = state.retornos.filter(r => r.id !== id);
      save();
      renderAll();
      showToast("Retorno removido.", true);
    }
  });

  /* PESSOAS */
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.pessoaNome) {
      if (state.lock && state.lock.locked) {
        const pOrig = state.pessoas.find(x => x.id === t.dataset.pessoaNome);
        if (pOrig) t.value = pOrig.nome;
        return;
      }
      const p = state.pessoas.find(x => x.id === t.dataset.pessoaNome);
      if (p) p.nome = t.value;
    }
  });

  document.addEventListener("focusout", e => {
    const t = e.target;
    if (t.dataset.pessoaNome) save();
  });

  document.addEventListener("click", async e => {
    const t = e.target;

    if (t.id === "btnAddPessoa") {
      if (!ensureNotLocked()) return;
      state.pessoas.push({ id: uid(), nome: "Novo Nome" });
      save();
      renderPessoas();
    }

    if (t.dataset.delPessoa) {
      if (!ensureNotLocked()) return;
      const id = t.dataset.delPessoa;
      const ok = await confirmDialog("Remover este correntista?", "Remover correntista");
      if (!ok) return;
      state.pessoas = state.pessoas.filter(p => p.id !== id);
      state.cotas = state.cotas.filter(c => c.pessoaId !== id);
      save();
      renderAll();
      showToast("Correntista removido.", true);
    }

    if (t.id === "btnResetDados") {
      if (!ensureNotLocked()) return;
      if (!confirm("Tem certeza? Isto apagará todos os dados (cotas, empréstimos, retornos, payouts).")) return;
      state.cotas = [];
      state.emprestimos = [];
      state.retornos = [];
      state.payouts = [];
      state.cashbacks = [];
      save();
      renderAll();
      showToast("Dados zerados.", true);
    }
  });

  /* RESUMO / EXPORTS / BAIXA FINAL */
  document.addEventListener("click", e => {
    const t = e.target;

    if (t.id === "btnAplicarFiltros") aplicarFiltros();

    if (t.id === "btnLimparFiltros") {
      document.getElementById("filtroDe").value = "";
      document.getElementById("filtroAte").value = "";
      document.getElementById("filtroTipo").value = "todos";
      document.getElementById("filtroTomador").value = "todos";
      document.getElementById("filtroCorrentista").value = "todos";
      aplicarFiltros();
    }

    if (t.id === "btnExportResumoCSV") exportResumo("csv");
    if (t.id === "btnExportResumoXLS") exportResumo("xls");

    if (t.id === "btnGerarPayout") gerarTabelaPayout();

    if (t.id === "btnExportPayoutCSV") {
      const ciclo = document.getElementById("cicloPayout").value;
      exportPayout(ciclo, "csv");
    }
    if (t.id === "btnExportPayoutXLS") {
      const ciclo = document.getElementById("cicloPayout").value;
      exportPayout(ciclo, "xls");
    }

    if (t.dataset.payout) {
      if (!ensureNotLocked()) return;
      const [pessoaId, ciclo, valor] = t.dataset.payout.split("::");
      if (state.payouts.some(p => p.pessoaId === pessoaId && p.ciclo === ciclo)) {
        alert("Baixa já registrada para essa pessoa neste ciclo.");
        return;
      }
      const data = today();
      state.payouts.push({
        id: uid(),
        pessoaId,
        ciclo,
        valor: Number(valor),
        data
      });
      save();
      gerarTabelaPayout();
      renderKPIs();
      showToast("Baixa registrada.");
    }

    if (t.dataset.estornar) {
      if (!ensureNotLocked()) return;
      const [pessoaId, ciclo] = t.dataset.estornar.split("::");
      state.payouts = state.payouts.filter(
        p => !(p.pessoaId === pessoaId && p.ciclo === ciclo)
      );
      save();
      gerarTabelaPayout();
      renderKPIs();
      showToast("Baixa estornada.", true);
    }
  });

  /* BACKUP */
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.id === "btnExportarBackup") exportBackup();
    if (t.id === "btnImportarBackup")
      document.getElementById("inputImportBackup").click();
  });

  const inputImport = document.getElementById("inputImportBackup");
  if (inputImport) {
    inputImport.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      importBackup(file);
    });
  }

  /* PIN */
  document.addEventListener("click", e => {
    const t = e.target;

    if (t.id === "btnDefinirPIN") {
      const elAtual = document.getElementById("pinAtual");
      const elNovo = document.getElementById("pinNovo");
      const atual = elAtual.value || "";
      const novo = elNovo.value || "";

      if (state.lock && state.lock.pin) {
        if (atual !== state.lock.pin) {
          showToast("PIN atual incorreto.", true);
          return;
        }
      }
      if (novo.length < 4 || novo.length > 10) {
        showToast("PIN deve ter 4–10 dígitos.", true);
        return;
      }
      state.lock = { pin: novo, locked: false };
      elAtual.value = "";
      elNovo.value = "";
      save();
      renderLockStatus();
      showToast("PIN atualizado.");
    }

    if (t.id === "btnBloquear") {
      if (!(state.lock && state.lock.pin)) {
        showToast("Defina um PIN antes de bloquear.", true);
        return;
      }
      state.lock.locked = true;
      save();
      renderLockStatus();
      showToast("Bloqueado.");
    }

    if (t.id === "btnDesbloquear") {
      const elAtual = document.getElementById("pinAtual");
      const atual = elAtual.value || "";
      if (!(state.lock && state.lock.pin)) {
        showToast("Sem PIN definido.", true);
        return;
      }
      if (atual !== state.lock.pin) {
        showToast("PIN incorreto.", true);
        return;
      }
      state.lock.locked = false;
      save();
      renderLockStatus();
      showToast("Desbloqueado.");
    }
  });

  /* SALVAR CICLO (CONFIG) */
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.id === "btnSalvarCfg") {
      if (!ensureNotLocked()) return;
      const ini = document.getElementById("cfgInicio").value;
      const fim = document.getElementById("cfgFim").value;
      if (!ini || !fim) {
        alert("Informe início e fim do ciclo.");
        return;
      }
      state.config.inicio = ini;
      state.config.fim = fim;
      save();
      renderAll();
      showToast("Ciclo atualizado.");
    }
  });
}
