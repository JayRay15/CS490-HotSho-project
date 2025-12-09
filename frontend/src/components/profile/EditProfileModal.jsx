import React from 'react';
import ErrorMessage from '../ErrorMessage';

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Real Estate'];
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Executive'];

export default function EditProfileModal({
    isOpen,
    onClose,
    onSave,
    formData,
    handleInputChange,
    bioCharCount,
    isSaving,
    error,
    onErrorDismiss
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
            onClick={(e) => {
                if (!isSaving) {
                    onClose();
                }
            }}
        >
            <div
                className="rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative border"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 border-b px-6 py-4 flex justify-between items-center z-10" style={{ backgroundColor: '#FFFFFF' }}>
                    <h3 className="text-2xl font-semibold" style={{ color: '#111827' }}>Edit Profile</h3>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: '#9CA3AF' }}
                        onMouseOver={(e) => !isSaving && (e.currentTarget.style.color = '#4B5563')}
                        onMouseOut={(e) => !isSaving && (e.currentTarget.style.color = '#9CA3AF')}
                        title={isSaving ? "Please wait while saving..." : "Close"}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <ErrorMessage
                            error={error}
                            onDismiss={onErrorDismiss}
                            className="mb-6"
                        />
                    )}

                    <form onSubmit={onSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="1234567890 or (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location (City, State)
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="New York, NY"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
                                Professional Headline <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="headline"
                                name="headline"
                                value={formData.headline}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Senior Software Engineer | Full Stack Developer"
                            />
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                                Bio / Summary
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Tell us about yourself, your expertise, and what you're looking for..."
                            />
                            <div className="mt-1 flex justify-between items-center">
                                <p className="text-xs text-gray-500">Optional</p>
                                <p className={`text-sm ${bioCharCount > 450 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                    {bioCharCount} / 500 characters
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                                    Industry <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="industry"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select an industry...</option>
                                    {INDUSTRIES.map(industry => (
                                        <option key={industry} value={industry}>{industry}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                                    Experience Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="experienceLevel"
                                    name="experienceLevel"
                                    value={formData.experienceLevel}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select experience level...</option>
                                    {EXPERIENCE_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t sticky bottom-0" style={{ backgroundColor: '#FFFFFF' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-6 py-2 border rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                                onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                                onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#777C6D' }}
                                onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#656A5C')}
                                onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#777C6D')}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
