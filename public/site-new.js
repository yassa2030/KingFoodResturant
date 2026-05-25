// Language & Dark Mode    ملف site_new.js
const lang = { get: () => localStorage.getItem('lang') || 'en', set: (l) => localStorage.setItem('lang', l) };
const theme = { get: () => localStorage.getItem('theme') || 'dark', set: (t) => localStorage.setItem('theme', t) };
const translations = {
  en: { cart: 'Add to cart', wishlist: 'Wishlist', addWish: 'Add to wishlist', removeWish: 'Remove', promo: 'Apply', total: 'Total', checkout: 'Checkout', noCart: 'Cart is empty' },
  ar: { cart: 'أضف إلى السلة', wishlist: 'المفضلة', addWish: 'أضف للمفضلة', removeWish: 'إزالة', promo: 'تطبيق', total: 'الإجمالي', checkout: 'الدفع', noCart: 'السلة فارغة' }
};
const t = (key) => translations[lang.get()]?.[key] || translations.en[key];

// API calls
const api = async (u, o = {}) => {
  const r = await fetch(u, { headers: { "Content-Type": "application/json" }, ...o });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Error");
  return d;
};

// State & Toast
const state = { products: [], categories: [], selectedCategory: null };
const showToast = (m, ok = true) => {
  const zone = document.getElementById('toastZone') || (() => {
    const z = document.createElement('div');
    z.id = 'toastZone';
    z.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;';
    document.body.appendChild(z);
    return z;
  })();
  const wrap = document.createElement('div');
  wrap.className = `toast align-items-center text-bg-${ok ? 'success' : 'danger'} border-0 show mb-2`;
  wrap.style.cssText = 'min-width:300px;';
  wrap.innerHTML = `<div class="d-flex"><div class="toast-body">${m}</div></div>`;
  zone.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3000);
};
const toast = (m, ok = true) => showToast((ok ? "✅ " : "❌ ") + m, ok);

// Dark Mode Toggle
function initTheme() {
  const btn = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  const applyTheme = () => {
    const t = theme.get();
    if (t === 'light') {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
      icon.className = 'bi bi-moon-fill';
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
      icon.className = 'bi bi-sun-fill';
    }
  };
  if (btn) {
    applyTheme();
    btn.addEventListener('click', () => {
      theme.set(theme.get() === 'dark' ? 'light' : 'dark');
      applyTheme();
    });
  }
}

const imgFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=60';
function imageFor(p) { return p.imageUrl || p.img || p.category?.imageUrl || imgFallback; }

async function refreshBadges() {
  try {
    const [c, w, o, n] = await Promise.all([
      api('/api/user/cart').catch(() => ({ items: [] })),
      api('/api/user/wishlist').catch(() => []),
      api('/api/user/orders').catch(() => []),
      api('/api/user/notifications').catch(() => [])
    ]);
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('cartBadge', c.items?.reduce((s, i) => s + i.qty, 0) || 0);
    set('wishBadge', w.length || 0);
    set('orderBadge', o.length || 0);
    set('notifBadge', n.length || 0);
  } catch { }
}

