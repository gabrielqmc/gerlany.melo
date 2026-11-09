/* ==========================================================================
   Dra. Gerlany Melo — interactions
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
    'use strict';

    var doc = document.documentElement;
    var body = document.body;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var vh = window.innerHeight;
    var vw = window.innerWidth;

    /* ---------- 1. Intro / loader ---------- */
    var readyDone = false;
    function ready() {
        if (readyDone) return;
        readyDone = true;
        body.classList.add('is-ready');
        body.classList.remove('is-loading');
        setTimeout(function () {
            var l = document.querySelector('.loader');
            if (l) l.remove();
        }, 1400);
    }
    if (reduceMotion) {
        ready();
    } else {
        var minTime = new Promise(function (r) { setTimeout(r, 1150); });
        var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        Promise.all([minTime, fontsReady]).then(ready);
        setTimeout(ready, 2600); // safety net
    }

    /* ---------- 2. Split headings into words ---------- */
    function splitWords(el) {
        var i = 0;
        function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var parts = child.textContent.split(/(\s+)/);
                    var frag = document.createDocumentFragment();
                    parts.forEach(function (p) {
                        if (!p) return;
                        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
                        var outer = document.createElement('span');
                        outer.className = 'sw';
                        var inner = document.createElement('span');
                        inner.style.setProperty('--i', i++);
                        inner.textContent = p;
                        outer.appendChild(inner);
                        frag.appendChild(outer);
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1) {
                    walk(child);
                }
            });
        }
        // keep an accessible label identical to the original text
        el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
        walk(el);
        Array.prototype.forEach.call(el.querySelectorAll('.sw'), function (s) { s.setAttribute('aria-hidden', 'true'); });
    }
    if (!reduceMotion) {
        document.querySelectorAll('[data-split]').forEach(splitWords);
    }

    /* Manifesto: words that light up while scrolling */
    var wordsEl = document.querySelector('[data-words]');
    var wordSpans = [];
    if (wordsEl && !reduceMotion) {
        (function wrap(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(function (p) {
                        if (!p) return;
                        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
                        var s = document.createElement('span');
                        s.className = 'wd';
                        s.textContent = p;
                        frag.appendChild(s);
                        wordSpans.push(s);
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1) {
                    wrap(child);
                }
            });
        })(wordsEl);
    }

    /* ---------- 3. Reveal on scroll ---------- */
    // stagger siblings that reveal together
    document.querySelectorAll('.treatments__track, .reviews__track, .compare').forEach(function (group) {
        var items = group.querySelectorAll(':scope > [data-reveal]');
        items.forEach(function (it, idx) { it.style.setProperty('--d', (idx * 0.12) + 's'); });
    });

    var revealTargets = document.querySelectorAll('[data-reveal], [data-split]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('is-in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
        revealTargets.forEach(function (el) { io.observe(el); });
    } else {
        revealTargets.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---------- 4. Counters ---------- */
    var counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var el = e.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = null;
                function step(t) {
                    if (!t0) t0 = t;
                    var p = Math.min((t - t0) / 1600, 1);
                    var eased = 1 - Math.pow(1 - p, 4);
                    el.textContent = Math.round(end * eased);
                    if (p < 1) requestAnimationFrame(step);
                }
                el.textContent = '0';
                requestAnimationFrame(step);
                cio.unobserve(el);
            });
        }, { threshold: 0.6 });
        counters.forEach(function (c) { cio.observe(c); });
    }

    /* ---------- 5. Navigation ---------- */
    var nav = document.getElementById('navbar');
    var hero = document.querySelector('.hero');
    var toggle = document.querySelector('.nav__toggle');
    var menu = document.getElementById('menu-mobile');
    var lastY = window.scrollY;

    function setMenu(open) {
        body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        menu.setAttribute('aria-hidden', open ? 'false' : 'true');
        body.style.overflow = open ? 'hidden' : '';
        if (open) nav.classList.remove('is-hidden');
    }
    toggle.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
    });

    // active section highlight
    var navLinks = document.querySelectorAll('.nav__links a');
    if ('IntersectionObserver' in window) {
        var sio = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id); });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        ['metodo', 'tratamentos', 'especialista', 'depoimentos', 'duvidas'].forEach(function (id) {
            var s = document.getElementById(id); if (s) sio.observe(s);
        });
    }

    /* ---------- 6. Scroll-driven effects (single rAF loop) ---------- */
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax], [data-parallax-el]'));
    var heroMedia = document.querySelector('[data-hero-media]');
    var heroContent = document.querySelector('.hero__content');
    var waFloat = document.querySelector('.wa-float');
    var rail = document.querySelector('[data-drift]');
    var railSection = rail ? rail.closest('.gallery') : null;
    var ticking = false;

    function onScroll() {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }

    function update() {
        ticking = false;
        var y = window.scrollY;
        var heroH = hero ? hero.offsetHeight : vh;

        // nav state
        nav.classList.toggle('is-solid', y > heroH - 90);
        if (!body.classList.contains('menu-open')) {
            if (y > lastY + 4 && y > heroH * 0.6) nav.classList.add('is-hidden');
            else if (y < lastY - 4 || y < 120) nav.classList.remove('is-hidden');
        }
        lastY = y;

        // floating whatsapp
        if (waFloat) waFloat.classList.toggle('is-visible', y > vh * 0.55);

        if (reduceMotion) return;

        // hero parallax
        if (heroMedia && y < heroH * 1.1) {
            heroMedia.style.translate = '0 ' + (y * 0.28).toFixed(1) + 'px';
            if (heroContent) {
                heroContent.style.translate = '0 ' + (y * -0.12).toFixed(1) + 'px';
                heroContent.style.opacity = Math.max(0, 1 - y / (heroH * 0.75)).toFixed(3);
            }
        }

        // generic parallax
        var factorScale = vw < 900 ? 0.5 : 1;
        for (var i = 0; i < parallaxEls.length; i++) {
            var el = parallaxEls[i];
            var r = (el.parentElement || el).getBoundingClientRect();
            if (r.bottom < -200 || r.top > vh + 200) continue;
            var f = parseFloat(el.getAttribute('data-parallax') || el.getAttribute('data-parallax-el')) * factorScale;
            var off = (r.top + r.height / 2 - vh / 2) * f;
            el.style.translate = '0 ' + off.toFixed(1) + 'px';
        }

        // manifesto words
        if (wordSpans.length) {
            var wr = wordsEl.getBoundingClientRect();
            var start = vh * 0.82, end = vh * 0.38;
            var p = (start - wr.top) / ((start - end) + wr.height * 0.6);
            p = Math.max(0, Math.min(1, p));
            var lit = Math.round(p * wordSpans.length);
            for (var w = 0; w < wordSpans.length; w++) wordSpans[w].classList.toggle('on', w < lit);
        }

        // gallery horizontal drift (desktop)
        if (rail && vw >= 900) {
            var sr = railSection.getBoundingClientRect();
            var total = rail.scrollWidth - vw + 80;
            var prog = (vh - sr.top) / (vh + sr.height);
            prog = Math.max(0, Math.min(1, prog));
            rail.style.transform = 'translate3d(' + (-total * prog).toFixed(1) + 'px,0,0)';
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { vh = window.innerHeight; vw = window.innerWidth; onScroll(); });
    update();

    /* ---------- 7. Treatments carousel progress (mobile) ---------- */
    var carousel = document.querySelector('[data-carousel]');
    var bar = document.querySelector('[data-carousel-bar]');
    if (carousel && bar) {
        var updateBar = function () {
            var max = carousel.scrollWidth - carousel.clientWidth;
            var ratio = carousel.clientWidth / carousel.scrollWidth;
            bar.style.width = (Math.max(ratio, 0.2) * 100) + '%';
            var p = max > 0 ? carousel.scrollLeft / max : 0;
            bar.style.transform = 'translateX(' + (p * (1 / Math.max(ratio, 0.2) - 1) * 100) + '%)';
        };
        carousel.addEventListener('scroll', updateBar, { passive: true });
        window.addEventListener('resize', updateBar);
        updateBar();
    }

    /* ---------- 8. Reviews slider ---------- */
    var rv = document.querySelector('[data-reviews]');
    if (rv) {
        var step = function (dir) {
            var card = rv.querySelector('.review');
            var w = card ? card.getBoundingClientRect().width + 16 : 400;
            rv.scrollBy({ left: dir * w, behavior: reduceMotion ? 'auto' : 'smooth' });
        };
        document.querySelector('[data-reviews-prev]').addEventListener('click', function () { step(-1); });
        document.querySelector('[data-reviews-next]').addEventListener('click', function () { step(1); });
    }

    /* ---------- 9. FAQ accordion ---------- */
    var faqBtns = document.querySelectorAll('.faq-btn');
    faqBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var content = document.getElementById(btn.getAttribute('aria-controls'));
            var willOpen = btn.getAttribute('aria-expanded') !== 'true';
            faqBtns.forEach(function (other) {
                other.setAttribute('aria-expanded', 'false');
                document.getElementById(other.getAttribute('aria-controls')).classList.remove('open');
            });
            if (willOpen) {
                btn.setAttribute('aria-expanded', 'true');
                content.classList.add('open');
            }
        });
    });

    /* ---------- 10. Magnetic buttons (desktop only) ---------- */
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('[data-magnetic]').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var x = (e.clientX - r.left - r.width / 2) * 0.22;
                var y = (e.clientY - r.top - r.height / 2) * 0.32;
                el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
            });
            el.addEventListener('mouseleave', function () { el.style.transform = ''; });
        });
    }

    /* ---------- 11. Year ---------- */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
