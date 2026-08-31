import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

// Two honest trust badges — not a fabricated third-party certification.
// "Site Seguro Google" (as literally requested) isn't something this store
// is actually enrolled in — there's no real Google merchant-verification
// program behind that phrase — so displaying it would be exactly the kind
// of unearned trust seal this project has avoided all session (see the
// footer's existing "no unearned verified-secure-site seal" note). These two
// instead state only what's true and already verifiable: the site runs over
// HTTPS/SSL (same fact the footer already states in text, just given the
// visual "selo" treatment asked for), and it takes personal data protection
// seriously — a genuine, checkable claim for any Brazilian store, not a
// borrowed brand's name.
const seals = [
    {
        icon: Lock,
        title: 'Site Seguro',
        subtitle: 'Criptografia SSL'
    },
    {
        icon: ShieldCheck,
        title: 'Dados Protegidos',
        subtitle: 'Conforme a LGPD'
    }
];

const SecuritySeals = () => (
    <div className="flex items-center gap-3 flex-wrap">
        {seals.map(({ icon: Icon, title, subtitle }) => (
            <div
                key={title}
                className="flex items-center gap-2 bg-black border border-gray-800 rounded-lg px-3 h-9"
            >
                <Icon className="w-4 h-4 text-harley-orange flex-none" aria-hidden="true" />
                <div className="leading-tight">
                    <p className="text-[10px] font-bold uppercase text-white">{title}</p>
                    <p className="text-[9px] text-gray-500">{subtitle}</p>
                </div>
            </div>
        ))}
    </div>
);

export default SecuritySeals;
