import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    source: {
        type: DataTypes.ENUM('manual', 'partner_import'),
        allowNull: false,
        defaultValue: 'manual'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'suppliers',
    timestamps: true,
    indexes: [
        // Named — see the comment on Order.orderNumber for why: an unnamed unique
        // index isn't reliably recognized as already existing across dev's
        // sync({ alter: true }) restarts, and duplicates accumulate.
        { unique: true, fields: ['name'], name: 'suppliers_name_unique' },
        { fields: ['active'] }
    ]
});

export default Supplier;
