// frontend/src/components/Button.jsx
import { jsxDEV } from "react/jsx-dev-runtime";
import React from 'react';
import clsx from "classnames";
import LoadingSpinner from "./LoadingSpinner";

export default function Button({
    children,
    variant = "primary",
    size = "medium",
    isLoading = false,
    disabled = false,
    className = "",
    ...props
}) {
    const sizes = {
        small: "py-2 px-3 text-sm",
        medium: "py-3 px-5 text-base sm:py-2 sm:px-4 md:py-3 md:px-5",
        large: "py-3 px-6 text-lg"
    };

    const base = "rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-11 hover:shadow-md";
    const styles = {
        primary: "bg-primary hover:bg-primary-600 active:bg-primary-700 text-text-inverse focus:ring-primary-400 disabled:bg-primary-300",
        secondary: "bg-accent hover:bg-accent-500 active:bg-accent-600 text-text-primary focus:ring-accent-400 disabled:bg-accent-300",
        tertiary: "bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 focus:ring-gray-400 disabled:bg-gray-100",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-400 disabled:border-primary-200 disabled:text-primary-200",
        ghost: "bg-transparent text-primary hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-400 disabled:text-primary-200",
        danger: "bg-error hover:bg-error-600 active:bg-error-700 text-text-inverse focus:ring-error-400 disabled:bg-error-300",
    };

    return (
        <button
            className={clsx(
                base,
                styles[variant],
                sizes[size],
                isLoading && "relative !text-transparent",
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {children}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner size={size === "small" ? "sm" : size === "large" ? "lg" : "md"} />
                </div>
            )}
        </button>
    );
}
