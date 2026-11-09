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
                    var el = e.target;
                    io.unobserve(el);
                    var img = el.getAttribute('data-reveal') === 'img' ? el.querySelector('img') : null;
                    if (img && !img.complete) {
                        var done = function () { el.classList.add('is-in'); };
                        img.addEventListener('load', done, { once: true });
                        img.addEventListener('error', done, { once: true });
                        setTimeout(done, 2500);
                    } else {
                        el.classList.add('is-in');
                    }
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
    var heroImg = document.querySelector('.hero__media img');
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
        if (heroImg && y < heroH * 1.1) {
            heroImg.style.translate = '0 ' + (y * 0.16).toFixed(1) + 'px';
            if (heroContent) {
                heroContent.style.translate = '0 ' + (y * -0.08).toFixed(1) + 'px';
                heroContent.style.opacity = Math.max(0, 1 - y / (heroH * 0.8)).toFixed(3);
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


    /* ======================================================================
       Interaction layer
       ====================================================================== */
    var canHover = finePointer && !reduceMotion;
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ---------- 12. Text roll on buttons & nav links ---------- */
    function roll(el) {
        var txt = el.textContent.trim();
        if (!txt) return;
        el.textContent = '';
        var outer = document.createElement('span');
        outer.className = 'roll';
        var inner = document.createElement('span');
        inner.setAttribute('data-t', txt);
        inner.textContent = txt;
        outer.appendChild(inner);
        el.appendChild(outer);
    }
    if (!reduceMotion) {
        document.querySelectorAll('.btn > span:first-child, .nav__links a').forEach(roll);
    }

    /* ---------- 13. Footer word: per-letter hover ---------- */
    var fw = document.querySelector('.footer__word');
    if (fw) {
        (function wrapLetters(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (c) {
                if (c.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    c.textContent.split('').forEach(function (ch) {
                        if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
                        var sp = document.createElement('span'); sp.className = 'fl'; sp.textContent = ch; frag.appendChild(sp);
                    });
                    node.replaceChild(frag, c);
                } else if (c.nodeType === 1) { wrapLetters(c); }
            });
        })(fw);
    }

    /* ---------- 14. Velocity-reactive marquee ---------- */
    var mq = document.querySelector('.marquee');
    var mqTrack = mq ? mq.querySelector('.marquee__track') : null;
    if (mqTrack && !reduceMotion) {
        mq.classList.add('is-js');
        var mqX = 0, mqDir = -1, mqBoost = 0, mqLastY = window.scrollY, mqHover = false;
        mq.addEventListener('mouseenter', function () { mqHover = true; });
        mq.addEventListener('mouseleave', function () { mqHover = false; });
        (function mqLoop() {
            var sy = window.scrollY, dy = sy - mqLastY; mqLastY = sy;
            if (dy !== 0) mqDir = dy > 0 ? -1 : 1;
            mqBoost = lerp(mqBoost, Math.min(Math.abs(dy) * 0.6, 26), 0.12);
            var speed = mqHover ? 0.25 : (0.9 + mqBoost);
            mqX += mqDir * speed;
            var half = mqTrack.scrollWidth / 2;
            if (mqX <= -half) mqX += half;
            if (mqX > 0) mqX -= half;
            mqTrack.style.transform = 'translate3d(' + mqX.toFixed(2) + 'px,0,0)';
            requestAnimationFrame(mqLoop);
        })();
    }

    /* ---------- 15. Hero: mouse parallax + light ---------- */
    var heroFrame = document.querySelector('[data-hero]');
    var heroTilt = document.querySelector('[data-hero-tilt]');
    var heroLight = document.querySelector('[data-hero-light]');
    if (heroFrame && canHover) {
        var hx = 0, hy = 0, tx = 0, ty = 0, lx = 0, ly = 0, tlx = 0, tly = 0, heroActive = false;
        heroFrame.addEventListener('mousemove', function (e) {
            var r = heroFrame.getBoundingClientRect();
            tx = (e.clientX - r.left) / r.width - 0.5;
            ty = (e.clientY - r.top) / r.height - 0.5;
            tlx = e.clientX - r.left; tly = e.clientY - r.top;
            if (!heroActive) { lx = tlx; ly = tly; heroActive = true; }
        });
        heroFrame.addEventListener('mouseleave', function () { tx = 0; ty = 0; });
        (function heroLoop() {
            hx = lerp(hx, tx, 0.06); hy = lerp(hy, ty, 0.06);
            lx = lerp(lx, tlx, 0.12); ly = lerp(ly, tly, 0.12);
            if (heroTilt) heroTilt.style.transform = 'translate3d(' + (hx * -26).toFixed(2) + 'px,' + (hy * -18).toFixed(2) + 'px,0) scale(1.04)';
            if (heroLight) heroLight.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
            requestAnimationFrame(heroLoop);
        })();
    }

    /* ---------- 16. 3D tilt + glare on cards ---------- */
    if (canHover) {
        document.querySelectorAll('[data-tilt]').forEach(function (el) {
            var glare = document.createElement('span');
            glare.className = 'tilt-glare';
            el.appendChild(glare);
            var max = el.classList.contains('tcard') ? 7 : 5;
            el.addEventListener('mouseenter', function () {
                el.style.transition = 'transform .25s cubic-bezier(.16,1,.3,1), opacity .6s, filter .6s, box-shadow .6s';
            });
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
                el.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - py) * max).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * max).toFixed(2) + 'deg) translateY(-6px) scale(1.015)';
                el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
                el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
            });
            el.addEventListener('mouseleave', function () {
                el.style.transition = 'transform 1s cubic-bezier(.16,1,.3,1), opacity .6s, filter .6s, box-shadow .6s';
                el.style.transform = '';
            });
        });
    }

    /* ---------- 17. Drag to scroll (reviews) ---------- */
    var dragEl = document.querySelector('[data-reviews]');
    if (dragEl && finePointer) {
        var isDown = false, startX = 0, startLeft = 0, moved = false;
        dragEl.addEventListener('mousedown', function (e) {
            isDown = true; moved = false; startX = e.pageX; startLeft = dragEl.scrollLeft;
            dragEl.style.scrollSnapType = 'none'; dragEl.style.scrollBehavior = 'auto';
        });
        window.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            var dx = e.pageX - startX;
            if (Math.abs(dx) > 4) moved = true;
            dragEl.scrollLeft = startLeft - dx;
        });
        window.addEventListener('mouseup', function () {
            if (!isDown) return;
            isDown = false;
            dragEl.style.scrollSnapType = ''; dragEl.style.scrollBehavior = '';
        });
        dragEl.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
        dragEl.addEventListener('dragstart', function (e) { e.preventDefault(); });
    }

    /* ---------- 18. Custom cursor ---------- */
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (dot && ring && canHover) {
        var label = ring.querySelector('.cursor-ring__label');
        var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
        window.addEventListener('mousemove', function (e) {
            mx = e.clientX; my = e.clientY;
            if (!shown) { rx = mx; ry = my; shown = true; doc.classList.add('has-cursor'); }
        });
        document.addEventListener('mouseleave', function () { doc.classList.remove('has-cursor'); shown = false; });
        document.addEventListener('mouseover', function (e) {
            var t = e.target;
            var lab = t.closest && t.closest('[data-cursor]');
            if (t.tagName === 'IFRAME') { doc.classList.remove('has-cursor'); shown = false; return; }
            if (lab) {
                label.textContent = lab.getAttribute('data-cursor');
                ring.classList.add('is-label'); ring.classList.remove('is-link'); dot.classList.add('is-hidden');
                return;
            }
            ring.classList.remove('is-label'); dot.classList.remove('is-hidden');
            ring.classList.toggle('is-link', !!(t.closest && t.closest('a, button, .faq-btn, .chips li')));
        });
        window.addEventListener('mousedown', function () { ring.classList.add('is-down'); });
        window.addEventListener('mouseup', function () { ring.classList.remove('is-down'); });
        (function cursorLoop() {
            rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
            dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
            ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
            requestAnimationFrame(cursorLoop);
        })();
    }

    /* ---------- 11. Year ---------- */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
