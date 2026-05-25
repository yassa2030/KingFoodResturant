// ==================== i18n TRANSLATION SYSTEM ====================
// Professional multilingual support with RTL for Arabic

const i18n = {
  currentLang: localStorage.getItem('app_lang') || 'en',

  translations: {
    en: {
      // Navigation
      nav_home: 'Home',
      nav_about: 'About',
      nav_menu: 'Menu',
      nav_bookTable: 'Book Table',
      nav_login: 'Login',
      nav_register: 'Register',
      nav_profile: 'Profile',
      nav_logout: 'Logout',
      nav_support: 'Support',
      nav_orders: 'Orders',
      nav_notifications: 'Notifications',
      nav_wishlist: 'Wishlist',
      nav_cart: 'Cart',
      nav_search: 'Search',

      // Hero
      hero_title: 'King Food',
      hero_subtitle: 'Fresh flavors, fast delivery, premium experience.',

      // Common
      common_loading: 'Loading...',
      common_save: 'Save',
      common_cancel: 'Cancel',
      common_delete: 'Delete',
      common_edit: 'Edit',
      common_apply: 'Apply',
      common_total: 'Total',
      common_checkout: 'Checkout',
      common_submit: 'Submit',
      common_back: 'Back',
      common_next: 'Next',
      common_previous: 'Previous',
      common_skip: 'Skip',
      common_finish: 'Finish',
      common_close: 'Close',
      common_confirm: 'Confirm',

      // Cart
      cart_title: 'Shopping Cart',
      cart_empty: 'Your cart is empty',
      cart_addToCart: 'Add to cart',
      cart_remove: 'Remove',
      cart_quantity: 'Quantity',
      cart_subtotal: 'Subtotal',
      cart_tax: 'Tax',
      cart_shipping: 'Shipping',
      cart_discount: 'Discount',
      cart_promoCode: 'Promo Code',
      cart_promoApply: 'Apply Code',
      cart_promoSuccess: 'Coupon applied successfully!',
      cart_promoInvalid: 'Invalid or expired promo code',
      cart_checkout: 'Proceed to Checkout',

      // Products
      products_title: 'Products',
      products_categories: 'Categories',
      products_featured: 'Featured',
      products_onSale: 'On Sale',
      products_inStock: 'In Stock',
      products_outOfStock: 'Out of Stock',
      products_rating: 'Rating',
      products_reviews: 'Reviews',
      products_addToWishlist: 'Add to Wishlist',
      products_removeFromWishlist: 'Remove from Wishlist',

      // Orders
      orders_title: 'My Orders',
      orders_empty: 'No orders yet',
      orders_orderNo: 'Order',
      orders_status: 'Status',
      orders_date: 'Date',
      orders_total: 'Total',
      orders_delivered: 'Delivered',
      orders_shipping: 'Shipping',
      orders_processing: 'Processing',
      orders_cancelled: 'Cancelled',

      // Profile
      profile_title: 'My Profile',
      profile_fullName: 'Full Name',
      profile_email: 'Email',
      profile_phone: 'Phone',
      profile_dob: 'Date of Birth',
      profile_gender: 'Gender',
      profile_photo: 'Profile Photo',
      profile_updateSuccess: 'Profile updated successfully',

      // Addresses
      addresses_title: 'My Addresses',
      addresses_addNew: 'Add New Address',
      addresses_fullName: 'Full Name',
      addresses_phone: 'Phone Number',
      addresses_country: 'Country',
      addresses_city: 'City',
      addresses_street: 'Street Address',
      addresses_zipCode: 'Postal Code',
      addresses_notes: 'Additional Notes',
      addresses_setDefault: 'Set as Default',
      addresses_default: 'Default',
      addresses_saveSuccess: 'Address saved successfully',
      addresses_deleteSuccess: 'Address deleted',

      // Book Table
      bookTable_title: 'Book a Table',
      bookTable_fullName: 'Full Name',
      bookTable_email: 'Email',
      bookTable_phone: 'Phone',
      bookTable_date: 'Date',
      bookTable_time: 'Time',
      bookTable_guests: 'Number of Guests',
      bookTable_requests: 'Special Requests',
      bookTable_submit: 'Book Now',
      bookTable_success: 'Your table reservation has been successfully submitted!',
      bookTable_error: 'Failed to book table. Please try again.',
      view_menu: 'View Menu',
      confirm_order_book: 'Confirm & Book a Table',
      selected_items: 'Selected Items',
      selected_menu_items: 'Selected Menu Items',

      // Notifications
      notifications_title: 'Notifications',
      notifications_empty: 'No notifications yet',
      notifications_markAllRead: 'Mark All as Read',
      notifications_read: 'Read',
      notifications_welcome: 'Welcome to King Food!',
      notifications_welcomeMsg: 'Thank you for joining us. Enjoy delicious meals and fast delivery!',

      // Tour Guide
      tour_welcome_title: 'Welcome to King Food!',
      tour_welcome_desc: 'Let us show you around our amazing restaurant website.',
      tour_home_title: 'Home Page',
      tour_home_desc: 'Browse our delicious menu, view categories, and discover featured products.',
      tour_cart_title: 'Shopping Cart',
      tour_cart_desc: 'Add your favorite items, apply promo codes, and manage quantities.',
      tour_profile_title: 'Profile',
      tour_profile_desc: 'Manage your personal information, addresses, and preferences.',
      tour_orders_title: 'Orders',
      tour_orders_desc: 'Track your order history and current order status.',
      tour_support_title: 'Support',
      tour_support_desc: 'Chat with our support team for any questions or issues.',
      tour_notifications_title: 'Notifications',
      tour_notifications_desc: 'Stay updated with order status, promotions, and news.',
      tour_finish_title: 'All Set!',
      tour_finish_desc: 'You are ready to enjoy King Food. Happy ordering!',

      // Support
      faq_title: 'Frequently Asked Questions',
      support_title: 'King Food Support',
      support_start: 'Start a conversation',
      support_start_desc: 'Send a message or ask a question below',
      support_input_placeholder: 'Type a message...',

      // Orders
      orders_title: 'طلباتي',
      orders_empty: 'لا توجد طلبات بعد',
      orders_orderNo: 'الطلب',
      orders_status: 'الحالة',
      orders_date: 'التاريخ',
      orders_total: 'الإجمالي',
      orders_delivered: 'تم التسليم',
      orders_shipping: 'قيد الشحن',
      orders_processing: 'قيد المعالجة',
      orders_cancelled: 'ملغي',

      // Profile
      profile_title: 'ملفي الشخصي',
      profile_fullName: 'الاسم الكامل',
      profile_email: 'البريد الإلكتروني',
      profile_phone: 'الهاتف',
      profile_dob: 'تاريخ الميلاد',
      profile_gender: 'الجنس',
      profile_photo: 'الصورة الشخصية',
      profile_updateSuccess: 'تم تحديث الملف الشخصي بنجاح',

      // Addresses
      addresses_title: 'عناويني',
      addresses_addNew: 'إضافة عنوان جديد',
      addresses_fullName: 'الاسم الكامل',
      addresses_phone: 'رقم الهاتف',
      addresses_country: 'البلد',
      addresses_city: 'المدينة',
      addresses_street: 'عنوان الشارع',
      addresses_zipCode: 'الرمز البريدي',
      addresses_notes: 'ملاحظات إضافية',
      addresses_setDefault: 'تعيين كافتراضي',
      addresses_default: 'افتراضي',
      addresses_saveSuccess: 'تم حفظ العنوان بنجاح',
      addresses_deleteSuccess: 'تم حذف العنوان',

      // Book Table
      bookTable_title: 'حجز طاولة',
      bookTable_fullName: 'الاسم الكامل',
      bookTable_email: 'البريد الإلكتروني',
      bookTable_phone: 'الهاتف',
      bookTable_date: 'التاريخ',
      bookTable_time: 'الوقت',
      bookTable_guests: 'عدد الضيوف',
      bookTable_requests: 'طلبات خاصة',
      bookTable_submit: 'احجز الآن',
      bookTable_success: 'تم حجز طاولتك بنجاح!',
      bookTable_error: 'فشل الحجز. يرجى المحاولة مرة أخرى.',
      view_menu: 'عرض القائمة',
      confirm_order_book: 'تأكيد وحجز طاولة',
      selected_items: 'العناصر المحددة',
      selected_menu_items: 'عناصر القائمة المحددة',

      // Notifications
      notifications_title: 'الإشعارات',
      notifications_empty: 'لا توجد إشعارات بعد',
      notifications_markAllRead: 'تحديد الكل كمقروء',
      notifications_read: 'مقروء',
      notifications_welcome: 'مرحباً بك في كينغ فود!',
      notifications_welcomeMsg: 'شكراً لانضمامك إلينا. استمتع بوجبات لذيذة وتوصيل سريع!',

      // Tour Guide
      tour_welcome_title: 'مرحباً بك في كينغ فود!',
      tour_welcome_desc: 'دعنا نريك حول موقعنا الرائع للمطاعم.',
      tour_home_title: 'الصفحة الرئيسية',
      tour_home_desc: 'تصفح قائمتنا اللذيذة، اعرض الفئات، واكتشف المنتجات المميزة.',
      tour_cart_title: 'سلة التسوق',
      tour_cart_desc: 'أضف عناصرك المفضلة، طبق أكواد الخصم، وأدر الكميات.',
      tour_profile_title: 'الملف الشخصي',
      tour_profile_desc: 'أدر معلوماتك الشخصية، العناوين، والتفضيلات.',
      tour_orders_title: 'الطلبات',
      tour_orders_desc: 'تتبع سجل طلباتك وحالة الطلب الحالي.',
      tour_support_title: 'الدعم',
      tour_support_desc: 'تحدث مع فريق الدعم لأي أسئلة أو مشاكل.',
      tour_notifications_title: 'الإشعارات',
      tour_notifications_desc: 'ابق على اطلاع بحالة الطلب، العروض، والأخبار.',
      tour_finish_title: 'كل شيء جاهز!',
      tour_finish_desc: 'أنت مستعد للاستمتاع بـ كينغ فود. طلب سعيد!',

      // Auth
      auth_login: 'تسجيل الدخول',
      auth_register: 'إنشاء حساب',
      auth_forgotPassword: 'نسيت كلمة المرور؟',
      auth_email: 'البريد الإلكتروني',
      auth_password: 'كلمة المرور',
      auth_confirmPassword: 'تأكيد كلمة المرور',
      auth_firstName: 'الاسم الأول',
      auth_lastName: 'اسم العائلة',
      auth_rememberMe: 'تذكرني',
      auth_loginSuccess: 'تم تسجيل الدخول بنجاح',
      auth_registerSuccess: 'تم إنشاء الحساب بنجاح',
      auth_invalidCredentials: 'بيانات غير صحيحة',
      auth_passwordsNotMatch: 'كلمات المرور غير متطابقة',
      auth_weakPassword: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز خاص',
      auth_alreadyExists: 'البريد الإلكتروني موجود بالفعل',

      // Footer
      footer_about: 'من نحن',
      footer_contact: 'اتصل بنا',
      footer_privacy: 'سياسة الخصوصية',
      footer_terms: 'شروط الخدمة',
      footer_followUs: 'تابعنا',
      footer_newsletter: 'اشترك في النشرة الإخبارية',
      footer_newsletterPlaceholder: 'أدخل بريدك الإلكتروني',
      footer_subscribe: 'اشترك',
      footer_copyright: '© 2024 كينغ فود. جميع الحقوق محفوظة.',

      // Misc
      misc_language: 'اللغة',
      misc_theme: 'المظهر',
      misc_darkMode: 'الوضع الداكن',
      misc_lightMode: 'الوضع الفاتح',
      misc_searchPlaceholder: 'ابحث عن منتجات...',
      misc_filter: 'تصفية',
      misc_sortBy: 'ترتيب حسب',
      misc_priceLow: 'السعر: من الأقل للأعلى',
      misc_priceHigh: 'السعر: من الأعلى للأقل',
      misc_newest: 'الأحدث أولاً',
      misc_relevance: 'الأكثر صلة',
      chat_title: 'كينغ فود AI',
      chat_online: 'متصل',
      chat_menu: '📋 القائمة',
      chat_recommend: '⭐ اقتراحات',
      chat_cart: '🛒 عربتي',
      chat_orders: '📦 طلباتي',

      // Support AR
      faq_title: 'الأسئلة الشائعة',
      support_title: 'دعم King Food',
      support_start: 'ابدأ محادثة',
      support_start_desc: 'أرسل رسالة أو اطرح سؤالاً أدناه',
      support_input_placeholder: 'اكتب رسالة...',

      // Payment
      pay_secure: 'Secure Checkout',
      pay_subtitle: 'Complete your order with Paymob - Egypt\'s most trusted payment gateway',
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
      pay_processing: 'Connecting to Paymob...',
      pay_success_msg: 'Your order has been placed successfully!',
      pay_fail_msg: 'Payment failed or was cancelled. Please try again.',
      pay_retry: 'Try Again',
      pay_continue: 'Continue Shopping'
    }
  },

  t(key) {
    return this.translations[this.currentLang]?.[key] ||
           this.translations.en[key] ||
           key;
  },

  // ✅ FIX: Guard document.body in case script runs before <body> is parsed
  setLang(lang) {
    this.currentLang = lang;
    localStorage.setItem('app_lang', lang);

    if (document.documentElement) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    // ✅ FIX: Use DOMContentLoaded guard if body not yet available
    const applyBodyClass = () => {
      if (document.body) {
        document.body.classList.toggle('rtl', lang === 'ar');
      }
    };

    if (document.body) {
      applyBodyClass();
    } else {
      document.addEventListener('DOMContentLoaded', applyBodyClass);
    }

    this.applyTranslations();
  },

  init() {
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.currentLang = savedLang;

    // ✅ FIX: Apply lang/dir to <html> immediately (safe, always exists)
    if (document.documentElement) {
      document.documentElement.lang = savedLang;
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    }

    // ✅ FIX: Defer body class & translations until DOM is ready
    const applyWhenReady = () => {
      if (document.body) {
        document.body.classList.toggle('rtl', savedLang === 'ar');
      }
      this.applyTranslations();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyWhenReady);
    } else {
      applyWhenReady();
    }
  },

  applyTranslations() {
    if (!document || !document.querySelectorAll) return;

    // 1. Restore original text on elements tagged by auto-translate
    document.querySelectorAll('[data-i18n-auto]').forEach(el => {
      const orig = el.getAttribute('data-i18n-auto');
      el.textContent = orig;
      el.removeAttribute('data-i18n-auto');
    });

    // 2. Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr') || 'textContent';
      el[attr] = this.t(key);
    });

    // 3. Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // 4. Auto-translate text nodes when switching to a non-English language
    const targetLang = this.currentLang;
    if (targetLang === 'en') return;

    const srcTrans = this.translations.en;
    const tgtTrans = this.translations[targetLang];
    if (!srcTrans || !tgtTrans) return;

    const englishToKey = {};
    for (const [key, val] of Object.entries(srcTrans)) {
      if (typeof val === 'string' && val.trim()) {
        englishToKey[val.toLowerCase().trim()] = key;
      }
    }

    const iter = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    const replacements = [];
    let n;
    while ((n = iter.nextNode())) {
      const raw = n.textContent;
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const parent = n.parentElement;
      if (!parent || parent.closest('script,style,svg,[data-i18n]')) continue;
      if (parent.closest('[data-i18n]')) continue;

      const key = englishToKey[trimmed.toLowerCase()];
      if (key && tgtTrans[key]) {
        // Store original text before replacing
        if (!parent.hasAttribute('data-i18n-auto')) {
          // The original text may be split across multiple text nodes;
          // store a full snap only for the parent
          parent.setAttribute('data-i18n-auto', parent.innerHTML);
        }
        replacements.push({ node: n, replacement: tgtTrans[key] });
      }
    }

    for (const { node, replacement } of replacements) {
      node.textContent = replacement;
    }
  },

  toggleLang() {
    const newLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.setLang(newLang);
    return newLang;
  }
};

// ✅ Initialize i18n safely
i18n.init();