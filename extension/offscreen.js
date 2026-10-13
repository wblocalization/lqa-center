/* Звуки уведомлений. Service worker сам играть звук не умеет, поэтому играем здесь,
   в скрытом offscreen-документе. Звуки синтезируются Web Audio, файлов нет. */
let ctx = null;
const ac = () => (ctx = ctx || new AudioContext());

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(out, type, f0, f1, t, a, peak, d) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
  env(g, t, a, peak, d);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + a + d + 0.05);
}

/* кряк: пила с падающим тоном через «носовые» форманты */
function quack(out, t) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(560, t);
  o.frequency.linearRampToValueAtTime(470, t + 0.05);
  o.frequency.exponentialRampToValueAtTime(330, t + 0.17);
  const vib = c.createOscillator(), vg = c.createGain();
  vib.frequency.value = 38; vg.gain.value = 18;
  vib.connect(vg).connect(o.frequency);
  const mix = c.createGain(); mix.gain.value = 1;
  [[1100, 6, 1], [2500, 8, 0.55], [600, 4, 0.5]].forEach(([f, q, v]) => {
    const bp = c.createBiquadFilter(), bg = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; bg.gain.value = v;
    o.connect(bp).connect(bg).connect(mix);
  });
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1.5, t + 0.015);
  g.gain.setValueAtTime(1.5, t + 0.09);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
  mix.connect(g).connect(out);
  o.start(t); vib.start(t); o.stop(t + 0.22); vib.stop(t + 0.22);
}

const SOUNDS = {
  quack(out, t) { quack(out, t); quack(out, t + 0.24); },
  ding(out, t) { tone(out, 'sine', 1319, 1319, t, 0.005, 0.5, 1.2); tone(out, 'sine', 2637, 2637, t, 0.005, 0.15, 0.6); },
  pop(out, t) { tone(out, 'sine', 900, 180, t, 0.004, 0.8, 0.09); },
  coin(out, t) { tone(out, 'square', 988, 988, t, 0.003, 0.4, 0.08); tone(out, 'square', 1319, 1319, t + 0.08, 0.003, 0.4, 0.4); },
  tada(out, t) { [523, 659, 784, 1047].forEach((f, i) => tone(out, 'triangle', f, f, t + i * 0.09, 0.008, 0.7, i === 3 ? 0.7 : 0.18)); }
};

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== 'wlx-play-sound' || !SOUNDS[msg.sound]) return;
  const c = ac(), out = c.createGain();
  out.gain.value = 0.7;
  out.connect(c.destination);
  c.resume().then(() => SOUNDS[msg.sound](out, c.currentTime + 0.03));
});
