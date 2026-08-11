// BARRACA — script.js

// Header con fondo al hacer scroll
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Menú móvil
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");
if (burger && nav) {
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", open);
  });
}

// Animaciones de entrada al hacer scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ============================================================
// Nube de partículas de fondo
// Un único grupo enorme que ocupa casi toda la pantalla y
// fluye muy despacio como un fluido, empujado por un campo
// de corrientes. El cursor abre huecos en la masa y la
// palabra "sound" emite ondas que la atraviesan.
// ============================================================
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "particles";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const ROJO = "255, 0, 51";
  const mouse = { x: -9999, y: -9999 };
  let puntos = [];
  let ondas = [];
  let w, h, raf;
  let t = 0; // tiempo de la simulación

  const rand = (a, b) => a + Math.random() * (b - a);

  const HUIDA = 150;   // radio de huida del cursor
  const VEL_TOPE = 3.8; // velocidad máxima al huir

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // un solo grupo gigante: disco que cubre casi toda la pantalla
    const R = Math.max(w, h) * 0.46;
    const n = Math.min(650, Math.floor((w * h) / 2100));
    puntos = Array.from({ length: n }, () => {
      const ang = rand(0, Math.PI * 2);
      const rad = Math.sqrt(Math.random()) * R; // reparto uniforme en el disco
      return {
        // ancla: su sitio dentro del grupo
        ox: Math.cos(ang) * rad,
        oy: Math.sin(ang) * rad,
        x: w / 2 + Math.cos(ang) * rad,
        y: h / 2 + Math.sin(ang) * rad,
        vx: 0,
        vy: 0,
        radio: rand(1, 2),
        alfa: rand(0.35, 0.85),
        fase: rand(0, Math.PI * 2)
      };
    });
  }

  function step() {
    t += 0.0035; // ritmo general: muy lento
    ctx.clearRect(0, 0, w, h);

    // el centro del grupo deriva suavemente por la pantalla
    const cx = w / 2 + Math.sin(t * 0.7) * w * 0.06;
    const cy = h / 2 + Math.cos(t * 0.5) * h * 0.06;
    // y el grupo entero rota de forma casi imperceptible
    const rot = t * 0.12;
    const cosR = Math.cos(rot), sinR = Math.sin(rot);

    for (const p of puntos) {
      // 1) tirón elástico hacia su sitio en el grupo (mantiene la masa unida)
      const ax = cx + p.ox * cosR - p.oy * sinR;
      const ay = cy + p.ox * sinR + p.oy * cosR;
      p.vx += (ax - p.x) * 0.0022;
      p.vy += (ay - p.y) * 0.0022;

      // 2) campo de corrientes: flujo orgánico dentro de la masa
      const ang =
        Math.sin(p.x * 0.0022 + t) +
        Math.cos(p.y * 0.0022 - t * 0.8) +
        p.fase * 0.05;
      p.vx += Math.cos(ang) * 0.016;
      p.vy += Math.sin(ang) * 0.016;

      // 3) huida del cursor
      const dxm = p.x - mouse.x, dym = p.y - mouse.y;
      const dm2 = dxm * dxm + dym * dym;
      if (dm2 < HUIDA * HUIDA) {
        const d = Math.sqrt(dm2) || 1;
        const f = (HUIDA - d) / HUIDA;
        // empuje en velocidad + desplazamiento directo (respuesta instantánea)
        p.vx += (dxm / d) * f * 1.6;
        p.vy += (dym / d) * f * 1.6;
        p.x += (dxm / d) * f * 1.4;
        p.y += (dym / d) * f * 1.4;
      }

      // 4) empuje de las ondas de "sound"
      for (const o of ondas) {
        const dxo = p.x - o.x, dyo = p.y - o.y;
        const d = Math.sqrt(dxo * dxo + dyo * dyo) || 1;
        if (Math.abs(d - o.r) < 46) {
          p.vx += (dxo / d) * o.fuerza;
          p.vy += (dyo / d) * o.fuerza;
        }
      }

      // fricción alta: todo vuelve a la calma enseguida
      p.vx *= 0.94;
      p.vy *= 0.94;

      // límite de velocidad
      const v = Math.hypot(p.vx, p.vy);
      if (v > VEL_TOPE) {
        p.vx = (p.vx / v) * VEL_TOPE;
        p.vy = (p.vy / v) * VEL_TOPE;
      }

      p.x += p.vx;
      p.y += p.vy;
    }

    // dibujar: circulitos rojos pequeños
    for (const p of puntos) {
      ctx.fillStyle = `rgba(${ROJO}, ${p.alfa})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fill();
    }

    // ondas de "sound"
    ondas = ondas.filter((o) => o.alfa > 0.02);
    for (const o of ondas) {
      o.r += o.velocidad;
      o.alfa *= 0.94;
      o.fuerza *= 0.9;
      ctx.strokeStyle = `rgba(${ROJO}, ${o.alfa})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    raf = requestAnimationFrame(step);
  }

  // API para que "sound" emita ondas
  window.__emitirOnda = (x, y) => {
    ondas.push({ x, y, r: 10, velocidad: 8, alfa: 0.6, fuerza: 2.8 });
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(step);
  });

  resize();
  raf = requestAnimationFrame(step);
})();

// ============================================================
// La palabra "sound": al pasar el cursor, emite una onda
// y se transforma letra a letra en "barraca".
// Al salir, vuelve a "sound" con la misma animación.
// ============================================================
(() => {
  const palabra = document.querySelector(".hero__title .fina");
  if (!palabra) return;

  const SOUND = "sound";
  const BARRACA = "barraca";
  const GLIFOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ///\u25B2"; // letras + rayas + triángulo
  let intervalo = null;

  // efecto "descodificación": las letras barajan símbolos al azar
  // y se van fijando de izquierda a derecha hasta formar el objetivo
  const transformar = (objetivo) => {
    clearInterval(intervalo);
    let frame = 0;
    const total = objetivo.length;
    intervalo = setInterval(() => {
      let out = "";
      for (let i = 0; i < total; i++) {
        // cada letra se fija cuando la animación "pasa" por su posición
        if (frame / 2.2 > i) {
          out += objetivo[i];
        } else {
          out += GLIFOS[Math.floor(Math.random() * GLIFOS.length)];
        }
      }
      palabra.textContent = out;
      frame++;
      if (frame / 2.2 > total) {
        palabra.textContent = objetivo;
        clearInterval(intervalo);
      }
    }, 34);
  };

  const emitirOnda = () => {
    if (window.__emitirOnda) {
      const r = palabra.getBoundingClientRect();
      window.__emitirOnda(r.left + r.width / 2, r.top + r.height / 2);
    }
  };

  palabra.addEventListener("pointerenter", () => {
    emitirOnda();
    transformar(BARRACA);
  });

  palabra.addEventListener("pointerleave", () => {
    transformar(SOUND);
  });

  palabra.addEventListener("click", emitirOnda);
})();
