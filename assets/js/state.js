/* =============================
            STATE
   ============================= */

export const KEY = 'plataforma_cotas_v1';

export const state = JSON.parse(localStorage.getItem(KEY) || 'null') || {
  config: { inicio: '2024-12', fim: '2025-11' },
  pessoas: [],
  cotas: [],
  emprestimos: [],
  retornos: [],
  payouts: [],
  cashbacks: [],
  seqEmprestimo: 1,
  lock: { pin: '', locked: false }
};

export function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
