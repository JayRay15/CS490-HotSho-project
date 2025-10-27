// frontend/src/components/InputField.jsx
import React from "react";

export default function InputField({ label, id, type = "text", value, onChange, placeholder }) {
    return (
        <label className="block">
            {label && <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
        </label>
    );
}
