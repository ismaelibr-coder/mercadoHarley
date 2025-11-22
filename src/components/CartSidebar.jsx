import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const CartSidebar = () => {
    const {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        removeFromCart,
        updateQuantity,
        cartTotal
    } = useCart();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            ></div>

            {/* Sidebar */}
            <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
                <div className="h-full w-full bg-gray-900 shadow-xl flex flex-col border-l border-gray-800 transform transition-transform duration-300 ease-in-out">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-black">
                        <h2 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-harley-orange" />
                            Seu Carrinho
                        </h2>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {cartItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <ShoppingBag className="w-16 h-16 text-gray-700" />
                                <p className="text-gray-400 text-lg">Seu carrinho está vazio.</p>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="text-harley-orange font-bold hover:underline"
                                >
                                    Continuar Comprando
                                </button>
                            </div>
                        ) : (
                            cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-black p-4 rounded-lg border border-gray-800">
                                    <div className="w-20 h-20 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-white font-bold text-sm line-clamp-2 mb-1">
                                                {item.name}
                                            </h3>
                                            <p className="text-harley-orange font-bold text-sm">
                                                {item.price}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 bg-gray-800 rounded p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:text-harley-orange transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:text-harley-orange transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {cartItems.length > 0 && (
                        <div className="p-6 bg-black border-t border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="text-2xl font-bold text-white">
                                    R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Link
                                to="/checkout"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full bg-harley-orange text-white py-4 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors text-center"
                            >
                                Finalizar Compra
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;
