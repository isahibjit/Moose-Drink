/* ================= MOOSE DRINK — main.js ================= */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = window.matchMedia('(hover: hover) and (min-width: 1025px)').matches;
  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  /* ---------------- PRELOADER ---------------- */
  function runPreloader() {
    const bar = $('#preloader-bar');
    const pct = $('#preloader-pct');
    const pre = $('#preloader');
    const logo = $('#preloader-logo');
    let p = 0;
    const tick = () => {
      p += Math.random() * 12 + 4;
      if (p >= 100) p = 100;
      bar.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
      if (p < 100) {
        setTimeout(tick, 120);
      } else {
        setTimeout(() => {
          if (window.gsap && !prefersReduced) {
            gsap.timeline()
              .to(logo, { scale: 1.4, duration: .4, ease: 'power2.in' })
              .to(logo, { opacity: 0, filter: 'blur(10px)', duration: .3 }, '-=.1')
              .to(pre, { opacity: 0, duration: .5, onComplete: () => { pre.style.display = 'none'; } }, '-=.1')
              .add(startIntro);
          } else {
            pre.style.display = 'none';
            startIntro();
          }
        }, 300);
      }
    };
    tick();
  }

  /* ---------------- CUSTOM CURSOR ---------------- */
  function initCursor() {
    if (!isDesktop) return;
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    const label = $('.cursor-label');
    let mx = 0, my = 0, rx = 0, ry = 0;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    $$('[data-cursor], a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add('active');
        label.textContent = el.getAttribute('data-cursor') || '';
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('active');
        label.textContent = '';
      });
    });

    window.addEventListener('click', (e) => {
      const r = document.createElement('div');
      r.className = 'cursor-ripple';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      r.style.width = r.style.height = '10px';
      document.body.appendChild(r);
      if (window.gsap) {
        gsap.to(r, { width: 70, height: 70, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => r.remove() });
      } else { setTimeout(() => r.remove(), 600); }
    });
  }

  /* ---------------- LENIS SMOOTH SCROLL ---------------- */
  let lenis = null;
  function initLenis() {
    if (prefersReduced || typeof Lenis === 'undefined') return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, lerp: 0.09 });
    lenis.on('scroll', () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap) {
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: -20 });
    else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  }

  // placeholder; defined later
  let startIntro = () => {};

  // expose for later modules
  window.__moose = { $, $$, prefersReduced, isDesktop, scrollTo, get lenis() { return lenis; } };

  document.addEventListener('DOMContentLoaded', () => {
    runPreloader();
    initCursor();
    initLenis();
    window.__moose.initUI();
    window.__moose.initAnimations();
    window.__moose.initThree();
    window.__moose.initAudio();
    window.__moose.initExtras();
  });

  // allow modules below to set startIntro
  window.__moose.setIntro = (fn) => { startIntro = fn; };
})();

