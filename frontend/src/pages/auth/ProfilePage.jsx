import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import ErrorMessage from "../../components/ErrorMessage";
import ProfilePictureUpload from "../../components/ProfilePictureUpload";

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Real Estate'];
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Executive'];

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    bio: '',
    industry: '',
    experienceLevel: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [bioCharCount, setBioCharCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!isSignedIn) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        setAuthToken(token);
        const response = await api.get('/api/users/me');
        const data = response.data.data;

        setUserData(data);

        const profileData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          headline: data.headline || '',
          bio: data.bio || '',
          industry: data.industry || '',
          experienceLevel: data.experienceLevel || ''
        };

        setFormData(profileData);
        setOriginalData(profileData);
        setBioCharCount(profileData.bio.length);
        setProfilePicture(data.picture || null);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      loadProfile();
    }
  }, [isSignedIn, getToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle bio character limit
    if (name === 'bio') {
      if (value.length > 500) return;
      setBioCharCount(value.length);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!formData.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!formData.email.includes('@')) {
      errors.push({ field: 'email', message: 'Email must be valid' });
    }

    // Phone validation (optional field, but if provided must be valid)
    if (formData.phone.trim()) {
      // Remove all non-digit characters for validation
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        errors.push({ field: 'phone', message: 'Phone number must be between 10-15 digits' });
      }
    }

    // Location validation (optional field, but if provided should have city and state)
    if (formData.location.trim()) {
      if (formData.location.length < 3) {
        errors.push({ field: 'location', message: 'Location must be at least 3 characters' });
      }
    }

    if (!formData.headline.trim()) {
      errors.push({ field: 'headline', message: 'Professional headline is required' });
    }

    if (!formData.industry) {
      errors.push({ field: 'industry', message: 'Industry is required' });
    }

    if (!formData.experienceLevel) {
      errors.push({ field: 'experienceLevel', message: 'Experience level is required' });
    }

    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError({
        customError: {
          errorCode: 2001,
          message: 'Please fix the following errors:',
          errors: validationErrors
        }
      });
      return;
    }

    setIsSaving(true);

    try {
      const token = await getToken();
      setAuthToken(token);

      const response = await api.put('/api/users/me', formData);
      
      setUserData(response.data.data);
      setOriginalData(formData);
      setSuccessMessage('Profile updated successfully!');
      setShowEditModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setBioCharCount(originalData.bio.length);
    setError(null);
    setShowEditModal(false);
  };

  const handleEditClick = () => {
    setError(null);
    setSuccessMessage(null);
    setShowEditModal(true);
  };

  const handleDeleteAccount = async (e) => {
    e?.preventDefault();
    setError(null);
    setDeleting(true);

    try {
      const token = await getToken();
      setAuthToken(token);

      await api.delete('/api/users/delete', { data: { password: deletePassword } });

      // store message and sign out
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-md p-8">
          {/* Header with Profile Picture */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-semibold mb-2">My Profile</h1>
              <p className="text-gray-600">View and manage your professional profile</p>
            </div>
          {/* Danger Zone: Account deletion */}
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-red-100">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-700 mb-4">Deleting your account will schedule permanent removal of your personal data after a 30-day grace period. You will be logged out immediately.</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.48)' }} onClick={() => setShowDeleteModal(false)}>
              <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-2">Confirm Account Deletion</h3>
                <p className="text-sm text-gray-700 mb-4">This will schedule your account for permanent deletion in 30 days. To confirm, enter your password below (if your account uses a local password).</p>

                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                />

                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
            
            {/* Profile Picture Upload */}
            <ProfilePictureUpload
              currentPicture={profilePicture}
              onUploadSuccess={(newPicture) => {
                setProfilePicture(newPicture);
              }}
              onDeleteSuccess={() => {
                setProfilePicture(null);
              }}
            />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading profile...</span>
            </div>
          ) : (
            <>
              {/* Profile Display */}
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="border-b pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
                    <button
                      onClick={handleEditClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                      <p className="text-gray-900">{userData?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                      <p className="text-gray-900">{userData?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                      <p className="text-gray-900">{userData?.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                      <p className="text-gray-900">{userData?.location || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className="border-b pb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Professional Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Professional Headline</p>
                      <p className="text-gray-900 text-lg">{userData?.headline || '—'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Industry</p>
                        <p className="text-gray-900">{userData?.industry || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Experience Level</p>
                        <p className="text-gray-900">{userData?.experienceLevel || '—'}</p>
                      </div>
                    </div>

                    {userData?.bio && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Bio / Summary</p>
                        <p className="text-gray-900 whitespace-pre-wrap">{userData.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {(userData?.website || userData?.linkedin || userData?.github) && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Links</h2>
                    <div className="space-y-2">
                      {userData?.website && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                          <a href={userData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {userData.website}
                          </a>
                        </div>
                      )}
                      {userData?.linkedin && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">LinkedIn</p>
                          <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {userData.linkedin}
                          </a>
                        </div>
                      )}
                      {userData?.github && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">GitHub</p>
                          <a href={userData.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {userData.github}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }} 
          onClick={handleCancel}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-2xl font-semibold">Edit Profile</h3>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Error Display */}
              {error && (
                <ErrorMessage
                  error={error}
                  onDismiss={() => setError(null)}
                  className="mb-6"
                />
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Name and Email Row */}
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

                {/* Phone and Location Row */}
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
                      placeholder="(555) 123-4567"
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

                {/* Professional Headline */}
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

                {/* Bio/Summary */}
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

                {/* Industry and Experience Level Row */}
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

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
