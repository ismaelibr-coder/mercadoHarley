import React from 'react';
import { Star } from 'lucide-react';

const SIZES = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
};

/**
 * Star rating display. Was reimplemented with slightly different sizes/colors
 * in ProductPage, CategoryPage and ProductList — this is the single source of
 * truth going forward.
 *
 * Renders nothing unless `reviewCount` is a real positive number. There is no
 * review system yet — every caller currently passes only `product.rating`,
 * which is a fixed admin-set default (5) with no customer feedback behind it.
 * Showing 5 fabricated stars with no review count is worse for trust than
 * showing nothing: a real shopper reads it as a fake rating on a
 * zero-review product. Once real reviews exist, pass reviewCount to render.
 */
const RatingStars = ({ rating = 0, size = 'md', reviewCount, className = '' }) => {
    const sizeClass = SIZES[size] || SIZES.md;

    if (!(typeof reviewCount === 'number' && reviewCount > 0)) {
        return null;
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} de 5 estrelas`}>
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`${sizeClass} ${i < rating ? 'text-harley-orange fill-harley-orange' : 'text-gray-600'}`}
                        aria-hidden="true"
                    />
                ))}
            </div>
            {typeof reviewCount === 'number' && (
                <span className="text-gray-400 text-sm">({reviewCount} avaliações)</span>
            )}
        </div>
    );
};

export default RatingStars;
