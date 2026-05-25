const path = require('path');
const express = require('express');
const http = require('http');
const https = require('https');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// =====================================================================
// ✅ GLOBAL ERROR HANDLERS — يمنع الـ server من الانهيار نهائياً
// =====================================================================
process.on('uncaughtException', (err) => {
  const mongoErrors = [
    'MongoNetworkTimeoutError',
    'MongoNetworkError',
    'MongoServerSelectionError',
    'MongoExpiredSessionError',
    'MongoNotConnectedError'
  ];
  if (mongoErrors.includes(err.name)) {
    console.error(`⚠️ MongoDB non-fatal error [${err.name}]: ${err.message}`);
    // لا توقف الـ server — mongoose سيعيد الاتصال تلقائياً
  } else {
    console.error('❌ FATAL uncaughtException:', err);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  const mongoKeywords = ['MongoNetwork', 'MongoServer', 'topology was destroyed', 'connection timed out', 'ECONNRESET', 'ETIMEDOUT'];
  if (mongoKeywords.some(k => msg.includes(k))) {
    console.error('⚠️ MongoDB unhandled rejection (non-fatal):', msg);
  } else {
    console.error('⚠️ Unhandled Rejection:', msg);
  }
});
// =====================================================================

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = 'admin2030@gmail.com';
const ADMIN_PASSWORD = 'Admin2030KingFood';

if (!MONGO_URI) throw new Error('MONGO_URI is required.');

mongoose.set('strictQuery', false);

// =====================================================================
// ✅ CONNECT MONGO — ثابت لا يوقف الـ server أبداً
// =====================================================================
async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 0,              // ✅ 0 = لا timeout على الـ socket نهائياً
      connectTimeoutMS: 30000,
      family: 4,                        // ✅ IPv4 فقط
      heartbeatFrequencyMS: 30000,      // ✅ فحص الاتصال كل 30 ثانية
      minHeartbeatFrequencyMS: 10000,   // ✅ حد أدنى 10 ثواني
      maxPoolSize: 5,                   // ✅ تقليل الـ connections على Free Tier
      minPoolSize: 1,
      maxIdleTimeMS: 30000,             // ✅ يغلق connections خاملة بعد 30 ثانية
      retryWrites: true,
      retryReads: true
    });
    console.log('✅ Mongo connected');

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected — Auto Reconnaction....');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    mongoose.connection.on('error', (err) => {
      // لا تُوقف الـ server — فقط سجّل الخطأ
      console.error('⚠️ MongoDB connection error (non-fatal):', err.message);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message || error);
    console.log('🔄 Retrying in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectMongo();
  }
}
// =====================================================================

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ['user', 'admin', 'delivery'], default: 'user' },
    isActive: { type: Boolean, default: true },
    resetCodeHash: String,
    resetCodeExpiresAt: Date
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    nameEn: { type: String, required: true },
    nameAr: { type: String, required: true },
    imageUrl: String,
    apiUrl: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    originalPrice: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    imageUrl: String,
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    rating: Number,
    reviewsCount: Number,
    reviews: [{ userName: String, comment: String, stars: Number }],
    sourceApi: String
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    customerEmail: String,
    shippingAddress: String,
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        qty: Number,
        price: Number
      }
    ],
    tableReservation: { type: Boolean, default: false },
    total: Number,
    status: { type: String, enum: ['processing', 'shipping', 'delivered', 'cancelled'], default: 'processing' }
  },
  { timestamps: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: Number,
    minOrderAmount: Number,
    maxUses: Number,
    usageCount: { type: Number, default: 0 },
    validFrom: Date,
    validUntil: Date,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['system', 'promotion', 'delivery', 'order_update'] },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    message: String,
    actionLink: String
    // isRead removed - now tracked per-user via NotificationRead collection
  },
  { timestamps: true }
);

const logSchema = new mongoose.Schema(
  { action: String, email: String, actionType: String, userAgent: String, ip: String },
  { timestamps: true }
);

const profileSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true }, fullName: String, email: String, phone: String, dob: Date, gender: String, photoUrl: String },
  { timestamps: true }
);
const addressSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, type: String, fullName: String, phone: String, streetAddress: String, city: String, zipCode: String, country: String, notes: String, isDefault: Boolean },
  { timestamps: true }
);
const paymentSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, cardLast4: String, cardholderName: String, expiryDate: String, cvv: String, isDefault: Boolean },
  { timestamps: true }
);
const wishlistSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' } },
  { timestamps: true }
);
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number }],
    appliedCoupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    discountAmount: { type: Number, default: 0 },
    discountCode: { type: String }
  },
  { timestamps: true }
);
const bookingSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, fullName: String, email: String, phone: String, date: String, time: String, guests: String, requests: String, orderItems: [{ name: String, price: Number, qty: Number }] },
  { timestamps: true }
);
const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: String,
    message: String,
    imageUrl: String,
    fileUrl: String,
    fileName: String,
    fileType: String,
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    reactions: [{ type: { type: String }, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }]
  },
  { timestamps: true }
);
const newsletterSchema = new mongoose.Schema({ name: String, email: String }, { timestamps: true });
const couponUseSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' } },
  { timestamps: true }
);
const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: 'New Chat' },
    messages: [{ role: String, content: String, createdAt: { type: Date, default: Date.now } }]
  },
  { timestamps: true }
);

// Paymob Transaction Schema
const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderNo: { type: String, unique: true },
    paymobOrderId: Number,
    paymobTransactionId: Number,
    amount: Number,
    currency: { type: String, default: 'EGP' },
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
    paymentMethod: String,
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      qty: Number,
      price: Number
    }],
    customerEmail: String,
    customerName: String,
    successUrl: String,
    failUrl: String,
    rawResponse: Object
  },
  { timestamps: true }
);

// Per-user tour state (isolated by email)
const userTourStateSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  tourCompleted: { type: Boolean, default: false },
  completedAt: Date
}, { timestamps: true });

// Per-notification read status per user (isolated by email)
const notificationReadSchema = new mongoose.Schema({
  notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  userEmail: { type: String, required: true, lowercase: true },
  isRead: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });
notificationReadSchema.index({ notification: 1, userEmail: 1 }, { unique: true });

