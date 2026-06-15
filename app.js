/* Tony Groison — comportements partagés */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Révélation des sections au scroll */
  const reveals = document.querySelectorAll('.reveal');
  if (reduce) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    reveals.forEach(el => io.observe(el));
  }

  /* Masthead : bordure laiton au défilement */
  const mast = document.querySelector('.masthead');
  if (mast) {
    const onScroll = () => mast.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Menu hamburger (mobile) */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.mast-nav');
  if (toggle && nav) {
    const setOpen = open => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  }

  /* Compteurs animés sur les statistiques */
  const nums = document.querySelectorAll('[data-count]');
  const setFinal = el => { el.firstChild.nodeValue = (+el.dataset.count).toLocaleString('fr-FR'); };
  if (nums.length) {
    if (reduce) {
      nums.forEach(setFinal);
    } else {
      const cio = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        cio.unobserve(el);
        const target = +el.dataset.count, dur = 1100, t0 = performance.now(), node = el.firstChild;
        const tick = now => {
          const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
          node.nodeValue = Math.round(target * eased).toLocaleString('fr-FR');
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }), { threshold: .5 });
      nums.forEach(el => cio.observe(el));
    }
  }

  /* Façade vidéos témoignages */
  document.querySelectorAll('.vid-facade').forEach(function(facade) {
    var btn = facade.querySelector('.vid-play');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var src = facade.dataset.src;
      facade.innerHTML = '<video src="' + src + '" autoplay controls playsinline style="width:100%;height:100%;object-fit:cover;display:block"></video>';
    });
  });

})();
