import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/ToastProvider';
import { getProductReviews, canReviewProduct, createReview } from '../services/reviewService';

const StarPicker = ({ value, onChange }) => (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Sua nota">
        {[1, 2, 3, 4, 5].map((n) => (
            <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} de 5 estrelas`}
                onClick={() => onChange(n)}
                className="p-1"
            >
                <Star className={`w-7 h-7 ${n <= value ? 'text-harley-orange fill-harley-orange' : 'text-gray-600'}`} />
            </button>
        ))}
    </div>
);

const ReviewCard = ({ review }) => (
    <div className="border-b border-gray-800 py-5 last:border-0">
        <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white">{review.userName}</span>
            <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
            </span>
        </div>
        <div className="flex items-center gap-0.5 mb-2" role="img" aria-label={`${review.rating} de 5 estrelas`}>
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-harley-orange fill-harley-orange' : 'text-gray-700'}`} aria-hidden="true" />
            ))}
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
    </div>
);

/**
 * Real customer reviews for a product — no moderation queue yet (reviews are
 * gated by a verified purchase server-side, in reviewService.js, so the main
 * spam vector is already closed off).
 */
const ProductReviews = ({ productId }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const [data, setData] = useState({ reviews: [], average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [eligible, setEligible] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        getProductReviews(productId)
            .then(setData)
            .catch((error) => console.error('Error loading reviews:', error))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        if (currentUser) {
            canReviewProduct(productId).then(setEligible);
        } else {
            setEligible(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (comment.trim().length < 10) {
            showToast('Escreva um pouco mais sobre sua experiência (mínimo 10 caracteres).', { type: 'warning' });
            return;
        }
        setSubmitting(true);
        try {
            await createReview(productId, { rating, comment: comment.trim() });
            showToast('Avaliação publicada — obrigado!', { type: 'success' });
            setComment('');
            setEligible(false);
            load();
        } catch (error) {
            showToast(error.response?.data?.error || 'Erro ao publicar avaliação.', { type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="mt-16 pt-10 border-t border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-display font-bold text-white uppercase">Avaliações</h2>
                {data.count > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5" role="img" aria-label={`Nota média ${data.average} de 5`}>
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < Math.round(data.average) ? 'text-harley-orange fill-harley-orange' : 'text-gray-700'}`} aria-hidden="true" />
                            ))}
                        </div>
                        <span className="text-gray-400 text-sm">{data.average} · {data.count} avaliaç{data.count === 1 ? 'ão' : 'ões'}</span>
                    </div>
                )}
            </div>

            {eligible && (
                <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                    <p className="text-white font-bold mb-3">Comprou este produto? Deixe sua avaliação</p>
                    <div className="mb-4">
                        <StarPicker value={rating} onChange={setRating} />
                    </div>
                    <label htmlFor="review-comment" className="sr-only">Seu comentário</label>
                    <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Conte como foi sua experiência com o produto..."
                        rows={3}
                        maxLength={1000}
                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none resize-none"
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-3 bg-sick-red text-white px-6 py-2.5 rounded font-bold uppercase text-sm hover:bg-red-800 transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Publicando...' : 'Publicar Avaliação'}
                    </button>
                </form>
            )}

            {data.reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma avaliação ainda — seja o primeiro a comprar e avaliar este produto.</p>
            ) : (
                <div>
                    {data.reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductReviews;
