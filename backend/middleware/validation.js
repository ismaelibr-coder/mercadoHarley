import Joi from 'joi';

// Every validator below did the same 6 lines: run a schema, and on failure
// respond 400 with the first error message. Factored out once so each export
// is just its schema.
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

const productFields = {
    name: Joi.string().min(3).max(200),
    description: Joi.string().max(2000),
    price: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().pattern(/^R\$\s?[\d.,]+$/),
        Joi.string().pattern(/^\d+(?:[.,]\d{1,2})?$/)
    ),
    category: Joi.string(),
    partType: Joi.string().allow('', null),
    partner: Joi.string().allow('', null),
    image: Joi.string().uri().allow('', null),
    images: Joi.array().items(Joi.string().uri()),
    stock: Joi.number().integer().min(0),
    weight: Joi.number().positive().allow(0),
    width: Joi.number().positive().allow(0),
    height: Joi.number().positive().allow(0),
    length: Joi.number().positive().allow(0),
    dimensions: Joi.object({
        weight: Joi.number().positive().allow(0).optional(),
        width: Joi.number().positive().allow(0).optional(),
        height: Joi.number().positive().allow(0).optional(),
        length: Joi.number().positive().allow(0).optional()
    }),
    featured: Joi.boolean(),
    featuredCarousel: Joi.boolean(),
    new: Joi.boolean(),
    rating: Joi.number().min(0).max(5),
    condition: Joi.string().allow('', null),
    profitMargin: Joi.number().allow(0),
    specs: Joi.array().items(Joi.string().allow(''))
};

// Validate product data before creation
export const validateProduct = validate(
    Joi.object({
        ...productFields,
        name: productFields.name.required(),
        description: productFields.description.required(),
        price: productFields.price.required(),
        category: productFields.category.required(),
        stock: productFields.stock.required()
    }).unknown(true)
);

// Same fields as validateProduct, but nothing required (PUT only sends what's
// changing); at least one field must be present so an empty body doesn't
// silently no-op.
export const validateProductUpdate = validate(
    Joi.object(productFields).unknown(true).min(1)
);

// Validate shipping calculation request
export const validateShipping = validate(
    Joi.object({
        cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).required(),
        weight: Joi.number().positive().required(),
        dimensions: Joi.object({
            width: Joi.number().positive().optional(),
            height: Joi.number().positive().optional(),
            length: Joi.number().positive().optional()
        }).optional()
    })
);

/**
 * Order/payment creation. Matches the actual payload shape sent by
 * CheckoutPage.jsx (buildOrderData) — items[].id (not productId), customer/
 * shipping as nested objects, price fields as numbers. Deliberately loose on
 * customer.cpf/phone and shipping.cep/number: the in-store "pavilhão" flow
 * (backend/routes/orders.js) legitimately omits them. subtotal/discount/total
 * are accepted but not trusted — the server always recomputes them
 * (see orderCalculationService.js) before creating the order.
 */
const orderPayloadSchema = Joi.object({
    orderNumber: Joi.string().optional(),
    items: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        }).unknown(true)
    ).min(1).required(),
    customer: Joi.object({
        name: Joi.string().min(1).required(),
        cpf: Joi.string().allow('', null).optional(),
        phone: Joi.string().allow('', null).optional(),
        email: Joi.string().allow('', null).optional()
    }).unknown(true).required(),
    shipping: Joi.object({
        address: Joi.string().min(1).required(),
        city: Joi.string().min(1).required()
    }).unknown(true).required(),
    payment: Joi.object().unknown(true).optional(),
    method: Joi.string().allow('', null).optional(),
    subtotal: Joi.number().optional(),
    discount: Joi.number().optional(),
    total: Joi.number().optional(),
    sellerName: Joi.string().allow('', null).optional(),
    orderType: Joi.string().optional(),
    installments: Joi.number().integer().min(1).optional()
}).unknown(true);

export const validateOrder = validate(orderPayloadSchema);

// Every status dbService.js/emailService.js actually know how to handle — an
// unrecognized value would silently leave stock/notifications inconsistent.
const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected'];

export const validateOrderStatus = validate(
    Joi.object({
        status: Joi.string().valid(...ORDER_STATUSES).required()
    }).unknown(true)
);

// Validate the /api/payments/credit-card body, which wraps the same order
// payload one level deeper: { orderData, cardToken, installments, paymentMethodId }.
export const validateCreditCardPayment = validate(
    Joi.object({
        orderData: orderPayloadSchema.required(),
        cardToken: Joi.string().required(),
        installments: Joi.number().integer().min(1).optional(),
        paymentMethodId: Joi.string().required()
    }).unknown(true)
);

export const validateSupplierPayload = validate(
    Joi.object({
        name: Joi.string().trim().min(2).max(120).required(),
        active: Joi.boolean().optional()
    }).unknown(false)
);

export const validateSupplierUpdatePayload = validate(
    Joi.object({
        name: Joi.string().trim().min(2).max(120).optional(),
        active: Joi.boolean().optional()
    }).or('name', 'active').unknown(false)
);

export const validatePricingConfigPayload = validate(
    Joi.object({
        siteMarkupPercent: Joi.number().min(0).required(),
        marketplaceMarkupPercent: Joi.number().min(0).required(),
        roundingStrategy: Joi.string().valid('2_decimals').optional()
    }).unknown(false)
);

export const validateInternalStockItemCreate = validate(
    Joi.object({
        name: Joi.string().trim().min(2).max(200).required(),
        description: Joi.string().trim().min(2).max(5000).required(),
        quantity: Joi.number().integer().min(0).required(),
        unitCost: Joi.number().positive().required(),
        supplierId: Joi.string().trim().required()
    }).unknown(false)
);

export const validateReview = validate(
    Joi.object({
        productId: Joi.string().required(),
        rating: Joi.number().integer().min(1).max(5).required(),
        comment: Joi.string().trim().min(10).max(1000).required()
    }).unknown(false)
);

export const validateInternalStockItemUpdate = validate(
    Joi.object({
        name: Joi.string().trim().min(2).max(200).optional(),
        description: Joi.string().trim().min(2).max(5000).optional(),
        quantity: Joi.number().integer().min(0).optional(),
        unitCost: Joi.number().positive().optional(),
        supplierId: Joi.string().trim().optional()
    }).or('name', 'description', 'quantity', 'unitCost', 'supplierId').unknown(false)
);
