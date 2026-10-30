/* ====== CONFIG ======
   Pegá acá la URL de un webhook de Discord para recibir dibujos y preguntas.
   Si queda vacío, "enviar" baja el dibujo como PNG y las preguntas no se envían.
   OJO: la URL queda visible en el código; si te hacen spam, borrá el webhook y creá otro. */
const WEBHOOK = "";

const $ = (s, r = document) => r.querySelector(s);

/* ---------- DRAWBOX ---------- */
(() => {
  const box = $('[data-type="gimmick-canvas"]');
  if (!box) return;
  const cv = $('canvas', box), ctx = cv.getContext('2d');
  const size = $('.canvSizing input', box), col = $('#colpick', box);
  col.value = '#000000';
  const hist = [];
  let drawing = false, last = null;

  const reset = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.lineCap = ctx.lineJoin = 'round'; };
  reset();
  const snap = () => { hist.push(ctx.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 30) hist.shift(); };
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  const w = () => +size.value * 2.5;

  cv.addEventListener('pointerdown', e => {
    snap(); drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId);
    ctx.fillStyle = col.value; ctx.beginPath(); ctx.arc(last.x, last.y, w() / 2, 0, 7); ctx.fill();
  });
  cv.addEventListener('pointermove', e => {
    if (!drawing) return;
    const p = pos(e);
    ctx.strokeStyle = col.value; ctx.lineWidth = w();
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
  });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => drawing = false));
  $('.fa-undo', box).addEventListener('click', () => { const h = hist.pop(); if (h) ctx.putImageData(h, 0, 0); });

  const download = () => { const a = document.createElement('a'); a.download = 'dibujo.png'; a.href = cv.toDataURL('image/png'); a.click(); };
  const done = $('.completionCasso button', box);
  done.addEventListener('click', () => { download(); box.classList.remove('doneArt'); });

  $('.sendPicasso button', box).addEventListener('click', () => {
    if (!WEBHOOK) { box.classList.add('doneArt'); return; }
    cv.toBlob(async blob => {
      const f = new FormData();
      f.append('content', 'Nuevo dibujo anónimo');
      f.append('file', blob, 'dibujo.png');
      try { const r = await fetch(WEBHOOK, { method: 'POST', body: f }); if (r.ok) { box.classList.add('doneArt'); reset(); hist.length = 0; } else alert('No se pudo enviar.'); }
      catch (e) { alert('No se pudo enviar.'); }
    }, 'image/png');
  });
})();

/* ---------- AMA (preguntas anónimas) ---------- */
(() => {
  const box = $('[data-type="gimmick-ama"]');
  if (!box) return;
  const input = $('.asker input', box), btn = $('.askerSend button', box);
  btn.addEventListener('click', async () => {
    const q = input.value.trim();
    if (!q) return;
    if (!WEBHOOK) { alert('Falta configurar WEBHOOK en script.js'); return; }
    try {
      const r = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Pregunta anónima: ' + q.slice(0, 288) }) });
      if (r.ok) { input.value = ''; btn.textContent = '¡Enviado! ♥'; setTimeout(() => btn.textContent = 'Enviar anónimamente ✍️🤫', 2000); }
    } catch (e) { alert('No se pudo enviar.'); }
  });
  $('.askVoice', box)?.remove();
  $('.askExtra', box)?.remove();
})();

/* ---------- Reproductor de canciones ---------- */
let audio = null;
document.querySelectorAll('[data-type="spotify"]').forEach(el => {
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    const src = el.dataset.sound;
    if (!src) return;
    if (audio) { audio.pause(); if (audio.dataset.src === src) { audio = null; return; } }
    audio = new Audio(src); audio.dataset.src = src; audio.play();
  });
});
