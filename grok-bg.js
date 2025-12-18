(() => {
  const canvas = document.getElementById("grokCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const DPR = Math.min(2, window.devicePixelRatio || 1); // cap for performance
  let W = 0, H = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const N = 90;                 // particles count (safe)
  const LINK_DIST = 120;        // line distance
  const SPEED = 0.25;           // movement speed
  const particles = [];

  function rand(min, max) { return min + Math.random() * (max - min); }

  function seed() {
    particles.length = 0;
    for (let i = 0; i < N; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-SPEED, SPEED),
        vy: rand(-SPEED, SPEED),
        r: rand(0.7, 1.6),
        a: rand(0.06, 0.18) // alpha
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // subtle bloom-ish gradient (monochrome)
    const g = ctx.createRadialGradient(W * 0.25, H * 0.2, 0, W * 0.25, H * 0.2, Math.max(W, H));
    g.addColorStop(0, "rgba(255,255,255,0.035)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // update particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      if (p.y > H + 20) p.y = -20;
    }

    // links
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        const ld2 = LINK_DIST * LINK_DIST;
        if (d2 < ld2) {
          const t = 1 - d2 / ld2;
          ctx.strokeStyle = `rgba(255,255,255,${0.06 * t})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // dots
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  // Respect reduced motion
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  resize();
  seed();
  if (!reduced) step();

  window.addEventListener("resize", () => {
    resize();
    seed();
  }, { passive: true });
})();