const User          = mongoose.model('User', userSchema);
const Category      = mongoose.model('Category', categorySchema);
const Product       = mongoose.model('Product', productSchema);
const Order         = mongoose.model('Order', orderSchema);
const Coupon        = mongoose.model('Coupon', couponSchema);
const Notification  = mongoose.model('Notification', notificationSchema);
const AdminLog      = mongoose.model('AdminLog', logSchema);
const UserProfile   = mongoose.model('UserProfile', profileSchema);
const UserAddress   = mongoose.model('UserAddress', addressSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentSchema);
const Wishlist      = mongoose.model('Wishlist', wishlistSchema);
const Cart          = mongoose.model('Cart', cartSchema);
const TableBooking  = mongoose.model('TableBooking', bookingSchema);
const Conversation  = mongoose.model('Conversation', conversationSchema);
const Newsletter    = mongoose.model('Newsletter', newsletterSchema);
const CouponUse     = mongoose.model('CouponUse', couponUseSchema);
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
const UserTourState = mongoose.model('UserTourState', userTourStateSchema);
const NotificationRead = mongoose.model('NotificationRead', notificationReadSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 2 }
  })
);
app.use(express.static(path.join(__dirname, 'public')));

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const CATEGORIES_SEED = [
  ['بيتزا 🍕', 'pizzas', 'بيتزا'],
  ['برجر 🍔', 'burgers', 'برجر'],
  ['حلويات 🍰', 'desserts', 'حلويات'],
  ['مشروبات 🥤', 'drinks', 'مشروبات'],
  ['مأكولات بحرية 🦐', 'seafoods', 'مأكولات بحرية'],
  ['مشويات 🥩', 'steaks', 'مشويات'],
  ['دجاج مقلي 🍗', 'fried-chicken', 'دجاج مقلي'],
  ['ساندوتشات 🥪', 'sandwiches', 'ساندوتشات'],
  ['أيس كريم 🍦', 'ice-cream', 'أيس كريم'],
  ['شوكولاتة 🍫', 'chocolates', 'شوكولاتة'],
  ['مشاوي (BBQ) 🍖', 'bbqs', 'مشاوي'],
  ['خبز (Breads) 🥖', 'breads', 'خبز'],
  ['لحم خنزير (Porks) 🥓', 'porks', 'لحم خنزير'],
  ['سجق (Sausages) 🌭', 'sausages', 'سجق'],
  ['Best Food ⭐', 'best-foods', 'أفضل الأطعمة']
];
const CATEGORY_FALLBACK_IMAGES = {
  desserts: 'https://goldbelly.imgix.net/uploads/showcase_media_asset/image/132029/german-chocolate-killer-brownie-tin-pack.5ebc34160f28767a9d94c4da2e04c4b9.jpg?ixlib=react-9.0.2&auto=format&ar=1%3A1'
};

async function writeLog(action, opts = {}) {
  try {
    await AdminLog.create({ action, email: opts.email || '', actionType: opts.actionType || '', userAgent: opts.userAgent || '', ip: opts.ip || '' });
  } catch (e) {
    console.error('writeLog error:', e.message);
  }
}

async function logUserAction(action, actionType, req) {
  const email     = req?.session?.email || 'guest';
  const userAgent = req?.headers?.['user-agent'] || '';
  const ip        = req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || '';
  await writeLog(action, { email, actionType, userAgent, ip });
}

async function ensureAdminUser() {
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      firstName: 'King',
      lastName: 'Food',
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: 'admin'
    });
  }
  return admin;
}

function adminOnly(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(401).json({ message: 'Admin login required.' });
  }
  return next();
}

function authOnly(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: 'Login required' });
  next();
}

// =====================================================================
// AUTH ROUTES
// =====================================================================
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, repeatPassword } = req.body;
    if (!firstName || !lastName || !email || !password || !repeatPassword)
      return res.status(400).json({ message: 'All fields required' });
    if (!passwordRule.test(password))
      return res.status(400).json({ message: 'Weak password' });
    if (password !== repeatPassword)
      return res.status(400).json({ message: 'Passwords do not match' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'already exist' });

    await User.create({ firstName, lastName, email, passwordHash: await bcrypt.hash(password, 10), role: 'user' });
    await logUserAction(`User registered: ${email}`, 'auth', req);
    res.status(201).json({ message: 'Account created successfully' });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ message: 'Register failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email = '', password = '', rememberMe } = req.body;
    await ensureAdminUser();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = String(user._id);
    req.session.role   = user.role;
    req.session.email  = user.email;
    req.session.cookie.maxAge = rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 2;

    await logUserAction(`User logged in: ${user.email} (${user.role})`, 'auth', req);
    res.json({ message: 'Login successful', role: user.role, redirectTo: user.role === 'admin' ? '/admin.html' : '/home.html' });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.json({ message: 'If account exists reset code sent' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCodeHash      = await bcrypt.hash(code, 10);
    user.resetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    res.json({ message: 'Demo mode: reset code generated', resetCode: code });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword, repeatPassword } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !user.resetCodeHash || new Date() > user.resetCodeExpiresAt)
      return res.status(400).json({ message: 'Invalid/expired code' });
    if (!(await bcrypt.compare(code || '', user.resetCodeHash)))
      return res.status(400).json({ message: 'Invalid code' });
    if (!passwordRule.test(newPassword || ''))
      return res.status(400).json({ message: 'Weak password' });
    if (newPassword !== repeatPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    user.passwordHash       = await bcrypt.hash(newPassword, 10);
    user.resetCodeHash      = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (e) {
    res.status(500).json({ message: 'Failed' });
  }
});

