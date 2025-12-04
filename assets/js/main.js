import { state, save } from "./state.js";
import { today, addMonths } from "./utils.js";
import {
  renderAll,
  aplicarFiltros,
  setupTabs,
  setupEventHandlers,
  renderLockStatus
} from "./events.js";

/* =============================
             INIT
   ============================= */

function bootstrapPessoas() {
  if (!state.pessoas || state.pessoas.length === 0) {
    for (let i = 1; i <= 15; i++) {
      state.pessoas.push({ id: Date.now().toString(36) + i, nome: `Pessoa ${i}` });
    }
    save();
  }
}

function initInputsDefault() {
  const dHoje = today();
  const dNext = addMonths(dHoje, 1);

  const elEmpData = document.getElementById("emprestData");
  const elEmpVenc = document.getElementById("emprestVenc");
  const elRetData = document.getElementById("retornoData");
  const elDataCota = document.getElementById("dataCota");
  const cfgInicio = document.getElementById("cfgInicio");
  const cfgFim = document.getElementById("cfgFim");

  if (elEmpData) elEmpData.value = dHoje;
  if (elEmpVenc) elEmpVenc.value = dNext;
  if (elRetData) elRetData.value = dHoje;
  if (elDataCota && !elDataCota.value) elDataCota.value = dHoje;

  if (cfgInicio) cfgInicio.value = state.config.inicio;
  if (cfgFim) cfgFim.value = state.config.fim;
}

function init() {
  bootstrapPessoas();
  setupTabs();
  setupEventHandlers();
  initInputsDefault();
  renderAll();
  aplicarFiltros();
  renderLockStatus();
}

document.addEventListener("DOMContentLoaded", init);
