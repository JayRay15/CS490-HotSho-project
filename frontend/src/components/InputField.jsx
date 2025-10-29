// frontend/src/components/InputField.jsx
import React from "react";
import clsx from "classnames";

export default function InputField({
    label,
    id,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    helperText,
    required,
    disabled,
    className = "",
    ...props
}) {
    const inputClasses = clsx(
        "w-full px-3 py-2 rounded-lg border transition-colors duration-200",
        "placeholder-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-offset-0",
        disabled && "bg-gray-50 cursor-not-allowed",
        error
            ? "border-error focus:border-error focus:ring-error/30 text-error"
            : "border-gray-300 focus:border-primary focus:ring-primary/30 text-gray-900",
        className
    );

    return (
        <div className="block">
            {label && (
                <label htmlFor={id} className="block mb-1.5">
                    <span className="text-sm font-medium text-gray-700">
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </span>
                </label>
            )}
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={inputClasses}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
                    {...props}
                />
            </div>
            {(error || helperText) && (
                <div
                    id={error ? `${id}-error` : `${id}-helper`}
                    className={clsx(
                        "mt-1.5 text-sm",
                        error ? "text-error" : "text-gray-500"
                    )}
                >
                    {error || helperText}
                </div>
            )}
        </div>
    );
}
