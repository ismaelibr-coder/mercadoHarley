import Joi from 'joi';

/**
 * Validate product data before creation/update
 */
export const validateProduct = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(200).required(),
        description: Joi.string().max(2000).required(),
        price: Joi.string().pattern(/^R\$ [\d.,]+$/).required(),
        category: Joi.string().required(),
        partType: Joi.string().allow('', null).optional(),
        partner: Joi.string().allow('', null).optional(),
        images: Joi.array().items(Joi.string().uri()).min(1).required(),
        stock: Joi.number().integer().min(0).required(),
        weight: Joi.number().positive().allow(0).optional(),
        width: Joi.number().positive().allow(0).optional(),
        height: Joi.number().positive().allow(0).optional(),
        length: Joi.number().positive().allow(0).optional(),
        featured: Joi.boolean().optional(),
        new: Joi.boolean().optional(),
        rating: Joi.number().min(0).max(5).optional()
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
