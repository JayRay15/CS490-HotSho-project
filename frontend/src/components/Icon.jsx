import React from 'react';
import * as LucideIcons from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Icon - unified icon wrapper using lucide-react
 * Props:
 *  - name: string name of the lucide icon (e.g. 'Menu', 'X', 'Edit3') OR
 *  - as: a React component to render (overrides name)
 *  - size: one of 'xs'|'sm'|'md'|'lg'|'xl' (maps to tailwind sizing)
 *  - className: extra classes (color should be set via text-... to use currentColor)
 *  - label: optional visible text label (shown to the right)
 */
export default function Icon({ name, as: AsComponent, size = 'md', className = '', label = '', ...props }) {
    const sizeMap = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    let Comp = null;
    if (AsComponent) Comp = AsComponent;
    else if (name && LucideIcons[name]) Comp = LucideIcons[name];
    else Comp = () => null;

    const icon = (
        <Comp
            className={`${sizeMap[size] || sizeMap.md} ${className}`.trim()}
            aria-hidden={label ? undefined : true}
            {...props}
        />
    );

    if (label) {
        return (
            <span className="inline-flex items-center gap-2">
                {icon}
                <span className="text-sm">{label}</span>
            </span>
        );
    }

    return icon;
}

Icon.propTypes = {
    name: PropTypes.string,
    as: PropTypes.elementType,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    className: PropTypes.string,
    label: PropTypes.string
};
