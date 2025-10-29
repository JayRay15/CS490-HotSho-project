import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import ErrorMessage from "../../components/ErrorMessage";
import ProfilePictureUpload from "../../components/ProfilePictureUpload";
import { useAccountDeletionCheck } from "../../hooks/useAccountDeletionCheck";
import LoadingSpinner from "../../components/LoadingSpinner";

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Real Estate'];
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Executive'];

export default function ProfilePage() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  
  const [userData, setUserData] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null); // Track if account is deleted
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
  const [employmentSuccessMessage, setEmploymentSuccessMessage] = useState(null);
  const [bioCharCount, setBioCharCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [employmentList, setEmploymentList] = useState([]);
  const [editingEmployment, setEditingEmployment] = useState(null);
  const [showEmploymentDeleteModal, setShowEmploymentDeleteModal] = useState(false);
  const [deletingEmployment, setDeletingEmployment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!isSignedIn) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        setAuthToken(token);
        
        // Try to get user profile
        let response;
        try {
          response = await api.get('/api/users/me');
        } catch (err) {
          // Check if account is deleted (403 status)
          if (err.response?.status === 403) {
            console.log("Account is deleted, logging out...");
            setAccountStatus('deleted');
            await signOut();
            return;
          }
          
          // If user not found (404), register them first
          if (err.response?.status === 404 || err.customError?.errorCode === 3001) {
            console.log("User not found in database, registering...");
            await api.post('/api/auth/register');
            // Retry getting user profile
            response = await api.get('/api/users/me');
          } else {
            throw err;
          }
        }
        
        const data = response.data.data;

        // Set account as active since we got here
        setAccountStatus('active');
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
        setEmploymentList(data.employment || []);
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
  }, [isSignedIn, getToken, signOut]);

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

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
  };

  const handleEditEmployment = (job) => {
    setEditingEmployment(job);
    setShowEmploymentModal(true);
  };

  const handleDeleteClick = (job) => {
    setDeletingEmployment(job);
    setShowEmploymentDeleteModal(true);
  };

  const handleDeleteEmployment = async () => {
    if (!deletingEmployment) return;

    setIsDeleting(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);

      await api.delete(`/api/users/employment/${deletingEmployment._id}`);
      
      // Update employment list by removing the deleted entry
      setEmploymentList(prev => prev.filter(job => job._id !== deletingEmployment._id));
      
      // Show success message in employment section
      setEmploymentSuccessMessage(`Employment entry for ${deletingEmployment.jobTitle} at ${deletingEmployment.company} deleted successfully!`);
      setTimeout(() => setEmploymentSuccessMessage(null), 5000);
      
      // Close modal and reset state
      setShowEmploymentDeleteModal(false);
      setDeletingEmployment(null);
    } catch (err) {
      console.error("Error deleting employment:", err);
      setError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEmploymentDelete = () => {
    setShowEmploymentDeleteModal(false);
    setDeletingEmployment(null);
  };

  if (!isLoaded) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg"
        text="Loading..." 
        variant="logo" 
      />
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Show loading while checking account status
  if (isLoading && accountStatus === null) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg"
        text="Loading your profile..." 
        variant="logo" 
      />
    );
  }

  // Show redirecting message if account is deleted
  if (accountStatus === 'deleted') {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="md"
        text="Redirecting..." 
        variant="spinner" 
      />
    );
  }

  // Only render profile if account is active
  if (accountStatus !== 'active') {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="lg"
        text="Loading..." 
        variant="logo" 
      />
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl shadow-md p-8 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#EEEEEE' }}>
          {/* Header with Profile Picture */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: '#111827' }}>My Profile</h1>
              <p style={{ color: '#4B5563' }}>View and manage your professional profile</p>
            </div>
            
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
            <div className="mb-6 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <p className="font-medium" style={{ color: '#166534' }}>{successMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading profile..." variant="spinner" />
            </div>
          ) : (
            <>
              {/* Profile Display */}
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="border-b pb-6" style={{ borderColor: '#EEEEEE' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-heading font-semibold" style={{ color: '#111827' }}>Basic Information</h2>
                    <button
                      onClick={handleEditClick}
                      className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Full Name</p>
                      <p style={{ color: '#111827' }}>{userData?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Email</p>
                      <p style={{ color: '#111827' }}>{userData?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Phone</p>
                      <p style={{ color: '#111827' }}>{userData?.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Location</p>
                      <p style={{ color: '#111827' }}>{userData?.location || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className="border-b pb-6" style={{ borderColor: '#EEEEEE' }}>
                  <h2 className="text-xl font-heading font-semibold mb-4" style={{ color: '#111827' }}>Professional Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Professional Headline</p>
                      <p className="text-lg" style={{ color: '#111827' }}>{userData?.headline || '—'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Industry</p>
                        <p style={{ color: '#111827' }}>{userData?.industry || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Experience Level</p>
                        <p style={{ color: '#111827' }}>{userData?.experienceLevel || '—'}</p>
                      </div>
                    </div>

                    {userData?.bio && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Bio / Summary</p>
                        <p className="whitespace-pre-wrap" style={{ color: '#111827' }}>{userData.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment History Section */}
                <div className="border-b pb-6" style={{ borderColor: '#EEEEEE' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-heading font-semibold" style={{ color: '#111827' }}>Employment History</h2>
                    <button
                      onClick={() => setShowEmploymentModal(true)}
                      className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: '#777C6D' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Employment</span>
                    </button>
                  </div>

                  {/* Employment Success Message */}
                  {employmentSuccessMessage && (
                    <div className="mb-4 p-4 border rounded-lg" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <p className="font-medium" style={{ color: '#166534' }}>{employmentSuccessMessage}</p>
                    </div>
                  )}

                  {employmentList && employmentList.length > 0 ? (
                    <div className="space-y-4">
                      {employmentList
                        .sort((a, b) => {
                          // Current positions first
                          if (a.isCurrentPosition && !b.isCurrentPosition) return -1;
                          if (!a.isCurrentPosition && b.isCurrentPosition) return 1;
                          
                          // For current positions, sort by start date (most recent first)
                          if (a.isCurrentPosition && b.isCurrentPosition) {
                            return new Date(b.startDate) - new Date(a.startDate);
                          }
                          
                          // For past positions, sort by end date (most recent first)
                          return new Date(b.endDate) - new Date(a.endDate);
                        })
                        .map((job, index) => (
                          <div key={job._id || index} className="border rounded-lg p-4 hover:shadow-md transition relative">
                            {/* Current Position Badge - Top Right */}
                            {job.isCurrentPosition && (
                              <div className="absolute top-4 right-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}>
                                  Current Position
                                </span>
                              </div>
                            )}
                            
                            <div className="flex flex-col">
                              {/* Job Details */}
                              <div className="flex-1 pr-32">
                                <h3 className="text-lg font-heading font-semibold text-text-primary">{job.jobTitle}</h3>
                                <p className="text-text-primary font-medium">{job.company}</p>
                                <div className="flex items-center text-sm text-text-secondary mt-1 space-x-2">
                                  {job.location && (
                                    <>
                                      <span>{job.location}</span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span>
                                    {(() => {
                                      const startDate = new Date(job.startDate);
                                      const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                                      const startYear = startDate.getFullYear();
                                      return `${startMonth}/${startYear}`;
                                    })()}
                                    {' - '}
                                    {job.isCurrentPosition 
                                      ? 'Present' 
                                      : (() => {
                                          const endDate = new Date(job.endDate);
                                          const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                                          const endYear = endDate.getFullYear();
                                          return `${endMonth}/${endYear}`;
                                        })()
                                    }
                                  </span>
                                </div>
                                {job.description && (
                                  <p className="mt-2 whitespace-pre-wrap" style={{ color: '#111827' }}>{job.description}</p>
                                )}
                              </div>
                              
                              {/* Action Buttons - Bottom Right */}
                              <div className="flex justify-end mt-3 space-x-2">
                                <button
                                  onClick={() => handleEditEmployment(job)}
                                  className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
                                  style={{ color: '#6B7280' }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.color = '#777C6D';
                                    e.currentTarget.style.backgroundColor = '#F5F6F4';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.color = '#6B7280';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Edit employment"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                
                                {/* Hide delete button if only 1 entry */}
                                {employmentList.length > 1 && (
                                  <button
                                    onClick={() => handleDeleteClick(job)}
                                    className="p-2 rounded-lg transition focus:outline-none focus:ring-2"
                                    style={{ color: '#6B7280' }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.color = '#EF4444';
                                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.color = '#6B7280';
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    title="Delete employment"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                    </div>
                  ) : (
                    <p className="italic" style={{ color: '#9CA3AF' }}>No employment history added yet.</p>
                  )}
                </div>

                {/* Additional Information */}
                {(userData?.website || userData?.linkedin || userData?.github) && (
                  <div>
                    <h2 className="text-xl font-heading font-semibold mb-4" style={{ color: '#111827' }}>Links</h2>
                    <div className="space-y-2">
                      {userData?.website && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>Website</p>
                          <a 
                            href={userData.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline transition-colors"
                            style={{ color: '#777C6D' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#656A5C'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#777C6D'}
                          >
                            {userData.website}
                          </a>
                        </div>
                      )}
                      {userData?.linkedin && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>LinkedIn</p>
                          <a 
                            href={userData.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline transition-colors"
                            style={{ color: '#777C6D' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#656A5C'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#777C6D'}
                          >
                            {userData.linkedin}
                          </a>
                        </div>
                      )}
                      {userData?.github && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: '#4B5563' }}>GitHub</p>
                          <a 
                            href={userData.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline transition-colors"
                            style={{ color: '#777C6D' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#656A5C'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#777C6D'}
                          >
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

        {/* Danger Zone: Account deletion - moved to bottom of page */}
        <div className="mt-8">
          <div className="rounded-2xl shadow-md p-6 border-2" style={{ backgroundColor: '#EEEEEE', borderColor: '#FCA5A5' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#DC2626' }}>Danger Zone</h2>
            <p className="text-sm mb-4" style={{ color: '#111827' }}>
              Deleting your account will schedule permanent removal of your personal data after a 30-day grace period. 
              You will be logged out immediately and cannot access your account during this period.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-2.5 text-white rounded-lg transition font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#EF4444' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} 
          onClick={() => {
            setShowDeleteModal(false);
            setDeletePassword("");
            setError(null);
          }}
        >
          <div 
            className="rounded-lg shadow-2xl max-w-md w-full p-6 mx-4 border" 
            style={{ backgroundColor: '#EEEEEE', borderColor: '#E5E7EB' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start mb-4">
              <div className="shrink-0">
                <svg className="h-6 w-6" style={{ color: '#DC2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-heading font-semibold mb-2" style={{ color: '#111827' }}>Confirm Account Deletion</h3>
                <p className="text-sm mb-4" style={{ color: '#111827' }}>
                  This will schedule your account for <strong>permanent deletion in 30 days</strong>. 
                  You will be logged out immediately and cannot log in during the grace period.
                </p>
                <p className="text-sm mb-4" style={{ color: '#4B5563' }}>
                  <strong>Please enter your password to confirm this action:</strong>
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 border rounded-lg" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                <p className="text-sm" style={{ color: '#991B1B' }}>
                  {error?.response?.data?.error?.message || error?.message || 'Failed to delete account'}
                </p>
              </div>
            )}

            <label className="block text-sm font-medium mb-2" style={{ color: '#111827' }}>
              Password <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm"
              required
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:ring-2 focus:border-transparent"
              style={{ borderColor: '#D1D5DB' }}
            />

            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setError(null);
                }} 
                disabled={deleting}
                className="px-4 py-2 rounded-lg transition disabled:opacity-50 focus:outline-none focus:ring-2"
                style={{ backgroundColor: '#F3F4F6', color: '#111827' }}
                onMouseOver={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#E5E7EB')}
                onMouseOut={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleting || !deletePassword.trim()} 
                className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#EF4444' }}
                onMouseOver={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#DC2626')}
                onMouseOut={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#EF4444')}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }} 
          onClick={(e) => {
            // Allow closing modal by clicking backdrop even if there's an error
            if (!isSaving) {
              handleCancel();
            }
          }}
        >
          <div 
            className="rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative border" 
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 border-b px-6 py-4 flex justify-between items-center z-10" style={{ backgroundColor: '#FFFFFF' }}>
              <h3 className="text-2xl font-semibold" style={{ color: '#111827' }}>Edit Profile</h3>
              <button
                onClick={handleCancel}
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
                <div className="flex justify-end space-x-4 pt-6 border-t sticky bottom-0" style={{ backgroundColor: '#FFFFFF' }}>
                  <button
                    type="button"
                    onClick={handleCancel}
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
      )}

      {/* Add/Edit Employment Modal */}
      {showEmploymentModal && (
        <EmploymentModal
          isOpen={showEmploymentModal}
          onClose={() => {
            setShowEmploymentModal(false);
            setEditingEmployment(null);
          }}
          onSuccess={(newEmployment, message) => {
            setEmploymentList(newEmployment);
            setEditingEmployment(null);
            setShowEmploymentModal(false);
            setEmploymentSuccessMessage(message);
            // Auto-dismiss success message after 5 seconds
            setTimeout(() => setEmploymentSuccessMessage(null), 5000);
          }}
          getToken={getToken}
          editingJob={editingEmployment}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showEmploymentDeleteModal && deletingEmployment && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={(e) => {
            if (!isDeleting) {
              handleCancelEmploymentDelete();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-heading font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this employment entry?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900">{deletingEmployment.jobTitle}</p>
                <p className="text-gray-700">{deletingEmployment.company}</p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>

              {/* Error Display */}
              {error && (
                <div className="mt-4">
                  <ErrorMessage
                    error={error}
                    onDismiss={() => setError(null)}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                type="button"
                onClick={handleCancelEmploymentDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployment}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Employment Modal Component
function EmploymentModal({ isOpen, onClose, onSuccess, getToken, editingJob }) {
  const isEditMode = !!editingJob;
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrentPosition: false,
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [descCharCount, setDescCharCount] = useState(0);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingJob) {
      const startDate = new Date(editingJob.startDate);
      const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
      const startYear = startDate.getFullYear();
      const formattedStartDate = `${startMonth}/${startYear}`;

      let formattedEndDate = '';
      if (editingJob.endDate && !editingJob.isCurrentPosition) {
        const endDate = new Date(editingJob.endDate);
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        const endYear = endDate.getFullYear();
        formattedEndDate = `${endMonth}/${endYear}`;
      }

      setFormData({
        jobTitle: editingJob.jobTitle || '',
        company: editingJob.company || '',
        location: editingJob.location || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        isCurrentPosition: editingJob.isCurrentPosition || false,
        description: editingJob.description || ''
      });
      setDescCharCount(editingJob.description?.length || 0);
    } else {
      // Reset form for add mode
      setFormData({
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrentPosition: false,
        description: ''
      });
      setDescCharCount(0);
    }
    setError(null);
    setSuccessMessage(null);
  }, [editingJob]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle description character limit
    if (name === 'description') {
      if (value.length > 1000) return;
      setDescCharCount(value.length);
    }

    // Handle date formatting for startDate and endDate
    if (name === 'startDate' || name === 'endDate') {
      // Remove any non-digit characters
      let cleaned = value.replace(/\D/g, '');
      
      // Limit to 6 digits (MMYYYY)
      if (cleaned.length > 6) {
        cleaned = cleaned.substring(0, 6);
      }
      
      // Format as MM/YYYY
      let formatted = cleaned;
      if (cleaned.length >= 3) {
        formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.jobTitle.trim()) {
      errors.push({ field: 'jobTitle', message: 'Job title is required and cannot be empty' });
    }

    if (!formData.company.trim()) {
      errors.push({ field: 'company', message: 'Company name is required and cannot be empty' });
    }

    if (!formData.startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    } else {
      // Validate MM/YYYY format
      const datePattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
      if (!datePattern.test(formData.startDate)) {
        errors.push({ field: 'startDate', message: 'Invalid start date format. Please use MM/YYYY (e.g., 10/2023)' });
      } else {
        const [month, year] = formData.startDate.split('/');
        const startDateObj = new Date(year, month - 1, 1);
        if (isNaN(startDateObj.getTime())) {
          errors.push({ field: 'startDate', message: 'Invalid start date' });
        }
      }
    }

    // Date validation for end date
    if (!formData.isCurrentPosition) {
      if (!formData.endDate) {
        errors.push({ field: 'endDate', message: 'End date is required when this is not a current position' });
      } else {
        const datePattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
        if (!datePattern.test(formData.endDate)) {
          errors.push({ field: 'endDate', message: 'Invalid end date format. Please use MM/YYYY (e.g., 12/2024)' });
        } else {
          const [endMonth, endYear] = formData.endDate.split('/');
          const endDateObj = new Date(endYear, endMonth - 1, 1);
          
          if (isNaN(endDateObj.getTime())) {
            errors.push({ field: 'endDate', message: 'Invalid end date' });
          } else if (formData.startDate) {
            const startDatePattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
            if (startDatePattern.test(formData.startDate)) {
              const [startMonth, startYear] = formData.startDate.split('/');
              const startDateObj = new Date(startYear, startMonth - 1, 1);
              
              if (!isNaN(startDateObj.getTime()) && startDateObj >= endDateObj) {
                errors.push({ field: 'endDate', message: 'End date must be after the start date' });
              }
            }
          }
        }
      }
    }

    // Description character limit
    if (formData.description && formData.description.length > 1000) {
      errors.push({ field: 'description', message: `Description is too long (${formData.description.length} characters). Maximum 1000 characters allowed` });
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError({
        customError: {
          errorCode: 2001,
          message: 'Please fix the following errors before submitting:',
          errors: validationErrors
        }
      });
      return;
    }

    setIsSaving(true);

    try {
      const token = await getToken();
      setAuthToken(token);

      let response;
      if (isEditMode) {
        // Edit existing employment
        response = await api.put(`/api/users/employment/${editingJob._id}`, formData);
      } else {
        // Add new employment
        response = await api.post('/api/users/employment', formData);
      }
      
      const successMsg = isEditMode 
        ? 'Employment entry updated successfully!' 
        : 'Employment entry added successfully!';
      
      // Call success callback with updated employment list and message
      onSuccess(response.data.data.employment, successMsg);
      
      // For add mode only: clear form and show inline success message
      if (!isEditMode) {
        setFormData({
          jobTitle: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrentPosition: false,
          description: ''
        });
        setDescCharCount(0);
        setError(null);
        setSuccessMessage(successMsg);
        
        // Auto-dismiss inline success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error(isEditMode ? "Error updating employment:" : "Error adding employment:", err);
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrentPosition: false,
      description: ''
    });
    setDescCharCount(0);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }} 
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-2xl font-heading font-semibold">{isEditMode ? 'Edit Employment' : 'Add Employment'}</h3>
          <button
            onClick={handleClose}
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
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <ErrorMessage
              error={error}
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Senior Software Engineer"
              />
            </div>

            {/* Company and Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tech Corp"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
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

            {/* Start Date and End Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (MM/YYYY) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10/2023"
                  maxLength="7"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (MM/YYYY) {!formData.isCurrentPosition && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  disabled={formData.isCurrentPosition}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="12/2024"
                  maxLength="7"
                />
              </div>
            </div>

            {/* Current Position Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCurrentPosition"
                name="isCurrentPosition"
                checked={formData.isCurrentPosition}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isCurrentPosition" className="ml-2 block text-sm text-gray-700">
                I currently work here
              </label>
            </div>

            {/* Job Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your responsibilities, achievements, and key contributions..."
              />
              <div className="mt-1 flex justify-between items-center">
                <p className="text-xs text-gray-500">Optional</p>
                <p className={`text-sm ${descCharCount > 900 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {descCharCount} / 1000 characters
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-2 border rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: '#D1D5DB', color: '#374151' }}
                onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#656A5C')}
                onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#777C6D')}
              >
                {isSaving 
                  ? (isEditMode ? 'Updating...' : 'Saving...') 
                  : (isEditMode ? 'Update Entry' : 'Save Entry')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
