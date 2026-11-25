// ===== Cards, questões e imagens =====
const arts = [...document.querySelectorAll("article.post")];
const cards = document.getElementById("cards");
arts.forEach((a) => {
  const c = document.createElement("a");
  c.className = "card";
  c.href = "#" + a.id;
  const img = a.querySelector("img.capa"),
    src = img ? img.getAttribute("src") : "";
  c.innerHTML =
    '<img class="cv" alt="" src="' +
    src +
    '"><div class="b"><span class="badge">' +
    a.querySelector(".badge").textContent +
    "</span><h3>" +
    a.querySelector("h2").textContent +
    "</h3><p>" +
    a.querySelector(".lead").textContent +
    "</p></div>";
  c.querySelector("img").addEventListener("error", (e) =>
    e.target.removeAttribute("src"),
  );
  cards.appendChild(c);
});
document.querySelectorAll("img.capa").forEach((i) =>
  i.addEventListener("error", () => {
    i.style.display = "none";
  }),
);

// Transforma cada <details class="q"> em questão com alternativas clicáveis
document.querySelectorAll("details.q").forEach((d, n) => {
  const enun = d.querySelector("summary").innerHTML;
  const opts = [...d.querySelectorAll("ol li")].map((li) => li.textContent);
  const gabP = d.querySelector(".gab");
  const letra = gabP.textContent.match(/Gabarito:\s*([A-E])/)[1];
  const expl = gabP.textContent.replace(/Gabarito:\s*[A-E]\.?\s*/, "");
  const box = document.createElement("div");
  box.className = "q";
  const L = "ABCDE";
  box.innerHTML =
    "<fieldset><legend>" +
    enun +
    "</legend>" +
    opts
      .map(
        (o, i) =>
          '<label class="opt"><input type="radio" name="q' +
          n +
          '" value="' +
          L[i] +
          '"><span><b>' +
          L[i] +
          ")</b> " +
          o +
          "</span></label>",
      )
      .join("") +
    '</fieldset><button class="btn" type="button">Responder</button><div class="res" role="status"></div>';
  const res = box.querySelector(".res");
  box.querySelector("button").addEventListener("click", () => {
    const s = box.querySelector("input:checked");
    if (!s) {
      res.className = "res no";
      res.textContent = "Selecione uma alternativa.";
      return;
    }
    if (s.value === letra) {
      res.className = "res ok";
      res.textContent = "✔ Resposta correta! " + expl;
    } else {
      res.className = "res no";
      res.textContent = "✘ Resposta incorreta. Tente novamente.";
    }
  });
  d.replaceWith(box);
});

document.querySelectorAll(".questoes h3").forEach((h) => (h.className = "qt"));

