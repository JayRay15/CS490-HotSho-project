// frontend/src/components/InputField.jsx
import React from "react";
import clsx from "classnames";

export default function InputField({
    label,
    id,
    type = "text",
    as = "input",
    value,
    onChange,
    placeholder,
    error,
    helperText,
    required,
    disabled,
    className = "",
    maxLength,
    rows,
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

    const Component = as === "textarea" ? "textarea" : "input";
    const componentProps = {
        id,
        value,
        onChange,
        placeholder,
        disabled,
        required,
        className: inputClasses,
        "aria-invalid": error ? "true" : "false",
        "aria-describedby": error ? `${id}-error` : helperText ? `${id}-helper` : undefined,
        maxLength,
        ...props
    };

    if (as === "textarea") {
        componentProps.rows = rows || 4;
    } else {
        componentProps.type = type;
    }

    const currentLength = value?.length || 0;
    const showCharCount = maxLength && as === "textarea";

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
                <Component {...componentProps} />
            </div>
            {showCharCount && (
                <div className="mt-1 text-xs text-right text-gray-500">
                    {currentLength} / {maxLength} characters
                </div>
            )}
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
