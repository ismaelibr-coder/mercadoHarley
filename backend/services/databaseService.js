import { Product, Order, User, ShippingRule, AuditLog } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Product Operations
 */
export const createProduct = async (productData) => {
    try {
        const product = await Product.create({
            id: `prod_${uuidv4()}`,
            ...productData
        });
        return product;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

export const getAllProducts = async () => {
    try {
        const products = await Product.findAll({
            order: [['createdAt', 'DESC']]
        });
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const getProductById = async (productId) => {
    try {
        const product = await Product.findByPk(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

export const updateProduct = async (productId, updateData) => {
    try {
        const product = await Product.findByPk(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        await product.update(updateData);
        return product;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        const product = await Product.findByPk(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        await product.destroy();
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

/**
 * Order Operations
 */
export const createOrder = async (orderData) => {
    const transaction = await sequelize.transaction();
    try {
        // 1. Check and decrement stock
        for (const item of orderData.items) {
            const product = await Product.findByPk(item.id, { transaction });

            if (!product) {
                throw new Error(`Product ${item.name} not found`);
            }

            if (product.stock < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${item.name}. ` +
                    `Available: ${product.stock}, Requested: ${item.quantity}`
                );
            }

            // Decrement stock
            await product.update(
                { stock: product.stock - item.quantity },
                { transaction }
            );
        }

        // 2. Create order
        const order = await Order.create(
            {
                id: `ord_${uuidv4()}`,
                ...orderData
            },
            { transaction }
        );

        // 3. Log audit
        if (orderData.userId) {
            await AuditLog.create(
                {
                    id: `audit_${uuidv4()}`,
                    userId: orderData.userId,
                    action: 'CREATE_ORDER',
                    resource: 'Order',
                    resourceId: order.id,
                    changes: { created: true }
                },
                { transaction }
            );
        }

        await transaction.commit();
        return order;
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const order = await Order.findByPk(orderId, {
            include: [{ model: User, as: 'user' }]
        });

        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

export const getAllOrders = async () => {
    try {
        const orders = await Order.findAll({
            include: [{ model: User, as: 'user' }],
            order: [['createdAt', 'DESC']]
        });
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const updateData = {
            status,
            ...additionalData
        };

        // Add timestamps for specific statuses
        if (status === 'paid') {
            updateData.paidAt = new Date();
        } else if (status === 'shipped') {
            updateData.shippedAt = new Date();
        } else if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        await order.update(updateData);

        // Log audit
        if (order.userId) {
            await AuditLog.create({
                id: `audit_${uuidv4()}`,
                userId: order.userId,
                action: 'UPDATE_ORDER_STATUS',
                resource: 'Order',
                resourceId: orderId,
                changes: { status, ...additionalData }
            });
        }

        return order;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

export const updateOrderPayment = async (orderId, paymentData) => {
    try {
        const order = await Order.findByPk(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        await order.update({
            payment: paymentData
        });

        return order;
    } catch (error) {
        console.error('Error updating order payment:', error);
        throw error;
    }
};

/**
 * User Operations
 */
export const getUserById = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

export const updateUserProfile = async (userId, updateData) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Don't allow password updates through this endpoint
        const { password, ...safeData } = updateData;

        await user.update(safeData);

        return user;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

/**
 * Shipping Rules Operations
 */
export const getShippingRulesByState = async (state) => {
    try {
        // Get all rules and filter by state
        const rules = await ShippingRule.findAll();
        return rules.filter(rule => {
            const states = JSON.parse(JSON.stringify(rule.states));
            return states.includes(state);
        });
    } catch (error) {
        console.error('Error fetching shipping rules:', error);
        throw error;
    }
};

export const createShippingRule = async (ruleData) => {
    try {
        const rule = await ShippingRule.create({
            id: `ship_${uuidv4()}`,
            states: Array.isArray(ruleData.states) ? ruleData.states : [ruleData.states],
            ...ruleData
        });
        return rule;
    } catch (error) {
        console.error('Error creating shipping rule:', error);
        throw error;
    }
};

export const getAllShippingRules = async () => {
    try {
        const rules = await ShippingRule.findAll({
            order: [['price', 'ASC']]
        });
        return rules;
    } catch (error) {
        console.error('Error fetching shipping rules:', error);
        throw error;
    }
};

export const updateShippingRule = async (ruleId, updateData) => {
    try {
        const rule = await ShippingRule.findByPk(ruleId);
        if (!rule) {
            throw new Error('Shipping rule not found');
        }

        if (updateData.states && !Array.isArray(updateData.states)) {
            updateData.states = [updateData.states];
        }

        await rule.update(updateData);
        return rule;
    } catch (error) {
        console.error('Error updating shipping rule:', error);
        throw error;
    }
};

export const deleteShippingRule = async (ruleId) => {
    try {
        const rule = await ShippingRule.findByPk(ruleId);
        if (!rule) {
            throw new Error('Shipping rule not found');
        }
        await rule.destroy();
    } catch (error) {
        console.error('Error deleting shipping rule:', error);
        throw error;
    }
};
