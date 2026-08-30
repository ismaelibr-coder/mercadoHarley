// Single source of truth for the 4 macro-categories (menu, home cards, category
// pages) — was previously a local const only inside CategoryPage.jsx, so any other
// component (Layout.jsx's nav, CategoryGrid.jsx's cards) had no way to know which
// real product-category strings map to which macro-category, or how many products
// are actually in one.
export const CATEGORY_MAP = {
    todos: {
        title: 'Todos os Produtos',
        allowedCategories: null // All categories
    },
    pecas: {
        title: 'Peças',
        allowedCategories: ['Peças', 'Escapamentos', 'Guidões', 'Bancos', 'Performance', 'Iluminação', 'Freios', 'Suspensão']
    },
    acessorios: {
        title: 'Acessórios',
        allowedCategories: ['Acessórios', 'Alforges', 'Retrovisores', 'Manoplas']
    },
    vestuario: {
        title: 'Vestuário',
        allowedCategories: ['Vestuário', 'Jaquetas', 'Capacetes', 'Luvas', 'Botas', 'Camisetas']
    },
    eletrica: {
        title: 'Elétrica & Iluminação',
        allowedCategories: ['Iluminação']
    }
};

/**
 * Counts how many products fall under each macro-category key in CATEGORY_MAP
 * (excluding 'todos', which by definition covers everything). Used to hide menu
 * links / home cards for a macro-category with zero published products instead
 * of sending shoppers to a permanently empty "0 produtos encontrados" page.
 */
export const computeCategoryCounts = (products) => {
    const counts = {};
    for (const key of Object.keys(CATEGORY_MAP)) {
        if (key === 'todos') continue;
        const allowed = CATEGORY_MAP[key].allowedCategories || [];
        counts[key] = products.filter((p) => allowed.includes(p.category)).length;
    }
    return counts;
};
