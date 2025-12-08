/* =============================================================
   MÓDULO DE CÁLCULOS DO SISTEMA
   (juros, totais, passivos, agrupamentos e estatísticas)
============================================================= */

import { state } from "./state.js";

/* -------------------------------------------------------------
   TOTAL DE COTAS
------------------------------------------------------------- */
export function totalCotas() {
    return state.cotas.reduce((s, c) => s + c.valor, 0);
}

/* -------------------------------------------------------------
   TOTAL DO PASSIVO (10%)
------------------------------------------------------------- */
export function totalPassivo() {
    return state.cotas.reduce((s, c) => s + c.acrescimo, 0);
}

/* -------------------------------------------------------------
   TOTAL DE JUROS DE TODOS OS EMPRÉSTIMOS
------------------------------------------------------------- */
export function totalJuros() {
    return state.emprestimos.reduce((s, e) => {
        const juros = e.total - e.principal;
        return s + juros;
    }, 0);
}

/* -------------------------------------------------------------
   JUROS DE UM EMPRÉSTIMO (isolado)
------------------------------------------------------------- */
export function jurosEmprestimo(e) {
    return e.total - e.principal;
}

/* -------------------------------------------------------------
   SALDO DO FUNDO
   Fórmula:
   (Total de cotas + total de juros recebidos)
   - empréstimos abertos
   - valores pagos
------------------------------------------------------------- */
export function saldoFundo() {
    const totalC = totalCotas();
    const totalJ = totalJuros();

    // total liberado em empréstimos
    const totalEmp = state.emprestimos.reduce((s, e) => s + e.principal, 0);

    // total já pago para o fundo
    const totalPagamentos = state.emprestimos.reduce((s, e) => s + e.pago, 0);

    return (totalC + totalJ + totalPagamentos) - totalEmp;
}

/* -------------------------------------------------------------
   AGRUPAR CASHBACK POR CORRENTISTA
------------------------------------------------------------- */
export function cashbackPorPessoa() {
    const mapa = {};

    state.cashbacks.forEach(cb => {
        if (!mapa[cb.pessoa]) mapa[cb.pessoa] = 0;
        mapa[cb.pessoa] += cb.valor;
    });

    return mapa;
}

/* -------------------------------------------------------------
   TOTAL DE CASHBACK (todos os correntistas)
------------------------------------------------------------- */
export function totalCashback() {
    return state.cashbacks.reduce((s, cb) => s + cb.valor, 0);
}

/* -------------------------------------------------------------
   EMPRÉSTIMOS ABERTOS
------------------------------------------------------------- */
export function emprestimosAbertos() {
    return state.emprestimos.filter(e => e.aberto);
}

/* -------------------------------------------------------------
   EMPRÉSTIMOS FECHADOS
------------------------------------------------------------- */
export function emprestimosFechados() {
    return state.emprestimos.filter(e => !e.aberto);
}

/* -------------------------------------------------------------
   TOTAL DE EMPRÉSTIMOS ABERTOS (somente principal)
------------------------------------------------------------- */
export function totalEmprestimosAbertos() {
    return emprestimosAbertos().reduce((s, e) => s + e.principal, 0);
}

/* -------------------------------------------------------------
   TOTAL DE EMPRÉSTIMOS FECHADOS (somente principal)
------------------------------------------------------------- */
export function totalEmprestimosFechados() {
    return emprestimosFechados().reduce((s, e) => s + e.principal, 0);
}
