// frontend/src/components/Card.jsx
import React from "react";

export default function Card({ title, children, className = "" }) {
    return (
        <div className={`bg-white rounded-2xl shadow-md p-6 ${className}`}>
            {title && <h3 className="text-lg font-heading text-gray-800 mb-3">{title}</h3>}
            <div>{children}</div>
        </div>
    );
}
