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
 * Given a product's raw `category` field (e.g. "Peças", "Escapamentos" — the
 * display-name strings actually stored on products), returns the matching
 * macro-category slug (e.g. "pecas") that routing/CATEGORY_MAP expects —
 * NOT the display name itself. Building a `/category/${...}` link straight
 * from a product's category field (or an admin form's raw category name)
 * produces a URL nothing matches, since routes are keyed by slug, not by
 * display name — found as a real, live bug in ProductPage.jsx's breadcrumb
 * (linked to /category/Peças, which 0-matches; the working link is
 * /category/pecas). Returns null if no macro-category claims it.
 */
export const getCategorySlug = (rawCategory) => {
    if (!rawCategory) return null;
    const entry = Object.entries(CATEGORY_MAP).find(
        ([key, { allowedCategories }]) => key !== 'todos' && allowedCategories?.includes(rawCategory)
    );
    return entry?.[0] || null;
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
