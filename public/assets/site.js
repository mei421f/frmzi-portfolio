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
var sections = ['hero', 'about', 'skills', 'reel', 'tools', 'clients', 'team', 'order', 'contact']
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
  items.forEach(function (el) {
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
