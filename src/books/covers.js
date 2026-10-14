async function createFallbackCover(t, i, l) {
  const s = document.createElement('canvas');
  s.width = 480;
  s.height = 720;
  const o = s.getContext('2d');
  const c = coverPalettes[Math.abs(hashTitle(t)) % coverPalettes.length];
  const h = o.createLinearGradient(0, 0, 480, 720);
  h.addColorStop(0, c[0]);
  h.addColorStop(0.52, c[1]);
  h.addColorStop(1, c[2]);
  o.fillStyle = h;
  o.fillRect(0, 0, 480, 720);
  o.globalAlpha = 0.22;
  o.fillStyle = '#fff';
  o.beginPath();
  o.arc(390, 96, 180, 0, Math.PI * 2);
  o.fill();
  o.globalAlpha = 0.16;
  o.beginPath();
  o.arc(72, 660, 230, 0, Math.PI * 2);
  o.fill();
  o.globalAlpha = 1;
  const d = o.createLinearGradient(52, 78, 420, 650);
  d.addColorStop(0, 'rgba(255,255,255,.36)');
  d.addColorStop(1, 'rgba(255,255,255,.08)');
  o.fillStyle = d;
  drawRoundedRect(o, 44, 60, 392, 600, 42);
  o.fill();
  o.strokeStyle = 'rgba(255,255,255,.52)';
  o.lineWidth = 2;
  o.stroke();
  o.fillStyle = 'rgba(255,255,255,.78)';
  o.font = '600 20px system-ui, sans-serif';
  o.fillText(l.toUpperCase(), 78, 118);
  o.fillStyle = '#fff';
  o.font = '700 47px "Microsoft YaHei", system-ui, sans-serif';
  wrapCoverTitle(o, t, 324).forEach((m, y) => o.fillText(m, 78, 260 + y * 64));
  o.fillStyle = 'rgba(255,255,255,.78)';
  o.font = '500 22px "Microsoft YaHei", system-ui, sans-serif';
  o.fillText(i || '本地图书', 78, 590);
  return s.toDataURL('image/jpeg', 0.88);
}
async function resizeCover(t) {
  try {
    const i = await createImageBitmap(t);
    const l = Math.min(480 / i.width, 720 / i.height, 1);
    const s = document.createElement('canvas');
    s.width = Math.max(1, Math.round(i.width * l));
    s.height = Math.max(1, Math.round(i.height * l));
    s.getContext('2d').drawImage(i, 0, 0, s.width, s.height);
    i.close();
    return s.toDataURL('image/jpeg', 0.88);
  } catch {
    return await new Promise((i, l) => {
      const s = new FileReader();
      s.onload = () => i(String(s.result));
      s.onerror = () => l(s.error);
      s.readAsDataURL(t);
    });
  }
}
const coverPalettes = [
  ['#e55b8c', '#8039b4', '#24398f'],
  ['#f6b73c', '#e6604d', '#9c2f62'],
  ['#5bc7c1', '#2387a5', '#3f467c'],
  ['#86b86b', '#328276', '#233f64'],
  ['#b69cff', '#6d69d8', '#32427a'],
];
const hashTitle = (t) => [...t].reduce((i, l) => ((i << 5) - i + l.charCodeAt(0)) | 0, 0);
function drawRoundedRect(t, i, l, s, o, c) {
  t.beginPath();
  t.roundRect(i, l, s, o, c);
}
const wrapCoverTitle = (t, i, l) => {
  const s = [...i];
  const o = [];
  let c = '';
  for (const h of s) {
    const d = c + h;
    if ((t.measureText(d).width > l && c ? (o.push(c), (c = h)) : (c = d), o.length === 3)) break;
  }
  c && o.length < 4 && o.push(c);
  return o;
};
export {
  createFallbackCover,
  resizeCover,
  coverPalettes,
  hashTitle,
  drawRoundedRect,
  wrapCoverTitle,
};
