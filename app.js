/* Óbyggðasetur · White Desert engine transplant
   Vanilla + GSAP ScrollTrigger + Lenis. One writer per element. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = function () { return window.matchMedia('(min-width: 769px)').matches; };
  var body = document.body;

  /* ---------- nav theme swap (works with or without motion) ---------- */
  function setNavTheme(v) {
    body.setAttribute('data-nav-theme', v === 'dark' ? 'dark' : 'light');
    var meta = document.getElementById('themeColor');
    if (meta) meta.setAttribute('content', v === 'dark' ? '#FFFFFF' : '#0C120D');
  }

  /* ---------- flyout (no motion dependency) ---------- */
  var flyout = document.getElementById('flyout');
  var flyoutTab = document.getElementById('flyoutTab');
  var flyoutClose = document.getElementById('flyoutClose');
  var flyoutOverlay = document.getElementById('flyoutOverlay');
  var lenis = null;
  function openFlyout() {
    flyout.classList.add('is-open');
    flyout.setAttribute('aria-hidden', 'false');
    flyoutTab.setAttribute('aria-expanded', 'true');
    body.classList.add('hide-grid');
    if (lenis) lenis.stop();
    setTimeout(function () { flyoutClose.focus({ preventScroll: true }); }, 480);
  }
  function closeFlyout() {
    flyout.classList.remove('is-open');
    flyout.setAttribute('aria-hidden', 'true');
    flyoutTab.setAttribute('aria-expanded', 'false');
    body.classList.remove('hide-grid');
    if (lenis) lenis.start();
    flyoutTab.focus();
  }
  flyoutTab.addEventListener('click', openFlyout);
  flyoutClose.addEventListener('click', closeFlyout);
  flyoutOverlay.addEventListener('click', closeFlyout);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && flyout.classList.contains('is-open')) closeFlyout();
  });

  /* ---------- reduced motion: static render, theme swap via observer ---------- */
  if (reduced || !window.gsap) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setNavTheme(en.target.getAttribute('data-nav-theme-val'));
      });
    }, { rootMargin: '-45% 0% -45% 0%' });
    document.querySelectorAll('[data-nav-section]').forEach(function (s) { io.observe(s); });
    document.querySelectorAll('.text-scroll-fade').forEach(function (el) {
      el.style.webkitMaskImage = 'none'; el.style.maskImage = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis on the GSAP ticker (reference: autoRaf false) ---------- */
  lenis = new Lenis({ lerp: 0.1, syncTouch: true, syncTouchLerp: 0.075, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  var vh = function () { return window.innerHeight; };

  /* ---------- intro wipe: time-based, never load-bearing ---------- */
  var wipe = document.getElementById('introWipe');
  gsap.set(wipe, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
  gsap.to(wipe, {
    clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)',
    duration: 0.8, delay: 0.15, ease: 'power4.inOut',
    onComplete: function () { wipe.classList.add('is-done'); }
  });

  /* ---------- nav: direction-driven hide (Lenis direction, .3s sine.inOut) ---------- */
  var nav = document.getElementById('nav');
  var ctaNav = document.getElementById('ctaNav');
  var navTl = gsap.timeline({ paused: true });
  navTl.to(nav, { yPercent: -100, duration: 0.3, ease: 'sine.inOut' }, 0)
       .to(ctaNav, { yPercent: 100, duration: 0.3, ease: 'sine.inOut' }, 0);
  lenis.on('scroll', function (e) {
    if (flyout.classList.contains('is-open')) return;
    if (e.scroll > 10 && e.direction === 1) navTl.play();
    else navTl.reverse();
  });

  /* ---------- per-section nav theme ---------- */
  document.querySelectorAll('[data-nav-section]').forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec, start: 'top 4rem', end: 'bottom 4rem',
      onToggle: function (self) {
        if (self.isActive) setNavTheme(sec.getAttribute('data-nav-theme-val'));
      }
    });
  });

  /* ---------- HERO (not a pin: wrapper rides the scroll) ---------- */
  var hero = document.getElementById('hero');
  var heroWrapper = document.getElementById('heroWrapper');
  var heroContent = document.getElementById('heroContent');
  gsap.to(heroWrapper, {
    y: function () { return vh(); }, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true, refreshPriority: 10 }
  });
  gsap.fromTo(heroContent, { filter: 'blur(0px)' }, {
    filter: 'blur(10px)', ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, refreshPriority: 10 }
  });
  /* Layers rest at translateY(100%) in CSS and animate the `y` property with a
     UNIT STRING, exactly as the reference does. Using yPercent instead makes
     GSAP resolve the CSS 100% to 900px and then add the percent on top, so the
     layer only travels a fraction of its range (ledger #97, third variant). */
  hero.querySelectorAll('[data-scroll-speed]').forEach(function (el) {
    var t = el.getAttribute('data-scroll-speed');
    var st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true, refreshPriority: 10 };
    if (t.charAt(0) === '-') gsap.to(el, { y: t, ease: 'none', scrollTrigger: st });
    else gsap.fromTo(el, { y: t }, { y: 0, ease: 'none', scrollTrigger: st });
  });

  /* the hero photo dissolves into paper exactly while the bank crosses it, so
     the wrapper's own bottom edge never reads as a seam */
  var heroBgFade = document.getElementById('heroBgFade');
  if (heroBgFade) {
    gsap.fromTo(heroBgFade, { opacity: 0 }, {
      opacity: 1, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top-=8%', end: 'top top-=52%', scrub: true, refreshPriority: 10 }
    });
  }

  /* mist-transition: the plane rotates up from its bottom edge (90deg = edge-on
     and invisible, 0deg = full frame), so the fog stands into the manifesto */
  var mistPlane = document.getElementById('mistPlane');
  var mistTransition = document.getElementById('mistTransition');
  if (mistPlane && mistTransition) {
    mistPlane.classList.add('visible');
    gsap.fromTo(mistPlane, { rotateX: 90 }, {
      rotateX: 0, ease: 'none',
      scrollTrigger: { trigger: mistTransition, start: 'top top-=80%', end: 'bottom center', scrub: true, refreshPriority: 8 }
    });
  }
  /* the reference's -60svh content lift: kicker + monument title drift up
     and away while the film recedes at half speed */
  hero.querySelectorAll('[data-hero-drift]').forEach(function (el) {
    gsap.to(el, {
      y: function () { return -0.6 * vh(); }, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true, refreshPriority: 10 }
    });
  });

  /* ---------- manifesto: mask develop + scribble draw ---------- */
  var maskEl = document.getElementById('maskDevelop');
  gsap.set(maskEl, { '--mask-position': -40 });
  gsap.to(maskEl, {
    '--mask-position': 100, ease: 'none',
    scrollTrigger: { trigger: maskEl, start: 'top 80%', end: 'bottom 60%', scrub: true, refreshPriority: 9 }
  });
  var scribblePath = document.querySelector('#scribble path');
  if (scribblePath) {
    var len = scribblePath.getTotalLength();
    gsap.set(scribblePath, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(scribblePath, {
      strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut',
      scrollTrigger: { trigger: '.manifesto_kicker', start: 'top 75%', toggleActions: 'play none none reverse' }
    });
  }

  /* ---------- inset band (season): unclip to full bleed ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 769px)', function () {
    document.querySelectorAll('.has-inset .season_inner').forEach(function (el) {
      gsap.fromTo(el,
        { clipPath: 'inset(0rem 1.25rem 0rem 1.25rem round 0.375rem)' },
        { clipPath: 'inset(0rem 0rem 0rem 0rem round 0rem)', ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 50%', scrub: true } });
    });
    /* same device, contained: the vitrine and the three plates wipe open */
    var frame = document.getElementById('exhibitFrame');
    if (frame) {
      gsap.fromTo(frame,
        { clipPath: 'inset(0% 0% 18% 0% round 0.375rem)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0.375rem)', ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top 85%', end: 'top 45%', scrub: true } });
    }
    var plates = document.querySelectorAll('#foodStrip .food_plate');
    plates.forEach(function (el, i) {
      gsap.fromTo(el,
        { clipPath: 'inset(0% 0% 22% 0% round 0.375rem)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0.375rem)', ease: 'none',
          scrollTrigger: { trigger: '#foodStrip', start: 'top 85%', end: 'top ' + (48 - i * 6) + '%', scrub: true } });
    });
  });

  /* ---------- card-flick: hover accordion (desktop) ---------- */
  mm.add('(min-width: 769px)', function () {
    var flick = document.getElementById('cardFlick');
    var items = Array.prototype.slice.call(flick.querySelectorAll('.card-flick_item'));
    var n = items.length;
    /* subtract flex gap so the row never overflows: total gap = .55rem × (n−1) */
    var wActive = 'calc(50% - ' + (0.55 * (n - 1) * 0.5).toFixed(3) + 'rem)';
    var wRest = 'calc(' + (50 / (n - 1)).toFixed(3) + '% - ' + (0.55 * (n - 1) * 0.5 / (n - 1)).toFixed(3) + 'rem)';
    var current = 0;
    items.forEach(function (item, i) {
      gsap.set(item, { width: i === 0 ? wActive : wRest });
      gsap.set(item.querySelector('.card-flick_content'), { opacity: i === 0 ? 1 : 0 });
    });
    var tl = null;
    function activate(idx) {
      if (idx === current) return;
      current = idx;
      if (tl) tl.kill();
      tl = gsap.timeline();
      items.forEach(function (item, i) {
        var on = i === idx;
        item.classList.toggle('is-active', on);
        tl.to(item, { width: on ? wActive : wRest, duration: 0.75, ease: 'expo' }, 0);
        tl.to(item.querySelector('.card-flick_content'), { opacity: on ? 1 : 0, duration: on ? 0.75 : 0.2, ease: on ? 'power1.out' : 'expo.out' }, 0);
      });
    }
    items.forEach(function (item, i) {
      item.addEventListener('mouseenter', function () { activate(i); });
      item.addEventListener('focusin', function () { activate(i); });
    });
    return function () {
      items.forEach(function (item) {
        gsap.set(item, { clearProps: 'width' });
        gsap.set(item.querySelector('.card-flick_content'), { clearProps: 'opacity' });
      });
    };
  });

  /* ---------- THE RAIL ---------- */
  var railOuter = document.querySelector('.rail_outer');
  var rail = document.getElementById('rail');
  var railContainer = document.getElementById('railContainer');
  var railTitleWrap = document.querySelector('.rail_title-wrap');
  var railTitle = document.getElementById('railTitle');
  var railClipped = document.getElementById('railClipped');
  var railBehind = document.getElementById('railBehind');
  var railOverlay = document.getElementById('railOverlay');
  var curtainRects = Array.prototype.slice.call(document.querySelectorAll('#curtainClip rect'));
  var railTravel = function () { return railContainer.scrollWidth - window.innerWidth; };

  /* approach: section unclips + title grows + behind plate rises */
  mm.add('(min-width: 769px)', function () {
    gsap.fromTo(railOuter,
      { clipPath: 'inset(0% 10% 0% 10%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', clearProps: 'clipPath',
        scrollTrigger: { trigger: railOuter, start: 'top bottom', end: 'top top', scrub: true, refreshPriority: 6 } });
  });
  /* The rail title's size is animated, so GSAP writes it INLINE and the mobile
     media query can never win. Read the sizes per breakpoint here instead, and
     rebuild them on resize with the rest of the rail. */
  var railType = function () {
    return window.matchMedia('(min-width: 769px)').matches
      ? { enter: '2.4rem', grown: '5.625rem', settled: '3.75rem' }
      : { enter: '1.45rem', grown: '2.2rem', settled: '1.85rem' };
  };
  var railGrow = null;
  function buildRailGrow() {
    if (railGrow) { railGrow.scrollTrigger && railGrow.scrollTrigger.kill(); railGrow.kill(); }
    var t = railType();
    railGrow = gsap.fromTo(railTitle, { fontSize: t.enter }, {
      fontSize: t.grown, ease: 'none',
      scrollTrigger: { trigger: railOuter, start: 'top bottom', end: 'top top', scrub: true, refreshPriority: 6 }
    });
  }
  buildRailGrow();
  gsap.fromTo(railBehind, { yPercent: 18 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: railOuter, start: 'top 60%', end: 'top top', scrub: true, refreshPriority: 6 }
  });

  /* behind the birch plate sits the hero valley plate again (insert before timeline) */
  (function () {
    var valley = document.createElement('div');
    valley.className = 'rail_backdrop';
    valley.style.zIndex = '-1';
    valley.innerHTML = '<img class="img-fill" src="assets/img/plate-hero.webp" alt="" loading="lazy">';
    railBehind.parentNode.insertBefore(valley, railBehind);
  })();

  /* the pinned machine: end = 1.5vh (text) + 1vh (curtain) + 1.5·travel (x).
     GSAP durations must be numbers, so the timeline is (re)built from measured
     values, and rebuilt on debounced resize (ledger #98: container width is
     FIXED by CSS, item widths never animate inside it). */
  var railTl = null;
  function buildRail() {
    if (railTl) {
      railTl.scrollTrigger && railTl.scrollTrigger.kill();
      railTl.kill();
      gsap.set([railContainer, railTitleWrap], { clearProps: 'x' });
      gsap.set(railBehind, { clearProps: 'clipPath' });
      gsap.set(railOverlay, { '--rail-overlay': 0 });
      curtainRects.forEach(function (r, i) {
        r.setAttribute('width', '0.3334');
        r.setAttribute('x', String(i * 0.3333));
      });
      gsap.set(railTitle, { clearProps: 'fontSize' });
    }
    var H = vh();
    var L = railTravel();
    var sText = 1.5 * H;      /* title shrink segment  */
    var sCurtain = 1 * H;     /* curtain segment       */
    var sX = 1.5 * L;         /* horizontal travel     */
    railTl = gsap.timeline({
      scrollTrigger: {
        trigger: rail, start: 'top top',
        end: '+=' + (sText + sCurtain + sX),
        pin: true, scrub: true, invalidateOnRefresh: true, refreshPriority: 5
      }
    });
    var rt = railType();
    railTl.fromTo(railTitle, { fontSize: rt.grown },
      { fontSize: rt.settled, ease: 'none', duration: 0.5 * sText }, 0);
    var tCurtain = 0.5 * sText;
    railTl.to(curtainRects[2], { attr: { width: 0 }, ease: 'none', duration: 0.5 * sCurtain }, tCurtain);
    railTl.to(curtainRects[1], { attr: { width: 0 }, ease: 'none', duration: 0.75 * sCurtain }, tCurtain);
    railTl.to(curtainRects[0], { attr: { width: 0 }, ease: 'none', duration: 1.0 * sCurtain }, tCurtain);
    var tX = tCurtain + 0.3 * sCurtain;   /* rail starts while curtain still opening */
    railTl.to(railContainer, { x: -L, ease: 'none', duration: sX }, tX);
    /* counter-translate: title panel visually pinned while container slides */
    railTl.to(railTitleWrap, { x: L, ease: 'none', duration: sX }, tX);
    /* mid-rail backdrop swap: birch wipes leftward to the valley plate + darkens */
    var tWipe = tX + 0.35 * sX;
    railTl.to(railBehind, { clipPath: 'inset(0% 100% 0% 0%)', ease: 'none', duration: 0.45 * sX }, tWipe);
    railTl.to(railOverlay, { '--rail-overlay': 0.4, ease: 'none', duration: 0.45 * sX }, tWipe);
  }
  gsap.set(railOverlay, { '--rail-overlay': 0 });
  buildRail();

  /* ---------- journey thread: route draws down the page, pulse rides it ---------- */
  var flown = document.getElementById('routeFlown');
  var indicator = document.getElementById('routeIndicator');
  var flightWrap = document.getElementById('flightWrap');
  if (flown && indicator) {
    var flownLen = flown.getTotalLength();
    gsap.set(flown, { strokeDasharray: flownLen, strokeDashoffset: flownLen });
    var prog = { p: 0 };
    var vb = { w: 600, h: 1600 };
    gsap.to(prog, {
      p: 1, ease: 'none',
      scrollTrigger: { trigger: flightWrap, start: 'top 65%', end: 'bottom 65%', scrub: true, invalidateOnRefresh: true, refreshPriority: 3 },
      onUpdate: function () {
        flown.style.strokeDashoffset = String(flownLen * (1 - prog.p));
        var pt = flown.getPointAtLength(flownLen * prog.p);
        indicator.style.left = (pt.x / vb.w * 100) + '%';
        indicator.style.top = (pt.y / vb.h * 100) + '%';
      }
    });
  }

  /* ---------- custom cursor (desktop hover only) ---------- */
  mm.add('(hover: hover) and (pointer: fine)', function () {
    var cur = document.getElementById('cursor');
    var dot = document.getElementById('curDot');
    var lv = document.getElementById('curV');
    var lh = document.getElementById('curH');
    var label = document.getElementById('curLabel');
    gsap.set(cur, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    var qx = gsap.quickTo(cur, 'x', { duration: 0.3, ease: 'power3.out' });
    var qy = gsap.quickTo(cur, 'y', { duration: 0.3, ease: 'power3.out' });
    var mx = 0, my = 0, active = false, text = '';
    function isInteractive(el) {
      if (!el) return false;
      return !!(el.closest && (el.closest('a') || el.closest('button')));
    }
    function refresh(el) {
      var host = el && el.closest ? el.closest('[data-cursor-text]') : null;
      var t = host ? host.getAttribute('data-cursor-text') : '';
      var on = !!t || isInteractive(el);
      if (on === active && t === text) return;
      active = on; text = t || '';
      label.textContent = text;
      gsap.to(dot, { rotation: on ? 45 : 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(lv, { height: on ? '0.75rem' : 0, opacity: on ? 1 : 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(lh, { width: on ? '0.75rem' : 0, opacity: on ? 1 : 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(label, { opacity: text ? 1 : 0, duration: 0.3, ease: 'power2.out' });
    }
    function onMove(e) { mx = e.clientX; my = e.clientY; qx(mx); qy(my); }
    function onOver(e) { refresh(e.target); }
    var scrollCheck = function () { refresh(document.elementFromPoint(mx, my)); };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    lenis.on('scroll', scrollCheck);
    return function () {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  });

  /* ---------- resize safety: rebuild the rail, then refresh everything ---------- */
  var rto;
  window.addEventListener('resize', function () {
    clearTimeout(rto);
    rto = setTimeout(function () {
      buildRailGrow();   /* re-reads the breakpoint's type sizes */
      buildRail();
      ScrollTrigger.refresh();
    }, 250);
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
