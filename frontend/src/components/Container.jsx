// frontend/src/components/Container.jsx
import React from "react";
import PropTypes from "prop-types";

/**
 * Container Component - Provides consistent page section layout and max-width constraints
 * 
 * @param {number} level - Container hierarchy level (1 = widest, 2 = narrower)
 * @param {boolean} padded - Add visual padding/background styling
 * @param {boolean} panel - Apply panel styling (background + shadow)
 * @param {ReactNode} children - Container content
 * @param {string} className - Additional CSS classes
 * @param {string} as - HTML element to render as (default: 'div')
 */
export default function Container({
  level = 1,
  padded = false,
  panel = false,
  children,
  className = "",
  as: Component = "div",
  ...props
}) {
  // Determine base container class
  const levelClasses = {
    1: "container-level-1",
    2: "container-level-2",
  };

  const baseClass = levelClasses[level] || levelClasses[1];
  const paddedClass = padded ? "container--padded" : "";
  const panelClass = panel ? "container-panel" : "";
  
  const finalClassName = `${baseClass} ${paddedClass} ${panelClass} ${className}`.trim();

  return (
    <Component className={finalClassName} {...props}>
      {children}
    </Component>
  );
}

Container.propTypes = {
  level: PropTypes.oneOf([1, 2]),
  padded: PropTypes.bool,
  panel: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  as: PropTypes.elementType,
};
