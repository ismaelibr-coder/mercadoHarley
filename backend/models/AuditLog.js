import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from './User.js';

export const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING(255),
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    resource: {
        type: DataTypes.STRING(100)
    },
    resourceId: {
        type: DataTypes.STRING(255)
    },
    changes: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['timestamp'] }
    ]
});

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default AuditLog;
