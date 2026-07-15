import Joi from 'joi';

/**
 * Validate product data before creation/update
 */
export const validateProduct = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(200).required(),
        description: Joi.string().max(2000).required(),
        price: Joi.alternatives().try(
            Joi.number().positive(),
            Joi.string().pattern(/^R\$\s?[\d.,]+$/),
            Joi.string().pattern(/^\d+(?:[.,]\d{1,2})?$/)
        ).required(),
        category: Joi.string().required(),
        partType: Joi.string().allow('', null).optional(),
        partner: Joi.string().allow('', null).optional(),
        image: Joi.string().uri().allow('', null).optional(),
        images: Joi.array().items(Joi.string().uri()).optional(),
        stock: Joi.number().integer().min(0).required(),
        weight: Joi.number().positive().allow(0).optional(),
        width: Joi.number().positive().allow(0).optional(),
        height: Joi.number().positive().allow(0).optional(),
        length: Joi.number().positive().allow(0).optional(),
        dimensions: Joi.object({
            weight: Joi.number().positive().allow(0).optional(),
            width: Joi.number().positive().allow(0).optional(),
            height: Joi.number().positive().allow(0).optional(),
            length: Joi.number().positive().allow(0).optional()
        }).optional(),
        featured: Joi.boolean().optional(),
        featuredCarousel: Joi.boolean().optional(),
        new: Joi.boolean().optional(),
        rating: Joi.number().min(0).max(5).optional(),
        condition: Joi.string().allow('', null).optional(),
        profitMargin: Joi.number().allow(0).optional(),
        specs: Joi.array().items(Joi.string().allow('')).optional()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

/**
 * Validate shipping calculation request
 */
export const validateShipping = (req, res, next) => {
    const schema = Joi.object({
        cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).required(),
        weight: Joi.number().positive().required(),
        dimensions: Joi.object({
            width: Joi.number().positive().optional(),
            height: Joi.number().positive().optional(),
            length: Joi.number().positive().optional()
        }).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

/**
 * Validate order creation
 */
export const validateOrder = (req, res, next) => {
    const schema = Joi.object({
        items: Joi.array().items(Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            price: Joi.string().required()
        })).min(1).required(),
        shippingAddress: Joi.object({
            street: Joi.string().required(),
            number: Joi.string().required(),
            complement: Joi.string().allow('').optional(),
            neighborhood: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().length(2).required(),
            cep: Joi.string().pattern(/^\d{5}-?\d{3}$/).required()
        }).required(),
        paymentMethod: Joi.string().valid('credit_card', 'pix', 'boleto').required(),
        totalAmount: Joi.number().positive().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

export const validateSupplierPayload = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(120).required(),
        active: Joi.boolean().optional()
    }).unknown(false);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

export const validateSupplierUpdatePayload = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(120).optional(),
        active: Joi.boolean().optional()
    }).or('name', 'active').unknown(false);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

export const validatePricingConfigPayload = (req, res, next) => {
    const schema = Joi.object({
        siteMarkupPercent: Joi.number().min(0).required(),
        marketplaceMarkupPercent: Joi.number().min(0).required(),
        roundingStrategy: Joi.string().valid('2_decimals').optional()
    }).unknown(false);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

export const validateInternalStockItemCreate = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(200).required(),
        description: Joi.string().trim().min(2).max(5000).required(),
        quantity: Joi.number().integer().min(0).required(),
        unitCost: Joi.number().positive().required(),
        supplierId: Joi.string().trim().required()
    }).unknown(false);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};

export const validateInternalStockItemUpdate = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(200).optional(),
        description: Joi.string().trim().min(2).max(5000).optional(),
        quantity: Joi.number().integer().min(0).optional(),
        unitCost: Joi.number().positive().optional(),
        supplierId: Joi.string().trim().optional()
    }).or('name', 'description', 'quantity', 'unitCost', 'supplierId').unknown(false);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.details[0].message
        });
    }
    next();
};
