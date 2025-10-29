import React from 'react';
import clsx from 'classnames';

// Container used for major page sections to establish visual hierarchy
// level: 1 (major) | 2 (sub-section)
export default function Container({ children, className = '', level = 1, padded = true, ...props }) {
    const base = 'mx-auto w-full';
    const levelClass = level === 1 ? 'container-level-1' : 'container-level-2';
    const paddedClass = padded ? 'container--padded' : '';

    return (
        <section className={clsx(base, levelClass, paddedClass, className)} {...props}>
            {children}
        </section>
    );
}
