import React from 'react';

// A soft red-gradient line instead of a flat border between homepage sections —
// fades in from transparent on both ends rather than a hard-edged rule.
const SectionDivider = () => (
    <div className="container mx-auto px-4">
        <div className="section-divider" aria-hidden="true" />
    </div>
);

export default SectionDivider;
