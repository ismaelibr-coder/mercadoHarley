import { Op, col, fn, where } from 'sequelize';
import { sequelize, InternalStockItem, PricingConfig, Supplier } from '../models/index.js';
import { getFilterSettings } from './settingsStore.js';

const DEFAULT_PRICING_CONFIG_ID = 'default';

const toMoneyNumber = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error('Invalid numeric value');
    }

    return parsed;
};

const normalizeName = (value = '') => String(value).trim();

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const roundCurrency = (value) => Number(value.toFixed(2));

export const calculateSalePrices = ({ unitCost, siteMarkupPercent, marketplaceMarkupPercent }) => {
    const cost = toMoneyNumber(unitCost);
    const sitePercent = toMoneyNumber(siteMarkupPercent);
    const marketplacePercent = toMoneyNumber(marketplaceMarkupPercent);

    const siteSalePrice = roundCurrency(cost * (1 + sitePercent / 100));
    const mlSalePrice = roundCurrency(cost * (1 + marketplacePercent / 100));

    return {
        siteSalePrice,
        mlSalePrice
    };
};

const ensurePricingConfig = async (transaction) => {
    const existing = await PricingConfig.findByPk(DEFAULT_PRICING_CONFIG_ID, { transaction });
    if (existing) {
        return existing;
    }

    return PricingConfig.create({ id: DEFAULT_PRICING_CONFIG_ID }, { transaction });
};

export const getPricingConfig = async () => {
    const pricingConfig = await ensurePricingConfig();
    return pricingConfig.toJSON();
};

export const listSuppliers = async ({ includeInactive = false } = {}) => {
    const whereClause = includeInactive ? {} : { active: true };
    const rows = await Supplier.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
    });

    return rows.map((item) => item.toJSON());
};

const findSupplierByNormalizedName = async (name, { excludeId } = {}) => {
    const normalizedName = normalizeName(name).toLowerCase();

    if (!normalizedName) {
        return null;
    }

    const whereClause = {
        [Op.and]: [where(fn('LOWER', col('name')), normalizedName)]
    };

    if (excludeId) {
        whereClause.id = { [Op.ne]: excludeId };
    }

    return Supplier.findOne({ where: whereClause });
};

export const createSupplier = async ({ name, source = 'manual' }) => {
    const normalized = normalizeName(name);

    const existing = await findSupplierByNormalizedName(normalized);
    if (existing) {
        throw new Error('Supplier name already exists');
    }

    const supplier = await Supplier.create({
        id: generateId('sup'),
        name: normalized,
        source
    });

    return supplier.toJSON();
};

export const updateSupplier = async (id, payload = {}) => {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
        throw new Error('Supplier not found');
    }

    const nextName = payload.name !== undefined ? normalizeName(payload.name) : supplier.name;
    const nextActive = payload.active !== undefined ? Boolean(payload.active) : supplier.active;

    const duplicate = await findSupplierByNormalizedName(nextName, { excludeId: id });
    if (duplicate) {
        throw new Error('Supplier name already exists');
    }

    await supplier.update({
        name: nextName,
        active: nextActive
    });

    return supplier.toJSON();
};

export const deactivateSupplier = async (id) => {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
        throw new Error('Supplier not found');
    }

    await supplier.update({ active: false });
    return supplier.toJSON();
};

export const importSuppliersFromPartners = async () => {
    const filterSettings = getFilterSettings();
    const partnerNames = Array.isArray(filterSettings.partners) ? filterSettings.partners : [];

    let imported = 0;

    for (const partnerName of partnerNames) {
        const normalizedName = normalizeName(partnerName);
        if (!normalizedName) {
            continue;
        }

        const existing = await findSupplierByNormalizedName(normalizedName);
        if (existing) {
            continue;
        }

        await Supplier.create({
            id: generateId('sup'),
            name: normalizedName,
            source: 'partner_import'
        });

        imported += 1;
    }

    return { imported, totalPartners: partnerNames.length };
};

const normalizeInternalStockOutput = (item) => {
    const data = item?.toJSON ? item.toJSON() : { ...item };
    return {
        ...data,
        unitCost: Number(data.unitCost),
        siteSalePrice: Number(data.siteSalePrice),
        mlSalePrice: Number(data.mlSalePrice)
    };
};

const getActiveSupplierOrThrow = async (supplierId, transaction) => {
    const supplier = await Supplier.findOne({
        where: { id: supplierId, active: true },
        transaction
    });

    if (!supplier) {
        throw new Error('Supplier not found or inactive');
    }

    return supplier;
};

