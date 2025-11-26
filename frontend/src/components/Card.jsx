// frontend/src/components/Card.jsx
import React from "react";
import PropTypes from "prop-types";

/**
 * Card Component - Flexible container for grouping related content
 * 
 * @param {string} variant - Card style variant (default|primary|info|muted|elevated|outlined|interactive)
 * @param {string} title - Optional card title
 * @param {ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 * @param {boolean} interactive - Enable hover/focus states (deprecated, use variant="interactive")
 * @param {function} onClick - Click handler (makes card interactive)
 * @param {string} as - HTML element to render as (default: 'div')
 */
export default function Card({
  variant = "default",
  title,
  children,
  className = "",
  interactive = false,
  onClick,
  as: Component = "div",
  ...props
}) {
  // Determine if card should be interactive
  const isInteractive = interactive || onClick || variant === "interactive";

  // Build variant classes
  const variantClasses = {
    default: "bg-white shadow-md",
    primary: "bg-white shadow-md card--primary",
    info: "bg-white shadow-md card--info",
    muted: "card--muted shadow-sm",
    elevated: "bg-white shadow-lg",
    outlined: "bg-white border-2 shadow-sm",
    interactive: "bg-white shadow-md card--interactive",
  };

  const baseClasses = "rounded-2xl p-6";
  const selectedVariant = variantClasses[variant] || variantClasses.default;
  const interactiveClass = isInteractive && variant !== "interactive" ? "card--interactive" : "";

  const finalClassName = `${baseClasses} ${selectedVariant} ${interactiveClass} ${className}`.trim();

  return (
    <Component
      className={finalClassName}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {title && (
        <h3 className="text-lg font-heading font-semibold text-gray-800 mb-3">
          {title}
        </h3>
      )}
      {children}
    </Component>
  );
}

Card.propTypes = {
  variant: PropTypes.oneOf([
    "default",
    "primary",
    "info",
    "muted",
    "elevated",
    "outlined",
    "interactive"
  ]),
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  as: PropTypes.elementType,
};
