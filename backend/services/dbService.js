import { sequelize, User, Product, Order, Banner, AuditLog } from '../models/index.js';
import { QueryTypes } from 'sequelize';

// Routes migrating to next(error) + the central errorHandler (see errorHandler.js)
// read err.status when set, falling back to 500 otherwise — this is how a "not
// found" error here becomes an actual 404 response instead of a generic 500.
const notFoundError = (message) => {
  const err = new Error(message);
  err.status = 404;
  return err;
};

export const createOrder = async (orderData) => {
  const t = await sequelize.transaction();
  try {
    // Validate items exist and have enough stock. This is a check only — stock is
    // NOT decremented here. It's only decremented once payment is confirmed (see
    // updateOrderStatus below), so a pending/unpaid order never removes real stock.
    for (const item of orderData.items || []) {
      const product = await Product.findByPk(item.id, { transaction: t });
      if (!product) throw new Error(`Produto ${item.name || item.id} não encontrado`);
      const currentStock = product.stock || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${item.name || item.id}. Disponível: ${currentStock}, Solicitado: ${item.quantity}`);
      }
    }

    const id = orderData.id || `ord_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const orderNumber = orderData.orderNumber || `HD-${new Date().getFullYear()}-${Math.floor(Math.random()*1000000).toString().padStart(6,'0')}`;

    const created = await Order.create({
      id,
      orderNumber,
      userId: orderData.userId || null,
      items: orderData.items || [],
      customer: orderData.customer || {},
      shipping: orderData.shipping || {},
      payment: orderData.payment || null,
      total: orderData.total || 0,
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      status: orderData.status || 'pending',
      method: orderData.method || null,
      sellerName: orderData.sellerName || null,
      orderType: orderData.orderType || 'online'
    }, { transaction: t });

    await t.commit();
    return created.toJSON();
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

export const getOrderById = async (orderId) => {
  const o = await Order.findByPk(orderId);
  if (!o) throw notFoundError('Order not found');
  return o.toJSON();
};

export const getAllOrders = async () => {
  const rows = await Order.findAll({ order: [['createdAt','DESC']] });
  return rows.map(r => r.toJSON());
};

// Statuses that mean "payment confirmed" — stock is committed (decremented) here,
// and only here, so a pending order that never gets paid never touches real stock.
const STOCK_DECREMENTING_STATUSES = new Set(['paid']);
// Statuses that release a previously committed order back to stock.
const STOCK_RESTORING_STATUSES = new Set(['cancelled', 'rejected']);

const adjustStockForOrder = async (order, direction, t) => {
  for (const item of order.items || []) {
    // SELECT ... FOR UPDATE — without this, two concurrent transactions touching the
    // same product (e.g. two orders paid near-simultaneously, or a retried webhook)
    // can both read the same currentStock under REPEATABLE READ and both decrement
    // from it, silently overselling. Locking the row serializes them.
    const product = await Product.findByPk(item.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!product) continue; // product may have been removed since the order was placed
    const currentStock = product.stock || 0;
    const nextStock = direction < 0
      ? Math.max(0, currentStock - item.quantity)
      : currentStock + item.quantity;
    await product.update({ stock: nextStock }, { transaction: t });
  }
};

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  const t = await sequelize.transaction();
  try {
    // Lock the order row too — without it, two concurrent calls for the same order
    // (e.g. Mercado Pago's own webhook retry landing twice) could both read the same
    // previousStatus before either commits, and both pass the "genuine transition"
    // check below, double-decrementing stock for one paid order.
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) throw notFoundError('Order not found');

    const previousStatus = order.status;

    const updateData = {
      status,
      updatedAt: new Date(),
      ...additionalData
    };
    if (status === 'paid') updateData.paidAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();

    await order.update(updateData, { transaction: t });

    // Move stock only on a genuine transition, so calling this twice with the same
    // status (e.g. a duplicate webhook event) never double-decrements or double-restores.
    if (STOCK_DECREMENTING_STATUSES.has(status) && !STOCK_DECREMENTING_STATUSES.has(previousStatus)) {
      await adjustStockForOrder(order, -1, t);
    } else if (STOCK_RESTORING_STATUSES.has(status) && STOCK_DECREMENTING_STATUSES.has(previousStatus)) {
      await adjustStockForOrder(order, 1, t);
    }

    await t.commit();
    return getOrderById(orderId);
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

export const updateOrderPayment = async (orderId, paymentData) => {
  await Order.update({ payment: paymentData, updatedAt: new Date() }, { where: { id: orderId } });
  return getOrderById(orderId);
};

// payment.paymentId in the JSON column can be stored as either a string or a
// number depending on which payment provider wrote it — matching both in one
// query instead of two sequential ones (string, then numeric on a miss).
const parseOrderJsonFields = (row) => {
  try { if (typeof row.items === 'string') row.items = JSON.parse(row.items); } catch (e) { /* leave as-is */ }
  try { if (typeof row.payment === 'string') row.payment = JSON.parse(row.payment); } catch (e) { /* leave as-is */ }
  try { if (typeof row.shipping === 'string') row.shipping = JSON.parse(row.shipping); } catch (e) { /* leave as-is */ }
  return row;
};

export const findOrderByPaymentId = async (paymentId) => {
  // Mock-mode payment ids (mock_pix_..., mock_card_...) aren't numeric — Number()
  // on those is NaN, which mysql2 would inline as the bare (invalid) SQL token NaN.
  // null instead: valid SQL, and IN (x, NULL) simply never matches NULL, which is
  // exactly the "this id isn't numeric" case we want to no-op on.
  const numericId = Number(paymentId);
  const sql = "SELECT * FROM orders WHERE JSON_UNQUOTE(JSON_EXTRACT(payment, '$.paymentId')) IN (?, ?) LIMIT 1";
  const rows = await sequelize.query(sql, {
    replacements: [String(paymentId), Number.isFinite(numericId) ? numericId : null],
    type: QueryTypes.SELECT
  });

  return rows && rows.length ? parseOrderJsonFields(rows[0]) : null;
};

export const isUserAdmin = async (uid) => {
  const u = await User.findByPk(uid);
  return u ? !!u.isAdmin : false;
};

const normalizeProductOutput = (product) => {
  const normalized = product?.toJSON ? product.toJSON() : { ...product };
  const images = Array.isArray(normalized.images) ? normalized.images.filter(Boolean) : [];

  return {
    ...normalized,
    images,
    image: normalized.image || images[0] || null
  };
};

const normalizeProductInput = (productData = {}, currentImages = []) => {
  const providedImages = Array.isArray(productData.images) ? productData.images.filter(Boolean) : [];
  const fallbackImage = typeof productData.image === 'string' ? productData.image.trim() : '';
  const providedSpecs = Array.isArray(productData.specs) ? productData.specs.filter(Boolean) : [];

  const images = providedImages.length > 0
    ? providedImages
    : (fallbackImage ? [fallbackImage] : currentImages);

  return {
    ...productData,
    images,
    specs: providedSpecs
  };
};

export const createProduct = async (productData) => {
  const id = productData.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const normalizedInput = normalizeProductInput(productData);

  const p = await Product.create({
    id,
    name: normalizedInput.name,
    price: normalizedInput.price,
    stock: normalizedInput.stock || 0,
    images: normalizedInput.images,
    dimensions: normalizedInput.dimensions || null,
    weight: normalizedInput.weight || null,
    description: normalizedInput.description || null,
    category: normalizedInput.category || null,
    partType: normalizedInput.partType || null,
    partner: normalizedInput.partner || null,
    condition: normalizedInput.condition || null,
    rating: normalizedInput.rating || 5,
    profitMargin: normalizedInput.profitMargin || 0,
    featured: !!normalizedInput.featured,
    featuredCarousel: !!normalizedInput.featuredCarousel,
    specs: normalizedInput.specs || []
  });
  return normalizeProductOutput(p);
};

export const getAllProducts = async () => {
  const rows = await Product.findAll({ order: [['createdAt','DESC']] });
  return rows.map(normalizeProductOutput);
};

export const getProductById = async (productId) => {
  const p = await Product.findByPk(productId);
  if (!p) throw notFoundError('Product not found');
  return normalizeProductOutput(p);
};

export const updateProduct = async (productId, productData) => {
  const p = await Product.findByPk(productId);
  if (!p) throw notFoundError('Product not found');

  const currentImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const normalizedInput = normalizeProductInput(productData, currentImages);

  await p.update(normalizedInput);
  return normalizeProductOutput(p);
};

export const deleteProduct = async (productId) => {
  const p = await Product.findByPk(productId);
  if (!p) throw notFoundError('Product not found');
  await p.destroy();
};

export const getOrdersByUserId = async (userId) => {
  const rows = await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  return rows.map(r => r.toJSON());
};

export const updateUserProfile = async (userId, updates) => {
  const u = await User.findByPk(userId);
  if (!u) throw notFoundError('User not found');
  await u.update(updates);
  return u.toJSON();
};

// Banner helpers
export const getAllBanners = async () => {
  const rows = await Banner.findAll({ order: [['displayOrder','ASC']] });
  return rows.map(r => r.toJSON());
};

export const getActiveBanners = async () => {
  const rows = await Banner.findAll({ where: { active: true } });
  return rows.map(r => r.toJSON()).sort((a,b) => (a.displayOrder||0)-(b.displayOrder||0));
};

export const getActiveBannersByType = async (displayType) => {
  const rows = await Banner.findAll({ where: { active: true } });
  return rows.map(r => r.toJSON()).filter(b => b.displayType === displayType).sort((a,b) => (a.displayOrder||0)-(b.displayOrder||0));
};

export const getBannerById = async (id) => {
  const b = await Banner.findByPk(id);
  if (!b) throw notFoundError('Banner not found');
  return b.toJSON();
};

export const createBanner = async (data) => {
  const id = data.id || `banner_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  const b = await Banner.create({
    id,
    title: data.title,
    subtitle: data.subtitle || null,
    image: data.image || null,
    link: data.link || null,
    active: data.active !== undefined ? data.active : true,
    displayOrder: data.order || 0
  });
  return b.toJSON();
};

export const updateBanner = async (id, data) => {
  const b = await Banner.findByPk(id);
  if (!b) throw notFoundError('Banner not found');
  await b.update({
    title: data.title ?? b.title,
    subtitle: data.subtitle ?? b.subtitle,
    image: data.image ?? b.image,
    link: data.link ?? b.link,
    active: data.active ?? b.active,
    displayOrder: data.order ?? b.displayOrder
  });
  return b.toJSON();
};

export const deleteBanner = async (id) => {
  const b = await Banner.findByPk(id);
  if (!b) throw notFoundError('Banner not found');
  await b.destroy();
};

export default {
  createOrder,
  getOrderById,
  getAllOrders,
  getOrdersByUserId,
  updateOrderStatus,
  updateOrderPayment,
  findOrderByPaymentId,
  isUserAdmin,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateUserProfile,
  getAllBanners,
  getActiveBanners,
  getActiveBannersByType,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner
};
