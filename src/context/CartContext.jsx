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

    const cartTotal = cartItems.reduce((total, item) => {
        // Handle price as both number and string
        const price = typeof item.price === 'number'
            ? item.price
            : parseFloat(item.price.replace('R$ ', '').replace('.', '').replace(',', '.'));
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
