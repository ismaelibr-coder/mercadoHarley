// Single source of truth for the backend base URL. Previously every service/
// component re-declared its own `import.meta.env.VITE_API_URL || '...'` fallback,
// and they'd drifted: most fell back to localhost:3001, but a few
// (FeaturedCarousel, orderService, productService) fell back to production
// (https://www.sickgrip.com.br) instead. If VITE_API_URL is ever missing from a
// build (CI, a new preview environment, a misconfigured deploy), that split
// silently sends some requests to production and others to localhost —
// products/orders would load fine while payments/shipping quietly failed, with
// no error pointing at the real cause. One fallback, chosen consistently.
const envUrl = import.meta.env.VITE_API_URL;
export const API_URL = (envUrl && envUrl.startsWith('http')) ? envUrl : 'http://localhost:3001';
