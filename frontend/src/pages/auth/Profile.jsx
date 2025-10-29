import { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Container from "../../components/Container";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import ErrorMessage, { FieldError } from "../../components/ErrorMessage";
import api from "../../api/axios";

export default function Profile() {
    const { user: clerkUser } = useUser();
    const [formData, setFormData] = useState({
        name: clerkUser?.fullName || "",
        email: clerkUser?.primaryEmailAddress?.emailAddress || "",
        bio: "",
        location: "",
        phone: ""
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    // Deletion UI state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const { signOut } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear errors when user starts typing
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            // Use direct API call for profile update
            await api.put("/api/users/me", formData);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            console.error("Profile update error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        handleSubmit(new Event('submit'));
    };

    const handleDeleteAccount = async (e) => {
        e?.preventDefault();
        setError(null);
        setDeleting(true);

        try {
            // Delete request with body via axios
            await api.delete('/api/users/delete', { data: { password: deletePassword } });

            // Clear sensitive state and log out via Clerk
            sessionStorage.setItem("logoutMessage", "Your account deletion request was received. You have been logged out.");
            signOut();
        } catch (err) {
            console.error('Account deletion error:', err);
            setError(err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setDeletePassword("");
        }
    };

    return (
        <Container level={2} className="max-w-5xl mx-auto p-6">
            <h2 className="text-2xl font-heading mb-4">My Profile</h2>

            {/* Error display */}
            {error && (
                <ErrorMessage
                    error={error}
                    onRetry={handleRetry}
                    onDismiss={() => setError(null)}
                    className="mb-4"
                />
            )}

            {/* Success message */}
            {success && (
                <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4">
                    <p className="text-sm text-green-800">
                        Profile updated successfully!
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card title="Avatar">
                        <div className="flex items-center flex-col">
                            <div className="w-32 h-32 rounded-full bg-neutral-200 mb-4 overflow-hidden">
                                {clerkUser?.imageUrl ? (
                                    <img
                                        src={clerkUser.imageUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">
                                        {formData.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            <Button variant="secondary" disabled>
                                Upload Photo
                            </Button>
                        </div>
                    </Card>

                    <Card title="Danger Zone" className="mt-6">
                        <div className="p-4">
                            <p className="text-sm text-gray-700 mb-4">Deleting your account will permanently remove your personal data after a 30-day grace period. This action is irreversible after that period.</p>
                            <div className="flex items-center justify-end">
                                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Modal: Confirm deletion */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-2">Confirm Account Deletion</h3>
                                <p className="text-sm text-gray-700 mb-4">This will schedule your account for permanent deletion in 30 days. You will be logged out immediately. To confirm, enter your password below.</p>

                                <InputField
                                    label="Password"
                                    name="deletePassword"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                />

                                <div className="mt-4 flex justify-end space-x-2">
                                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                                    <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
                                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2">
                    <Card title="Basic Information">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputField
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <FieldError error={error} fieldName="name" />
                                </div>
                                <div>
                                    <InputField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <FieldError error={error} fieldName="email" />
                                </div>
                                <div>
                                    <InputField
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    <FieldError error={error} fieldName="phone" />
                                </div>
                                <div>
                                    <InputField
                                        label="Location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                    <FieldError error={error} fieldName="location" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Tell us about yourself..."
                                />
                                <FieldError error={error} fieldName="bio" />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </Container>
    );
}

