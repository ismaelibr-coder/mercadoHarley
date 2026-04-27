import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [cartItems, setCartItems] = useState(() => {
        // Get cart specific to current user
        const userId = currentUser?.uid || 'guest';
        const savedCart = localStorage.getItem(`mercado-harley-cart-${userId}`);
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        const userId = currentUser?.uid || 'guest';
        localStorage.setItem(`mercado-harley-cart-${userId}`, JSON.stringify(cartItems));
    }, [cartItems, currentUser]);

    // Clear cart and load user-specific cart when user changes
    useEffect(() => {
        const userId = currentUser?.uid || 'guest';
        const savedCart = localStorage.getItem(`mercado-harley-cart-${userId}`);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
    }, [currentUser?.uid]);

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);

            // Check stock availability
            const productStock = product.stock || 0;

            if (existingItem) {
                // Check if we can add one more
                if (existingItem.quantity >= productStock) {
                    alert(`Estoque insuficiente. Apenas ${productStock} unidades disponíveis.`);
                    return prevItems;
                }
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            // Check if product has stock
            if (productStock < 1) {
                alert('Produto esgotado.');
                return prevItems;
            }

            return [...prevItems, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.id === productId) {
                    // Check stock limit
                    const productStock = item.stock || 0;
                    if (newQuantity > productStock) {
                        alert(`Estoque insuficiente. Apenas ${productStock} unidades disponíveis.`);
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const parsePrice = (raw) => {
        if (typeof raw === 'number') return raw;
        if (!raw || typeof raw !== 'string') return 0;

        // Remove currency symbol and trim
        let s = raw.replace('R$','').trim();

        // If string contains both '.' and ',' assume PT-BR format: '1.234,56'
        if (s.includes('.') && s.includes(',')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else if (s.includes(',')) {
            // If only comma present, it's decimal separator: '1234,56'
            s = s.replace(',', '.');
        }

        // Remove any non numeric (except dot and minus)
        s = s.replace(/[^0-9.-]/g, '');

        return parseFloat(s) || 0;
    };

    const cartTotal = cartItems.reduce((total, item) => {
        const price = parsePrice(item.price);
        return total + price * item.quantity;
    }, 0);

    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