/* ================= ANIMATIONS MODULE ================= */
(() => {
  const M = window.__moose;
  const { $, $$ } = M;

  M.initAnimations = function () {
    if (typeof gsap === 'undefined') return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.SplitType === undefined && window.ScrollTrigger) { /* SplitType optional */ }

    /* ---- intro (after preloader) ---- */
    M.setIntro(() => {
      if (M.prefersReduced) return;
      gsap.from('#hero h1 span', { y: 120, opacity: 0, stagger: .12, duration: 1, ease: 'power4.out' });
      gsap.from('#hero-can', { scale: .4, opacity: 0, duration: 1.1, ease: 'back.out(1.6)', delay: .3 });
      gsap.from('#hero p, #hero a', { y: 30, opacity: 0, stagger: .1, duration: .8, delay: .7 });
      // show music player
      gsap.to('#music-player', { y: 0, opacity: 1, duration: .6, delay: 1.2 });
    });

    if (M.prefersReduced) return;

    /* ---- hero mouse parallax ---- */
    if (M.isDesktop) {
      const scene = $('.parallax-scene');
      const layers = $$('[data-depth]');
      window.addEventListener('mousemove', (e) => {
        const cx = (e.clientX / window.innerWidth - .5);
        const cy = (e.clientY / window.innerHeight - .5);
        layers.forEach((l) => {
          const d = parseFloat(l.dataset.depth) || 0;
          const sign = l.classList.contains('layer-back') ? 1 : -1;
          gsap.to(l, { x: cx * 120 * d * sign, y: cy * 120 * d * sign,
            rotateY: l.id === 'hero-can' ? cx * 20 : 0, duration: .8, ease: 'power2.out' });
        });
      });
    }

    /* ---- hero scroll: can scales, text fades ---- */
    gsap.to('#hero h1', {
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      opacity: 0, y: -80
    });
    gsap.to('#hero-can', {
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      scale: 1.6, y: 60
    });

    /* ---- legend: reveal lines + portrait slide ---- */
    $$('.reveal-lines').forEach((el) => {
      let targets = [el];
      if (window.SplitType) {
        const split = new SplitType(el, { types: 'lines' });
        targets = split.lines;
        targets.forEach((l) => l.style.overflow = 'hidden');
      }
      gsap.from(targets, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        y: 60, opacity: 0, stagger: .12, duration: .8, ease: 'power3.out'
      });
    });
    gsap.from('.legend-img', {
      scrollTrigger: { trigger: '#legend', start: 'top 70%' },
      xPercent: 40, opacity: 0, duration: 1, ease: 'power3.out'
    });

    /* ---- drink section: pin + callouts (3D handled in three module via scroll var) ---- */
    const drink = $('#drink');
    if (drink) {
      ScrollTrigger.create({
        trigger: drink, start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: (self) => { M.canScroll = self.progress; }
      });
      $$('.callout').forEach((c, i) => {
        c.style.left = c.dataset.x + '%';
        c.style.top = c.dataset.y + '%';
        gsap.to(c, {
          scrollTrigger: { trigger: drink, start: `top+=${i * 15}% top`, toggleActions: 'play none none reverse' },
          opacity: 1, duration: .6
        });
      });
    }

    /* ---- ingredients cards rise ---- */
    gsap.from('#ingredients .tilt-card', {
      scrollTrigger: { trigger: '#ingredients', start: 'top 75%' },
      y: 60, opacity: 0, stagger: .12, duration: .7, ease: 'power3.out'
    });

    /* ---- kinetic lyrics parallax ---- */
    $$('.kinetic').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 1;
      gsap.fromTo(el, { y: 120 * speed }, {
        y: -120 * speed,
        scrollTrigger: { trigger: '#lyrics', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      if (window.SplitType) {
        const s = new SplitType(el, { types: 'chars' });
        gsap.from(s.chars, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          opacity: 0, y: 20, stagger: .02, duration: .4
        });
      }
    });

    /* ---- legacy horizontal scroll ---- */
    const track = $('#legacy-track');
    if (track) {
      const dist = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: '#legacy', start: 'top top',
          end: () => '+=' + dist(),
          scrub: 1, pin: true, invalidateOnRefresh: true
        }
      });
      // bg color shift
      gsap.to('#legacy', {
        backgroundColor: '#06121f',
        scrollTrigger: { trigger: '#legacy', start: 'top top', end: () => '+=' + dist(), scrub: true }
      });
    }

    /* ---- generic fade-up for sections ---- */
    ['#stores h2', '#merch .tilt-card', '#newsletter h2', '#fanwall .fan-item'].forEach((sel) => {
      $$(sel).forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 88%' },
          y: 40, opacity: 0, duration: .7, delay: (i % 4) * .08, ease: 'power2.out'
        });
      });
    });

    ScrollTrigger.refresh();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  };
})();
(() => {
  const M = window.__moose;
  const { $, $$ } = M;

  M.initUI = function () {
    /* ---- navbar shrink + anchor smooth scroll ---- */
    const navbar = $('#navbar');
    const onScroll = () => navbar.classList.toggle('shrink', window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1 && $(id)) {
          e.preventDefault();
          M.scrollTo(id);
          closeMenu();
        }
      });
    });

    /* ---- mobile menu ---- */
    const menu = $('#mobile-menu');
    const burger = $('#hamburger');
    function openMenu() {
      menu.classList.add('open'); burger.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      if (window.gsap && !M.prefersReduced) {
        gsap.fromTo('.mobile-link', { x: -60, opacity: 0 },
          { x: 0, opacity: 1, stagger: .08, duration: .5, ease: 'power3.out', delay: .15 });
      }
    }
    function closeMenu() {
      menu.classList.remove('open'); burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', openMenu);
    $('#close-menu').addEventListener('click', closeMenu);
    M.closeMenu = closeMenu;

    /* ---- tilt cards (3D on mouse) ---- */
    if (M.isDesktop && !M.prefersReduced) {
      $$('.tilt-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - .5;
          const py = (e.clientY - r.top) / r.height - .5;
          card.style.transform = `perspective(800px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
      });
    }

    /* ---- fan wall ---- */
    const grid = $('#fan-grid');
    if (grid) {
      const captions = ['Moosa to the world', 'Concert night 🔥', 'Fan art tribute', 'Gang on tour', 'Ice cold energy', 'Legacy lives on', '295 forever', 'Street anthem', 'Moose up!'];
      const hues = [200, 210, 48, 195, 220, 205, 50, 198, 215];
      for (let i = 0; i < 9; i++) {
        const h = hues[i];
        const tall = i % 3 === 1 ? 320 : 220;
        const svg = `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='${tall}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},70%,18%)'/><stop offset='1' stop-color='hsl(${h},80%,8%)'/></linearGradient></defs><rect width='300' height='${tall}' fill='url(%23g)'/><circle cx='150' cy='${tall/2-20}' r='45' fill='hsl(${h},80%,45%)' opacity='0.5'/><text x='150' y='${tall-24}' font-family='Oswald,sans-serif' font-size='16' fill='rgba(255,255,255,.75)' text-anchor='middle'>MOOSE GANG</text></svg>`
        )}`;
        const fig = document.createElement('figure');
        fig.className = 'fan-item';
        fig.setAttribute('data-cursor', 'VIEW');
        fig.innerHTML = `<img class="fan-img" src="${svg}" alt="Fan photo: ${captions[i]}" loading="lazy" />`;
        fig.addEventListener('click', () => openLightbox(svg, captions[i]));
        grid.appendChild(fig);
      }
    }

    /* ---- lightbox ---- */
    const lb = $('#lightbox');
    function openLightbox(src, cap) {
      $('#lightbox-img').style.cssText = `background:url('${src}') center/cover; aspect-ratio:4/3;`;
      $('#lightbox-cap').textContent = cap;
      lb.classList.remove('hidden'); lb.classList.add('flex');
    }
    $('#lightbox-close').addEventListener('click', () => { lb.classList.add('hidden'); lb.classList.remove('flex'); });
    lb.addEventListener('click', (e) => { if (e.target === lb) { lb.classList.add('hidden'); lb.classList.remove('flex'); } });

    /* ---- stores ---- */
    const stores = [
      { name: 'Moosa Mega Mart', city: 'Mansa, Punjab', x: 150, y: 120 },
      { name: 'Ice District Grocers', city: 'London, UK', x: 95, y: 90 },
      { name: 'Gang Supply Co.', city: 'Toronto, CA', x: 70, y: 160 },
      { name: 'High Octane Foods', city: 'New Delhi, IN', x: 180, y: 150 },
      { name: 'Legacy Liquors', city: 'Brampton, CA', x: 110, y: 210 },
    ];
    const list = $('#store-list');
    const map = $('#store-map');
    if (list && map) {
      const svgns = 'http://www.w3.org/2000/svg';
      stores.forEach((s, i) => {
        const li = document.createElement('li');
        li.className = 'store-row glass rounded-lg px-4 py-3';
        li.setAttribute('data-cursor', 'GO');
        li.innerHTML = `<p class="font-oswald uppercase text-white text-sm tracking-wide">${s.name}</p><p class="text-xs text-silver/70">${s.city}</p>`;
        const dot = document.createElementNS(svgns, 'circle');
        dot.setAttribute('cx', s.x); dot.setAttribute('cy', s.y); dot.setAttribute('r', '7');
        dot.setAttribute('class', 'store-dot');
        dot.style.animationDelay = (i * .3) + 's';
        const sync = (on) => { li.classList.toggle('active', on); dot.classList.toggle('active', on); };
        li.addEventListener('mouseenter', () => sync(true));
        li.addEventListener('mouseleave', () => sync(false));
        dot.addEventListener('mouseenter', () => sync(true));
        dot.addEventListener('mouseleave', () => sync(false));
        list.appendChild(li); map.appendChild(dot);
      });
    }

    /* ---- merch quick view ---- */
    const qv = $('#quickview');
    $$('.quick-view').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        $('#qv-title').textContent = btn.dataset.title;
        $('#qv-price').textContent = btn.dataset.price;
        $('#qv-art').textContent = btn.dataset.title.split(' ')[0].toUpperCase();
        qv.classList.remove('hidden'); qv.classList.add('flex');
      });
    });
    $('#qv-close').addEventListener('click', () => { qv.classList.add('hidden'); qv.classList.remove('flex'); });
    qv.addEventListener('click', (e) => { if (e.target === qv) { qv.classList.add('hidden'); qv.classList.remove('flex'); } });

    /* ---- newsletter ---- */
    const form = $('#newsletter-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = $('#newsletter-success');
      if (window.gsap) gsap.fromTo(msg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5 });
      else msg.style.opacity = 1;
      form.reset();
      M.confetti && M.confetti();
    });

    /* ---- back to top ---- */
    $('#back-to-top').addEventListener('click', () => M.scrollTo('#hero'));

    /* ---- escape closes overlays ---- */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        [lb, qv].forEach((el) => { el.classList.add('hidden'); el.classList.remove('flex'); });
        closeMenu();
      }
    });
  };
})();

