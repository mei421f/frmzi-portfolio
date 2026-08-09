// timecode ticker
(function () {
  var start = Date.now();
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    var el = document.getElementById('tc');
    if (!el) return;
    var diff = Date.now() - start;
    var totalSec = Math.floor(diff / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var f = Math.floor((diff % 1000) / 1000 * 24);
    el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// nav: active link + click-to-jump + mobile toggle + scroll progress
var sections = ['hero', 'about', 'skills', 'reel', 'tools', 'clients', 'team', 'faq', 'order', 'contact']
  .map(function (id) { return { id: id, el: document.getElementById(id) }; })
  .filter(function (s) { return s.el; });

var navLinksEl = document.getElementById('navLinks');
var navToggle = document.getElementById('navToggle');
var clickable = document.querySelectorAll('.nav-link, .nav-cta, .nav-logo, .btn-primary, .btn-ghost');

clickable.forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    var id = btn.dataset.target;
    if (!id) return;
    e.preventDefault();
    var target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (navLinksEl) navLinksEl.classList.remove('open');
    if (navToggle) { navToggle.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }
  });
});

if (navToggle) {
  navToggle.addEventListener('click', function () {
    var open = navLinksEl.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

var navLinkButtons = document.querySelectorAll('.nav-link');

function onScroll() {
  var doc = document.documentElement;
  var scrollTop = doc.scrollTop || document.body.scrollTop;
  var scrollH = doc.scrollHeight - doc.clientHeight;
  var pct = scrollH > 0 ? (scrollTop / scrollH) * 100 : 0;
  var fill = document.getElementById('scrubFill');
  if (fill) fill.style.width = pct + '%';

  var current = sections.length ? sections[0].id : null;
  sections.forEach(function (s) {
    var rect = s.el.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.4) current = s.id;
  });
  navLinkButtons.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.target === current);
  });
}
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// reveal-on-scroll for cards and text blocks
var revealIO = ('IntersectionObserver' in window)
  ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
  : null;

function observeReveal(root) {
  var items = (root || document).querySelectorAll('.reveal:not(.in)');
  items.forEach(function (el, i) {
    el.style.setProperty('--reveal-delay', Math.min(i, 6) * 70 + 'ms');
    if (revealIO) revealIO.observe(el);
    else el.classList.add('in');
  });
}
observeReveal();

// lazy play for a clip stage element (فقط برای ویدیوها)
function wireClipStage(stage) {
  stage.addEventListener('click', function () {
    if (stage.classList.contains('playing')) return;
    var src = stage.getAttribute('data-src');
    var video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    stage.appendChild(video);
    stage.classList.add('playing');
  });
}

// fetch and render projects from the backend
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderProjects(list) {
  var grid = document.getElementById('reelGrid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '<p class="reel-empty">هنوز نمونه‌کاری اضافه نشده. به‌زودی اضافه می‌شود.</p>';
    return;
  }

  grid.innerHTML = list.map(function (p, i) {
    var num = String(i + 1).padStart(2, '0');
    var isImage = p.type === 'image';
    var link = p.link || '';
    var stageInner = isImage
      ? '<img class="clip-img" src="' + p.url + '" alt="' + escapeHtml(p.title || '') + '" loading="lazy" />'
      : (
          '<div class="clip-poster">' +
            '<div class="play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' +
          '</div>'
        );
    return (
      '<article class="clip reveal">' +
        '<div class="clip-sprockets">' + '<i></i>'.repeat(10) + '</div>' +
        '<div class="clip-meta"><span>CLIP_' + num + '</span><span>' + escapeHtml((p.title || '').toUpperCase()) + '</span></div>' +
        '<div class="clip-stage' + (isImage ? ' is-image' : '') + (isImage && link ? ' has-link' : '') + '" data-src="' + p.url + '"' + (isImage && link ? ' data-link="' + escapeHtml(link) + '"' : '') + '>' +
          stageInner +
        '</div>' +
        '<div class="clip-body">' +
          '<h3 class="clip-title">' + escapeHtml(p.title) + '</h3>' +
          (p.description ? '<p class="clip-desc">' + escapeHtml(p.description) + '</p>' : '') +
        '</div>' +
      '</article>'
    );
  }).join('');

  grid.querySelectorAll('.clip-stage:not(.is-image)').forEach(wireClipStage);
  grid.querySelectorAll('.clip-stage.has-link').forEach(function (stage) {
    stage.addEventListener('click', function () {
      var link = stage.getAttribute('data-link');
      if (link) window.open(link, '_blank', 'noopener');
    });
  });
  observeReveal(grid);
}

fetch('/api/projects')
  .then(function (res) { return res.json(); })
  .then(renderProjects)
  .catch(function () {
    var grid = document.getElementById('reelGrid');
    if (grid) grid.innerHTML = '<p class="reel-empty">در حال حاضر امکان بارگذاری نمونه‌کارها نیست.</p>';
  });

// ===== custom cinematic cursor (fine pointer devices only) =====
(function () {
  var isFine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFine || reduceMotion) return;

  document.documentElement.classList.add('has-custom-cursor');
  var dot = document.getElementById('cursorDot');
  var ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  var hoverables = 'a, button, .clip-stage, .faq-q, input, textarea, select, .nav-link';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(hoverables)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(hoverables)) ring.classList.remove('hover');
  });
})();

// ===== subtle hero parallax on scroll =====
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var layers = hero.querySelectorAll('.hero-hud, .hero-kicker, .hero-name, .hero-role, .hero-actions');
  var ticking = false;

  function update() {
    ticking = false;
    var rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    var progress = Math.min(Math.max(-rect.top / (rect.height || 1), 0), 1);
    layers.forEach(function (el, i) {
      var depth = (i + 1) * 6;
      el.style.transform = 'translateY(' + (progress * depth) + 'px)';
      el.style.opacity = String(1 - progress * 0.5);
    });
  }
  document.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// ===== FAQ accordion =====
document.querySelectorAll('.faq-item').forEach(function (item) {
  var btn = item.querySelector('.faq-q');
  var answer = item.querySelector('.faq-a');
  if (!btn || !answer) return;
  btn.addEventListener('click', function () {
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function (other) {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-a').style.maxHeight = null;
      }
    });
    item.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
    answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
  });
});

// ===== floating quick-contact toggle =====
(function () {
  var wrap = document.getElementById('quickContact');
  var toggle = document.getElementById('quickContactToggle');
  if (!wrap || !toggle) return;
  toggle.addEventListener('click', function () {
    var open = wrap.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) wrap.classList.remove('open');
  });
})();
