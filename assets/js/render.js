/* =============================================================
   RENDERIZAÇÃO DO SISTEMA (OTIMIZADO)
============================================================= */

import { state } from "./state.js";
import {
    totalCotas,
    totalPassivo,
    totalJuros,
    cashbackPorPessoa
} from "./calc.js";
import { formatMoney } from "./utils.js";

/* -------------------------------------------------------------
   RENDER KPI's
------------------------------------------------------------- */
export function renderKpis() {
    const elCotas = document.getElementById("kpi-total-cotas");
    const elPassivo = document.getElementById("kpi-passivo");
    const elJuros = document.getElementById("kpi-juros");

    if (elCotas) elCotas.textContent = formatMoney(totalCotas());
    if (elPassivo) elPassivo.textContent = formatMoney(totalPassivo());
    if (elJuros) elJuros.textContent = formatMoney(totalJuros());
}

/* -------------------------------------------------------------
   RENDER COTAS
------------------------------------------------------------- */
export function renderCotas() {
    const body = document.getElementById("tbl-cotas-body");
    if (!body) return;

    body.innerHTML = "";

    state.cotas.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${c.data}</td>
            <td>${c.pessoa}</td>
            <td>${formatMoney(c.valor)}</td>
            <td>${formatMoney(c.acrescimo)}</td>
            <td>${c.data.slice(0, 7)}</td>
            <td>
                <button class="btn-ghost" onclick="window.events.excluirCota('${c.id}')">Excluir</button>
            </td>
        `;
        body.appendChild(tr);
    });
}

/* -------------------------------------------------------------
   RENDER EMPRÉSTIMOS
------------------------------------------------------------- */
export function renderEmprestimos() {
    const body = document.getElementById("tbl-emp-body");
    if (!body) return;

    body.innerHTML = "";

    state.emprestimos.forEach(e => {
        const aprovado = e.aberto
            ? `<span class="pill out">Aberto</span>`
            : `<span class="pill in">Fechado</span>`;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${e.data}</td>
            <td>${e.pessoa}<br><small>EMP-${e.id.slice(0, 4)} • Venc: ${e.venc}</small></td>
            <td>${formatMoney(e.principal)}</td>
            <td>${e.jurosPercent}%</td>
            <td>${formatMoney(e.total)}</td>
            <td>${formatMoney(e.pago)}</td>
            <td>${aprovado}</td>
            <td>
                ${
                    e.aberto
                        ? `<button class="btn-ghost" onclick="window.events.registrarPagamentoPrompt('${e.id}')">Pagar</button>`
                        : `<button class="btn-ghost" onclick="window.events.reabrirEmprestimo('${e.id}')">Reabrir</button>`
                }
                <button class="btn-ghost" onclick="window.events.excluirEmprestimo('${e.id}')">Excluir</button>
            </td>
        `;
        body.appendChild(tr);
    });
}

/* -------------------------------------------------------------
   RENDER CASHBACK (AGRUPADO)
------------------------------------------------------------- */
export function renderCashbacks() {
    const body = document.getElementById("tbl-cashback-body");
    if (!body) return;

    const mapa = cashbackPorPessoa();

    body.innerHTML = "";

    const nomes = Object.keys(mapa);

    if (!nomes.length) {
        body.innerHTML = `<tr><td colspan="2" class="muted">Nenhum cashback gerado.</td></tr>`;
        return;
    }

    nomes.forEach(nome => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nome}</td>
            <td>${formatMoney(mapa[nome])}</td>
        `;
        body.appendChild(tr);
    });
}

/* -------------------------------------------------------------
   RENDER GERAL
------------------------------------------------------------- */
export function renderAll() {
    renderKpis();
    renderCotas();
    renderEmprestimos();
    renderCashbacks();
}
