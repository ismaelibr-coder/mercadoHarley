import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
    // Replace with your actual phone number
    const phoneNumber = "5511999999999";
    const message = "Olá! Gostaria de saber mais sobre as peças da Mercado Harley.";

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
            aria-label="Falar no WhatsApp"
        >
            <MessageCircle className="w-8 h-8 fill-current" />
            <span className="absolute right-full mr-3 bg-white text-black px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                Fale Conosco
            </span>
        </a>
    );
};

export default WhatsAppButton;
