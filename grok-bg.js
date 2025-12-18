// grok-bg.js
// Monochrome "Grok-alive" background: layered particles + orbiting wisps + subtle parallax.
// Drop this file in your repo root (same folder as index.html) and keep <canvas id="grokCanvas"> in HTML.

(() => {
  const canvas = document.getElementById("grokCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  // Respect reduced motion
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let w = 0, h = 0;
  let mx = 0, my = 0;          // normalized mouse (-1..1)
  let targetMx = 0, targetMy = 0;

  // Tunables (kept conservative for performance)
  const CFG = {
    starCount: reduceMotion ? 60 : 140,
    dustCount: reduceMotion ? 80 : 220,
    wispCount: reduceMotion ? 2 : 4,
    maxFps: reduceMotion ? 30 : 60,
    parallax: 0.55,            // parallax intensity
    vignetteStrength: 0.62,
    contrastBoost: 1.08,       // slight pop
  };

  // Entities
  let stars = [];
  let dust = [];
  let wisps = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function resize() {
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Re-seed to match new size (gentle)
    seed();
  }

  function seed() {
    stars = new Array(CFG.starCount).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.6, 1.7),
      a: rand(0.08, 0.22),
      tw: rand(0.4, 1.6),     // twinkle speed
      p: rand(0, Math.PI * 2),
      z: rand(0.15, 1.0),     // depth
    }));

    dust = new Array(CFG.dustCount).fill(0).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.6, 2.8),
      a: rand(0.02, 0.07),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.06, 0.06),
      z: rand(0.1, 1.2),
      p: rand(0, Math.PI * 2),
      s: rand(0.6, 1.5),
    }));

    // Wisps are orbiting soft gradients (monochrome)
    wisps = new Array(CFG.wispCount).fill(0).map((_, i) => ({
      cx: w * rand(0.25, 0.75),
      cy: h * rand(0.25, 0.75),
      radius: rand(Math.min(w, h) * 0.18, Math.min(w, h) * 0.42),
      speed: rand(0.00035, 0.00075) * (i % 2 ? 1 : -1),
      phase: rand(0, Math.PI * 2),
      strength: rand(0.06, 0.12),
      scale: rand(1.2, 1.8),
      z: rand(0.2, 1.0),
    }));
  }

  // Mouse / touch parallax
  function onMove(clientX, clientY) {
    const nx = (clientX / w) * 2 - 1;
    const ny = (clientY / h) * 2 - 1;
    targetMx = clamp(nx, -1, 1);
    targetMy = clamp(ny, -1, 1);
  }

  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (!e.touches?.length) return;
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Animation timing
  let last = 0;
  const minFrame = 1000 / CFG.maxFps;

  function clear() {
    // Deep base
    ctx.clearRect(0, 0, w, h);
    // Slight dark fill to stabilize alpha blending
    ctx.fillStyle = "rgba(5,6,8,0.60)";
    ctx.fillRect(0, 0, w, h);
  }

  function drawWisps(t) {
    // Very soft orbiting monochrome glows
    for (const wp of wisps) {
      const ang = wp.phase + t * wp.speed;
      const ox = Math.cos(ang) * wp.radius;
      const oy = Math.sin(ang * 0.9) * wp.radius * 0.65;

      const px = wp.cx + ox + (mx * 22 * wp.z * CFG.parallax);
      const py = wp.cy + oy + (my * 18 * wp.z * CFG.parallax);

      const r = wp.radius * 0.9 * wp.scale;

      const g = ctx.createRadialGradient(px, py, r * 0.08, px, py, r);
      // Monochrome: white -> transparent
      g.addColorStop(0, `rgba(255,255,255,${wp.strength})`);
      g.addColorStop(0.35, `rgba(255,255,255,${wp.strength * 0.55})`);
      g.addColorStop(1, "rgba(255,255,255,0)");

      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 1.05, r * 0.70, ang * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawStars(t) {
    ctx.globalCompositeOperation = "screen";
    for (const s of stars) {
      // Twinkle
      const tw = (Math.sin(t * s.tw + s.p) * 0.5 + 0.5);
      const a = s.a + tw * 0.12;

      const px = s.x + (mx * 18 * s.z * CFG.parallax);
      const py = s.y + (my * 14 * s.z * CFG.parallax);

      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawDust(t) {
    ctx.globalCompositeOperation = "screen";
    for (const d of dust) {
      // Float
      d.x += d.vx * d.z;
      d.y += d.vy * d.z;

      // tiny oscillation
      const ox = Math.cos(t * 0.0008 + d.p) * 8 * d.s;
      const oy = Math.sin(t * 0.0007 + d.p) * 6 * d.s;

      // wrap
      if (d.x < -40) d.x = w + 40;
      if (d.x > w + 40) d.x = -40;
      if (d.y < -40) d.y = h + 40;
      if (d.y > h + 40) d.y = -40;

      const px = d.x + ox + (mx * 26 * d.z * CFG.parallax);
      const py = d.y + oy + (my * 20 * d.z * CFG.parallax);

      const r = d.r * (0.9 + 0.25 * Math.sin(t * 0.001 + d.p));
      ctx.fillStyle = `rgba(255,255,255,${d.a})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function vignette() {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, Math.min(w, h) * 0.18, w * 0.5, h * 0.35, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.55, `rgba(0,0,0,${CFG.vignetteStrength * 0.35})`);
    g.addColorStop(1, `rgba(0,0,0,${CFG.vignetteStrength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function filmCurve() {
    // subtle contrast pop (cheap “curve”)
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(255,255,255,${(CFG.contrastBoost - 1) * 0.12})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  function animate(ts) {
    if (!last) last = ts;
    const dt = ts - last;

    if (dt < minFrame) {
      requestAnimationFrame(animate);
      return;
    }

    last = ts;

    // Smooth parallax
    mx += (targetMx - mx) * 0.06;
    my += (targetMy - my) * 0.06;

    clear();

    const t = ts;

    // Order matters
    drawWisps(t);
    drawDust(t);
    drawStars(t);

    filmCurve();
    vignette();

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize, { passive: true });

  resize();
  requestAnimationFrame(animate);
})();
