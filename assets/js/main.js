import { events } from "./events.js";
import { state, loadState } from "./state.js";
import { renderAll } from "./render.js";

/* ============================================================
   INICIALIZAÇÃO DO SISTEMA
============================================================ */

window.addEventListener("DOMContentLoaded", () => {
    loadState();
    anexarEventosGlobais();
    renderAll();
});

/* ============================================================
   EVENTOS GLOBAIS (BOTÕES DO HTML)
============================================================ */

function anexarEventosGlobais() {

    /* --------------------------------------------------------
       LANÇAMENTOS (COTAS)
    -------------------------------------------------------- */

    // Botão "Adicionar Lançamento"
    const btnAddCota = document.getElementById("btn-add-cota");
    if (btnAddCota) {
        btnAddCota.addEventListener("click", () => {
            const pessoa = document.getElementById("cota-pessoa").value;
            const valor = document.getElementById("cota-valor").value;
            const data = document.getElementById("cota-data").value;

            events.registrarCota(pessoa, valor, data);
        });
    }

    /* --------------------------------------------------------
       EMPRÉSTIMOS
    -------------------------------------------------------- */

    // Botão Registrar Empréstimo
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

    /* --------------------------------------------------------
       PAGAMENTO DE EMPRÉSTIMO (PROMPT)
    -------------------------------------------------------- */

    // Torna acessível pelo HTML
    window.events = events;

    // Criar função global chamada pelo botão "Pagar"
    window.events.registrarPagamentoPrompt = (id) => {
        const valor = prompt("Informe o valor do pagamento:");

        if (!valor) return;

        events.registrarPagamento(id, valor);
    };
}

/* ============================================================
   EXPORTAÇÃO (SE PRECISAR)
============================================================ */
export const app = {
    renderAll,
};
