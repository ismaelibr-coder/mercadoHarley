import React from 'react';

/**
 * Product condition pill (Novo/Usado/etc). Was reimplemented with slightly
 * different markup in ProductPage, CategoryPage and ProductList — this is the
 * single source of truth going forward.
 */
const ConditionBadge = ({ condition, className = '' }) => {
    if (!condition) return null;

    const isNew = condition === 'Novo';

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${isNew ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                } ${className}`}
        >
            {condition}
        </span>
    );
};

export default ConditionBadge;
