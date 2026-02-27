import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        lowercase: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    cpf: {
        type: DataTypes.STRING(14),
        unique: true
    },
    address: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    userType: {
        type: DataTypes.STRING(50),
        defaultValue: 'customer',
        validate: {
            isIn: [['customer', 'pavilhao', 'admin']]
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['isAdmin'] }
    ]
});

export default User;
