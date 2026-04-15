import { sequelize, User, Product, Order, Banner, AuditLog } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import { testDatabaseConnection } from '../config/database.js';

// Initialize (alias for compatibility with old firebaseService.initializeFirebase)
export const initializeFirebase = async () => {
  await testDatabaseConnection();
  return true;
};

export const createOrder = async (orderData) => {
  const t = await sequelize.transaction();
  try {
    // Check and decrement stock
    for (const item of orderData.items || []) {
      const product = await Product.findByPk(item.id, { transaction: t });
      if (!product) throw new Error(`Produto ${item.name || item.id} não encontrado`);
      const currentStock = product.stock || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${item.name || item.id}. Disponível: ${currentStock}, Solicitado: ${item.quantity}`);
      }
      await product.update({ stock: currentStock - item.quantity }, { transaction: t });
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
  if (!o) throw new Error('Order not found');
  return o.toJSON();
};

export const getAllOrders = async () => {
  const rows = await Order.findAll({ order: [['createdAt','DESC']] });
  return rows.map(r => r.toJSON());
};

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  const updateData = {
    status,
    updatedAt: new Date(),
    ...additionalData
  };
  if (status === 'paid') updateData.paidAt = new Date();
  if (status === 'shipped') updateData.shippedAt = new Date();
  if (status === 'delivered') updateData.deliveredAt = new Date();

  await Order.update(updateData, { where: { id: orderId } });
  return getOrderById(orderId);
};

export const updateOrderPayment = async (orderId, paymentData) => {
  await Order.update({ payment: paymentData, updatedAt: new Date() }, { where: { id: orderId } });
  return getOrderById(orderId);
};

export const findOrderByPaymentId = async (paymentId) => {
  // Try as string
  const sql = "SELECT * FROM orders WHERE JSON_UNQUOTE(JSON_EXTRACT(payment, '$.paymentId')) = ? LIMIT 1";
  const rows = await sequelize.query(sql, { replacements: [String(paymentId)], type: QueryTypes.SELECT });
  if (rows && rows.length) {
    const r = rows[0];
    // Parse JSON fields if returned as strings
    try { if (typeof r.items === 'string') r.items = JSON.parse(r.items); } catch(e){}
    try { if (typeof r.payment === 'string') r.payment = JSON.parse(r.payment); } catch(e){}
    try { if (typeof r.shipping === 'string') r.shipping = JSON.parse(r.shipping); } catch(e){}
    return r;
  }

  // Try numeric
  const rows2 = await sequelize.query(sql, { replacements: [Number(paymentId)], type: QueryTypes.SELECT });
  if (rows2 && rows2.length) {
    const r = rows2[0];
    try { if (typeof r.items === 'string') r.items = JSON.parse(r.items); } catch(e){}
    try { if (typeof r.payment === 'string') r.payment = JSON.parse(r.payment); } catch(e){}
    try { if (typeof r.shipping === 'string') r.shipping = JSON.parse(r.shipping); } catch(e){}
    return r;
  }

  return null;
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

  const images = providedImages.length > 0
    ? providedImages
    : (fallbackImage ? [fallbackImage] : currentImages);

  return {
    ...productData,
    images
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
    category: normalizedInput.category || null
  });
  return normalizeProductOutput(p);
};

export const getAllProducts = async () => {
  const rows = await Product.findAll({ order: [['createdAt','DESC']] });
  return rows.map(normalizeProductOutput);
};

export const getProductById = async (productId) => {
  const p = await Product.findByPk(productId);
  if (!p) throw new Error('Product not found');
  return normalizeProductOutput(p);
};

export const updateProduct = async (productId, productData) => {
  const p = await Product.findByPk(productId);
  if (!p) throw new Error('Product not found');

  const currentImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const normalizedInput = normalizeProductInput(productData, currentImages);

  await p.update(normalizedInput);
  return normalizeProductOutput(p);
};

export const deleteProduct = async (productId) => {
  const p = await Product.findByPk(productId);
  if (!p) throw new Error('Product not found');
  await p.destroy();
};

export const getOrdersByUserId = async (userId) => {
  const rows = await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  return rows.map(r => r.toJSON());
};

export const updateUserProfile = async (userId, updates) => {
  const u = await User.findByPk(userId);
  if (!u) throw new Error('User not found');
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
  if (!b) throw new Error('Banner not found');
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
  if (!b) throw new Error('Banner not found');
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
  if (!b) throw new Error('Banner not found');
  await b.destroy();
};

export default {
  initializeFirebase,
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