app.post('/api/logout', async (req, res) => {
  const email = req.session?.email || 'guest';
  await logUserAction(`User logged out: ${email}`, 'auth', req);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// =====================================================================
// ADMIN ROUTES
// =====================================================================
app.get('/api/admin/me', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json({ name: `${user.firstName} ${user.lastName}`, email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/admin/seed-food-data', adminOnly, async (req, res) => {
  try {
    for (const [en, key, ar] of CATEGORIES_SEED) {
      const apiUrl = `https://free-food-menus-api-two.vercel.app/${key}`;
      let category = await Category.findOne({ apiUrl });
      if (!category) {
        const first = await fetch(apiUrl).then(r => r.json()).then(d => d[0]).catch(() => null);
        category = await Category.create({
          nameEn: en, nameAr: ar, apiUrl,
          imageUrl: first?.img || CATEGORY_FALLBACK_IMAGES[key] || '',
          isActive: true
        });
      }
      if ((await Product.countDocuments({ category: category._id })) > 0) continue;
      const data = await fetch(apiUrl).then(r => r.json()).catch(() => []);
      const bulk = data.map(p => ({
        name: p.name || p.dsc || en, description: p.dsc || '',
        price: Number(p.price) || 0, originalPrice: Number(p.price) || 0,
        category: category._id, imageUrl: p.img || '',
        inStock: true, featured: false, onSale: false,
        rating: Number(p.rate) || 0, reviewsCount: 0, reviews: [], sourceApi: apiUrl
      }));
      if (bulk.length) await Product.insertMany(bulk);
    }
    await writeLog('Food data seeded/imported from APIs');
    res.json({ message: 'Seeding done' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/admin/categories', adminOnly, async (_req, res) => {
  try { res.json(await Category.find().sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/categories', adminOnly, async (req, res) => {
  try { const doc = await Category.create(req.body); await writeLog(`Category created: ${doc.nameEn}`); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/admin/categories/:id', adminOnly, async (req, res) => {
  try { const doc = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); await writeLog(`Category updated: ${doc?.nameEn || req.params.id}`); res.json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/admin/categories/:id', adminOnly, async (req, res) => {
  try { await Category.findByIdAndDelete(req.params.id); await writeLog(`Category deleted: ${req.params.id}`); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/products', adminOnly, async (_req, res) => {
  try { res.json(await Product.find().populate('category').sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/products', adminOnly, async (req, res) => {
  try { const doc = await Product.create(req.body); await writeLog(`Product created: ${doc.name}`); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/admin/products/:id', adminOnly, async (req, res) => {
  try { const doc = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); await writeLog(`Product updated: ${doc?.name || req.params.id}`); res.json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/admin/products/:id', adminOnly, async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); await writeLog(`Product deleted: ${req.params.id}`); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/users', adminOnly, async (_req, res) => {
  try {
    const users    = await User.find().sort({ createdAt: -1 });
    const enriched = await Promise.all(
      users.map(async u => {
        const orders     = await Order.find({ user: u._id });
        const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
        return { _id: u._id, name: `${u.firstName || ''} ${u.lastName || ''}`.trim(), email: u.email, role: u.role, joined: u.createdAt, orders: orders.length, totalSpent };
      })
    );
    res.json(enriched);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/admin/users/:id', adminOnly, async (req, res) => {
  try { const doc = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }); await writeLog(`User role updated: ${doc?.email}`); res.json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/users/:id/send-email', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user?.email) return res.status(404).json({ message: 'User email not found' });
    const { subject, message } = req.body;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    if (!smtpUser || !smtpPass)
      return res.status(400).json({ message: 'SMTP credentials missing. Add SMTP_USER + SMTP_PASS in .env' });
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: smtpUser, pass: smtpPass } });
    await transporter.sendMail({ from: smtpUser, to: user.email, subject: subject || 'Message from King Food Admin', text: message || '' });
    await writeLog(`Email sent to ${user.email}: ${subject || 'No subject'}`);
    res.json({ message: `Email sent successfully to ${user.email}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/orders', adminOnly, async (_req, res) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/admin/orders/:id/status', adminOnly, async (req, res) => {
  try { const doc = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); await writeLog(`Order status updated: ${doc?.orderNo} => ${doc?.status}`); res.json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/coupons', adminOnly, async (_req, res) => {
  try { res.json(await Coupon.find().sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/coupons', adminOnly, async (req, res) => {
  try { const doc = await Coupon.create(req.body); await writeLog(`Coupon created: ${doc.code}`); res.status(201).json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/admin/coupons/:id', adminOnly, async (req, res) => {
  try { const doc = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }); await writeLog(`Coupon updated: ${doc?.code}`); res.json(doc); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/admin/coupons/:id', adminOnly, async (req, res) => {
  try { await Coupon.findByIdAndDelete(req.params.id); await writeLog(`Coupon deleted: ${req.params.id}`); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/notifications', adminOnly, async (_req, res) => {
  try { res.json(await Notification.find().populate('user').sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/notifications', adminOnly, async (req, res) => {
  try {
    const doc = await Notification.create(req.body);
    await writeLog(`Notification sent: ${doc.title}`);
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin: get notifications with per-user read counts
app.get('/api/admin/notifications', adminOnly, async (_req, res) => {
  try {
    const notifs = await Notification.find().populate('user').sort({ createdAt: -1 }).lean();
    const notifIds = notifs.map(n => n._id);
    const readRecords = await NotificationRead.find({ notification: { $in: notifIds } }).lean();

    // Count unique users who read each notification
    const readCountMap = {};
    readRecords.forEach(r => {
      const nid = String(r.notification);
      if (!readCountMap[nid]) readCountMap[nid] = new Set();
      if (r.isRead) readCountMap[nid].add(r.userEmail);
    });

    const enriched = notifs.map(n => ({
      ...n,
      readCount: readCountMap[String(n._id)] ? readCountMap[String(n._id)].size : 0
    }));

    res.json(enriched);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/admin/notifications/:id', adminOnly, async (req, res) => {
  try { res.json(await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/admin/notifications/:id', adminOnly, async (req, res) => {
  try { await Notification.findByIdAndDelete(req.params.id); await writeLog(`Notification deleted: ${req.params.id}`); res.json({ ok: true }); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/bookings', adminOnly, async (_req, res) => {
  try { res.json(await TableBooking.find().sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/admin/logs', adminOnly, async (_req, res) => {
  try { res.json(await AdminLog.find().sort({ createdAt: -1 }).limit(200)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/admin/storage-metrics', adminOnly, async (_req, res) => {
  try {
    const [users, categories, products, orders, coupons, notifications, bookings] = await Promise.all([
      User.countDocuments(), Category.countDocuments(), Product.countDocuments(),
      Order.countDocuments(), Coupon.countDocuments(), Notification.countDocuments(), TableBooking.countDocuments()
    ]);
    res.json({ users, categories, products, orders, coupons, notifications, bookings, mongoReadyState: mongoose.connection.readyState });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/analytics', adminOnly, async (req, res) => {
  try {
    const range  = req.query.range || '7d';
    const days   = range === '365d' ? 365 : range === '30d' ? 30 : 7;
    const start  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const orders = await Order.find({ createdAt: { $gte: start } });
    const totalRevenue   = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders    = orders.length;
    const avgOrderValue  = totalOrders ? totalRevenue / totalOrders : 0;
    const totalUsers     = await User.countDocuments();
    const regularUsers   = await User.countDocuments({ role: 'user' });

    const byStatus   = ['processing', 'shipping', 'delivered', 'cancelled'].map(s => ({ status: s, count: orders.filter(o => o.status === s).length }));
    const topSelling = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', sold: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } },
      { $sort: { sold: -1 } },
      { $limit: 5 }
    ]);

    const revenueSeries = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayRevenue = orders
        .filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd)
        .reduce((s, o) => s + (o.total || 0), 0);
      revenueSeries.push({ label: dayStart.toISOString().slice(0, 10), revenue: dayRevenue });
    }
    res.json({ totalRevenue, totalOrders, avgOrderValue, totalUsers, regularUsers, byStatus, topSelling, revenueSeries });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/conversations', adminOnly, async (_req, res) => {
  try { res.json(await Conversation.find().populate('user').sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/conversations/reply', adminOnly, async (req, res) => {
  try {
    const m = await Conversation.create({
      user: req.body.userId, senderRole: 'admin',
      message: req.body.message || '', imageUrl: req.body.imageUrl || '',
      fileUrl: req.body.fileUrl || '', fileName: req.body.fileName || '',
      fileType: req.body.fileType || '', replyTo: req.body.replyTo || null
    });
    await logUserAction('Admin replied to support chat', 'support', req);
    io.to(`user:${req.body.userId}`).emit('support:new-message', m);
    res.json(m);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/admin/conversations/reaction', adminOnly, async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const msg = await Conversation.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const existingIdx = msg.reactions.findIndex(r => String(r.by) === String(req.session.userId) && r.type === emoji);
    if (existingIdx >= 0) msg.reactions.splice(existingIdx, 1);
    else msg.reactions.push({ type: emoji, by: req.session.userId });
    await msg.save();
    io.to(`user:${msg.user}`).emit('support:new-message', msg);
    io.emit('support:admin-feed', msg);
    res.json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================================
// STORE / PUBLIC ROUTES
// =====================================================================
app.get('/api/store/categories', async (_req, res) => {
  try { res.json(await Category.find({ isActive: true }).sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/store/products', async (_req, res) => {
  try { res.json(await Product.find().populate('category').sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/store/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('category');
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json({ id: p._id, img: p.imageUrl, name: p.name, dsc: p.description, price: p.price, rate: p.rating, country: p.country || 'Unknown', category: p.category });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================================
// USER ROUTES
// =====================================================================
app.get('/api/user/profile', authOnly, async (req, res) => {
  try {
    let p = await UserProfile.findOne({ user: req.session.userId });
    if (!p) {
      const u = await User.findById(req.session.userId);
      p = await UserProfile.create({ user: req.session.userId, fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(), email: u.email, gender: 'male' });
    }
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/user/profile', authOnly, async (req, res) => {
  try {
    const u = await UserProfile.findOne({ user: req.session.userId });
    await logUserAction(`Profile updated: ${u?.email || req.session.email}`, 'profile', req);
    res.json(await UserProfile.findOneAndUpdate({ user: req.session.userId }, req.body, { new: true, upsert: true }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/user/wishlist', authOnly, async (req, res) => {
  try { const w = await Wishlist.find({ user: req.session.userId }).populate('product'); res.json(w.map(x => x.product).filter(Boolean)); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/wishlist/toggle', authOnly, async (req, res) => {
  try {
    const { productId } = req.body;
    const ex = await Wishlist.findOne({ user: req.session.userId, product: productId });
    if (ex) { await ex.deleteOne(); await logUserAction(`Removed from wishlist: ${productId}`, 'wishlist', req); return res.json({ liked: false }); }
    await Wishlist.create({ user: req.session.userId, product: productId });
    await logUserAction(`Added to wishlist: ${productId}`, 'wishlist', req);
    res.json({ liked: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/user/cart', authOnly, async (req, res) => {
  try {
    let c = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!c) c = await Cart.create({ user: req.session.userId, items: [] });
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/cart', authOnly, async (req, res) => {
  try {
    const { productId, qty } = req.body;
    let c = await Cart.findOne({ user: req.session.userId });
    if (!c) c = await Cart.create({ user: req.session.userId, items: [] });
    const idx = c.items.findIndex(i => String(i.product) === String(productId));
    if (idx >= 0) c.items[idx].qty += qty;
    else c.items.push({ product: productId, qty });
    await c.save();
    await logUserAction(`Added to cart: product=${productId} qty=${qty}`, 'cart', req);
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/user/cart/qty', authOnly, async (req, res) => {
  try {
    const { productId, delta } = req.body;
    const c = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!c) return res.json({});
    const it = c.items.find(i => String(i.product._id || i.product) === String(productId));
    if (it) { const stock = it.product.inStock ? 999 : 0; it.qty = Math.max(1, Math.min(stock, it.qty + Number(delta || 0))); }
    await c.save();
    await logUserAction(`Cart qty updated: product=${productId} delta=${delta}`, 'cart', req);
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/cart/apply-coupon', authOnly, async (req, res) => {
  try {
    const rawCode = (req.body.code || '').trim();
    if (!rawCode) return res.status(400).json({ message: 'Code is required' });

    const coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isActive: true
    });
    if (!coupon) return res.status(400).json({ message: 'Invalid or expired promo code' });

    const used = await CouponUse.findOne({ user: req.session.userId, coupon: coupon._id });
    if (used) return res.status(400).json({ message: 'You have already used this coupon' });

    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    const subtotal = cart.items.reduce((s, i) => s + i.qty * (i.product?.price || 0), 0);
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount)
      return res.status(400).json({ message: `Minimum order amount is $${coupon.minOrderAmount}` });
    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses)
      return res.status(400).json({ message: 'Coupon maximum usage reached' });

    const discount = coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue / 100)
      : coupon.discountValue;

    cart.appliedCoupon  = coupon._id;
    cart.discountAmount = discount;
    cart.discountCode   = coupon.code;
    await cart.save();

    await CouponUse.create({ user: req.session.userId, coupon: coupon._id });
    coupon.usageCount = (coupon.usageCount || 0) + 1;
    await coupon.save();

    await logUserAction(`Coupon applied: ${coupon.code} discount=$${discount.toFixed(2)}`, 'coupon', req);
    res.json({ discount, finalTotal: subtotal - discount, appliedCoupon: coupon.code, message: 'Coupon applied successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to apply coupon' });
  }
});
app.delete('/api/user/cart', authOnly, async (req, res) => {
  try {
    const { productId } = req.body;
    const c = await Cart.findOne({ user: req.session.userId });
    if (!c) return res.json({ items: [] });
    c.items = c.items.filter(i => String(i.product) !== String(productId));
    await c.save();
    await logUserAction(`Removed from cart: product=${productId}`, 'cart', req);
    res.json(c);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Clear entire cart (for payment success)
app.post('/api/user/cart/clear', authOnly, async (req, res) => {
  try {
    const c = await Cart.findOne({ user: req.session.userId });
    if (!c || !c.items.length) return res.json({ items: [], message: 'Cart already empty' });
    
    // Store order info before clearing if needed for logging
    const itemCount = c.items.length;
    
    // Clear all cart items and discount info
    c.items = [];
    c.appliedCoupon = null;
    c.discountAmount = 0;
    c.discountCode = null;
    await c.save();
    
    await logUserAction(`Cart cleared after successful payment (items: ${itemCount})`, 'cart', req);
    console.log(`[Cart Clear] User ${req.session.userId} cart cleared successfully`);
    
    res.json({ items: [], message: 'Cart cleared successfully' });
  } catch (e) { 
    console.error('[Cart Clear] Error:', e.message);
    res.status(500).json({ message: e.message }); 
  }
});

// ===== TOUR GUIDE PER-USER ENDPOINTS =====
app.get('/api/user/tour-status', authOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const state = await UserTourState.findOne({ email: user.email.toLowerCase() });
    res.json({ tourCompleted: state?.tourCompleted || false });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/user/tour-complete', authOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    await UserTourState.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      { tourCompleted: true, completedAt: new Date() },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================================
// USER ROUTES
// =====================================================================

app.post('/api/user/orders/checkout', authOnly, async (req, res) => {
  try {
    const c = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!c || !c.items.length) return res.status(400).json({ message: 'Empty cart' });
    const subtotal = c.items.reduce((s, i) => s + i.qty * (i.product?.price || 0), 0);
    const shipping = 10;
    const tax      = (subtotal - c.discountAmount) * 0.14;
    const total    = subtotal + shipping + tax - c.discountAmount;
    const u  = await User.findById(req.session.userId);
    const ad = await UserAddress.findOne({ user: req.session.userId, isDefault: true });
    const order = await Order.create({
      orderNo: `ORD-${Date.now()}`, user: req.session.userId,
      customerName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      customerEmail: u.email,
      shippingAddress: ad ? `${ad.streetAddress}, ${ad.city}` : '',
      items: c.items.map(i => ({ product: i.product._id, name: i.product.name, qty: i.qty, price: i.product.price })),
      subtotal, shipping, tax, total,
      discount: c.discountAmount, discountCode: c.discountCode, status: 'processing'
    });
    c.items         = [];
    c.appliedCoupon = null;
    c.discountAmount = 0;
    c.discountCode  = null;
    await c.save();
    await logUserAction(`Order placed: ${order.orderNo} total=$${total.toFixed(2)}`, 'order', req);
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/orders/from-chat', authOnly, async (req, res) => {
  try {
    const { items, addressId } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'No items' });
    const u        = await User.findById(req.session.userId);
    const enriched = [];
    let subtotal   = 0;
    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) continue;
      const price = product.price || 0;
      const qty   = item.qty || 1;
      enriched.push({ product: product._id, name: product.name, qty, price });
      subtotal += price * qty;
    }
    if (!enriched.length) return res.status(400).json({ message: 'No valid products' });
    const shipping = 10;
    const tax      = subtotal * 0.14;
    const total    = subtotal + shipping + tax;
    let shippingAddress = '';
    let addrObj = null;
    if (addressId) addrObj = await UserAddress.findOne({ _id: addressId, user: req.session.userId });
    if (!addrObj)  addrObj = await UserAddress.findOne({ user: req.session.userId, isDefault: true });
    if (addrObj)   shippingAddress = `${addrObj.streetAddress}, ${addrObj.city}${addrObj.country ? ', ' + addrObj.country : ''}`;
    const order = await Order.create({
      orderNo: `ORD-${Date.now()}`, user: req.session.userId,
      customerName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      customerEmail: u.email, shippingAddress,
      items: enriched, subtotal, shipping, tax, total,
      discount: 0, discountCode: null, status: 'processing'
    });
    await logUserAction(`Order from chat: ${order.orderNo} total=$${total.toFixed(2)}`, 'order', req);
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/user/orders', authOnly, async (req, res) => {
  try { res.json(await Order.find({ user: req.session.userId }).populate('items.product').sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/user/addresses', authOnly, async (req, res) => {
  try { res.json(await UserAddress.find({ user: req.session.userId }).sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/addresses', authOnly, async (req, res) => {
  try {
    if (req.body.isDefault) await UserAddress.updateMany({ user: req.session.userId }, { isDefault: false });
    const a = await UserAddress.create({ ...req.body, user: req.session.userId });
    await logUserAction(`Address added: ${a.city}`, 'address', req);
    res.json(a);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/user/addresses/default', authOnly, async (req, res) => {
  try {
    await UserAddress.updateMany({ user: req.session.userId }, { isDefault: false });
    await UserAddress.findOneAndUpdate({ _id: req.body.id, user: req.session.userId }, { isDefault: true });
    await logUserAction(`Default address changed: ${req.body.id}`, 'address', req);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/user/addresses/:id', authOnly, async (req, res) => {
  try {
    const a = await UserAddress.findOneAndUpdate({ _id: req.params.id, user: req.session.userId }, req.body, { new: true });
    await logUserAction(`Address updated: ${a?.city}`, 'address', req);
    res.json(a);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/user/addresses/:id', authOnly, async (req, res) => {
  try {
    await UserAddress.deleteOne({ _id: req.params.id, user: req.session.userId });
    await logUserAction(`Address deleted: ${req.params.id}`, 'address', req);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/user/payments', authOnly, async (req, res) => {
  try { res.json(await PaymentMethod.find({ user: req.session.userId })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/payments', authOnly, async (req, res) => {
  try {
    const { cardNumber, cardholderName, expiryDate, cvv, isDefault } = req.body;
    if (!/^\d{16}$/.test(cardNumber)) return res.status(400).json({ message: 'invalid card number' });
    if (!/^\d{3}$/.test(cvv))         return res.status(400).json({ message: 'invalid cvv' });
    const [m, y] = expiryDate.split('/').map(Number);
    const exp = new Date(2000 + y, m);
    if (exp <= new Date()) return res.status(400).json({ message: 'expiry must be future' });
    if (isDefault) await PaymentMethod.updateMany({ user: req.session.userId }, { isDefault: false });
    const p = await PaymentMethod.create({ user: req.session.userId, cardLast4: cardNumber.slice(-4), cardholderName, expiryDate, cvv, isDefault: !!isDefault });
    await logUserAction(`Payment method added: ****${p.cardLast4}`, 'payment', req);
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/user/bookings', authOnly, async (req, res) => {
  try {
    const b = await TableBooking.create({ ...req.body, user: req.session.userId });
    await logUserAction(`Table booked: ${b.date} ${b.time} for ${b.guests} guests`, 'booking', req);
    res.json(b);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Per-user notification fetch with individual read status
app.get('/api/user/notifications', authOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const userEmail = user.email.toLowerCase();

    const notifs = await Notification.find({ $or: [{ user: null }, { user: req.session.userId }] }).sort({ createdAt: -1 }).lean();

    // Resolve per-user read status
    const notifIds = notifs.map(n => n._id);
    const readRecords = await NotificationRead.find({ notification: { $in: notifIds }, userEmail }).lean();
    const readMap = new Map(readRecords.map(r => [String(r.notification), r.isRead]));

    const enriched = notifs.map(n => ({
      ...n,
      isRead: readMap.get(String(n._id)) || false
    }));

    res.json(enriched);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Mark single notification read (per-user)
app.post('/api/user/notifications/:id/read', authOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const userEmail = user.email.toLowerCase();

    const notif = await Notification.findOne({ _id: req.params.id, $or: [{ user: null }, { user: req.session.userId }] });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    await NotificationRead.findOneAndUpdate(
      { notification: notif._id, userEmail },
      { isRead: true, readAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, isRead: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Mark all notifications read (per-user)
app.post('/api/user/notifications/mark-all-read', authOnly, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const userEmail = user.email.toLowerCase();

    const notifs = await Notification.find({ $or: [{ user: null }, { user: req.session.userId }] }).select('_id').lean();
    const ops = notifs.map(n => ({
      updateOne: {
        filter: { notification: n._id, userEmail },
        update: { isRead: true, readAt: new Date() },
        upsert: true
      }
    }));
    if (ops.length) await NotificationRead.bulkWrite(ops);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/user/conversations', authOnly, async (req, res) => {
  try { res.json(await Conversation.find({ user: req.session.userId }).sort({ createdAt: 1 })); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/conversations', authOnly, async (req, res) => {
  try {
    const m = await Conversation.create({
      user: req.session.userId, senderRole: 'user',
      message: req.body.message || '', imageUrl: req.body.imageUrl || '',
      fileUrl: req.body.fileUrl || '', fileName: req.body.fileName || '',
      fileType: req.body.fileType || '', replyTo: req.body.replyTo || null
    });
    await logUserAction('Support message sent', 'support', req);
    io.emit('support:admin-feed', await Conversation.findById(m._id).populate('user').lean());
    res.json(m);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/user/conversations/reaction', authOnly, async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const msg = await Conversation.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const existingIdx = msg.reactions.findIndex(r => String(r.by) === String(req.session.userId) && r.type === emoji);
    if (existingIdx >= 0) msg.reactions.splice(existingIdx, 1);
    else msg.reactions.push({ type: emoji, by: req.session.userId });
    await msg.save();
    io.emit('support:admin-feed', await Conversation.findById(messageId).populate('user').lean());
    io.to(`user:${msg.user}`).emit('support:new-message', msg);
    res.json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================================
// FILE UPLOAD
// =====================================================================
const multer    = require('multer');
const fs        = require('fs');
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (r, f, cb) => cb(null, uploadDir),
  filename:    (r, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
app.post('/api/upload', authOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ fileUrl: '/uploads/' + req.file.filename, fileName: req.file.originalname, fileType: req.file.mimetype });
});

// =====================================================================
// MISC
// =====================================================================
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    await Newsletter.create({ name: req.body.name || '', email: req.body.email || '' });
    await AdminLog.create({ action: `Newsletter subscribe: ${req.body.name || ''} ${req.body.email || ''}` });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/translate', async (req, res) => {
  const { text = '', target = 'ar' } = req.body;
  if (!text.trim()) return res.json({ translated: '' });
  try {
    const url  = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const data = await fetch(url).then(r => r.json());
    const translated = (data?.[0] || []).map(x => x?.[0] || '').join('');
    return res.json({ translated });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// =====================================================================
// AI CHAT
// =====================================================================
const AI_PROVIDERS = [
  {
    name: 'eyegpt',
    model: 'claude-opus-4-7',
    url: 'https://api-eye-gpt.ahmedsalah.dev/v1/chat/completions',
    key: 'egpt_o38X2JFrTd40bbtUZtjDOMympxnjms1ReE3wHwPKXN8',
    headers: k => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' })
  },
  {
    name: 'openrouter',
    model: 'openai/gpt-3.5-turbo',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: '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',
    headers: k => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'King Food AI' })
  }
];

async function buildChatContext(userId) {
  const [allProducts, allCategories, cart, orders, wishlist, notifications, bookings] = await Promise.all([
    Product.find().populate('category').lean(),
    Category.find().lean(),
    userId ? Cart.findOne({ user: userId }).populate('items.product').lean() : null,
    userId ? Order.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean() : null,
    userId ? Wishlist.find({ user: userId }).populate('product').lean() : null,
    userId ? Notification.find({ $or: [{ user: null }, { user: userId }] }).sort({ createdAt: -1 }).limit(10).lean() : null,
    userId ? TableBooking.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean() : null
  ]);

  let cartInfo = 'Cart is empty.';
  if (cart?.items?.length) {
    const lines = cart.items.filter(i => i.product).map(i => `  • ${i.product.name} x${i.qty} = $${((i.product.price || 0) * i.qty).toFixed(2)}`);
    cartInfo = `Cart${cart.discountCode ? ` (coupon: ${cart.discountCode}, discount: -$${cart.discountAmount})` : ''}:\n${lines.join('\n')}`;
  }

  let ordersInfo = 'No orders placed yet.';
  if (orders?.length)
    ordersInfo = orders.map(o => `  • ${o.orderNo}: status=${o.status}, items=${o.items.length}, total=$${(o.total || 0).toFixed(2)}`).join('\n');

  let wishlistInfo = 'Wishlist is empty.';
  if (wishlist?.length)
    wishlistInfo = wishlist.filter(w => w.product).map(w => `  • ${w.product.name} - $${(w.product.price || 0).toFixed(2)} - rating: ${w.product.rating || 'N/A'}`).join('\n');

  let notifInfo = 'No notifications.';
  if (notifications?.length)
    notifInfo = notifications.map(n => `  • ${n.title}: ${n.message}`).join('\n');

  let bookingInfo = 'No table bookings.';
  if (bookings?.length)
    bookingInfo = bookings.map(b => `  • ${b.date} ${b.time} - ${b.guests} guests`).join('\n');

  const categoryMap = {};
  allCategories.forEach(c => { categoryMap[c._id] = c.nameEn || c.nameAr; });

  let menuText = '=== KING FOOD FULL MENU ===\n\n';
  const grouped = {};
  allProducts.forEach(p => {
    const catName = categoryMap[p.category] || 'Uncategorized';
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push(`  • ${p.name} — $${(p.price || 0).toFixed(2)} — rating: ${p.rating || 'N/A'}/5 — ${p.description || ''}`);
  });
  for (const [cat, items] of Object.entries(grouped))
    menuText += `**${cat}**:\n${items.slice(0, 20).join('\n')}\n\n`;

  return { menuText, cartInfo, ordersInfo, wishlistInfo, notifInfo, bookingInfo };
}

async function callAI(providers, body, attempt = 0) {
  if (attempt >= providers.length) throw new Error('All AI providers failed');
  const p = providers[attempt];
  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(p.key),
      body: JSON.stringify({ ...body, model: p.model }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) { const t = await resp.text(); console.error(`${p.name} error:`, t); return callAI(providers, body, attempt + 1); }
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || 'No response.';
  } catch (e) {
    console.error(`${p.name} failed:`, e.message);
    return callAI(providers, body, attempt + 1);
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ reply: 'Message is required.' });

    const userId  = req.session?.userId;
    const context = await buildChatContext(userId);

    let chatSession = null;
    if (sessionId && userId) chatSession = await ChatSession.findOne({ _id: sessionId, user: userId });
    if (!chatSession && userId) chatSession = await ChatSession.create({ user: userId, title: message.slice(0, 50) });

    const history = chatSession?.messages?.slice(-20) || [];

    const systemPrompt = `You are "King Food AI" — a fast, precise assistant for King Food restaurant.
You have REAL-TIME access to the user's menu, cart, orders, wishlist, notifications, and bookings.

CRITICAL LANGUAGE RULE:
- If the user writes in Arabic, respond in Arabic ONLY.
- If the user writes in English, respond in English ONLY.
- Detect the language from the user's first message and maintain it.

YOUR CAPABILITIES:
1. Menu: Answer any question about products, categories, prices, ratings, descriptions
2. Cart: Tell the user what's in their cart, coupon discounts applied, and totals
3. Orders: Show order status (processing/shipping/delivered/cancelled), order numbers, totals
4. Wishlist: Show saved items
5. Notifications: Show recent notifications
6. Book a Table: User can book via the contact page
7. Promo codes: Inform about applied coupons

RESPONSE STYLE:
- Think deeply before answering — analyze the user's full context
- Be concise but thorough, use bullet points for lists
- Give accurate prices and ratings from the data below
- If the user wants to order, guide them to use the product panel (+/- buttons) on the right side
- If the user asks about something outside King Food, politely redirect

${context.menuText}

=== USER DATA ===
🛒 Cart: ${context.cartInfo}

📦 Orders: ${context.ordersInfo}

❤️ Wishlist: ${context.wishlistInfo}

🔔 Notifications: ${context.notifInfo}

📅 Bookings: ${context.bookingInfo}`;

    const aiBody = {
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ]
    };

    const reply = await callAI(AI_PROVIDERS, aiBody);

    if (chatSession && userId) {
      chatSession.messages.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
      if (chatSession.messages.length <= 2) chatSession.title = message.slice(0, 50);
      await chatSession.save();
    }

    res.json({ reply, sessionId: chatSession?._id });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({ reply: 'Sorry, something went wrong. Please try again.' });
  }
});

app.get('/api/chat/history', async (req, res) => {
  try {
    if (!req.session?.userId) return res.json([]);
    const sessions = await ChatSession.find({ user: req.session.userId }).sort({ updatedAt: -1 }).select('title updatedAt _id').lean();
    res.json(sessions);
  } catch (e) { res.json([]); }
});

app.get('/api/chat/session/:id', async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: 'Login required' });
    const s = await ChatSession.findOne({ _id: req.params.id, user: req.session.userId }).lean();
    if (!s) return res.status(404).json({ message: 'Session not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete('/api/chat/session/:id', async (req, res) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: 'Login required' });
    await ChatSession.deleteOne({ _id: req.params.id, user: req.session.userId });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// =====================================================================
// PAYMOB PAYMENT INTEGRATION
// =====================================================================
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || '1047421';
const PAYMOB_HMAC = process.env.PAYMOB_HMAC;

// Helper: HTTPS POST request (works on ALL Node versions)
function httpsPost(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const payload = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error(`Invalid JSON: ${body.slice(0, 200)}`)); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Create Paymob Order and get payment key
app.post('/api/payment/paymob/initiate', authOnly, async (req, res) => {
  try {
    const { shippingAddress, phone } = req.body;
    
    // Get cart with populated products
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const user = await User.findById(req.session.userId);
    
    // Calculate totals
    const subtotal = cart.items.reduce((s, i) => s + i.qty * (i.product?.price || 0), 0);
    const shipping = 10;
    const tax = (subtotal - (cart.discountAmount || 0)) * 0.14;
    const total = subtotal + shipping + tax - (cart.discountAmount || 0);
    const totalCents = Math.round(total * 100);

    // Step 1: Authenticate with Paymob
    const authData = await httpsPost('https://accept.paymob.com/api/auth/tokens', {
      api_key: PAYMOB_API_KEY
    });
    
    const token = authData.token;
    if (!token) throw new Error('No token received from Paymob auth');

    // Step 2: Create order
    const orderData = await httpsPost('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      amount_cents: totalCents,
      currency: 'EGP',
      items: cart.items.map(i => ({
        name: i.product?.name || 'Product',
        amount_cents: Math.round((i.product?.price || 0) * 100),
        description: i.product?.description || '',
        quantity: i.qty
      }))
    });

    const paymobOrderId = orderData.id;
    if (!paymobOrderId) throw new Error('No order ID received from Paymob');

    // Step 3: Get payment key with callback URLs
    const callbackBaseUrl = process.env.CALLBACK_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const paymentKeyData = await httpsPost('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: token,
      amount_cents: totalCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: {
        apartment: 'NA',
        email: user.email,
        floor: 'NA',
        first_name: user.firstName || 'User',
        last_name: user.lastName || 'Customer',
        street: shippingAddress || 'NA',
        building: 'NA',
        phone_number: phone || '+201016447253',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'Cairo',
        country: 'EG',
        state: 'NA'
      },
      currency: 'EGP',
      integration_id: 5688130,
      callback: `${callbackBaseUrl}/api/payment/paymob/callback`,
      success_url: `${callbackBaseUrl}/payment-finished?success=true&tx_id={transaction_id}`,
      fail_url: `${callbackBaseUrl}/payment-finished?success=false&tx_id={transaction_id}`
    });

    const paymentToken = paymentKeyData.token;
    if (!paymentToken) throw new Error('No payment token received from Paymob');

    // Create transaction record
    const orderNo = `PAY-${Date.now()}`;
    const transaction = await Transaction.create({
      user: req.session.userId,
      orderNo,
      paymobOrderId,
      amount: total,
      currency: 'EGP',
      status: 'pending',
      items: cart.items.map(i => ({
        product: i.product?._id,
        name: i.product?.name,
        qty: i.qty,
        price: i.product?.price
      })),
      customerEmail: user.email,
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      shippingAddress: shippingAddress || 'Cairo, Egypt'
    });

    res.json({
      success: true,
      paymentToken,
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`,
      transactionId: transaction._id,
      orderNo,
      total
    });

  } catch (e) {
    console.error('Paymob initiate error:', e.message || e);
    res.status(500).json({ message: 'Payment initiation failed: ' + (e.message || 'Unknown error') });
  }
});

// Paymob callback (webhook) - for transaction updates
app.post('/api/payment/paymob/callback', async (req, res) => {
  try {
    const data = req.body;
    const paymobOrderId = data.order?.id;
    const transactionId = data.id;
    const success = data.success === true || data.success === 'true' || data.success === 1;
    const pending = data.pending === true || data.pending === 'true' || data.pending === 1;
    
    // Determine final status based on Paymob response
    let status;
    if (success && !pending) {
      status = 'success';
    } else if (!success || pending) {
      status = 'failed';
    } else {
      status = 'pending';
    }
    
    const transaction = await Transaction.findOne({ paymobOrderId });
    if (transaction) {
      // Only update if status changed to avoid redundant saves
      if (transaction.status !== status) {
        transaction.status = status;
        transaction.paymobTransactionId = transactionId;
        transaction.paymentMethod = data.source_data?.type || 'card';
        transaction.rawResponse = data;
        await transaction.save();
        
        console.log(`[Paymob Callback] Transaction ${transaction.orderNo} updated to: ${status}`);
      }

      // If successful payment, clear cart and create order
      if (status === 'success') {
        const cart = await Cart.findOne({ user: transaction.user });
        if (cart && cart.items.length > 0) {
          // Create the order in database
          await Order.create({
            orderNo: transaction.orderNo,
            user: transaction.user,
            customerName: transaction.customerName,
            customerEmail: transaction.customerEmail,
            shippingAddress: transaction.shippingAddress || 'Cairo, Egypt',
            items: transaction.items,
                shippingAddress: transaction.shippingAddress || 'Cairo, Egypt',
            total: transaction.amount,
            status: 'processing'
          });
          
          // Clear the cart completely
          cart.items = [];
          cart.appliedCoupon = null;
          cart.discountAmount = 0;
          cart.discountCode = null;
          await cart.save();
          
          console.log(`[Paymob Callback] Cart cleared for user ${transaction.user}, Order ${transaction.orderNo} created`);
        }
      }
    }
    res.json({ received: true, status: status });
  } catch (e) {
    console.error('Paymob callback error:', e);
    res.status(500).json({ message: e.message });
  }
});

// Iframe redirect after payment completion (detected by iframe navigation)
app.get('/payment-finished', async (req, res) => {
  const { success, tx_id } = req.query;
  const isSuccess = success === 'true' || success === '1';
  
  // Update transaction status based on the result from Paymob
  if (tx_id) {
    try {
      const transaction = await Transaction.findById(tx_id);
      if (transaction) {
        const newStatus = isSuccess ? 'success' : 'failed';
        if (transaction.status !== newStatus) {
          transaction.status = newStatus;
          transaction.rawResponse = { ...transaction.rawResponse, payment_finished_query: req.query };
          await transaction.save();
          
          console.log(`[Payment Finished] Transaction ${transaction.orderNo} updated to: ${newStatus}`);
          
          // If successful, clear the cart and create order
          if (isSuccess) {
            const cart = await Cart.findOne({ user: transaction.user });
            if (cart && cart.items.length > 0) {
              await Order.create({
                orderNo: transaction.orderNo,
                user: transaction.user,
                customerName: transaction.customerName,
                customerEmail: transaction.customerEmail,
                shippingAddress: transaction.shippingAddress || 'Cairo, Egypt',
                items: transaction.items,
                total: transaction.amount,
                status: 'processing'
              });
              cart.items = [];
              cart.appliedCoupon = null;
              cart.discountAmount = 0;
              cart.discountCode = null;
              await cart.save();
              
              console.log(`[Payment Finished] Cart cleared for user ${transaction.user}, Order ${transaction.orderNo} created`);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error updating transaction from payment-finished:', e.message);
    }
  }
  
  // Define redirect URL based on payment result
  const redirectUrl = isSuccess ? '/home.html' : '/cart.html';
  
  res.send(`<!doctype html><html><head><meta charset="UTF-8"><title>${isSuccess ? 'Approved' : 'Error Occured'}</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:${isSuccess ? '#f0fdf4' : '#fef2f2'};}div{text-align:center;padding:2rem;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);max-width:400px;}h1{font-size:2rem;margin:0 0 1rem;color:${isSuccess ? '#16a34a' : '#dc2626'};}p{color:#6b7280;margin:0 0 1.5rem;line-height:1.5;}.icon{font-size:4rem;margin-bottom:1rem;}</style></head><body><div><div class="icon">${isSuccess ? '✅' : '❌'}</div><h1>${isSuccess ? 'Approved' : 'Error Occured'}</h1><p>${isSuccess ? 'Thank you for using the online payment service.<br>Your payment was successful!' : 'Thank you for using the online payment service.<br>Something went wrong! If this problem persists, please contact your service provider.'}</p></div><script>
    // Notify parent window immediately
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'paymob_result', success: ${isSuccess}, transactionId: '${tx_id || ''}' }, '*');
    }
    // Also try to notify opener if exists
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'paymob_result', success: ${isSuccess}, transactionId: '${tx_id || ''}' }, '*');
    }
    // Log for debugging
    console.log('[Payment Finished] Message sent, success=' + ${isSuccess});
    // Redirect after a short delay to show the result page
    setTimeout(() => {
      window.location.href = '${redirectUrl}';
    }, 2000);
  <\\/script></body></html>`);
});

// Get transaction status
app.get('/api/payment/transaction/:id', authOnly, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.session.userId
    }).populate('items.product');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get user transactions history
app.get('/api/payment/transactions', authOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.session.userId })
      .sort({ createdAt: -1 }).limit(20);
    res.json(transactions);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));

// =====================================================================
// SOCKET.IO
// =====================================================================
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => socket.join(`user:${userId}`));

  socket.on('support:user-message', async (payload) => {
    try {
      if (!payload.userId || !mongoose.Types.ObjectId.isValid(payload.userId))
        return socket.emit('support:error', { message: 'Invalid user session. Please login again.' });
      const msg = await Conversation.create({
        user: payload.userId, senderRole: 'user',
        message: payload.message || '', imageUrl: payload.imageUrl || '',
        fileUrl: payload.fileUrl || '', fileName: payload.fileName || '',
        fileType: payload.fileType || '', replyTo: payload.replyTo || null
      });
      const populated = await Conversation.findById(msg._id).populate('user').lean();
      io.to(`user:${payload.userId}`).emit('support:new-message', msg);
      io.emit('support:admin-feed', populated);
      io.emit('support:new-message', msg);
    } catch (e) {
      socket.emit('support:error', { message: 'Failed to save message. Please try again.' });
    }
  });

  socket.on('support:admin-reply', async (payload) => {
    try {
      if (!payload.userId || !mongoose.Types.ObjectId.isValid(payload.userId))
        return socket.emit('support:error', { message: 'Invalid target user.' });
      const msg = await Conversation.create({
        user: payload.userId, senderRole: 'admin',
        message: payload.message || '', imageUrl: payload.imageUrl || '',
        fileUrl: payload.fileUrl || '', fileName: payload.fileName || '',
        fileType: payload.fileType || '', replyTo: payload.replyTo || null
      });
      io.to(`user:${payload.userId}`).emit('support:new-message', msg);
      io.emit('support:admin-feed', msg);
      io.emit('support:new-message', msg);
    } catch (e) {
      socket.emit('support:error', { message: 'Failed to save reply. Please try again.' });
    }
  });

  socket.on('support:reaction', async (payload) => {
    try {
      const msg = await Conversation.findById(payload.messageId);
      if (!msg) return;
      const existingIdx = msg.reactions.findIndex(r => String(r.by) === String(payload.userId) && r.type === payload.emoji);
      if (existingIdx >= 0) msg.reactions.splice(existingIdx, 1);
      else msg.reactions.push({ type: payload.emoji, by: payload.userId });
      await msg.save();
      io.to(`user:${payload.targetUserId || msg.user}`).emit('support:new-message', msg);
      io.emit('support:admin-feed', msg);
      io.emit('support:new-message', msg);
    } catch (e) {
      socket.emit('support:error', { message: 'Failed to save reaction.' });
    }
  });
});

// =====================================================================
// START SERVER
// =====================================================================
connectMongo().then(async () => {
  await ensureAdminUser();

  const existingCategories = await Category.countDocuments();
  const existingProducts   = await Product.countDocuments();

  if (existingCategories === 0 && existingProducts === 0) {
    console.log('📦 Database empty. Auto-seeding food data from APIs...');
    try {
      for (const [en, key, ar] of CATEGORIES_SEED) {
        const apiUrl = `https://free-food-menus-api-two.vercel.app/${key}`;
        let category = await Category.findOne({ apiUrl });
        if (!category) {
          const first = await fetch(apiUrl).then(r => r.json()).then(d => d[0]).catch(() => null);
          category = await Category.create({
            nameEn: en, nameAr: ar, apiUrl,
            imageUrl: first?.img || CATEGORY_FALLBACK_IMAGES[key] || '',
            isActive: true
          });
        }
        if ((await Product.countDocuments({ category: category._id })) > 0) continue;
        const data = await fetch(apiUrl).then(r => r.json()).catch(() => []);
        const bulk = data.map(p => ({
          name: p.name || p.dsc || en, description: p.dsc || '',
          price: Number(p.price) || 0, originalPrice: Number(p.price) || 0,
          category: category._id, imageUrl: p.img || '',
          inStock: true, featured: false, onSale: false,
          rating: Number(p.rate) || 0, reviewsCount: 0, reviews: [], sourceApi: apiUrl
        }));
        if (bulk.length) await Product.insertMany(bulk);
      }
      await writeLog('Auto-seeded food data on server start');
      console.log('✅ Auto-seeding completed successfully');
    } catch (e) {
      console.error('⚠️ Auto-seeding failed:', e.message);
    }
  } else {
    console.log(`📊 Database has ${existingCategories} categories and ${existingProducts} products`);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('❌ Unable to start server:', error.message || error);
  process.exit(1);
});