import { state } from "./state.js";
import { today } from "./utils.js";

/* =============================
            CÁLCULOS
   ============================= */

export const cicloAtualLabel = () =>
  `${state.config.inicio} → ${state.config.fim}`;

export function cicloDeData(dateStr) {
  const m = (dateStr || today()).slice(0, 7);
  const inicio = state.config.inicio;
  const fim = state.config.fim;
  const label = `${inicio} → ${fim}`;

  if (m >= inicio && m <= fim) return label;
  return m;
}

export const totalCotas = (ciclo) =>
  state.cotas
    .filter(c => !ciclo || c.ciclo === ciclo)
    .reduce((s, c) => s + Number(c.valor), 0);

export const passivo10 = (ciclo) => {
  const base = totalCotas(ciclo) * 0.10;
  const pagos = state.payouts
    .filter(p => p.ciclo === ciclo)
    .reduce((s, p) => s + Number(p.valor) / 11, 0);
  return Math.max(0, base - pagos);
};

export const jurosRecebidos = () =>
  state.retornos
    .filter(r => r.tipo.trim() !== "principal")
    .reduce((s, r) => s + Number(r.valor), 0);

export const totalRetornos = () =>
  state.retornos.reduce((s, r) => s + Number(r.valor), 0);

export const totalPayouts = () =>
  state.payouts.reduce((s, p) => s + Number(p.valor), 0);

export const totalEmprestimosLiberados = () =>
  state.emprestimos.reduce((s, e) => s + Number(e.principal), 0);

export const saldoFundo = () =>
  totalCotas() + totalRetornos() - totalEmprestimosLiberados() - totalPayouts();
