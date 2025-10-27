// frontend/src/components/Button.jsx
import React from "react";
import clsx from "classnames";

export default function Button({ children, variant = "primary", className = "", ...props }) {
    const base = "py-2 px-4 rounded-lg font-medium transition focus:outline-none";
    const styles = {
        primary: "bg-accent text-white hover:brightness-95",
        secondary: "bg-white text-primary border border-primary hover:bg-primary/5",
        ghost: "bg-transparent text-primary hover:text-accent",
    };

    return (
        <button className={clsx(base, styles[variant], className)} {...props}>
            {children}
        </button>
    );
}
