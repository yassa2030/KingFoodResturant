// Language & Dark Mode        ملف site.js
const lang = {
  get: () => localStorage.getItem('app_lang') || 'en',
  set: (l) => { localStorage.setItem('app_lang', l); i18n.setLang(l); }
};
const theme = {
  get: () => localStorage.getItem('website_theme') || 'light',
  set: (t) => localStorage.setItem('website_theme', t)
};

// ==================== GLOBAL DARK/LIGHT MODE ====================
// Apply saved theme immediately to prevent flash, then initTheme handles toggles
(function applySavedTheme() {
  const saved = localStorage.getItem('website_theme') || 'light';
  if (saved === 'dark') {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  }
})();

const translations = {
  en: {
    cart: 'Add to cart',
    wishlist: 'Wishlist',
    addWish: 'Add to wishlist',
    removeWish: 'Remove',
    promo: 'Apply',
    total: 'Total',
    checkout: 'Checkout',
    noCart: 'Cart is empty',
    home: 'Home',
    about: 'About',
    menu: 'Menu',
    bookTable: 'Book Table',
    profile: 'Profile',
    orders: 'Orders',
    support: 'Support',
    logout: 'Logout',
    notifications: 'Notifications',
    search: 'Search',
    delivered: 'Delivered',
    shipping: 'Shipping',
    processing: 'Processing',
    cancelled: 'Cancelled',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    pay_secure: 'Secure Checkout',
    pay_subtitle: 'Complete your order with Paymob',
    pay_summary: 'Order Summary',
    pay_subtotal: 'Subtotal',
    pay_shipping: 'Shipping',
    pay_tax: 'Tax (14%)',
    pay_discount: 'Discount',
    pay_total: 'Total',
    pay_method: 'Payment Method',
    pay_now: 'Pay Securely with Paymob',
    pay_secured: 'Secured by Paymob • 256-bit SSL',
    pay_safe: 'Your payment is processed securely through Paymob. We never store your card details.',
    pay_back: 'Back to Cart',
    pay_success: 'Payment Successful!',
    pay_success_msg: 'Your order has been placed successfully. Thank you for choosing King Food!',
    pay_fail: 'Payment Failed',
    pay_fail_msg: 'Your payment could not be processed. Please try again.',
    pay_continue: 'Continue Shopping',
    pay_view_orders: 'View Orders',
    pay_processing: 'Connecting to Paymob...',
    pay_retry: 'Try Again'
  },
  ar: {
    cart: 'أضف إلى السلة',
    wishlist: 'المفضلة',
    addWish: 'أضف للمفضلة',
    removeWish: 'إزالة',
    promo: 'تطبيق',
    total: 'الإجمالي',
    checkout: 'الدفع',
    noCart: 'السلة فارغة',
    home: 'الرئيسية',
    about: 'معلومات',
    menu: 'القائمة',
    bookTable: 'حجز طاولة',
    profile: 'الملف الشخصي',
    orders: 'الطلبات',
    support: 'الدعم',
    logout: 'تسجيل الخروج',
    notifications: 'الإشعارات',
    search: 'بحث',
    delivered: 'تم التسليم',
    shipping: 'قيد الشحن',
    processing: 'قيد المعالجة',
    cancelled: 'ملغاة',
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    pay_secure: 'الدفع الآمن',
    pay_subtitle: 'أكمل طلبك عبر باي موب',
    pay_summary: 'ملخص الطلب',
    pay_subtotal: 'المجموع الفرعي',
    pay_shipping: 'الشحن',
    pay_tax: 'الضريبة (14%)',
    pay_discount: 'الخصم',
    pay_total: 'الإجمالي',
    pay_method: 'طريقة الدفع',
    pay_now: 'ادفع بأمان عبر باي موب',
    pay_secured: 'مؤمن بواسطة Paymob • تشفير 256-bit',
    pay_safe: 'يتم معالجة دفعتك بأمان عبر Paymob. نحن لا نخزن بيانات بطاقتك أبداً.',
    pay_back: 'العودة إلى السلة',
    pay_success: 'تم الدفع بنجاح!',
    pay_success_msg: 'تم تقديم طلبك بنجاح. شكراً لاختيار King Food!',
    pay_fail: 'فشل الدفع',
    pay_fail_msg: 'تعذرت معالجة دفعتك. حاول مرة أخرى.',
    pay_continue: 'متابعة التسوق',
    pay_view_orders: 'عرض الطلبات',
    pay_processing: 'جاري الاتصال بـ Paymob...',
    pay_retry: 'حاول مرة أخرى'
  }
};

const t = (key) => translations[lang.get()]?.[key] || translations.en[key];

const api = async (u, o = {}) => {
  const r = await fetch(u, { headers: { 'Content-Type': 'application/json' }, ...o });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Error');
  return d;
};

const state = { products: [], categories: [], selectedCategory: null };

function showToast(m, ok = true) {
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
}

const toast = (m, ok = true) => showToast((ok ? '✅ ' : '❌ ') + m, ok);
const imgFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=60';

function initTheme() {
  const btn = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');

  const applyTheme = () => {
    const th = theme.get();
    if (th === 'light') {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      if (icon) icon.className = 'bi bi-moon-fill';
    } else {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      if (icon) icon.className = 'bi bi-sun-fill';
    }
  };

  if (btn) {
    applyTheme();
    btn.addEventListener('click', () => {
      const newTheme = theme.get() === 'dark' ? 'light' : 'dark';
      theme.set(newTheme);
      applyTheme();
    });
  }

  // ✅ Language toggle using i18n system
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const newLang = i18n.toggleLang();
      const langIcon = langBtn.querySelector('i');
      if (langIcon) {
        langIcon.className = newLang === 'ar' ? 'bi bi-translate' : 'bi bi-globe';
      }
      i18n.applyTranslations();
      if (typeof renderCategories === 'function') renderCategories();
      if (typeof renderProducts === 'function') renderProducts(state.products || []);
      if (typeof renderCart === 'function') renderCart();
    });
  }
}