// ===== Indicador lateral de leitura =====
(function () {
  const aside = document.getElementById("lateral");
  let html =
    '<a class="voltar" href="#artigos">↑ Voltar aos cards</a><div class="lt">Você está lendo</div><ol>';
  arts.forEach((a, i) => {
    const curto = a.querySelector("h2").textContent.split(":")[0];
    const subs = [...a.querySelectorAll(":scope > h3")]
      .map((s, k) => {
        s.id = a.id + "-s" + k;
        return '<li><a href="#' + s.id + '">' + s.textContent + "</a></li>";
      })
      .join("");
    html +=
      '<li class="it" data-id="' +
      a.id +
      '"><a class="main" href="#' +
      a.id +
      '"><b>' +
      (i + 1) +
      "</b> " +
      curto +
      '</a><span class="bar"><i></i></span><ul>' +
      subs +
      "</ul></li>";
  });
  aside.innerHTML =
    html +
    '</ol><div class="geral"><span>Progresso geral</span><span class="bar"><i id="geralBar"></i></span></div>';
  const itens = [...aside.querySelectorAll(".it")];
  let tick = false;
  function update() {
    tick = false;
    const y = window.innerHeight * 0.3;
    let atual = null;
    arts.forEach((a) => {
      if (a.getBoundingClientRect().top <= y) atual = a;
    });
    const area = document.querySelector(".artigos").getBoundingClientRect();
    const inArea = area.top <= y && area.bottom > 0;
    aside.classList.toggle("visivel", inArea);
    itens.forEach((it) => {
      const on = atual && it.dataset.id === atual.id && inArea;
      it.classList.toggle("ativo", on);
      const bar = it.querySelector(".bar i");
      if (on) {
        const r = atual.getBoundingClientRect(),
          p = Math.min(1, Math.max(0, (y - r.top) / (r.height - y * 0.5)));
        bar.style.width = p * 100 + "%";
        let sub = null;
        atual.querySelectorAll(":scope > h3").forEach((s) => {
          if (s.getBoundingClientRect().top <= y) sub = s.id;
        });
        it.querySelectorAll("ul a").forEach((l) =>
          l.classList.toggle("sub-ativo", l.getAttribute("href") === "#" + sub),
        );
        const m = it.querySelector(".main");
        if (window.innerWidth <= 900 && aside.scrollWidth > aside.clientWidth)
          it.scrollIntoView({ inline: "center", block: "nearest" });
      } else
        bar.style.width =
          itens.indexOf(it) < arts.indexOf(atual) && inArea ? "100%" : "0%";
    });
    const total = area.height - window.innerHeight * 0.7;
    document.getElementById("geralBar").style.width =
      Math.min(100, Math.max(0, ((-area.top + y) / total) * 100)) + "%";
  }
  addEventListener(
    "scroll",
    () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  addEventListener("resize", update);
  update();
})();

// ===== Globo (do blog antigo) =====
(function () {
  const cv = document.getElementById("globe");
  if (!cv) return;
  const ctx = cv.getContext("2d"),
    lbl = document.getElementById("gl");
  const L = [
    // contornos simplificados [lon, lat]
    [
      [-168, 66],
      [-140, 70],
      [-110, 72],
      [-85, 70],
      [-62, 60],
      [-55, 48],
      [-70, 42],
      [-76, 35],
      [-81, 25],
      [-90, 29],
      [-97, 26],
      [-97, 18],
      [-88, 15],
      [-83, 9],
      [-78, 8],
      [-86, 12],
      [-95, 16],
      [-105, 20],
      [-112, 30],
      [-118, 34],
      [-124, 40],
      [-125, 49],
      [-135, 57],
      [-150, 60],
      [-165, 60],
    ],
    [
      [-78, 8],
      [-72, 12],
      [-62, 10],
      [-52, 5],
      [-50, 0],
      [-35, -6],
      [-39, -14],
      [-41, -22],
      [-48, -26],
      [-58, -35],
      [-65, -41],
      [-68, -52],
      [-72, -54],
      [-75, -47],
      [-73, -37],
      [-71, -28],
      [-70, -18],
      [-76, -14],
      [-81, -5],
      [-80, 0],
      [-77, 4],
    ],
    [
      [-17, 21],
      [-10, 30],
      [-6, 36],
      [10, 37],
      [20, 32],
      [32, 31],
      [35, 28],
      [43, 12],
      [51, 12],
      [40, -3],
      [40, -15],
      [35, -25],
      [27, -34],
      [18, -34],
      [12, -18],
      [9, -1],
      [9, 4],
      [-8, 4],
      [-17, 14],
    ],
    [
      [-9, 37],
      [-9, 43],
      [-2, 48],
      [5, 53],
      [10, 57],
      [5, 62],
      [15, 69],
      [30, 71],
      [60, 69],
      [80, 73],
      [110, 77],
      [140, 72],
      [180, 68],
      [170, 60],
      [160, 55],
      [140, 52],
      [142, 46],
      [130, 42],
      [122, 40],
      [122, 30],
      [110, 20],
      [106, 10],
      [100, 13],
      [100, 3],
      [104, 1],
      [98, 8],
      [92, 22],
      [80, 15],
      [77, 8],
      [72, 20],
      [67, 25],
      [57, 25],
      [50, 30],
      [54, 24],
      [59, 22],
      [52, 13],
      [43, 13],
      [35, 30],
      [36, 36],
      [27, 37],
      [26, 41],
      [22, 37],
      [16, 41],
      [12, 44],
      [16, 38],
      [8, 44],
      [3, 43],
      [-2, 37],
    ],
    [
      [114, -22],
      [122, -18],
      [130, -12],
      [137, -12],
      [142, -11],
      [146, -19],
      [153, -26],
      [150, -37],
      [141, -38],
      [135, -34],
      [130, -32],
      [115, -34],
    ],
    [
      [-55, 60],
      [-45, 60],
      [-20, 70],
      [-20, 82],
      [-60, 82],
      [-70, 76],
    ],
    [
      [-5, 50],
      [1, 51],
      [-2, 57],
      [-6, 58],
    ],
    [
      [-180, -72],
      [-120, -74],
      [-60, -72],
      [0, -70],
      [60, -68],
      [120, -66],
      [180, -72],
      [180, -90],
      [-180, -90],
    ],
  ].map((p) => {
    const o = [];
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length],
        n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
      for (let k = 0; k < n; k++)
        o.push([
          a[0] + ((b[0] - a[0]) * k) / n,
          a[1] + ((b[1] - a[1]) * k) / n,
        ]);
    });
    return o;
  });
  const R = Math.PI / 180;
  let lon0 = -50;
  const lat0 = 10,
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function proj(lo, la, r, c) {
    const dl = (lo - lon0) * R,
      p = la * R,
      p0 = lat0 * R;
    let x = Math.cos(p) * Math.sin(dl),
      y =
        Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl);
    const z =
      Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl);
    if (z < 0) {
      const m = Math.hypot(x, y) || 1;
      x /= m;
      y /= m;
    }
    return [c + x * r, c - y * r, z > 0];
  }
  function draw() {
    const d = devicePixelRatio || 1,
      w = cv.clientWidth;
    if (!w) return;
    if (cv.width !== w * d) {
      cv.width = cv.height = w * d;
    }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, w, w);
    const c = w / 2,
      r = c - 4;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, 7);
    ctx.fillStyle = "#2c6b86";
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "#f1ead8";
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let lo = -180; lo < 180; lo += 30) {
      ctx.beginPath();
      let pen = false;
      for (let la = -90; la <= 90; la += 3) {
        const q = proj(lo, la, r, c);
        if (q[2]) {
          pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
          pen = true;
        } else pen = false;
      }
      ctx.stroke();
    }
    for (let la = -60; la <= 60; la += 30) {
      ctx.beginPath();
      let pen = false;
      for (let lo = -180; lo <= 180; lo += 3) {
        const q = proj(lo, la, r, c);
        if (q[2]) {
          pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
          pen = true;
        } else pen = false;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#d9c98f";
    ctx.strokeStyle = "#12372a";
    ctx.lineWidth = 1.5;
    L.forEach((p) => {
      ctx.beginPath();
      p.forEach((pt, i) => {
        const q = proj(pt[0], pt[1], r, c);
        i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
    ctx.beginPath();
    ctx.arc(c, c, r, 0, 7);
    ctx.strokeStyle = "#f1ead8";
    ctx.lineWidth = 2;
    ctx.stroke();
    let ln = ((lon0 + 540) % 360) - 180;
    lbl.textContent = "Lon " + Math.round(ln) + "° · Lat " + lat0 + "°";
  }
  let t = 0;
  (function tick() {
    if (!reduce) {
      lon0 += 0.12;
      if (++t % 6 === 0 || t === 1) draw();
      requestAnimationFrame(tick);
    }
  })();
  draw();
  addEventListener("resize", draw);
})();