async function toggleWishlist(productId, btn) {
  try {
    const res = await api('/api/user/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) });
    if (res.liked) {
      btn.classList.add('text-danger');
      toast(t('addWish'));
    } else {
      btn.classList.remove('text-danger');
      toast(t('removeWish'));
    }
    refreshBadges();
  } catch (e) {
    toast(e.message, false);
  }
}

function applyFilterFn() {
  let arr = [...state.products];
  if (state.selectedCategory) arr = arr.filter(p => String(p.category?._id || p.category) === state.selectedCategory);
  const q = (searchInput?.value || '').toLowerCase();
  if (q) arr = arr.filter(p => p.name.toLowerCase().includes(q));
  const min = +minPrice?.value || 0, max = +maxPrice?.value || 1e9;
  arr = arr.filter(p => p.price >= min && p.price <= max);
  const s = sortBy?.value;
  if (s === 'low') arr.sort((a, b) => a.price - b.price);
  if (s === 'high') arr.sort((a, b) => b.price - a.price);
  if (s === 'new') arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  renderProducts(arr);
}

async function addToCart(productId) {
  try {
    await api('/api/user/cart', { method: 'POST', body: JSON.stringify({ productId, qty: 1 }) });
    toast(t('cart'));
    refreshBadges();
  } catch (e) {
    toast(e.message, false);
  }
}

function renderProducts(arr) {
  const productsEl = document.getElementById('productsGrid');
  if (!productsEl) return;
  productsEl.innerHTML = arr.map(p => {
    const n = new Date(p.createdAt) > new Date(Date.now() - 7 * 86400000);
    const disc = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    return `<div class='col-6 col-md-4 col-lg-3'><div class='card p-2'><div class='position-relative'><img class='product-img product-link' data-id='${p._id}' src='${imageFor(p)}'><button class='btn btn-sm position-absolute top-0 end-0 m-1 wishbtn' data-id='${p._id}' style='background:none;border:none;font-size:1.3rem;'><i class='bi bi-heart' style='color:white;'></i></button>${n ? "<span class='badge bg-primary position-absolute top-0 start-0 m-1'>New</span>" : ''}${disc ? `<span class='badge bg-danger position-absolute top-0 start-50 translate-middle-x m-1'>-${disc}%</span>` : ''}</div><h6 class='mt-2'>${p.name}</h6><div>$${p.price}</div><button class='btn btn-sm btn-primary add-cart mt-2' data-id='${p._id}'>${t('cart')}</button></div></div>`;
  }).join('');
  document.querySelectorAll('.add-cart').forEach(b => b.onclick = () => addToCart(b.dataset.id));
  document.querySelectorAll('.wishbtn').forEach(b => b.onclick = (e) => { e.stopPropagation(); toggleWishlist(b.dataset.id, b.querySelector('i')); });
  document.querySelectorAll('.product-link').forEach(i => i.onclick = () => location.href = '/product.html?id=' + i.dataset.id);
}

function renderCategories() {
  const categoriesEl = document.getElementById('categoriesGrid');
  if (!categoriesEl) return;
  categoriesEl.innerHTML = state.categories.map(c => `<div class='col-4 col-md-2 category-chip ${state.selectedCategory === c._id ? 'active' : ''}' data-id='${c._id}'><img src='${c.imageUrl || imgFallback}'><div class='small mt-1'>${c.nameEn}</div></div>`).join('');
  document.querySelectorAll('.category-chip').forEach(x => x.onclick = () => { state.selectedCategory = x.dataset.id === state.selectedCategory ? null : x.dataset.id; renderCategories(); applyFilterFn(); });
}

async function initHome() {
  if (!document.getElementById('productsGrid')) return;
  state.categories = await api('/api/store/categories');
  state.products = await api('/api/store/products');
  renderCategories();
  renderProducts(state.products);
  searchToggle && (searchToggle.onclick = () => searchPanel.classList.toggle('d-none'));
  searchInput && (searchInput.oninput = applyFilterFn);
  document.getElementById('applyFilter') && (document.getElementById('applyFilter').onclick = applyFilterFn);
  refreshBadges();
}

async function initCart() {
  if (!document.getElementById('cartList')) return;
  const c = await api('/api/user/cart');
  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');
  const promoCode = document.getElementById('promoCode');
  const applyPromo = document.getElementById('applyPromo');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (!c.items || c.items.length === 0) {
    cartList.innerHTML = `<p class='text-secondary'>${t('noCart')}</p>`;
    cartTotal.innerHTML = '<h4>Total: $0</h4>';
    return;
  }

  const renderCart = () => {
    cartList.innerHTML = (c.items || []).map(item => `
      <div class='card p-2 mb-2 d-flex flex-row gap-2 align-items-center'>
        <img src='${imageFor(item.product)}' style='width:80px;height:80px;border-radius:10px;object-fit:cover'>
        <div class='flex-grow-1'>
          <b>${item.product?.name || 'Product'}</b>
          <div>Price: $${item.product?.price || 0} x ${item.qty}</div>
        </div>
        <div class='d-flex gap-2'>
          <button class='btn btn-sm btn-outline-light' onclick='updateQty("${item.product._id}", -1)'>-</button>
          <span class='px-2 align-self-center'>${item.qty}</span>
          <button class='btn btn-sm btn-outline-light' onclick='updateQty("${item.product._id}", 1)'>+</button>
        </div>
        <button class='btn btn-sm btn-danger' onclick='removeFromCart("${item.product._id}")'>Remove</button>
      </div>
    `).join('');
    const total = (c.items || []).reduce((s, i) => s + (i.product?.price || 0) * i.qty, 0);
    cartTotal.innerHTML = `<h4>${t('total')}: $${total.toFixed(2)}</h4>`;
  };

  window.updateQty = async (id, delta) => {
    try {
      const res = await api('/api/user/cart/qty', { method: 'PUT', body: JSON.stringify({ productId: id, delta }) });
      Object.assign(c, res);
      renderCart();
    } catch (e) { toast(e.message, false); }
  };

  window.removeFromCart = async (id) => {
    try {
      await api('/api/user/cart', { method: 'DELETE', body: JSON.stringify({ productId: id }) });
      c.items = c.items.filter(i => i.product._id !== id);
      renderCart();
      refreshBadges();
    } catch (e) { toast(e.message, false); }
  };

  applyPromo && (applyPromo.onclick = async () => {
    try {
      const res = await api('/api/user/cart/apply-coupon', { method: 'POST', body: JSON.stringify({ code: promoCode.value }) });
      toast('Coupon applied: $' + res.discount);
      cartTotal.innerHTML = `<h4>${t('total')}: $${res.finalTotal.toFixed(2)} <small class='text-danger'>(-$${res.discount})</small></h4>`;
    } catch (e) { toast(e.message, false); }
  });

  checkoutBtn && (checkoutBtn.onclick = () => {
    if ((c.items || []).length === 0) { toast('Cart is empty', false); return; }
    showToast('Proceed to checkout...', true);
    setTimeout(() => location.href = '/payment.html', 500);
  });

  renderCart();
}

async function initProduct() {
  if (!document.getElementById('productDetails')) return;
  const id = new URLSearchParams(location.search).get('id');
  const p = await api('/api/store/products/' + id);
  const productDetails = document.getElementById('productDetails');
  productDetails.innerHTML = `
    <img class='product-img mb-3' src='${imageFor(p)}'>
    <h2>${p.name}</h2>
    <p>${p.dsc || ''}</p>
    <ul>
      <li>Price: $${p.price}</li>
      <li>Rate: ${p.rate || 'N/A'}</li>
    </ul>
    <button class='btn btn-primary' id='addP'>${t('cart')}</button>
  `;
  document.getElementById('addP').onclick = () => addToCart(p._id);
}

async function initProfile() {
  if (!document.getElementById('profileForm')) return;
  const p = await api('/api/user/profile');
  const profileCard = document.getElementById('profileCard');
  const profileForm = document.getElementById('profileForm');
  const langBtn = document.querySelector('[href*="AR/EN"]');

  profileCard.innerHTML = `<img class='small-avatar' src='${p.photoUrl || imgFallback}'><h4 class='mt-2'>${p.fullName || ''}</h4><div>${p.email || ''}</div>`;
  document.getElementById('fullName').value = p.fullName || '';
  document.getElementById('email').value = p.email || '';
  document.getElementById('phone').value = p.phone || '';
  document.getElementById('dob').value = (p.dob || '').slice(0, 10);
  document.getElementById('gender').value = p.gender || 'male';

  if (langBtn) {
    langBtn.onclick = (e) => {
      e.preventDefault();
      lang.set(lang.get() === 'en' ? 'ar' : 'en');
      location.reload();
    };
  }

  profileForm.onsubmit = async (e) => {
    e.preventDefault();
    let photoUrl = p.photoUrl;
    if (document.getElementById('photo').files[0]) {
      const r = new FileReader();
      photoUrl = await new Promise(res => {
        r.onload = () => res(r.result);
        r.readAsDataURL(document.getElementById('photo').files[0]);
      });
    }
    await api('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        photoUrl
      })
    });
    toast('Profile updated');
  };

  document.getElementById('logoutUser') && (document.getElementById('logoutUser').onclick = async () => {
    await api('/api/logout', { method: 'POST' });
    location.href = '/login.html';
  });
}