function initScrollButton() {
  const btn = document.createElement('button');
  btn.id = 'scrollToTop';
  btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  btn.style.cssText = 'position:fixed;bottom:100px;right:30px;z-index:997;background:linear-gradient(135deg,#ff6b35,#f59e0b);color:white;border:none;border-radius:50%;width:50px;height:50px;cursor:pointer;display:none;font-size:1.5rem;animation:pulse 2s infinite;box-shadow:0 4px 12px rgba(255,107,53,0.4);transition:all 0.3s ease;align-items:center;justify-content:center';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
  });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  btn.addEventListener('mouseover', () => btn.style.transform = 'scale(1.1)');
  btn.addEventListener('mouseout', () => btn.style.transform = 'scale(1)');
}

// ==================== CATEGORY-BASED PRODUCT IMAGES ====================
const categoryImages = {
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
  drink: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
  seafood: 'https://images.unsplash.com/photo-1559737558-2f5e35155904?auto=format&fit=crop&w=800&q=80',
  steak: 'https://images.unsplash.com/photo-1546833998-877b3762b5e6?auto=format&fit=crop&w=800&q=80',
  chicken: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  icecream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80',
  chocolate: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80',
  bbq: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
};

function getImageForProduct(product) {
  if (!product) return categoryImages.default;
  if (product.imageUrl) return product.imageUrl;
  if (product.img) return product.img;

  const name = (product.name || '').toLowerCase();
  const catName = (product.category?.nameEn || product.category?.name || '').toLowerCase();
  const combined = name + ' ' + catName;

  if (combined.includes('pizza')) return categoryImages.pizza;
  if (combined.includes('burger') || combined.includes('برجر')) return categoryImages.burger;
  if (combined.includes('dessert') || combined.includes('حلويات') || combined.includes('cake') || combined.includes('chocolate')) return categoryImages.dessert;
  if (combined.includes('drink') || combined.includes('مشروب') || combined.includes('juice') || combined.includes('coffee')) return categoryImages.drink;
  if (combined.includes('seafood') || combined.includes('fish') || combined.includes('shrimp') || combined.includes('مأكولات بحرية')) return categoryImages.seafood;
  if (combined.includes('steak') || combined.includes('مشوي') || combined.includes('meat')) return categoryImages.steak;
  if (combined.includes('chicken') || combined.includes('دجاج') || combined.includes('مقلي')) return categoryImages.chicken;
  if (combined.includes('sandwich') || combined.includes('ساندوتش')) return categoryImages.sandwich;
  if (combined.includes('ice cream') || combined.includes('أيس كريم')) return categoryImages.icecream;
  if (combined.includes('chocolate') || combined.includes('شوكولاتة')) return categoryImages.chocolate;
  if (combined.includes('bbq') || combined.includes('مشاوي')) return categoryImages.bbq;
  if (combined.includes('bread') || combined.includes('خبز')) return categoryImages.bread;

  return categoryImages.default;
}

// ✅ Single unified imageFor function (no double-override conflict)
function imageFor(product) {
  return getImageForProduct(product);
}
window.imageFor = imageFor;

