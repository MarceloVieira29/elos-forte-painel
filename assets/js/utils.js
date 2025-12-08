/* =============================================================
   FUNÇÕES UTILITÁRIAS DO SISTEMA
   (formatar valores, datas, ids e conversões)
============================================================= */

/* -------------------------------------------------------------
   GERAR ID ÚNICO
------------------------------------------------------------- */
export function uid() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 8)
    ).toUpperCase();
}

/* -------------------------------------------------------------
   FORMATAR NÚMERO EM MOEDA (R$)
------------------------------------------------------------- */
export function formatMoney(valor) {
    const num = Number(valor || 0);

    return num.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* -------------------------------------------------------------
   REMOVER FORMATAÇÃO E RETORNAR NÚMERO
   Aceita formatos como:
   - "1.234,56"
   - "1234,56"
   - "1234.56"
   - "R$ 1.234,56"
------------------------------------------------------------- */
export function parseMoney(str) {
    if (!str) return 0;

    return Number(
        String(str)
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
    ) || 0;
}

/* -------------------------------------------------------------
   DATA ATUAL EM FORMATO YYYY-MM-DD
------------------------------------------------------------- */
export function today() {
    return new Date().toISOString().slice(0, 10);
}

/* -------------------------------------------------------------
   ADICIONAR MESES A UMA DATA
------------------------------------------------------------- */
export function addMonths(dateStr, qtd) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + qtd);
    return d.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------
   EXTRAIR "YYYY-MM" DE UMA DATA
------------------------------------------------------------- */
export function monthOnly(dateStr) {
    return String(dateStr).slice(0, 7);
}

/* -------------------------------------------------------------
   ORDENAR LISTAS POR DATA (YYYY-MM-DD)
------------------------------------------------------------- */
export function sortByDate(arr, field = "data") {
    return arr.sort((a, b) => {
        return String(a[field]).localeCompare(String(b[field]));
    });
}