/* ================= THREE.JS 3D CAN ================= */
(() => {
  const M = window.__moose;
  M.canScroll = 0;

  M.initThree = function () {
    const mount = document.getElementById('can-3d');
    if (!mount || typeof THREE === 'undefined') return;

    const w = () => mount.clientWidth;
    const h = () => mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w() / h(), 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w(), h());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // group = can
    const can = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b4a66, metalness: 0.9, roughness: 0.25 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 64), bodyMat);
    can.add(body);

    // ice-blue label band
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.6, roughness: 0.2, emissive: 0x00343a });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.01, 1.01, 1.4, 64), bandMat);
    can.add(band);

    // rims
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd8e3, metalness: 1, roughness: 0.15 });
    const topRim = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1, 0.18, 64), rimMat);
    topRim.position.y = 1.55; can.add(topRim);
    const botRim = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.92, 0.18, 64), rimMat);
    botRim.position.y = -1.55; can.add(botRim);

    // condensation dots
    const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0 });
    for (let i = 0; i < 60; i++) {
      const d = new THREE.Mesh(dotGeo, dotMat);
      const a = Math.random() * Math.PI * 2;
      d.position.set(Math.cos(a) * 1.02, (Math.random() - 0.5) * 2.6, Math.sin(a) * 1.02);
      can.add(d);
    }

    scene.add(can);

    // lighting — dramatic spotlight
    scene.add(new THREE.AmbientLight(0x334455, 0.6));
    const key = new THREE.DirectionalLight(0x00f0ff, 2.2); key.position.set(5, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(-5, 2, -3); scene.add(rim);
    const fill = new THREE.PointLight(0x1e3a8a, 1.5, 20); fill.position.set(0, -3, 4); scene.add(fill);

    // drag to rotate
    let dragging = false, px = 0, velY = 0, manualY = 0;
    const dn = (x) => { dragging = true; px = x; };
    const mv = (x) => { if (!dragging) return; const dx = x - px; px = x; velY += dx * 0.01; };
    const up = () => { dragging = false; };
    renderer.domElement.addEventListener('mousedown', (e) => dn(e.clientX));
    window.addEventListener('mousemove', (e) => mv(e.clientX));
    window.addEventListener('mouseup', up);
    renderer.domElement.addEventListener('touchstart', (e) => dn(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => { if (dragging) mv(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', up);

    const reduced = M.prefersReduced;
    function animate() {
      requestAnimationFrame(animate);
      manualY += velY; velY *= 0.92;
      const auto = reduced ? 0 : M.canScroll * Math.PI * 4;
      can.rotation.y = manualY + auto;
      can.rotation.z = Math.sin((M.canScroll || 0) * Math.PI) * 0.08;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = w() / h(); camera.updateProjectionMatrix();
      renderer.setSize(w(), h());
    });
  };
})();

/* ================= AUDIO MODULE (Howler) ================= */
(() => {
  const M = window.__moose;
  const { $ } = M;

  M.initAudio = function () {
    let enabled = false;
    const toggle = $('#sound-toggle');
    const iconMuted = toggle.querySelector('.icon-muted');
    const iconSound = toggle.querySelector('.icon-sound');

    // synth-free: use Howler with tiny data-URI tones where possible; gracefully degrade
    let hover, bass, music;
    if (typeof Howl !== 'undefined') {
      // short whoosh / bass via oscillator fallback handled by WebAudio below
    }

    // WebAudio for SFX + music visualizer-friendly tone bed
    let actx = null, musicOsc = null, musicGain = null, analyser = null;
    function ensureCtx() {
      if (actx) return;
      actx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = actx.createAnalyser(); analyser.fftSize = 64;
      analyser.connect(actx.destination);
      M.analyser = analyser;
    }
    function sfx(freq, dur, type = 'sine', vol = 0.08) {
      if (!enabled || !actx) return;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(analyser); o.start(); o.stop(actx.currentTime + dur);
    }
    M.sfx = sfx;

    function setIcons() {
      iconMuted.classList.toggle('hidden', enabled);
      iconSound.classList.toggle('hidden', !enabled);
      toggle.setAttribute('aria-pressed', String(enabled));
    }

    toggle.addEventListener('click', () => {
      ensureCtx();
      if (actx.state === 'suspended') actx.resume();
      enabled = !enabled;
      setIcons();
      if (enabled) sfx(80, 0.5, 'sawtooth', 0.12); // bass drop
    });

    // hover whoosh / click bass on interactive elements
    M.$$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => sfx(520, 0.08, 'triangle', 0.03));
      el.addEventListener('click', () => sfx(120, 0.25, 'sine', 0.06));
    });

    /* ---- music player ---- */
    const tracks = ['The Moose Anthem', 'So High (Energy Mix)', 'Legend — 295 Flip'];
    let ti = 0, playing = false, prog = 0, progTimer = null;
    const playBtn = $('#mp-play');
    const title = $('#mp-title');
    const bar = $('#mp-progress');
    const iPlay = playBtn.querySelector('.mp-icon-play');
    const iPause = playBtn.querySelector('.mp-icon-pause');

    // build viz bars
    const viz = $('#mp-viz');
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const b = document.createElement('span');
      b.style.cssText = 'flex:1;background:#00f0ff;border-radius:2px;height:20%;transition:height .1s;';
      viz.appendChild(b); bars.push(b);
    }
    function animateViz() {
      if (!playing) { bars.forEach((b) => b.style.height = '20%'); return; }
      bars.forEach((b) => b.style.height = (20 + Math.random() * 80) + '%');
      requestAnimationFrame(() => setTimeout(animateViz, 90));
    }

    function play() {
      ensureCtx();
      if (actx.state === 'suspended') actx.resume();
      playing = true;
      iPlay.classList.add('hidden'); iPause.classList.remove('hidden');
      animateViz();
      progTimer = setInterval(() => {
        prog += 0.3; if (prog >= 100) { prog = 0; next(); }
        bar.style.width = prog + '%';
      }, 100);
      if (enabled) sfx(220, 0.3, 'sine', 0.05);
    }
    function pause() {
      playing = false;
      iPlay.classList.remove('hidden'); iPause.classList.add('hidden');
      clearInterval(progTimer);
    }
    function next() { ti = (ti + 1) % tracks.length; title.textContent = tracks[ti]; prog = 0; }
    playBtn.addEventListener('click', () => playing ? pause() : play());

    setIcons();
  };
})();

