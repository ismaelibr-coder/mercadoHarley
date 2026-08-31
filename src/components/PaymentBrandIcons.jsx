import React from 'react';

// Simplified, own-drawn marks (not traced from any brand's official vector
// asset) — recognizable at footer size without hotlinking logos from a
// third-party CDN we don't control the reliability of. Visa/Mastercard/Elo
// are the networks Mercado Pago's standard Brazil checkout routes by default;
// PIX and Boleto aren't "flags" in the same sense, so they stay as text badges.
const badgeBase = 'h-9 px-2 rounded bg-white flex items-center justify-center shadow-sm';

export const VisaMark = () => (
    <div className={badgeBase} aria-label="Visa" role="img">
        <span className="font-black italic text-[#1A1F71] text-sm tracking-tight">VISA</span>
    </div>
);

export const MastercardMark = () => (
    <div className={badgeBase} aria-label="Mastercard" role="img">
        <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true">
            <circle cx="13" cy="10" r="9" fill="#EB001B" />
            <circle cx="21" cy="10" r="9" fill="#F79E1B" />
            <path d="M17 3.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13Z" fill="#FF5F00" />
        </svg>
    </div>
);

export const EloMark = () => (
    <div className={badgeBase} aria-label="Elo" role="img">
        <svg width="30" height="18" viewBox="0 0 30 18" aria-hidden="true">
            <circle cx="9" cy="9" r="8" fill="none" stroke="#FFCB05" strokeWidth="2" />
            <circle cx="15" cy="9" r="8" fill="none" stroke="#00A4E0" strokeWidth="2" />
            <circle cx="21" cy="9" r="8" fill="none" stroke="#EF4123" strokeWidth="2" />
        </svg>
    </div>
);

export const HipercardMark = () => (
    <div className={badgeBase} aria-label="Hipercard" role="img">
        <span className="font-black italic text-[#AB1F23] text-sm tracking-tight">hiper</span>
    </div>
);

export const AmexMark = () => (
    <div className={`${badgeBase} !bg-[#006FCF] px-2`} aria-label="American Express" role="img">
        <span className="font-black text-white text-[10px] tracking-tight leading-tight text-center">AMERICAN<br />EXPRESS</span>
    </div>
);

export const DinersMark = () => (
    <div className={badgeBase} aria-label="Diners Club" role="img">
        <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
            <circle cx="15" cy="10" r="9" fill="#0079BE" />
            <path d="M15 3.5a6.5 6.5 0 0 0 0 13 6.5 6.5 0 0 0 0-13Zm-1 2.2v8.6a4.9 4.9 0 0 1 0-8.6Zm2 0a4.9 4.9 0 0 1 0 8.6V5.7Z" fill="#fff" />
        </svg>
    </div>
);

// Text-only badges for methods that aren't card networks (no "flag" to draw).
const TextBadge = ({ children }) => (
    <span className="bg-black border border-gray-800 rounded px-3 h-9 flex items-center text-xs font-bold uppercase text-gray-400">
        {children}
    </span>
);

const PaymentBrandIcons = () => (
    <div className="flex items-center gap-2 flex-wrap">
        <VisaMark />
        <MastercardMark />
        <EloMark />
        <HipercardMark />
        <AmexMark />
        <DinersMark />
        <TextBadge>PIX</TextBadge>
        <TextBadge>Transferência</TextBadge>
        <TextBadge>Boleto</TextBadge>
    </div>
);

export default PaymentBrandIcons;