async function initOrders() {
  if (!document.getElementById('ordersList')) return;
  const data = await api('/api/user/orders');
  document.getElementById('ordersList').innerHTML = data.map(o => `
    <div class='card p-3 mb-2'>
      <div class='d-flex justify-content-between'><b>${o.orderNo || o._id}</b><span>${o.status}</span></div>
      <small>${new Date(o.createdAt).toLocaleString()}</small>
      <div>Total: $${o.total}</div>
      <div>${(o.items || []).map(i => `<div>${i.name} x${i.qty} - $${i.price}</div>`).join('')}</div>
    </div>
  `).join('') || '<div class="text-secondary">No orders yet</div>';
}

async function initWishlist() {
  if (!document.getElementById('wishList')) return;
  const d = await api('/api/user/wishlist');
  const wishCount = document.getElementById('wishCount');
  const wishList = document.getElementById('wishList');
  if (wishCount) wishCount.textContent = d.length;
  wishList.innerHTML = d.map(p => `
    <div class='card p-2 mb-2 d-flex flex-row gap-2 align-items-center'>
      <img src='${imageFor(p)}' style='width:70px;height:70px;border-radius:10px;object-fit:cover'>
      <div class='flex-grow-1'><b>${p.name}</b><div>$${p.price}</div></div>
      <button class='btn btn-primary btn-sm add-w' data-id='${p._id}'>${t('cart')}</button>
    </div>
  `).join('');
  document.querySelectorAll('.add-w').forEach(b => b.onclick = () => addToCart(b.dataset.id));
}

