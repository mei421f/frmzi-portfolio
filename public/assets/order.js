var orderForm = document.getElementById('orderForm');
var orderMsg = document.getElementById('orderMsg');
var orderBtn = document.getElementById('orderBtn');

function showOrderMsg(text, type) {
  orderMsg.innerHTML = '<div class="admin-msg ' + type + '">' + text + '</div>';
}
function clearOrderMsg() {
  orderMsg.innerHTML = '';
}

if (orderForm) {
  orderForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearOrderMsg();

    var payload = {
      name: document.getElementById('orderName').value.trim(),
      contact: document.getElementById('orderContact').value.trim(),
      service: document.getElementById('orderService').value,
      budget: document.getElementById('orderBudget').value.trim(),
      message: document.getElementById('orderMessage').value.trim(),
    };

    orderBtn.disabled = true;
    orderBtn.textContent = 'در حال ارسال...';

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        if (!r.ok) throw new Error(r.data.message || 'ارسال سفارش با خطا مواجه شد');
        showOrderMsg(r.data.message, 'ok');
        orderForm.reset();
      })
      .catch(function (err) {
        showOrderMsg(err.message, 'error');
      })
      .finally(function () {
        orderBtn.disabled = false;
        orderBtn.textContent = 'ارسال سفارش';
      });
  });
}