/* ================= EXTRAS: visualizer, confetti, konami ================= */
(() => {
  const M = window.__moose;
  const { $ } = M;

  M.initExtras = function () {
    /* ---- lyrics bg visualizer canvas ---- */
    const canvas = $('#viz-canvas');
    if (canvas && !M.prefersReduced) {
      const ctx = canvas.getContext('2d');
      let W, H, mx = 0.5, my = 0.5;
      const resize = () => {
        const r = canvas.getBoundingClientRect();
        W = canvas.width = r.width; H = canvas.height = r.height;
      };
      resize(); window.addEventListener('resize', resize);
      window.addEventListener('mousemove', (e) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; });
      let t = 0;
      (function draw() {
        requestAnimationFrame(draw);
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        const vel = M.lenis ? Math.min(Math.abs(M.lenis.velocity || 0) / 20, 3) : 1;
        const bars = 48, bw = W / bars;
        for (let i = 0; i < bars; i++) {
          const amp = M.analyser ? getFreq(i, bars) : (Math.sin(t * 0.05 + i * 0.4) * 0.5 + 0.5);
          const bh = (amp * 0.4 + 0.1) * H * (0.4 + vel * 0.25) * (0.6 + my * 0.6);
          const hue = 190 + (i / bars) * 40 + mx * 20;
          ctx.fillStyle = `hsla(${hue},100%,55%,0.5)`;
          ctx.fillRect(i * bw, H - bh, bw - 2, bh);
        }
        t++;
      })();
      let freqData = null;
      function getFreq(i, n) {
        if (!M.analyser) return 0.5;
        if (!freqData) freqData = new Uint8Array(M.analyser.frequencyBinCount);
        M.analyser.getByteFrequencyData(freqData);
        const idx = Math.floor((i / n) * freqData.length);
        return freqData[idx] / 255;
      }
    }

    /* ---- confetti ---- */
    M.confetti = function () {
      const canvas = $('#confetti-canvas');
      if (!canvas || M.prefersReduced) return;
      canvas.classList.remove('hidden');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const colors = ['#00f0ff', '#ffd700', '#1e3a8a', '#ffffff'];
      const parts = Array.from({ length: 140 }, () => ({
        x: window.innerWidth / 2, y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 1) * 16,
        c: colors[Math.floor(Math.random() * colors.length)],
        s: Math.random() * 6 + 3, life: 1
      }));
      (function run() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        parts.forEach((p) => {
          p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
          if (p.life > 0) { alive = true; ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
        });
        ctx.globalAlpha = 1;
        if (alive) requestAnimationFrame(run); else canvas.classList.add('hidden');
      })();
      M.sfx && M.sfx(660, 0.3, 'triangle', 0.06);
    };

    /* ---- konami code -> moose mode ---- */
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    window.addEventListener('keydown', (e) => {
      pos = (e.key === seq[pos] || e.key.toLowerCase() === seq[pos]) ? pos + 1 : 0;
      if (pos === seq.length) {
        pos = 0;
        document.body.classList.toggle('moose-mode');
        const flash = document.createElement('div');
        flash.textContent = '🐐 MOOSE MODE — Gone But Never Forgotten 🐐';
        flash.className = 'fixed inset-x-0 top-1/3 z-[120] text-center font-anton uppercase text-2xl sm:text-4xl text-gold drop-shadow-[0_0_20px_#ffd700] pointer-events-none';
        document.body.appendChild(flash);
        if (window.gsap) gsap.fromTo(flash, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, yoyo: true, repeat: 1, repeatDelay: 1.4, onComplete: () => flash.remove() });
        else setTimeout(() => flash.remove(), 3000);
        M.confetti();
      }
    });
  };
})();
