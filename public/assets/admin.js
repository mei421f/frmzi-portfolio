var TOKEN_KEY = 'portfolio_admin_token';

var loginCard = document.getElementById('loginCard');
var uploadCard = document.getElementById('uploadCard');
var listCard = document.getElementById('listCard');
var loginForm = document.getElementById('loginForm');
var loginMsg = document.getElementById('loginMsg');
var uploadForm = document.getElementById('uploadForm');
var uploadMsg = document.getElementById('uploadMsg');
var uploadBtn = document.getElementById('uploadBtn');
var projectList = document.getElementById('projectList');

function showMsg(el, text, type) {
  el.innerHTML = '<div class="admin-msg ' + type + '">' + text + '</div>';
}
function clearMsg(el) { el.innerHTML = ''; }

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function enterAdmin() {
  loginCard.classList.add('hidden');
  uploadCard.classList.remove('hidden');
  listCard.classList.remove('hidden');
  loadProjects();
}

// اگر توکن ذخیره‌شده معتبر باشد مستقیم وارد پنل شویم
if (getToken()) {
  enterAdmin();
}

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearMsg(loginMsg);
  var password = document.getElementById('password').value;

  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password }),
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (r) {
      if (!r.ok) throw new Error(r.data.message || 'ورود ناموفق بود');
      localStorage.setItem(TOKEN_KEY, r.data.token);
      enterAdmin();
    })
    .catch(function (err) { showMsg(loginMsg, err.message, 'error'); });
});

uploadForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearMsg(uploadMsg);

  var title = document.getElementById('title').value;
  var description = document.getElementById('description').value;
  var fileInput = document.getElementById('media');
  var file = fileInput.files[0];

  if (!file) {
    showMsg(uploadMsg, 'لطفاً یک فایل ویدیو یا عکس انتخاب کنید', 'error');
    return;
  }

  var formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('media', file);
  formData.append('linkUrl', document.getElementById('linkUrl').value);

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'در حال آپلود...';

  fetch('/api/projects', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: formData,
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (r) {
      if (!r.ok) throw new Error(r.data.message || 'آپلود ناموفق بود');
      showMsg(uploadMsg, 'نمونه‌کار با موفقیت اضافه شد ✅', 'ok');
      uploadForm.reset();
      loadProjects();
    })
    .catch(function (err) { showMsg(uploadMsg, err.message, 'error'); })
    .finally(function () {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'آپلود نمونه‌کار';
    });
});

function loadProjects() {
  fetch('/api/projects')
    .then(function (res) { return res.json(); })
    .then(function (list) {
      if (!list.length) {
        projectList.innerHTML = '<p style="color:var(--muted); font-size:13.5px;">هنوز نمونه‌کاری اضافه نشده.</p>';
        return;
      }
      projectList.innerHTML = list.map(function (p) {
        return (
          '<div class="admin-list-item">' +
            '<div>' +
              '<div class="name">' + p.title + '</div>' +
              '<div class="sub">' + new Date(p.createdAt).toLocaleDateString('fa-IR') + '</div>' +
            '</div>' +
            '<button class="btn btn-danger" data-id="' + p.id + '">حذف</button>' +
          '</div>'
        );
      }).join('');

      projectList.querySelectorAll('button[data-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('این نمونه‌کار برای همیشه حذف می‌شود. مطمئنی؟')) return;
          fetch('/api/projects/' + btn.dataset.id, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + getToken() },
          })
            .then(function (res) { return res.json(); })
            .then(function () { loadProjects(); });
        });
      });
    });
}
