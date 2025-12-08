/* =============================================================
   MAIN.JS — OTIMIZADO
   Inicialização + Eventos + Integração com Módulos
============================================================= */

import { loadState } from "./state.js";
import { events } from "./events.js";
import { renderAll } from "./render.js";

/* -------------------------------------------------------------
   INICIALIZAÇÃO
------------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
    loadState();
    registrarEventosGlobais();
    renderAll();
});

/* -------------------------------------------------------------
   FUNÇÃO PARA REGISTRAR EVENTOS DO HTML
------------------------------------------------------------- */
function registrarEventosGlobais() {

    /* COTAS */
    const btnAddCota = document.getElementById("btn-add-cota");
    if (btnAddCota) {
        btnAddCota.addEventListener("click", () => {
            const pessoa = document.getElementById("cota-pessoa").value;
            const valor = document.getElementById("cota-valor").value;
            const data = document.getElementById("cota-data").value;

            events.registrarCota(pessoa, valor, data);
        });
    }

    /* EMPRÉSTIMOS */
    const btnAddEmp = document.getElementById("btn-add-emp");
    if (btnAddEmp) {
        btnAddEmp.addEventListener("click", () => {
            const pessoa = document.getElementById("emp-pessoa").value;
            const principal = document.getElementById("emp-principal").value;
            const juros = Number(document.getElementById("emp-juros").value);
            const data = document.getElementById("emp-data").value;
            const venc = document.getElementById("emp-venc").value;

            events.registrarEmprestimo(pessoa, principal, juros, data, venc);
        });
    }

    /* REGISTRAR FUNÇÕES GLOBAIS (botões dentro das tabelas) */
    window.events = events;

    // Prompt para pagamento
    window.events.registrarPagamentoPrompt = (id) => {
        const v = prompt("Informe o valor do pagamento:");
        if (!v) return;
        events.registrarPagamento(id, v);
    };
}
