// frontend/src/components/Card.jsx
import React from "react";
import clsx from "classnames";

export default function Card({
    title,
    children,
    className = "",
    variant = "default", // default | primary | info | muted
    interactive = false,
    onClick = undefined,
    ...props
}) {
    const variantClass = {
        default: "",
        primary: "card--primary",
        info: "card--info",
        muted: "card--muted",
    }[variant];

    const interactiveClass = interactive ? "card--interactive" : "";

    return (
        <div
            role={interactive ? (onClick ? "button" : "group") : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? onClick : undefined}
            onKeyDown={interactive && onClick ? (e) => {
                // Activate on Enter or Space for accessibility
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(e);
                }
            } : undefined}
            className={clsx("card", variantClass, interactiveClass, className)}
            {...props}
        >
            {title && (
                <h3 className="text-lg font-heading font-semibold text-gray-800 mb-3">
                    {title}
                </h3>
            )}
            <div>{children}</div>
        </div>
    );
}
