import { state } from "./state.js";
import { fmt } from "./utils.js";
import {
  cicloAtualLabel,
  totalCotas,
  passivo10,
  jurosRecebidos,
  saldoFundo
} from "./calc.js";

/* =============================
          RENDERIZAÇÃO
   ============================= */

export function renderHeader() {
  document.getElementById("cycleLabel").textContent = cicloAtualLabel();
  document.getElementById("saldoFundo").textContent = fmt(saldoFundo());
}

export function renderKPIs() {
  const ciclo = cicloAtualLabel();
  document.getElementById("kpiTotalCotas").textContent = fmt(totalCotas(ciclo));
  document.getElementById("kpiPassivo10").textContent = fmt(passivo10(ciclo));
  document.getElementById("kpiJuros").textContent = fmt(jurosRecebidos());
}

/* === RENDER CORRENTISTAS === */
export function renderPessoas() {
  const ciclo = cicloAtualLabel();
  const tbody = document.querySelector("#tabelaPessoas tbody");
  tbody.innerHTML = "";

  state.pessoas.forEach((p, i) => {
    const tot = state.cotas
      .filter(c => c.pessoaId === p.id && c.ciclo === ciclo)
      .reduce((s, c) => s + Number(c.valor), 0);

    const qtd = state.cotas
      .filter(c => c.pessoaId === p.id && c.ciclo === ciclo)
      .length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><input data-pessoa-nome="${p.id}" value="${p.nome}"></td>
      <td class="val-in">${fmt(tot)}</td>
      <td class="muted">${fmt(tot * 0.10)}</td>
      <td class="muted">${Math.min(qtd, 12)}/12</td>
      <td><button class="btn btn-ghost" data-del-pessoa="${p.id}">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ======================================================================================
 As outras renderizações (cotas, empréstimos, retornos, payouts, filtros) seguem abaixo.
 ====================================================================================== */

export function renderCotas() {
  const sel = document.getElementById("cotistaSelect");
  const prev = sel.value || null;

  sel.innerHTML = "";
  state.pessoas.forEach(p => {
    sel.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
  });

  if (prev) sel.value = prev;

  const filtroId = sel.value;
  const tbody = document.querySelector("#tabelaCotas tbody");
  tbody.innerHTML = "";

  state.cotas
    .filter(c => !filtroId || c.pessoaId === filtroId)
    .sort((a, b) => a.data.localeCompare(b.data))
    .forEach(c => {
      const p = state.pessoas.find(x => x.id === c.pessoaId);

      tbody.innerHTML += `
        <tr>
          <td>${c.data}</td>
          <td>${p ? p.nome : "—"}</td>
          <td class="val-in">${fmt(c.valor)}</td>
          <td class="muted">${fmt(c.valor * 0.10)}</td>
          <td class="muted">${c.ciclo}</td>
          <td><button class="btn btn-ghost" data-del-cota="${c.id}">Excluir</button></td>
        </tr>
      `;
    });
}

export function renderEmprestimos() {
  const tbody = document.querySelector("#tabelaEmprestimos tbody");
  tbody.innerHTML = "";

  state.emprestimos
    .sort((a, b) => a.data.localeCompare(b.data))
    .forEach(e => {
      const juros = Number(e.principal) * Number(e.percentual);
      const total = Number(e.principal) + juros;
      const pagos = state.retornos
        .filter(r => r.emprestimoId === e.id)
        .reduce((s, r) => s + Number(r.valor), 0);

      const aberto = pagos + 0.01 < total;

      tbody.innerHTML += `
        <tr>
          <td>${e.data}</td>
          <td>${e.tomador}<div class="muted mono">${e.codigo} • Venc.: ${e.vencimento}</div></td>
          <td class="val-out">${fmt(e.principal)}</td>
          <td>${Math.round(e.percentual * 100)}%</td>
          <td>${fmt(total)}</td>
          <td>${fmt(pagos)}</td>
          <td>${aberto ? '<span class="pill out">Aberto</span>' : '<span class="pill in">Fechado</span>'}</td>
          <td>
            <button class="btn btn-ghost" data-close-emp="${e.id}">${aberto ? "Fechar" : "Reabrir"}</button>
            <button class="btn btn-ghost" data-del-emp="${e.id}">Excluir</button>
          </td>
        </tr>
      `;
    });

  // popular lista para retornos
  const sel = document.getElementById("retornoEmprestimo");
  sel.innerHTML = "";

  state.emprestimos.forEach(e => {
    const juros = Number(e.principal) * Number(e.percentual);
    const total = Number(e.principal) + juros;
    const pagos = state.retornos
      .filter(r => r.emprestimoId === e.id)
      .reduce((s, r) => s + Number(r.valor), 0);

    if (pagos + 0.01 < total) {
      sel.innerHTML += `
        <option value="${e.id}">
          ID ${e.codigo} • ${e.tomador} • ${fmt(e.principal)} • Devido ${fmt(total - pagos)}
        </option>`;
    }
  });

  if (!sel.innerHTML.trim()) {
    sel.innerHTML = `<option>— nenhum empréstimo aberto —</option>`;
  }
}

export function renderRetornos() {
  const tbody = document.querySelector("#tabelaRetornos tbody");
  tbody.innerHTML = "";

  state.retornos
    .sort((a, b) => a.data.localeCompare(b.data))
    .forEach(r => {
      const e = state.emprestimos.find(x => x.id === r.emprestimoId);

      tbody.innerHTML += `
        <tr>
          <td>${r.data}</td>
          <td>${e ? e.tomador : "—"}</td>
          <td class="val-in">${fmt(r.valor)}</td>
          <td>${r.tipo}</td>
          <td class="muted">${e ? e.codigo : "—"}</td>
          <td><button class="btn btn-ghost" data-del-ret="${r.id}">Excluir</button></td>
        </tr>
      `;
    });
}

export function renderCiclosPayout() {
  const sel = document.getElementById("cicloPayout");
  sel.innerHTML = "";

  const ciclos = [...new Set(state.cotas.map(c => c.ciclo))];

  ciclos.forEach(c => {
    sel.innerHTML += `<option value="${c}">${c}</option>`;
  });
}
