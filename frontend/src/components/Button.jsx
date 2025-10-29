// frontend/src/components/Button.jsx
import React from "react";
import clsx from "classnames";

export default function Button({ children, variant = "primary", className = "", ...props }) {
    const base = "py-2 px-4 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const styles = {
        primary: "bg-primary hover:bg-primary-600 active:bg-primary-700 text-text-inverse focus:ring-primary-400",
        secondary: "bg-accent hover:bg-accent-500 active:bg-accent-600 text-text-primary focus:ring-accent-400",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-400",
        ghost: "bg-transparent text-primary hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-400",
        danger: "bg-error hover:bg-error-600 active:bg-error-700 text-text-inverse focus:ring-error-400",
    };

    return (
        <button className={clsx(base, styles[variant], className)} {...props}>
            {children}
        </button>
    );
}
