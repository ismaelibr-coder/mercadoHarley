import { useEffect, useState } from 'react';
import { getAllProducts } from '../services/productService';
import { computeCategoryCounts } from '../config/categories.js';

/**
 * Per-macro-category product counts, so nav links / home cards can hide
 * themselves when a category has zero published products instead of sending
 * shoppers to a permanently empty page. `loading` starts true so callers can
 * avoid a flash of "hidden then shown" while the count is still unknown.
 */
export const useCategoryCounts = () => {
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getAllProducts()
            .then((products) => { if (!cancelled) setCounts(computeCategoryCounts(products)); })
            .catch((error) => console.error('Error loading category counts:', error))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return { counts, loading };
};

export default useCategoryCounts;
