/* =============================
              UTILS
   ============================= */

export const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export const fmt = n => BRL.format(Number(n || 0));

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const today = () =>
  new Date().toISOString().slice(0, 10);

export function download(filename, content, mime = 'application/octet-stream') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
