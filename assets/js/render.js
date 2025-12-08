import { state } from "./state.js";
import { formatMoney } from "./utils.js";

/* ============================================================
   RENDERIZAÇÃO — SEÇÕES PRINCIPAIS
============================================================ */

export function renderKpis() {
    document.getElementById("kpi-total-cotas").textContent =
        formatMoney(state.cotas.reduce((s, c) => s + c.valor, 0));

    document.getElementById("kpi-passivo").textContent =
        formatMoney(state.cotas.reduce((s, c) => s + c.acrescimo, 0));

    document.getElementById("kpi-juros").textContent =
        formatMoney(state.emprestimos.reduce((s, e) => s + (e.total - e.principal), 0));
}

/* ============================================================
   TABELA DE COTAS
============================================================ */

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
            <td><button class="btn-ghost" onclick="window.events.excluirCota('${c.id}')">Excluir</button></td>
        `;

        body.appendChild(tr);
    });
}

/* ============================================================
   TABELA DE EMPRÉSTIMOS
============================================================ */

export function renderEmprestimos() {
    const body = document.getElementById("tbl-emp-body");
    if (!body) return;

    body.innerHTML = "";

    state.emprestimos.forEach(e => {
        const statusHtml = e.aberto
            ? `<span class="pill out">Aberto</span>`
            : `<span class="pill in">Fechado</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${e.data}</td>
            <td>${e.pessoa}<br><small>EMP-${e.id.slice(0, 4)} • Venc.: ${e.venc}</small></td>
            <td>${formatMoney(e.principal)}</td>
            <td>${e.jurosPercent}%</td>
            <td>${formatMoney(e.total)}</td>
            <td>${formatMoney(e.pago)}</td>
            <td>${statusHtml}</td>
            <td>
                ${e.aberto
                    ? `<button onclick="window.events.registrarPagamentoPrompt('${e.id}')" class="btn-ghost">Pagar</button>`
                    : `<button onclick="window.events.reabrirEmprestimo('${e.id}')" class="btn-ghost">Reabrir</button>`
                }
                <button onclick="window.events.excluirEmprestimo('${e.id}')" class="btn-ghost">Excluir</button>
            </td>
        `;

        body.appendChild(tr);
    });
}

/* ============================================================
   TABELA — CASHBACK POR CORRENTISTA (CORRIGIDO)
============================================================ */

export function renderCashbacks() {
    const body = document.getElementById("tbl-cashback-body");
    if (!body) return;

    body.innerHTML = "";

    if (!state.cashbacks.length) {
        body.innerHTML = `
            <tr><td colspan="2" class="muted">Nenhum cashback gerado.</td></tr>
        `;
        return;
    }

    // AGRUPAR POR CORRENTISTA
    const agrupado = {};
    state.cashbacks.forEach(cb => {
        if (!agrupado[cb.pessoa]) agrupado[cb.pessoa] = 0;
        agrupado[cb.pessoa] += cb.valor;
    });

    // RENDERIZAR AGRUPADO
    Object.keys(agrupado).forEach(pessoa => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${pessoa}</td>
            <td>${formatMoney(agrupado[pessoa])}</td>
        `;
        body.appendChild(tr);
    });
}

/* ============================================================
   ATUALIZAR TODAS AS SEÇÕES
============================================================ */

export function renderAll() {
    renderKpis();
    renderCotas();
    renderEmprestimos();
    renderCashbacks();
}