function applyFilterFn() {
  let arr = [...state.products];
  if (state.selectedCategory) arr = arr.filter(p => String(p.category?._id || p.category) === state.selectedCategory);
  const searchInput = document.getElementById('searchInput');
  const q = (searchInput?.value || '').toLowerCase();
  if (q) arr = arr.filter(p => p.name.toLowerCase().includes(q));
  const minPrice = document.getElementById('minPrice');
  const maxPrice = document.getElementById('maxPrice');
  const sortBy = document.getElementById('sortBy');
  const min = +minPrice?.value || 0;
  const max = +maxPrice?.value || 1e9;
  arr = arr.filter(p => p.price >= min && p.price <= max);
  const s = sortBy?.value;
  if (s === 'relevance') {
    arr.sort((a, b) => {
      const aCat = String(a.category?._id || a.category);
      const bCat = String(b.category?._id || b.category);
      if (aCat !== bCat) return aCat === state.selectedCategory ? -1 : bCat === state.selectedCategory ? 1 : 0;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } else if (s === 'low') arr.sort((a, b) => a.price - b.price);
  else if (s === 'high') arr.sort((a, b) => b.price - a.price);
  else if (s === 'new') arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

function renderCategories() {
  const categoriesEl = document.getElementById('categoriesGrid');
  if (!categoriesEl) return;
  categoriesEl.innerHTML = state.categories.map(c =>
    `<div class='col-4 col-md-2 category-chip ${state.selectedCategory === c._id ? 'active' : ''}' data-id='${c._id}'>
      <img src='${c.imageUrl || imgFallback}'>
      <div class='small mt-1'>${lang.get() === 'ar' ? (c.nameAr || c.nameEn) : c.nameEn}</div>
    </div>`
  ).join('');
  document.querySelectorAll('.category-chip').forEach(x => x.onclick = () => {
    state.selectedCategory = x.dataset.id === state.selectedCategory ? null : x.dataset.id;
    renderCategories();
    applyFilterFn();
  });
}

function renderProducts(arr) {
  const productsEl = document.getElementById('productsGrid');
  if (!productsEl) return;
  productsEl.innerHTML = arr.map(p => {
    const n = new Date(p.createdAt) > new Date(Date.now() - 7 * 86400000);
    const disc = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    return `<div class='col-6 col-md-4 col-lg-3'>
      <div class='card p-2'>
        <div class='position-relative'>
          <img class='product-img product-link' data-id='${p._id}' src='${imageFor(p)}'>
          <button class='btn btn-sm position-absolute top-0 end-0 m-1 wishbtn' data-id='${p._id}' style='background:none;border:none;font-size:1.3rem;'>
            <i class='bi bi-heart' style='color:white;'></i>
          </button>
          ${n ? "<span class='badge bg-primary position-absolute top-0 start-0 m-1'>New</span>" : ''}
          ${disc ? `<span class='badge bg-danger position-absolute top-0 start-50 translate-middle-x m-1'>-${disc}%</span>` : ''}
        </div>
        <h6 class='mt-2'>${p.name}</h6>
        <div class='d-flex justify-content-between align-items-center'>
          <span style='font-weight:700;color:var(--accent);'>$${p.price}</span>
          <span style='font-size:12px;color:#f59e0b;'>${'★'.repeat(Math.round(p.rating || 0))}${'☆'.repeat(5 - Math.round(p.rating || 0))}</span>
        </div>
        <button class='btn btn-sm btn-primary add-cart mt-2' data-id='${p._id}'>${t('cart')}</button>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('.add-cart').forEach(b => b.onclick = () => addToCart(b.dataset.id));
  document.querySelectorAll('.wishbtn').forEach(b => b.onclick = (e) => {
    e.stopPropagation();
    toggleWishlist(b.dataset.id, b.querySelector('i'));
  });
  document.querySelectorAll('.product-link').forEach(i => i.onclick = () => location.href = '/product.html?id=' + i.dataset.id);
}

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

// ==================== CART ====================
async function initCart() {
  if (!document.getElementById('cartList')) return;

  let c = {};
  try {
    c = await api('/api/user/cart');
  } catch (e) {
    document.getElementById('cartList').innerHTML = `<p class='text-secondary'>${t('noCart')}</p>`;
    return;
  }

  const cartList = document.getElementById('cartList');
  const cartTotal = document.getElementById('cartTotal');
  const promoCode = document.getElementById('promoCode');
  const applyPromo = document.getElementById('applyPromo');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (!c.items || c.items.length === 0) {
    cartList.innerHTML = `<p class='text-secondary'>${t('noCart')}</p>`;
    if (cartTotal) cartTotal.innerHTML = '<h4>Total: $0</h4>';
    return;
  }

  const renderCart = () => {
    const TAX_RATE = 0.14;
    const SHIPPING_FEE = 10;

    // ✅ FIX: Filter out items where product is null/undefined before rendering
    const validItems = (c.items || []).filter(item => item && item.product && item.product._id);

    cartList.innerHTML = validItems.map(item => `
      <div class='card p-3 mb-3 d-flex flex-row gap-3 align-items-center flex-wrap'>
        <img src='${imageFor(item.product)}' style='width:80px;height:80px;border-radius:10px;object-fit:cover;flex-shrink:0'
             onerror="this.src='${imgFallback}'">
        <div class='flex-grow-1'>
          <b style='font-size:16px;display:block;margin-bottom:4px;'>${item.product.name || 'Product'}</b>
          <div style='color:var(--muted);font-size:14px;'>
            ${lang.get() === 'ar' ? 'السعر' : 'Price'}: $${(item.product.price || 0).toFixed(2)} × ${item.qty}
          </div>
        </div>
        <div class='d-flex gap-2 align-items-center cart-qty-actions'>
          <button class='btn btn-sm btn-outline-secondary' onclick='updateQty("${item.product._id}", -1)'>-</button>
          <span class='px-2 align-self-center' style='font-weight:600;'>${item.qty}</span>
          <button class='btn btn-sm btn-outline-secondary' onclick='updateQty("${item.product._id}", 1)'>+</button>
        </div>
        <button class='btn btn-sm btn-danger cart-delete-btn' onclick='removeFromCart("${item.product._id}")'>
          <i class='bi bi-trash'></i>
        </button>
      </div>
    `).join('');

    if (validItems.length === 0) {
      cartList.innerHTML = `<p class='text-secondary'>${t('noCart')}</p>`;
    }

    // Calculate totals using validItems
    const subtotal = validItems.reduce((s, i) => s + (i.product.price || 0) * i.qty, 0);
    const discountAmount = c.discountAmount || 0;
    const tax = (subtotal - discountAmount) * TAX_RATE;
    const shipping = SHIPPING_FEE;
    const total = subtotal + tax + shipping - discountAmount;

    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('taxAmount');
    const shippingEl = document.getElementById('shippingAmount');
    const discountRow = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');

    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (taxEl) taxEl.textContent = '$' + tax.toFixed(2);
    if (shippingEl) shippingEl.textContent = '$' + shipping.toFixed(2);

    if (discountAmount > 0 && discountRow) {
      discountRow.style.display = 'flex';
      if (discountAmountEl) discountAmountEl.textContent = '-$' + discountAmount.toFixed(2);
    } else if (discountRow) {
      discountRow.style.display = 'none';
    }

    if (cartTotal) cartTotal.textContent = '$' + total.toFixed(2);

    // Show applied discount info
    const discountInfo = document.getElementById('discountInfo');
    if (discountInfo) {
      if (c.discountCode) {
        discountInfo.innerHTML = `
          <div class='discount-info'>
            <strong>${c.discountCode}</strong> ${lang.get() === 'ar' ? 'مُطبَّق' : 'applied'}
            <small>${lang.get() === 'ar' ? 'توفير' : 'Saving'}: $${discountAmount.toFixed(2)}</small>
          </div>`;
      } else {
        discountInfo.innerHTML = '';
      }
    }
  };

  // ✅ Expose renderCart globally so theme toggle can call it
  window.renderCart = renderCart;

  // ✅ FIX: updateQty with null guards
  window.updateQty = async (id, delta) => {
    try {
      const res = await api('/api/user/cart/qty', { method: 'PUT', body: JSON.stringify({ productId: id, delta }) });
      Object.assign(c, res);
      renderCart();
    } catch (e) {
      toast(e.message, false);
    }
  };

  // ✅ FIX: removeFromCart with null guard
  window.removeFromCart = async (id) => {
    try {
      await api('/api/user/cart', { method: 'DELETE', body: JSON.stringify({ productId: id }) });
      c.items = (c.items || []).filter(i => i.product && i.product._id !== id);
      renderCart();
      refreshBadges();
    } catch (e) {
      toast(e.message, false);
    }
  };

  // ✅ FIX: Apply coupon - improved error handling & response parsing
  if (applyPromo) {
    applyPromo.onclick = async () => {
      try {
        const code = (promoCode ? promoCode.value.trim().toUpperCase() : '');
        if (!code) {
          toast(lang.get() === 'ar' ? 'الرجاء إدخال كود الخصم' : 'Please enter a promo code', false);
          return;
        }

        const res = await api('/api/user/cart/apply-coupon', {
          method: 'POST',
          body: JSON.stringify({ code })
        });

        // ✅ Reload cart with updated discount from server
        const updatedCart = await api('/api/user/cart');
        Object.assign(c, updatedCart);

        const savedAmount = res.discount != null ? Number(res.discount).toFixed(2) : '0.00';
        const successMsg = lang.get() === 'ar'
          ? `✓ تم تطبيق الكود! وفّرت $${savedAmount}`
          : `✓ ${res.message || 'Coupon applied!'} You saved $${savedAmount}`;
        toast(successMsg, true);

        if (promoCode) promoCode.value = '';
        triggerConfetti();
        renderCart();
        refreshBadges();
      } catch (e) {
        const errMsg = lang.get() === 'ar'
          ? 'كود خصم غير صالح أو منتهي الصلاحية'
          : (e.message || 'Invalid or expired promo code');
        toast(errMsg, false);
      }
    };
  }

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      const validItems = (c.items || []).filter(item => item && item.product && item.product._id);
      if (validItems.length === 0) { toast('Cart is empty', false); return; }
      showToast('Proceeding to checkout...', true);
      setTimeout(() => location.href = '/payment.html', 500);
    };
  }

  renderCart();
}

// ==================== ORDERS ====================
async function initOrders() {
  if (!document.getElementById('ordersList')) return;
  try {
    const data = await api('/api/user/orders');
    document.getElementById('ordersList').innerHTML = (data || []).map(o =>
      `<div class='card p-3 mb-3 border-2'>
        <div class='row g-2'>
          <div class='col-md-8'>
            <div class='d-flex justify-content-between align-items-center mb-2'>
              <b class='fs-5'>${o.orderNo || 'Order #' + o._id}</b>
              <span class='badge bg-${o.status === 'delivered' ? 'success' : o.status === 'shipping' ? 'info' : o.status === 'cancelled' ? 'danger' : 'warning'}'>
                ${o.status || 'processing'}
              </span>
            </div>
            <small class='text-secondary'>${new Date(o.createdAt).toLocaleString()}</small>
            <div class='mt-2'>
              ${(o.items || []).map(i =>
        `<div class='d-flex gap-2 mb-2 p-2 bg-light rounded'>
                  <img src='${i.product?.imageUrl || imgFallback}' style='width:60px;height:60px;border-radius:5px;object-fit:cover'
                       onerror="this.src='${imgFallback}'">
                  <div class='flex-grow-1'>
                    <div class='fw-bold'>${i.name || i.product?.name || 'Product'}</div>
                    <small>Qty: ${i.qty} × $${(i.price || i.product?.price || 0).toFixed(2)}</small>
                  </div>
                </div>`
      ).join('')}
            </div>
          </div>
          <div class='col-md-4'>
            ${o.shippingAddress ? `<div class='mb-2 p-2 border rounded'><small class='text-secondary'><i class='bi bi-geo-alt'></i> ${o.shippingAddress}</small></div>` : ''}
            <div class='card bg-light p-3 text-center'>
              <div class='text-muted'>Order Total</div>
              <h4 class='mb-0 text-primary'>$${(o.total || 0).toFixed(2)}</h4>
              <small class='text-muted mt-2 d-block'>Tax: $${(o.tax || 0).toFixed(2)}</small>
              <small class='text-muted'>Shipping: $${(o.shipping || 0).toFixed(2)}</small>
            </div>
          </div>
        </div>
      </div>`
    ).join('') || '<div class="text-secondary">No orders yet</div>';
  } catch (e) {
    console.error('initOrders error:', e);
  }
}

// ==================== WISHLIST ====================
async function initWishlist() {
  if (!document.getElementById('wishList')) return;
  try {
    const d = await api('/api/user/wishlist');
    const wishCount = document.getElementById('wishCount');
    const wishList = document.getElementById('wishList');
    if (wishCount) wishCount.textContent = d.length;
    wishList.innerHTML = (d || []).map(p =>
      `<div class='card p-2 mb-2 d-flex flex-row gap-2 align-items-center'>
        <img src='${imageFor(p)}' style='width:70px;height:70px;border-radius:10px;object-fit:cover'
             onerror="this.src='${imgFallback}'">
        <div class='flex-grow-1'>
          <b>${p.name}</b>
          <div>$${p.price}</div>
        </div>
        <button class='btn btn-primary btn-sm add-w' data-id='${p._id}'>${t('cart')}</button>
      </div>`
    ).join('');
    document.querySelectorAll('.add-w').forEach(b => b.onclick = () => addToCart(b.dataset.id));
  } catch (e) {
    console.error('initWishlist error:', e);
  }
}

// ==================== NOTIFICATIONS ====================
async function initNotifications() {
  const container = document.getElementById('nots');
  if (!container) return;
  try {
    const data = await api('/api/user/notifications');
    const unreadCount = (data || []).filter(n => !n.isRead).length;
    updateNotificationBadge(unreadCount);

    container.innerHTML = (data || []).map(n =>
      `<div class='card p-3 mb-2 notif-item ${n.isRead ? 'read' : ''}' id='notif-${n._id}'>
        <div class='d-flex justify-content-between align-items-start'>
          <div>
            <b>${n.title}</b>
            <p class='mb-0 text-secondary'>${n.message || ''}</p>
            <small class='text-muted'>${new Date(n.createdAt).toLocaleString()}</small>
          </div>
          ${!n.isRead
        ? `<button class='btn btn-sm btn-outline-primary mark-read-btn' onclick='markSingleNotificationRead("${n._id}")'>
                <i class='bi bi-check-lg'></i> Read
              </button>`
        : '<span class="badge bg-success"><i class="bi bi-check2"></i> Read</span>'}
        </div>
      </div>`
    ).join('') || '<div class="text-center text-secondary mt-4">No notifications yet</div>';
  } catch (e) {
    console.error('initNotifications error:', e);
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-block';
    badge.style.transform = 'scale(1)';
    badge.style.opacity = '1';
  } else {
    badge.style.transform = 'scale(0)';
    badge.style.opacity = '0';
    setTimeout(() => {
      badge.textContent = '0';
      badge.style.display = 'none';
    }, 300);
  }
}

async function markSingleNotificationRead(id) {
  try {
    await api(`/api/user/notifications/${id}/read`, { method: 'POST' });
    const el = document.getElementById(`notif-${id}`);
    if (el) {
      el.classList.add('read');
      const btn = el.querySelector('.mark-read-btn');
      if (btn) btn.outerHTML = '<span class="badge bg-success"><i class="bi bi-check2"></i> Read</span>';
    }
    const badge = document.getElementById('notifBadge');
    const current = parseInt(badge?.textContent || '0', 10);
    if (current > 0) updateNotificationBadge(current - 1);
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
  }
}

async function markAllNotificationsRead() {
  try {
    await api('/api/user/notifications/mark-all-read', { method: 'POST' });
    updateNotificationBadge(0);
    document.querySelectorAll('.notif-item').forEach(el => {
      el.classList.add('read');
      const btn = el.querySelector('.mark-read-btn');
      if (btn) btn.outerHTML = '<span class="badge bg-success"><i class="bi bi-check2"></i> Read</span>';
    });
    if (document.getElementById('nots')) setTimeout(() => initNotifications(), 300);
  } catch (e) {
    console.error('Failed to mark all as read:', e);
  }
}

// ==================== ADDRESSES ====================
async function initAddresses() {
  if (!document.getElementById('addressList')) return;

  // ✅ FIX: Store addresses at module-level so editAddress can access them
  let addressCache = [];

  const load = async () => {
    try {
      addressCache = await api('/api/user/addresses');
      document.getElementById('addressList').innerHTML = (addressCache || []).map(x =>
        `<div class='address-card ${x.isDefault ? 'default' : ''}'>
          <div class='address-card-header'>
            <div>
              <div class='address-card-title'>${x.fullName}</div>
              <div class='address-card-type'>${x.addressType || 'home'}</div>
            </div>
            ${x.isDefault ? '<span class="badge bg-primary">Default</span>' : ''}
          </div>
          <div class='address-card-content'>
            <div><i class='bi bi-telephone'></i> ${x.phone}</div>
            <div><i class='bi bi-geo-alt'></i> ${x.streetAddress}, ${x.city}, ${x.zipCode || ''}${x.country ? ', ' + x.country : ''}</div>
            ${x.notes ? `<div><i class='bi bi-file-text'></i> ${x.notes}</div>` : ''}
          </div>
          <div class='address-card-actions'>
            <button class='btn-edit' onclick='editAddress("${x._id}")'>
              <i class='bi bi-pencil'></i> Edit
            </button>
            <button class='btn-default' onclick='setDefault("${x._id}")' ${x.isDefault ? 'disabled' : ''}>
              <i class='bi bi-check-circle'></i> Set Default
            </button>
            <button class='btn-delete' onclick='deleteAddress("${x._id}")'>
              <i class='bi bi-trash'></i> Delete
            </button>
          </div>
        </div>`
      ).join('');

      const emptyState = document.getElementById('emptyAddresses');
      if (emptyState) emptyState.style.display = addressCache.length === 0 ? 'block' : 'none';
    } catch (e) {
      console.error('loadAddresses error:', e);
    }
  };

  window.setDefault = async (id) => {
    try {
      await api('/api/user/addresses/default', { method: 'PUT', body: JSON.stringify({ id }) });
      load();
      toast('Default address updated', true);
    } catch (e) { toast(e.message, false); }
  };

  window.deleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api('/api/user/addresses/' + id, { method: 'DELETE' });
      load();
      toast('Address deleted', true);
    } catch (e) { toast(e.message, false); }
  };

  // ✅ FIX: Use addressCache instead of out-of-scope `a`
  window.editAddress = (id) => {
    const address = addressCache.find(addr => addr._id === id);
    if (!address) return;

    const editAddressId = document.getElementById('editAddressId');
    const editFullName = document.getElementById('editFullName');
    const editPhone = document.getElementById('editPhone');
    const editStreetAddress = document.getElementById('editStreetAddress');
    const editCity = document.getElementById('editCity');
    const editZipCode = document.getElementById('editZipCode');
    const editAddressType = document.getElementById('editAddressType');

    if (editAddressId) editAddressId.value = id;
    if (editFullName) editFullName.value = address.fullName || '';
    if (editPhone) editPhone.value = address.phone || '';
    if (editStreetAddress) editStreetAddress.value = address.streetAddress || '';
    if (editCity) editCity.value = address.city || '';
    if (editZipCode) editZipCode.value = address.zipCode || '';
    if (editAddressType) editAddressType.value = address.addressType || 'home';
    const editCountry = document.getElementById('editCountry');
    const editNotes = document.getElementById('editNotes');
    if (editCountry) editCountry.value = address.country || '';
    if (editNotes) editNotes.value = address.notes || '';

    const editForm = document.getElementById('editAddressForm');
    if (editForm) {
      editForm.style.display = 'block';
      editForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.cancelEditAddress = () => {
    const editForm = document.getElementById('editAddressForm');
    if (editForm) editForm.style.display = 'none';
    const formData = document.getElementById('editAddressFormData');
    if (formData) formData.reset();
  };

  const addAddrBtn = document.getElementById('addAddrBtn');
  if (addAddrBtn) {
    addAddrBtn.onclick = () => {
      const addForm = document.getElementById('addAddressForm');
      if (addForm) {
        addForm.style.display = 'block';
        addForm.scrollIntoView({ behavior: 'smooth' });
      }
    };
  }

  const newAddressForm = document.getElementById('newAddressForm');
  if (newAddressForm) {
    newAddressForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(newAddressForm);
        const addressData = {
          fullName: formData.get('fullName'),
          phone: formData.get('phone'),
          streetAddress: formData.get('streetAddress'),
          city: formData.get('city'),
          zipCode: formData.get('zipCode'),
          country: formData.get('country'),
          notes: formData.get('notes'),
          addressType: formData.get('addressType') || 'home',
          isDefault: false
        };
        await api('/api/user/addresses', { method: 'POST', body: JSON.stringify(addressData) });
        newAddressForm.reset();
        const addForm = document.getElementById('addAddressForm');
        if (addForm) addForm.style.display = 'none';
        load();
        toast('Address added successfully', true);
      } catch (e) { toast(e.message, false); }
    };
  }

  const editAddressFormEl = document.getElementById('editAddressFormData');
  if (editAddressFormEl) {
    editAddressFormEl.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(editAddressFormEl);
        const addressData = {
          fullName: formData.get('fullName'),
          phone: formData.get('phone'),
          streetAddress: formData.get('streetAddress'),
          city: formData.get('city'),
          zipCode: formData.get('zipCode'),
          country: formData.get('country'),
          notes: formData.get('notes'),
          addressType: formData.get('addressType') || 'home'
        };
        const addressId = formData.get('id');
        await api('/api/user/addresses/' + addressId, { method: 'PUT', body: JSON.stringify(addressData) });
        editAddressFormEl.reset();
        const editForm = document.getElementById('editAddressForm');
        if (editForm) editForm.style.display = 'none';
        load();
        toast('Address updated successfully', true);
      } catch (e) { toast(e.message, false); }
    };
  }

  load();
}

// ==================== SUBSCRIBE ====================
async function initSubscribe() {
  if (!document.getElementById('subscribeForm')) return;
  document.getElementById('subscribeForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('subName').value,
          email: document.getElementById('subEmail').value
        })
      });
      toast('Subscribed');
    } catch (e) {
      toast(e.message, false);
    }
  };
}

// ==================== HOME ====================
async function initHome() {
  if (!document.getElementById('productsGrid')) return;
  try {
    state.categories = await api('/api/store/categories');
    state.products = await api('/api/store/products');
    renderCategories();
    renderProducts(state.products);
    const searchToggle = document.getElementById('searchToggle');
    const searchPanel = document.getElementById('searchPanel');
    const searchInput = document.getElementById('searchInput');
    const applyFilter = document.getElementById('applyFilter');
    if (searchToggle && searchPanel) searchToggle.onclick = () => searchPanel.classList.toggle('d-none');
    if (searchInput) searchInput.oninput = applyFilterFn;
    if (applyFilter) applyFilter.onclick = applyFilterFn;
    refreshBadges();
  } catch (e) {
    console.error('initHome error:', e);
  }
}

// ==================== PRODUCT DETAIL ====================
async function initProduct() {
  if (!document.getElementById('productDetails')) return;
  try {
    const id = new URLSearchParams(location.search).get('id');
    const p = await api('/api/store/products/' + id);
    document.getElementById('productDetails').innerHTML = `
      <img class='product-img mb-3' src='${imageFor(p)}' onerror="this.src='${imgFallback}'">
      <h2>${p.name}</h2>
      <p>${p.dsc || ''}</p>
      <ul>
        <li>Price: $${p.price}</li>
        <li>Rate: ${p.rate || 'N/A'}</li>
      </ul>
      <button class='btn btn-primary' id='addP'>${t('cart')}</button>`;
    document.getElementById('addP').onclick = () => addToCart(p._id);
  } catch (e) {
    console.error('initProduct error:', e);
  }
}

// ==================== PROFILE ====================
async function initProfile() {
  if (!document.getElementById('profileForm')) return;
  try {
    const p = await api('/api/user/profile');
    const profileCard = document.getElementById('profileCard');
    const profileForm = document.getElementById('profileForm');
    const langBtn = document.getElementById('langToggle');

    if (profileCard) {
      profileCard.innerHTML = `
        <img class='small-avatar' src='${p.photoUrl || imgFallback}' onerror="this.src='${imgFallback}'">
        <h4 class='mt-2'>${p.fullName || ''}</h4>
        <div>${p.email || ''}</div>`;
    }

    const fields = { fullName: p.fullName, email: p.email, phone: p.phone, dob: (p.dob || '').slice(0, 10), gender: p.gender || 'male' };
    Object.entries(fields).forEach(([k, v]) => { const el = document.getElementById(k); if (el) el.value = v; });

    // ✅ Language toggle on profile page
    if (langBtn) {
      langBtn.onclick = (e) => {
        e.preventDefault();
        i18n.toggleLang();
        i18n.applyTranslations();
      };
    }

    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      let photoUrl = p.photoUrl;
      const photoFile = document.getElementById('photo')?.files[0];
      if (photoFile) {
        const r = new FileReader();
        photoUrl = await new Promise(res => { r.onload = () => res(r.result); r.readAsDataURL(photoFile); });
      }
      try {
        await api('/api/user/profile', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: document.getElementById('fullName')?.value,
            email: document.getElementById('email')?.value,
            phone: document.getElementById('phone')?.value,
            dob: document.getElementById('dob')?.value,
            gender: document.getElementById('gender')?.value,
            photoUrl
          })
        });
        toast('Profile updated');
      } catch (err) {
        toast(err.message, false);
      }
    };

    const logoutUser = document.getElementById('logoutUser');
    if (logoutUser) {
      logoutUser.onclick = async () => {
        try {
          await api('/api/logout', { method: 'POST' });
        } catch { }
        location.href = '/login.html';
      };
    }
  } catch (e) {
    console.error('initProfile error:', e);
  }
}

// ==================== AI CHAT BUBBLE ====================
function initChatBubble() {
  if (document.getElementById('chatBubbleBtn') || location.pathname.includes('chat.html')) return;

  const bubble = document.createElement('button');
  bubble.id = 'chatBubbleBtn';
  bubble.className = 'chat-bubble';
  bubble.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';
  bubble.setAttribute('aria-label', 'Open AI chat');

  const tooltip = document.createElement('div');
  tooltip.className = 'chat-bubble-tooltip';
  tooltip.textContent = lang.get() === 'ar' ? 'تحدث مع المساعد الذكي' : 'Chat with AI assistant';
  bubble.appendChild(tooltip);

  setTimeout(() => { if (tooltip.parentNode) tooltip.remove(); }, 4000);

  bubble.addEventListener('click', () => {
    window.location.href = '/chat.html';
  });

  document.body.appendChild(bubble);
}

// ==================== CONFETTI ====================
function triggerConfetti() {
  try {
    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, startVelocity: 30, origin: { y: 0.6 }, colors: ['#ff6b35', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'] });
      setTimeout(() => confetti({ particleCount: 50, spread: 100, startVelocity: 40, origin: { y: 0.7 }, colors: ['#ff6b35', '#f59e0b', '#10b981'] }), 300);
    }
  } catch (e) { console.log('Confetti not available'); }
}

// ==================== WELCOME NOTIFICATION ====================
function showWelcomeNotification() {
  if (localStorage.getItem('has_seen_welcome')) return;
  localStorage.setItem('has_seen_welcome', 'true');
  setTimeout(() => toast('🎉 Welcome to King Food! Enjoy delicious meals and fast delivery!', true), 1500);
}

// ==================== TOUR GUIDE (PER-USER, SERVER-TRACKED) ====================
async function initTourGuide() {
  // Only run on pages after login
  if (!document.body) return;

  try {
    // Check if user already completed tour (server-side per email)
    const status = await api('/api/user/tour-status').catch(() => ({ tourCompleted: true }));
    if (status.tourCompleted) return;
  } catch { return; }

  const tourSteps = [
    { icon: 'bi-house-fill', title: 'Welcome to King Food', desc: 'This quick tour will guide you through every feature of our restaurant platform. Let\'s get started!', target: null },
    { icon: 'bi-house-fill', title: 'Home Page', desc: 'This is your main dashboard. Browse categories, search for meals, and discover today\'s featured dishes.', target: '#categoriesGrid' },
    { icon: 'bi-cart-fill', title: 'Cart & Promo Codes', desc: 'Add delicious meals to your cart. Apply promo codes at checkout to enjoy instant discounts.', target: '#cartBadge' },
    { icon: 'bi-person-fill', title: 'Your Profile', desc: 'Manage your personal information, update your photo, and keep your account details up to date.', target: null },
    { icon: 'bi-heart-fill', title: 'Wishlist', desc: 'Save your favorite meals here so you can quickly find and order them again later.', target: '#wishBadge' },
    { icon: 'bi-grid-fill', title: 'Menu & Categories', desc: 'Explore our full menu organized by categories like Pizza, Burgers, Desserts, and more.', target: null },
    { icon: 'bi-chat-dots-fill', title: 'AI Chat Assistant', desc: 'Chat with our smart AI assistant anytime. Ask about the menu, your orders, or get recommendations.', target: '#chatBubbleBtn' },
    { icon: 'bi-info-circle-fill', title: 'About Us', desc: 'Learn more about King Food, our story, values, and commitment to quality and fast delivery.', target: null },
    { icon: 'bi-headset', title: 'Support & Help', desc: 'Need help? Contact our support team directly through the Support page for quick assistance.', target: null },
    { icon: 'bi-moon-fill', title: 'Dark / Light Mode', desc: 'Toggle between dark and light themes anytime for comfortable browsing day or night.', target: '#themeToggle' },
    { icon: 'bi-translate', title: 'Language Translation', desc: 'Switch between English and Arabic instantly. The entire website adapts to your preferred language.', target: '#langToggle' },
    { icon: 'bi-bell-fill', title: 'Notifications', desc: 'Stay updated with order status, promotions, and important alerts. Click the bell to view them.', target: '#notifBadge' },
    { icon: 'bi-bag-fill', title: 'My Orders', desc: 'Track all your past and current orders. See real-time status: Processing, Shipping, or Delivered.', target: '#orderBadge' },
    { icon: 'bi-search', title: 'Search & Filters', desc: 'Quickly find any meal using the search bar. Filter by price, category, or sort by newest.', target: '#searchToggle' },
    { icon: 'bi-calendar-check', title: 'Book a Table', desc: 'Reserve your table in advance. Choose date, time, and number of guests for a perfect dining experience.', target: null },
    { icon: 'bi-geo-alt-fill', title: 'Shipping Address', desc: 'Save multiple delivery addresses. Set your default address for faster checkout every time.', target: null },
    { icon: 'bi-box-arrow-in-right', title: 'Login & Register', desc: 'Create a free account or log in to access your orders, wishlist, cart, and personalized experience.', target: null },
    { icon: 'bi-box-arrow-right', title: 'Logout', desc: 'Securely log out of your account anytime. Your data remains safe and private.', target: '#logoutUser' }
  ];

  let currentStep = 0;

  const tourOverlay = document.createElement('div');
  tourOverlay.id = 'tourGuideOverlay';
  tourOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);';
  tourOverlay.innerHTML = `
    <div style="background:white;border-radius:20px;padding:40px;max-width:520px;width:92%;text-align:center;box-shadow:0 25px 70px rgba(0,0,0,0.4);">
      <div id="tourIcon" style="font-size:4.2rem;color:#ff6b35;margin-bottom:18px;"><i class="bi ${tourSteps[0].icon}"></i></div>
      <h3 id="tourTitle" style="margin-bottom:14px;color:#121212;font-weight:700;">${tourSteps[0].title}</h3>
      <p id="tourDesc" style="color:#555;margin-bottom:28px;line-height:1.65;font-size:15px;">${tourSteps[0].desc}</p>
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:26px;" id="tourProgress"></div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button id="tourSkip" style="padding:11px 24px;border:none;background:#e5e7eb;color:#333;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;">Skip Tour</button>
        <button id="tourPrev" style="padding:11px 24px;border:none;background:#e5e7eb;color:#333;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;display:none;">Previous</button>
        <button id="tourNext" style="padding:11px 32px;border:none;background:#ff6b35;color:white;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;">Next</button>
      </div>
    </div>`;
  document.body.appendChild(tourOverlay);

  function updateTourStep() {
    const step = tourSteps[currentStep];
    document.getElementById('tourIcon').innerHTML = `<i class="bi ${step.icon}"></i>`;
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourDesc').textContent = step.desc;
    const progress = document.getElementById('tourProgress');
    progress.innerHTML = tourSteps.map((_, i) =>
      `<div style="width:11px;height:11px;border-radius:50%;background:${i === currentStep ? '#ff6b35' : '#d1d5db'};transition:all 0.25s;"></div>`
    ).join('');
    document.getElementById('tourPrev').style.display = currentStep > 0 ? 'inline-block' : 'none';
    document.getElementById('tourNext').textContent = currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next';
  }

  async function completeTour() {
    try {
      await api('/api/user/tour-complete', { method: 'POST' });
    } catch { }
    tourOverlay.remove();
  }

  document.getElementById('tourNext').onclick = async () => {
    if (currentStep < tourSteps.length - 1) {
      currentStep++;
      updateTourStep();
    } else {
      await completeTour();
    }
  };

  document.getElementById('tourPrev').onclick = () => {
    if (currentStep > 0) {
      currentStep--;
      updateTourStep();
    }
  };

  document.getElementById('tourSkip').onclick = async () => {
    await completeTour();
  };

  updateTourStep();
}

// ==================== PWA INSTALL BUTTON (SITE-WIDE - GitHub Style) ====================
let deferredPrompt = null;

// Create floating install button with King Food logo (crown "K") - ALWAYS VISIBLE on ALL pages
function createInstallButton() {
  if (window.matchMedia('(display-mode: standalone)').matches || document.getElementById('pwaInstallBtn')) {
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.style.cssText = 'position:fixed;bottom:160px;right:30px;z-index:9998;background:#fff;border:2px solid #ff6b35;border-radius:50%;width:56px;height:56px;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.35);display:flex;align-items:center;justify-content:center;padding:4px;transition:all 0.2s ease;';
  btn.innerHTML = `<img src="./assets/KingfoodPNG.PNG" alt="Install King Food" style="width:44px;height:44px;border-radius:50%;object-fit:contain;">`;
  btn.title = 'Install King Food App';

  btn.onclick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          btn.style.display = 'none';
        }
      } catch (e) {}
      deferredPrompt = null;
    } else {
      alert('Install King Food App:\n\n1. Click the ⋮ menu in Chrome\n2. Select "Install app" or "Add to Home screen"\n\nThe King Food icon will appear on your device!');
    }
  };

  document.body.appendChild(btn);

  // Capture beforeinstallprompt globally WITHOUT preventDefault
  // This allows the native browser install icon (like GitHub) to appear in the address bar
  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // Do NOT call preventDefault() - we want the native install banner/icon
  });

  window.addEventListener('appinstalled', () => {
    btn.style.display = 'none';
    deferredPrompt = null;
  });
}

  const btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.style.cssText = 'position:fixed;bottom:170px;right:30px;z-index:9998;background:#fff;border:2px solid #ff6b35;border-radius:50%;width:56px;height:56px;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,53,0.35);display:flex;align-items:center;justify-content:center;padding:4px;transition:all 0.2s ease;';
  btn.innerHTML = `<img src="./assets/KingfoodPNG.PNG" alt="Install King Food" style="width:44px;height:44px;border-radius:50%;object-fit:contain;">`;
  btn.title = 'Install King Food App';

  btn.onclick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          btn.style.display = 'none';
        }
      } catch (e) { }
      deferredPrompt = null;
    } else {
      // If prompt not captured yet, show instructions
      alert('To install King Food:\n\n1. Open Chrome menu (⋮)\n2. Click "Install app" or "Add to Home screen"\n\nThe app icon will appear on your home screen!');
    }
  };

  document.body.appendChild(btn);

  // Capture the install prompt event (for better UX when available)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    btn.style.display = 'none';
    deferredPrompt = null;
  });


// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollButton();
  initHome();
  initCart();
  initProduct();
  initProfile();
  initOrders();
  initWishlist();
  initNotifications();
  initAddresses();
  initSubscribe();
  showWelcomeNotification();
  initTourGuide();
  initChatBubble();
  createInstallButton();

  // Sync notification badge on every page load
  (async () => {
    try {
      const data = await api('/api/user/notifications');
      const unread = (data || []).filter(n => !n.isRead).length;
      updateNotificationBadge(unread);
    } catch { }
  })();
});
