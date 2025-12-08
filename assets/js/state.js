/* =============================================================
   ESTADO GLOBAL DO SISTEMA
   (salvo automaticamente no localStorage)
============================================================= */

export const state = {
    cotas: [],
    emprestimos: [],
    cashbacks: [],

    config: {
        cicloInicio: "",
        cicloFim: "",
    }
};

/* =============================================================
   SALVAR NO LOCALSTORAGE
============================================================= */
export function saveState() {
    try {
        localStorage.setItem("elosForteState", JSON.stringify(state));
    } catch (err) {
        console.error("Erro ao salvar state:", err);
    }
}

/* =============================================================
   CARREGAR STATE DO LOCALSTORAGE
============================================================= */
export function loadState() {
    try {
        const raw = localStorage.getItem("elosForteState");

        if (!raw) {
            console.log("Nenhum state salvo encontrado. Iniciando novo.");
            return;
        }

        const data = JSON.parse(raw);

        // Garantia de segurança (caso falte algo)
        if (!data.cotas) data.cotas = [];
        if (!data.emprestimos) data.emprestimos = [];
        if (!data.cashbacks) data.cashbacks = [];
        if (!data.config) data.config = {};

        if (!data.config.cicloInicio) data.config.cicloInicio = "";
        if (!data.config.cicloFim) data.config.cicloFim = "";

        // Aplicar valores carregados
        state.cotas = data.cotas;
        state.emprestimos = data.emprestimos;
        state.cashbacks = data.cashbacks;
        state.config = data.config;

    } catch (err) {
        console.error("Erro ao carregar state:", err);
    }
}

/* =============================================================
   DEFINIR CICLO
============================================================= */
export function setCiclo(inicio, fim) {
    state.config.cicloInicio = inicio;
    state.config.cicloFim = fim;
    saveState();
}