async function initNotifications() {
  if (!document.getElementById('nots')) return;
  const d = await api('/api/user/notifications');
  document.getElementById('nots').innerHTML = d.map(n => `
    <div class='card p-3 mb-2'><b>${n.title}</b><p class='mb-0'>${n.message || ''}</p></div>
  `).join('');
}

async function initAddresses() {
  if (!document.getElementById('addressList')) return;
  const load = async () => {
    const a = await api('/api/user/addresses');
    document.getElementById('addressList').innerHTML = a.map(x => `
      <div class='card p-2 mb-2'>${x.fullName} - ${x.streetAddress}, ${x.city}
        <button class='btn btn-sm btn-outline-light' onclick='setD("${x._id}")'>Default</button>
      </div>
    `).join('');
  };
  window.setD = async (id) => {
    await api('/api/user/addresses/default', { method: 'PUT', body: JSON.stringify({ id }) });
    load();
  };
  const addAddrBtn = document.getElementById('addAddrBtn');
  if (addAddrBtn) {
    addAddrBtn.onclick = async () => {
      await api('/api/user/addresses', {
        method: 'POST',
        body: JSON.stringify({
          type: 'home',
          fullName: prompt('Name'),
          phone: prompt('Phone'),
          streetAddress: prompt('Street'),
          city: prompt('City'),
          zipCode: prompt('ZIP'),
          isDefault: true
        })
      });
      load();
    };
  }
  load();
}

async function initSubscribe() {
  if (!document.getElementById('subscribeForm')) return;
  document.getElementById('subscribeForm').onsubmit = async (e) => {
    e.preventDefault();
    await api('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ name: document.getElementById('subName').value, email: document.getElementById('subEmail').value })
    });
    toast('Subscribed');
  };
}

// Initialize all
initTheme();
initHome();
initCart();
initProduct();
initProfile();
initOrders();
initWishlist();
initNotifications();
initAddresses();
initSubscribe();
refreshBadges();
