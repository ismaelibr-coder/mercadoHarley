import { useEffect, useRef, useState } from 'react';

/**
 * Fires once, the first time the element scrolls into view, then disconnects —
 * used to trigger a fade-in-up entrance instead of replaying every time the
 * user scrolls back and forth over a section. No framer-motion needed; the
 * actual animation is a plain CSS class (see `animate-fade-in-up` in
 * tailwind.config.js) toggled by the boolean this returns.
 *
 * Usage: const [ref, isVisible] = useInViewport();
 *        <div ref={ref} className={isVisible ? 'animate-fade-in-up' : 'opacity-0'}>
 */
export const useInViewport = ({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        // Respect reduced-motion users by just showing content immediately,
        // rather than observing and animating in.
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            setIsVisible(true);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return [ref, isVisible];
};

export default useInViewport;