export const listInternalStockItems = async () => {
    const rows = await InternalStockItem.findAll({
        where: { active: true },
        include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name', 'source'] }],
        order: [['createdAt', 'DESC']]
    });

    return rows.map(normalizeInternalStockOutput);
};

export const getInternalStockItemById = async (id) => {
    const item = await InternalStockItem.findOne({
        where: { id, active: true },
        include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'name', 'source'] }]
    });

    if (!item) {
        throw new Error('Internal stock item not found');
    }

    return normalizeInternalStockOutput(item);
};

export const createInternalStockItem = async ({ name, description, quantity, unitCost, supplierId }) => {
    const transaction = await sequelize.transaction();

    try {
        await getActiveSupplierOrThrow(supplierId, transaction);
        const pricingConfig = await ensurePricingConfig(transaction);

        const { siteSalePrice, mlSalePrice } = calculateSalePrices({
            unitCost,
            siteMarkupPercent: pricingConfig.siteMarkupPercent,
            marketplaceMarkupPercent: pricingConfig.marketplaceMarkupPercent
        });

        const item = await InternalStockItem.create({
            id: generateId('intstk'),
            name: normalizeName(name),
            description: String(description).trim(),
            quantity: Number(quantity),
            unitCost: toMoneyNumber(unitCost),
            siteSalePrice,
            mlSalePrice,
            supplierId
        }, { transaction });

        await transaction.commit();
        return getInternalStockItemById(item.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const updateInternalStockItem = async (id, payload = {}) => {
    const transaction = await sequelize.transaction();

    try {
        const item = await InternalStockItem.findOne({
            where: { id, active: true },
            transaction
        });

        if (!item) {
            throw new Error('Internal stock item not found');
        }

        const nextSupplierId = payload.supplierId || item.supplierId;
        await getActiveSupplierOrThrow(nextSupplierId, transaction);

        const pricingConfig = await ensurePricingConfig(transaction);
        const nextUnitCost = payload.unitCost !== undefined ? toMoneyNumber(payload.unitCost) : toMoneyNumber(item.unitCost);

        const { siteSalePrice, mlSalePrice } = calculateSalePrices({
            unitCost: nextUnitCost,
            siteMarkupPercent: pricingConfig.siteMarkupPercent,
            marketplaceMarkupPercent: pricingConfig.marketplaceMarkupPercent
        });

        await item.update({
            name: payload.name !== undefined ? normalizeName(payload.name) : item.name,
            description: payload.description !== undefined ? String(payload.description).trim() : item.description,
            quantity: payload.quantity !== undefined ? Number(payload.quantity) : item.quantity,
            unitCost: nextUnitCost,
            supplierId: nextSupplierId,
            siteSalePrice,
            mlSalePrice
        }, { transaction });

        await transaction.commit();
        return getInternalStockItemById(id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const deleteInternalStockItem = async (id) => {
    const item = await InternalStockItem.findOne({ where: { id, active: true } });
    if (!item) {
        throw new Error('Internal stock item not found');
    }

    await item.update({ active: false });
    return { success: true };
};

export const updatePricingConfig = async ({ siteMarkupPercent, marketplaceMarkupPercent, roundingStrategy, updatedBy }) => {
    const transaction = await sequelize.transaction();

    try {
        const pricingConfig = await ensurePricingConfig(transaction);

        await pricingConfig.update({
            siteMarkupPercent: toMoneyNumber(siteMarkupPercent),
            marketplaceMarkupPercent: toMoneyNumber(marketplaceMarkupPercent),
            roundingStrategy: roundingStrategy || pricingConfig.roundingStrategy,
            updatedBy: updatedBy || null
        }, { transaction });

        const activeItems = await InternalStockItem.findAll({
            where: { active: true },
            transaction
        });

        for (const item of activeItems) {
            const { siteSalePrice, mlSalePrice } = calculateSalePrices({
                unitCost: item.unitCost,
                siteMarkupPercent: pricingConfig.siteMarkupPercent,
                marketplaceMarkupPercent: pricingConfig.marketplaceMarkupPercent
            });

            await item.update({
                siteSalePrice,
                mlSalePrice
            }, { transaction });
        }

        await transaction.commit();

        return {
            config: pricingConfig.toJSON(),
            recalculatedItems: activeItems.length
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};
