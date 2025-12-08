import { state, saveState } from "./state.js";
import { formatMoney, parseMoney, uid } from "./utils.js";
import { renderAll } from "./render.js";

/* ============================================================
   EVENTO: Registrar Lançamento de Cotas
============================================================ */
export function registrarCota(correntista, valorStr, dataStr) {
    const valor = parseMoney(valorStr);
    if (!correntista || !valor || !dataStr) return;

    const acrescimo = valor * 0.10;

    state.cotas.push({
        id: uid(),
        pessoa: correntista,
        valor,
        acrescimo,
        data: dataStr
    });

    saveState();
    renderAll();
}

/* ============================================================
   EVENTO: Excluir Lançamento de Cotas
============================================================ */
export function excluirCota(id) {
    state.cotas = state.cotas.filter(c => c.id !== id);
    saveState();
    renderAll();
}

/* ============================================================
   EVENTO: Registrar Empréstimo
============================================================ */
export function registrarEmprestimo(pessoa, principalStr, jurosPercent, dataEmp, dataVenc) {
    const principal = parseMoney(principalStr);
    if (!pessoa || !principal || !dataEmp || !dataVenc) return;

    const jurosValor = principal * (jurosPercent / 100);
    const total = principal + jurosValor;

    state.emprestimos.push({
        id: uid(),
        pessoa,
        principal,
        jurosPercent,
        total,
        pago: 0,
        aberto: true,
        data: dataEmp,
        venc: dataVenc
    });

    saveState();
    renderAll();
}

/* ============================================================
   EVENTO: Registrar Pagamento de Empréstimo
============================================================ */
export function registrarPagamento(id, valorStr) {
    const valor = parseMoney(valorStr);
    if (!valor) return;

    const emp = state.emprestimos.find(e => e.id === id);
    if (!emp) return;

    emp.pago += valor;

    // FECHA AUTOMATICAMENTE QUANDO PAGO >= TOTAL
    if (emp.pago >= emp.total) {
        emp.aberto = false;

        /* ====================================================
             ⚡ CASHBACK — REGRA CORRIGIDA
             Antes: emp.principal > 250 (não gerava para 250 exato)
             Agora: emp.principal >= 250   ✔
        ===================================================== */
        if (emp.principal >= 250) {
            const cashback = emp.principal * 0.05;

            state.cashbacks.push({
                id: uid(),
                pessoa: emp.pessoa,
                valor: cashback,
                origem: emp.id,
                data: new Date().toISOString().slice(0, 10)
            });
        }
    }

    saveState();
    renderAll();
}

/* ============================================================
   EVENTO: Reabrir Empréstimo
============================================================ */
export function reabrirEmprestimo(id) {
    const emp = state.emprestimos.find(e => e.id === id);
    if (!emp) return;

    emp.aberto = true;

    // Remove cashback caso já tenha sido gerado
    state.cashbacks = state.cashbacks.filter(c => c.origem !== id);

    saveState();
    renderAll();
}

/* ============================================================
   EVENTO: Excluir Empréstimo
============================================================ */
export function excluirEmprestimo(id) {
    state.emprestimos = state.emprestimos.filter(e => e.id !== id);
    state.cashbacks = state.cashbacks.filter(c => c.origem !== id);

    saveState();
    renderAll();
}

/* ============================================================
   EXPORTA PARA main.js
============================================================ */
export const events = {
    registrarCota,
    excluirCota,
    registrarEmprestimo,
    registrarPagamento,
    reabrirEmprestimo,
    excluirEmprestimo
};
