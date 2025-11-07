import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import ErrorMessage, { FieldError } from "../../components/ErrorMessage";
import api, { getErrorMessage, retryRequest } from "../../api/axios";
import { addEmployment, updateEmployment, deleteEmployment } from "../../api/profile";

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
    
    // Employment state
    const [employmentList, setEmploymentList] = useState([]);
    const [showEmploymentForm, setShowEmploymentForm] = useState(false);
    const [editingEmployment, setEditingEmployment] = useState(null);
    const [employmentForm, setEmploymentForm] = useState({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrentPosition: false,
        description: '',
        salary: ''
    });
    const [employmentLoading, setEmploymentLoading] = useState(false);
    const [employmentError, setEmploymentError] = useState(null);
    
    // Deletion UI state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const { signOut } = useAuth();

    // Fetch user profile data including employment
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await retryRequest(() => api.get('/api/users/me'));
                if (response.data?.data) {
                    const userData = response.data.data;
                    setFormData({
                        name: userData.name || clerkUser?.fullName || "",
                        email: userData.email || clerkUser?.primaryEmailAddress?.emailAddress || "",
                        bio: userData.bio || "",
                        location: userData.location || "",
                        phone: userData.phone || ""
                    });
                    setEmploymentList(userData.employment || []);
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            }
        };
        fetchProfile();
    }, [clerkUser]);

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
            // Use retry mechanism for network resilience
            await retryRequest(async () => {
                return await api.put("/api/users/me", formData);
            });

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

            // Close modal immediately
            setShowDeleteModal(false);
            setDeletePassword("");
            
            // Clear sensitive state and log out via Clerk
            sessionStorage.setItem("logoutMessage", "Your account has been permanently deleted. You have been logged out.");
            
            // Sign out from Clerk - await to ensure session is cleared
            await signOut();
            
        } catch (err) {
            console.error('Account deletion error:', err);
            setError(err);
            setDeleting(false);
            setShowDeleteModal(false);
            setDeletePassword("");
        }
    };

    // Employment handlers
    const handleEmploymentChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEmploymentForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddEmployment = () => {
        setEditingEmployment(null);
        setEmploymentForm({
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            isCurrentPosition: false,
            description: '',
            salary: ''
        });
        setShowEmploymentForm(true);
        setEmploymentError(null);
    };

    const handleEditEmployment = (employment) => {
        setEditingEmployment(employment);
        setEmploymentForm({
            company: employment.company || '',
            position: employment.position || '',
            startDate: employment.startDate ? new Date(employment.startDate).toISOString().split('T')[0] : '',
            endDate: employment.endDate ? new Date(employment.endDate).toISOString().split('T')[0] : '',
            isCurrentPosition: employment.isCurrentPosition || false,
            description: employment.description || '',
            salary: employment.salary || ''
        });
        setShowEmploymentForm(true);
        setEmploymentError(null);
    };

    const handleCancelEmploymentForm = () => {
        setShowEmploymentForm(false);
        setEditingEmployment(null);
        setEmploymentForm({
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            isCurrentPosition: false,
            description: '',
            salary: ''
        });
        setEmploymentError(null);
    };

    const handleSaveEmployment = async (e) => {
        e.preventDefault();
        setEmploymentLoading(true);
        setEmploymentError(null);

        try {
            // Prepare data - convert empty strings to undefined for optional fields
            const data = {
                company: employmentForm.company,
                position: employmentForm.position,
                startDate: employmentForm.startDate,
                endDate: employmentForm.endDate || undefined,
                isCurrentPosition: employmentForm.isCurrentPosition,
                description: employmentForm.description || undefined,
                salary: employmentForm.salary ? parseFloat(employmentForm.salary) : undefined
            };

            if (editingEmployment) {
                // Update existing
                const response = await updateEmployment(editingEmployment._id, data);
                if (response.success && response.data) {
                    setEmploymentList(response.data);
                }
            } else {
                // Add new
                const response = await addEmployment(data);
                if (response.success && response.data) {
                    setEmploymentList(response.data);
                }
            }

            handleCancelEmploymentForm();
        } catch (err) {
            console.error("Error saving employment:", err);
            setEmploymentError(err);
        } finally {
            setEmploymentLoading(false);
        }
    };

    const handleDeleteEmployment = async (employmentId) => {
        if (!window.confirm("Are you sure you want to delete this employment record?")) {
            return;
        }

        try {
            await deleteEmployment(employmentId);
            setEmploymentList(prev => prev.filter(emp => emp._id !== employmentId));
        } catch (err) {
            console.error("Error deleting employment:", err);
            setEmploymentError(err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
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
                            <p className="text-sm text-gray-700 mb-4"><strong>Warning:</strong> Deleting your account will <strong>immediately and permanently</strong> remove all your personal data. This action cannot be undone.</p>
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
                                <p className="text-sm text-gray-700 mb-4"><strong>Warning:</strong> This will <strong>immediately and permanently delete</strong> your account and all associated data. This action cannot be undone. To confirm, enter your password below.</p>

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

            {/* Employment History Section - Full Width */}
            <div className="mt-6">
                <Card title="Employment History">
                    {employmentError && (
                        <ErrorMessage
                            error={employmentError}
                            onDismiss={() => setEmploymentError(null)}
                            className="mb-4"
                        />
                    )}

                    {/* Employment List */}
                    {!showEmploymentForm && (
                        <>
                            <div className="mb-4">
                                <Button onClick={handleAddEmployment}>
                                    + Add Employment
                                </Button>
                            </div>

                            {employmentList.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="mb-2">No employment history added yet</p>
                                    <p className="text-sm">
                                        Add your current position with salary to enable salary comparison features
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {employmentList.map((employment) => (
                                        <div
                                            key={employment._id}
                                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {employment.position}
                                                        </h3>
                                                        {employment.isCurrentPosition && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 mb-2">{employment.company}</p>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {new Date(employment.startDate).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'short' 
                                                        })}
                                                        {' - '}
                                                        {employment.endDate 
                                                            ? new Date(employment.endDate).toLocaleDateString('en-US', { 
                                                                year: 'numeric', 
                                                                month: 'short' 
                                                            })
                                                            : 'Present'
                                                        }
                                                    </p>
                                                    {employment.salary && (
                                                        <p className="text-sm font-medium text-blue-600 mb-2">
                                                            💰 ${employment.salary.toLocaleString()} / year
                                                        </p>
                                                    )}
                                                    {employment.description && (
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            {employment.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleEditEmployment(employment)}
                                                        className="text-sm"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => handleDeleteEmployment(employment._id)}
                                                        className="text-sm"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Employment Form */}
                    {showEmploymentForm && (
                        <form onSubmit={handleSaveEmployment} className="space-y-4">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingEmployment ? 'Edit Employment' : 'Add Employment'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputField
                                        label="Company *"
                                        name="company"
                                        value={employmentForm.company}
                                        onChange={handleEmploymentChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="Position *"
                                        name="position"
                                        value={employmentForm.position}
                                        onChange={handleEmploymentChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="Start Date *"
                                        name="startDate"
                                        type="date"
                                        value={employmentForm.startDate}
                                        onChange={handleEmploymentChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="End Date"
                                        name="endDate"
                                        type="date"
                                        value={employmentForm.endDate}
                                        onChange={handleEmploymentChange}
                                        disabled={employmentForm.isCurrentPosition}
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="Annual Salary (USD)"
                                        name="salary"
                                        type="number"
                                        min="0"
                                        max="10000000"
                                        step="1000"
                                        value={employmentForm.salary}
                                        onChange={handleEmploymentChange}
                                        placeholder="e.g., 75000"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Add your current salary to see personalized comparisons in Salary Research
                                    </p>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isCurrentPosition"
                                            checked={employmentForm.isCurrentPosition}
                                            onChange={handleEmploymentChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            This is my current position
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={employmentForm.description}
                                    onChange={handleEmploymentChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe your role and responsibilities..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCancelEmploymentForm}
                                    disabled={employmentLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={employmentLoading}
                                >
                                    {employmentLoading ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}

