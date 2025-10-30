import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import ErrorMessage from "../../components/ErrorMessage";
import ProfilePictureUpload from "../../components/ProfilePictureUpload";
import ProfileCompleteness from "../../components/ProfileCompleteness";
import { useAccountDeletionCheck } from "../../hooks/useAccountDeletionCheck";
import Certifications from "./Certifications";
import Projects from "./Projects";
import Card from "../../components/Card";
import Container from "../../components/Container";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  // Education state (mirrors employment implementation)
  const [educationSuccessMessage, setEducationSuccessMessage] = useState(null);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [educationList, setEducationList] = useState([]);
  const [editingEducation, setEditingEducation] = useState(null);
  const [showEducationDeleteModal, setShowEducationDeleteModal] = useState(false);
  const [deletingEducation, setDeletingEducation] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Skill state (mirrors education/employment implementation)
  const [skillList, setSkillList] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [showSkillDeleteModal, setShowSkillDeleteModal] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState(null);
  const [skillSuccessMessage, setSkillSuccessMessage] = useState(null);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    'Technical': true,
    'Soft Skills': true,
    'Languages': true,
    'Industry-Specific': true
  });
  
    // Skill handlers
    const handleEditSkill = (skill) => {
      setEditingSkill(skill);
      setShowSkillModal(true);
    };
  
  const handleDeleteSkillClick = (skill) => {
    setDeletingSkill(skill);
    setShowSkillDeleteModal(true);
  };

  const handleCancelSkillDelete = () => {
    setShowSkillDeleteModal(false);
    setDeletingSkill(null);
  };

  // Project handlers
  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };    const handleDeleteSkill = async () => {
      if (!deletingSkill) return;
      setIsDeleting(true);
      setError(null);
      try {
        const token = await getToken();
        setAuthToken(token);
        // attempt backend delete; if backend doesn't have endpoint this will throw and be caught
        await api.delete(`/api/profile/skills/${deletingSkill._id}`);
        // update local list
        setSkillList(prev => prev.filter(s => s._id !== deletingSkill._id && s.name !== deletingSkill.name));
        setSkillSuccessMessage('Skill deleted successfully.');
        setTimeout(() => setSkillSuccessMessage(null), 4000);
        setShowSkillDeleteModal(false);
        setDeletingSkill(null);
      } catch (err) {
        // Fallback: remove locally if API fails
        setSkillList(prev => prev.filter(s => s.name.toLowerCase() !== deletingSkill.name.toLowerCase()));
        setSkillSuccessMessage('Skill removed locally.');
        setTimeout(() => setSkillSuccessMessage(null), 4000);
      } finally {
        setIsDeleting(false);
      }
    };

  // Skills organization helpers
  const groupSkillsByCategory = (skills) => {
    const grouped = {};
    skills.forEach(skill => {
      const cat = skill.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(skill);
    });
    return grouped;
  };

  const getSkillLevelSummary = (skills) => {
    const summary = { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 };
    skills.forEach(skill => {
      if (summary.hasOwnProperty(skill.level)) {
        summary[skill.level]++;
      }
    });
    return summary;
  };

  const filteredSkills = skillList.filter(skill => {
    if (!skillSearchQuery.trim()) return true;
    const query = skillSearchQuery.toLowerCase();
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.category.toLowerCase().includes(query) ||
      skill.level.toLowerCase().includes(query)
    );
  });

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const exportSkillsByCategory = () => {
    const grouped = groupSkillsByCategory(skillList);
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Skills Export', 40, 40);

    // Meta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Date: ${dateStr}`, 40, 60);
    doc.text(`Total skills: ${skillList.length}`, 40, 75);

    let currentY = 95;

    const categories = Object.keys(grouped);
    if (categories.length === 0) {
      doc.text('No skills to export.', 40, currentY);
    }

    categories.forEach((category, idx) => {
      if (idx > 0) {
        currentY += 20; // spacing between categories
      }

      // Category header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${category} (${grouped[category].length})`, 40, currentY);

      // Level summary line
      const summary = getSkillLevelSummary(grouped[category]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 14;
      doc.text(
        `Beginner: ${summary.Beginner}   Intermediate: ${summary.Intermediate}   Advanced: ${summary.Advanced}   Expert: ${summary.Expert}`,
        40,
        currentY
      );

      // Table of skills in this category
      const rows = grouped[category]
        .map(s => [s.name || '', s.level || '', s.category || category]);

      // Use autoTable for tabular data under this category
      // @ts-ignore - plugin augments jsPDF instance
      doc.autoTable({
        startY: currentY + 8,
        margin: { left: 40, right: 40 },
        head: [['Name', 'Level', 'Category']],
        body: rows,
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: { fillColor: [33, 150, 243], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Update currentY to the end of the table
      // @ts-ignore - plugin augments jsPDF instance with lastAutoTable
      currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 40;
    });

    doc.save(`skills-export-${dateStr}.pdf`);
  };

  const handleSkillDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = skillList.findIndex(s => s._id === active.id);
    const newIndex = skillList.findIndex(s => s._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newSkillList = arrayMove(skillList, oldIndex, newIndex);
    setSkillList(newSkillList);

    // Optionally persist the new order to backend
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.put('/api/profile/skills/reorder', { skills: newSkillList.map(s => s._id) });
    } catch (err) {
      console.error('Failed to persist skill order:', err);
    }
  };

  const moveSkillToCategory = async (skill, newCategory) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await api.put(`/api/profile/skills/${skill._id}`, { ...skill, category: newCategory });
      
      setSkillList(prev => prev.map(s => 
        s._id === skill._id ? { ...s, category: newCategory } : s
      ));
      setSkillSuccessMessage(`Skill moved to ${newCategory}`);
      setTimeout(() => setSkillSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to move skill:', err);
      setError(err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [showCertModal, setShowCertModal] = useState(false);
  const [certList, setCertList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingCertification, setEditingCertification] = useState(null);
  const [projectSuccessMessage, setProjectSuccessMessage] = useState(null);
  const navigate = useNavigate();

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
          
          // If user not found (404), redirect to dashboard to handle registration
          if (err.response?.status === 404 || err.customError?.errorCode === 3001) {
            console.log("User not found in database, redirecting to dashboard...");
            window.location.href = '/dashboard';
            return;
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
        // Load server-backed lists
        setCertList(Array.isArray(data.certifications) ? data.certifications : []);
        setProjectList(Array.isArray(data.projects) ? data.projects : []);
  setEmploymentList(data.employment || []);
  setEducationList(data.education || []);
  // Populate skills if present on the profile response. Support either top-level `skills` or nested `profile.skills` shapes.
  try {
    const serverSkills = data.skills || (data.profile && data.profile.skills) || [];
    setSkillList(Array.isArray(serverSkills) ? serverSkills : []);
  } catch (e) {
    setSkillList([]);
  }
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

  // Refresh certifications from server when modal closes
  useEffect(() => {
    const refresh = async () => {
      if (!showCertModal) {
        try {
          const token = await getToken();
          setAuthToken(token);
          const me = await api.get('/api/users/me');
          setCertList(me?.data?.data?.certifications || []);
        } catch (e) {
          // ignore
        }
      }
    };
    refresh();
  }, [showCertModal, getToken]);

  // reload projects when modal is closed so list reflects changes
  // (projects are now managed on a dedicated /projects page; list is loaded on profile load)

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

      // Delete the account from the database
      await api.delete('/api/users/delete', { data: { password: deletePassword } });

      // Close modal immediately
      setShowDeleteModal(false);
      setDeletePassword("");
      
      // Store message for after logout
      sessionStorage.setItem("logoutMessage", "Your account has been permanently deleted. You have been logged out.");
      
      // Sign out from Clerk - this will redirect to login page
      // Important: await this to ensure Clerk session is cleared before any redirects
      await signOut();
      
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err);
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

  const handleEditEducation = (edu) => {
    setEditingEducation(edu);
    setShowEducationModal(true);
  };

  const handleDeleteClick = (job) => {
    setDeletingEmployment(job);
    setShowEmploymentDeleteModal(true);
  };

  const handleDeleteEducationClick = (edu) => {
    setDeletingEducation(edu);
    setShowEducationDeleteModal(true);
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

  const handleDeleteEducation = async () => {
    if (!deletingEducation) return;

    setIsDeleting(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);

        await api.delete(`/api/profile/education/${deletingEducation._id}`);

      // Update education list by removing the deleted entry
      setEducationList(prev => prev.filter(e => e._id !== deletingEducation._id));

      // Show success message in education section
      setEducationSuccessMessage(`Education entry for ${deletingEducation.institution} deleted successfully!`);
      setTimeout(() => setEducationSuccessMessage(null), 5000);

      // Close modal and reset state
      setShowEducationDeleteModal(false);
      setDeletingEducation(null);
    } catch (err) {
      console.error("Error deleting education:", err);
      setError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEducationDelete = () => {
    setShowEducationDeleteModal(false);
    setDeletingEducation(null);
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
    <div className="min-h-screen py-8" style={{ backgroundColor: '#E4E6E0' }}>
      <Container level={1}>
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <Card variant="primary" className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: '#4F5348' }}>My Profile</h1>
                <p style={{ color: '#656A5C' }}>View and manage your professional profile</p>
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
          </Card>

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
              {/* Profile Completeness Widget */}
              <div className="mb-6">
                <ProfileCompleteness userData={userData} />
              </div>

              {/* Profile Display */}
              <div className="space-y-6">
                {/* Basic Information Section */}
                <Card variant="default" title="Basic Information">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={handleEditClick}
                      className="px-4 py-2 text-white rounded-lg transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ml-auto"
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
                      <p className="text-sm font-medium mb-1" style={{ color: '#656A5C' }}>Full Name</p>
                      <p style={{ color: '#4F5348' }}>{userData?.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#656A5C' }}>Email</p>
                      <p style={{ color: '#4F5348' }}>{userData?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#656A5C' }}>Phone</p>
                      <p style={{ color: '#4F5348' }}>{userData?.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#656A5C' }}>Location</p>
                      <p style={{ color: '#4F5348' }}>{userData?.location || '—'}</p>
                    </div>
                  </div>
                </Card>

                {/* Professional Information Section */}
                <Card variant="default" title="Professional Information">
                  
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
                        <p className="text-sm font-medium mb-1" style={{ color: '#656A5C' }}>Experience Level</p>
                        <p style={{ color: '#4F5348' }}>{userData?.experienceLevel || '—'}</p>
                      </div>
                    </div>

                    {userData?.bio && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: '#656A5C' }}>Bio / Summary</p>
                        <p className="whitespace-pre-wrap" style={{ color: '#4F5348' }}>{userData.bio}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Employment History Section */}
                <Card variant="default" title="Employment History">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setShowEmploymentModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 ml-auto"
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
                          <Card key={job._id || index} variant="outlined" interactive className="relative">
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
                          </Card>
                        ))}

                    </div>
                  ) : (
                    <p className="italic" style={{ color: '#9CA3AF' }}>No employment history added yet.</p>
                  )}
                </Card>

                {/* Education History Section */}
                <Card variant="default" title="Education">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setShowEducationModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 ml-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Education</span>
                    </button>
                  </div>

                  {/* Education Success Message */}
                  {educationSuccessMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">{educationSuccessMessage}</p>
                    </div>
                  )}

                  {educationList && educationList.length > 0 ? (
                    <div className="relative pl-10">
                      {/* vertical timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                      {educationList
                        .slice() // copy
                        .sort((a, b) => {
                          // Reverse-chronological by endDate (ongoing considered most recent)
                          const aTime = a.current ? Number.MAX_SAFE_INTEGER : (a.endDate ? new Date(a.endDate).getTime() : new Date(a.startDate).getTime());
                          const bTime = b.current ? Number.MAX_SAFE_INTEGER : (b.endDate ? new Date(b.endDate).getTime() : new Date(b.startDate).getTime());
                          return bTime - aTime;
                        })
                        .map((edu, index) => (
                          <div key={edu._id || index} className="relative mb-8 pl-6">
                            {/* timeline dot */}
                            <div className={`absolute left-0 top-2 w-3 h-3 rounded-full border-2 ${edu.current ? 'bg-green-500 border-green-200' : 'bg-blue-600 border-white'}`} />

                            <div className="bg-white border rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-heading font-semibold text-gray-900">{edu.degree} — {edu.institution}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{edu.fieldOfStudy}</p>
                                  <div className="text-sm text-gray-500 mt-2">
                                    {(() => {
                                      const startDate = new Date(edu.startDate);
                                      const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                                      const startYear = startDate.getFullYear();
                                      const startStr = `${startMonth}/${startYear}`;
                                      const endStr = edu.current ? 'Present' : (() => { const d = new Date(edu.endDate); return `${String(d.getMonth() + 1).padStart(2,'0')}/${d.getFullYear()}`; })();
                                      return `${startStr} — ${endStr}`;
                                    })()}
                                  </div>

                                  {edu.achievements && (
                                    <div className="mt-3 p-3 bg-gray-50 border rounded">
                                      <strong className="text-gray-800">Honors / Achievements</strong>
                                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{edu.achievements}</p>
                                    </div>
                                  )}

                                  {typeof edu.gpa !== 'undefined' && edu.gpa !== null && (
                                    <p className="mt-3 text-sm text-gray-700">GPA: {edu.gpaPrivate ? 'Private' : edu.gpa}</p>
                                  )}
                                </div>

                                <div className="flex-shrink-0 ml-4 text-gray-600 flex items-start gap-2">
                                  {edu.current ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">Ongoing</span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">Completed</span>
                                  )}

                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => handleEditEducation(edu)}
                                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      title="Edit education"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>

                                    {educationList.length > 1 && (
                                      <button
                                        onClick={() => handleDeleteEducationClick(edu)}
                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete education"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No education added yet.</p>
                  )}
                </Card>

                {/* Skills Section - Enhanced with Categories */}
                <Card variant="default" title="Skills">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mt-1">{skillList.length} total skills across {Object.keys(groupSkillsByCategory(skillList)).length} categories</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={exportSkillsByCategory}
                        disabled={skillList.length === 0}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export skills by category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Export</span>
                      </button>
                      <button
                        onClick={() => { setEditingSkill(null); setShowSkillModal(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Skill</span>
                      </button>
                    </div>
                  </div>

                  {skillSuccessMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">{skillSuccessMessage}</p>
                    </div>
                  )}

                  {/* Search Bar */}
                  {skillList.length > 0 && (
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          value={skillSearchQuery}
                          onChange={(e) => setSkillSearchQuery(e.target.value)}
                          placeholder="Search skills by name, category, or proficiency..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {skillSearchQuery && (
                          <button
                            onClick={() => setSkillSearchQuery('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {skillList.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSkillDragEnd}>
                      {Object.entries(groupSkillsByCategory(filteredSkills)).map(([category, skills]) => (
                        <div key={category} className="mb-6 last:mb-0">
                          {/* Category Header */}
                          <div 
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-3 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition"
                            onClick={() => toggleCategory(category)}
                          >
                            <div className="flex items-center space-x-3">
                              <button className="text-gray-600">
                                <svg className={`w-5 h-5 transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm text-gray-600">{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
                                  {/* Level Summary */}
                                  <div className="flex items-center space-x-2 text-xs">
                                    {Object.entries(getSkillLevelSummary(skills)).map(([level, count]) => (
                                      count > 0 && (
                                        <span key={level} className={`px-2 py-0.5 rounded ${
                                          level === 'Beginner' ? 'bg-gray-200 text-gray-800' :
                                          level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                          level === 'Advanced' ? 'bg-indigo-100 text-indigo-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          {count} {level}
                                        </span>
                                      )
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Skills in Category */}
                          {expandedCategories[category] && (
                            <SortableContext items={skills.map(s => s._id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2 pl-8">
                                {skills.map((skill) => (
                                  <SortableSkillItem
                                    key={skill._id}
                                    skill={skill}
                                    onEdit={handleEditSkill}
                                    onDelete={handleDeleteSkillClick}
                                    onMoveCategory={moveSkillToCategory}
                                    categories={['Technical', 'Soft Skills', 'Languages', 'Industry-Specific']}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          )}
                        </div>
                      ))}
                    </DndContext>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="text-gray-500 italic">No skills added yet. Click "Add Skill" to get started!</p>
                    </div>
                  )}
                </Card>

                {/* Projects Section */}
                <Card variant="default" title="Projects">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 ml-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Project</span>
                    </button>
                  </div>

                      {projectSuccessMessage && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          {projectSuccessMessage}
                        </div>
                      )}

                      {projectList && projectList.length > 0 ? (
                        <div className="space-y-4">
                          {projectList.map((p, idx) => (
                            <div key={p._id || p.id || idx} className="border rounded-lg p-4 hover:shadow-md transition relative">
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="text-lg font-heading font-semibold text-gray-900">{p.name}</h3>
                                  <p className="text-gray-700 font-medium">{p.role} · Team: {p.teamSize}</p>
                                  <div className="text-sm text-gray-600 mt-1">{p.industry || '—'} · {p.status}</div>
                                  <div className="mt-2 text-sm text-gray-700">{p.description}</div>
                                  {p.projectUrl && <div className="mt-2"><a href={p.projectUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Project link</a></div>}
                                </div>

                                <div className="flex items-start gap-2">
                                  <button onClick={() => handleEditProject(p)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit project"> 
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={async () => { 
                                    if (!confirm('Delete project?')) return; 
                                    try { 
                                      const token = await getToken(); 
                                      setAuthToken(token); 
                                      await api.delete(`/api/profile/projects/${p._id}`); 
                                      const me = await api.get('/api/users/me'); 
                                      setProjectList(me?.data?.data?.projects || []); 
                                    } catch (e) { 
                                      console.error(e); 
                                      alert('Failed to delete project. Please try again.');
                                    } 
                                  }} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete project">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No projects added yet.</p>
                      )}
                </Card>

                {/* Certifications Section */}
                <Card variant="default" title="Certifications">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => { setEditingCertification(null); setShowCertModal(true); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 ml-auto"
                    >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Certification</span>
                        </button>
                      </div>

                      {/* Compact certifications list */}
                      {certList && certList.length > 0 ? (
                        <div className="space-y-4">
                          {certList.map((c, index) => {
                            const days = (() => {
                              if (c.doesNotExpire) return null;
                              if (!c.expirationDate) return null;
                              const d = new Date(c.expirationDate);
                              if (isNaN(d.getTime())) return null; // Invalid date
                              const now = new Date();
                              return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
                            })();
                            const expiringSoon = days !== null && days <= (c.reminderDays || 30) && days >= 0;
                            const expired = days !== null && days < 0;
                            
                            // Format dates for display
                            const formatDate = (dateStr) => {
                              if (!dateStr) return '—';
                              const d = new Date(dateStr);
                              if (isNaN(d.getTime())) return '—';
                              return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                            };

                            return (
                              <div key={c._id || c.id || index} className="border rounded-lg p-4 hover:shadow-md transition relative">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="text-lg font-heading font-semibold text-gray-900">{c.name}</h3>
                                    <p className="text-gray-700 font-medium">{c.organization}</p>
                                    <div className="flex items-center text-sm text-gray-600 mt-1 space-x-2">
                                      {c.certId && <span>ID: {c.certId}</span>}
                                      <span>•</span>
                                      <span>{c.industry || '—'}</span>
                                    </div>
                                    <div className="text-sm mt-2">Earned: {formatDate(c.dateEarned)} · {c.doesNotExpire ? 'Does not expire' : formatDate(c.expirationDate)}</div>
                                    <div className="text-sm mt-1">Verification: <strong className={`ml-2 ${c.verification === 'Verified' ? 'text-green-600' : c.verification === 'Pending' ? 'text-yellow-600' : 'text-gray-600'}`}>{c.verification}</strong></div>
                                    {c.document && <div className="mt-2"><a className="text-sm text-blue-600 underline" href={c.document.data} target="_blank" rel="noreferrer">View document ({c.document.name})</a></div>}
                                    <div className="mt-2 text-sm">
                                      {expired && <span className="text-red-600">Expired</span>}
                                      {expiringSoon && <span className="text-yellow-600">Expires in {days} day(s)</span>}
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingCertification(c);
                                        setShowCertModal(true);
                                      }}
                                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      title="Edit certification"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Delete this certification?')) return;
                                        try {
                                          const token = await getToken();
                                          setAuthToken(token);
                                          await api.delete(`/api/profile/certifications/${c._id}`);
                                          const me = await api.get('/api/users/me');
                                          setCertList(me?.data?.data?.certifications || []);
                                        } catch (e) {
                                          console.error(e);
                                          alert('Failed to delete certification. Please try again.');
                                        }
                                      }}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="Delete certification"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No certifications added yet.</p>
                      )}
                </Card>

                {/* Upcoming Reminders Section */}
                <Card variant="info" title="Upcoming Reminders">
                  {(() => {
                          const now = new Date();
                          const items = (certList || []).filter((c) => {
                            if (c.doesNotExpire) return false;
                            if (!c.expirationDate) return false;
                            if (c.reminderDismissed) return false;
                            if (c.reminderSnoozedUntil) {
                              const snoozed = new Date(c.reminderSnoozedUntil);
                              if (snoozed > now) return false;
                            }
                            const d = (() => {
                              const dt = new Date(c.expirationDate);
                              return Math.ceil((dt - now) / (1000 * 60 * 60 * 24));
                            })();
                            return d !== null && d <= (c.reminderDays || 30) && d >= 0;
                          });

                          if (!items || items.length === 0) return <div className="text-sm text-gray-600">No upcoming reminders.</div>;

                          return (
                            <div className="space-y-2">
                              {items.map((c) => {
                                const days = Math.ceil((new Date(c.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                                return (
                                  <div key={c._id || c.id} className="flex items-center justify-between">
                                    <div className="text-sm">
                                      <strong>{c.name}</strong> — {c.organization} · Expires in {days} day(s)
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button className="text-sm text-gray-600 hover:text-gray-800" onClick={async () => {
                                        try {
                                          const token = await getToken();
                                          setAuthToken(token);
                                          await api.put(`/api/profile/certifications/${c._id}`, { reminderSnoozedUntil: new Date(Date.now() + 7*24*60*60*1000).toISOString() });
                                          const me = await api.get('/api/users/me');
                                          setCertList(me?.data?.data?.certifications || []);
                                        } catch (e) { 
                                          console.error(e);
                                          alert('Failed to snooze reminder. Please try again.');
                                        }
                                      }}>Snooze 7d</button>
                                      <button className="text-sm text-gray-600 hover:text-gray-800" onClick={async () => {
                                        try {
                                          const token = await getToken();
                                          setAuthToken(token);
                                          await api.put(`/api/profile/certifications/${c._id}`, { reminderDismissed: true });
                                          const me = await api.get('/api/users/me');
                                          setCertList(me?.data?.data?.certifications || []);
                                        } catch (e) { 
                                          console.error(e);
                                          alert('Failed to dismiss reminder. Please try again.');
                                        }
                                      }}>Dismiss</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                </Card>

                    {/* Certifications modal - renders full Certifications UI */}
                    {showCertModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowCertModal(false); setEditingCertification(null); }}>
                        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                          {/* Modal Header */}
                          <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-heading font-semibold text-gray-900">Certifications</h3>
                            <button 
                              onClick={() => { setShowCertModal(false); setEditingCertification(null); }} 
                              className="text-gray-400 hover:text-gray-600 transition"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Modal Content */}
                          <div className="flex-1 overflow-y-auto p-6">
                            <Certifications 
                              getToken={getToken} 
                              onListUpdate={(updated) => setCertList(updated)} 
                              editingCertification={editingCertification}
                            />
                          </div>
                          
                          {/* Modal Footer */}
                          <div className="flex justify-end space-x-4 p-6 border-t sticky bottom-0 bg-white">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCertModal(false);
                                setEditingCertification(null);
                              }}
                              className="px-6 py-2 border rounded-lg transition"
                              style={{ borderColor: '#D1D5DB', color: '#374151' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Close
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Trigger form submit
                                const form = document.getElementById('cert-form');
                                if (form) form.requestSubmit();
                              }}
                              className="px-6 py-2 text-white rounded-lg transition"
                              style={{ backgroundColor: '#777C6D' }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#656A5C'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#777C6D'}
                            >
                              Save Certification
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    

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

          {/* Danger Zone: Account deletion */}
          <Card variant="outlined" className="mt-6 border-2" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#DC2626' }}>Danger Zone</h2>
            <p className="text-sm mb-4" style={{ color: '#111827' }}>
              <strong>Warning:</strong> Deleting your account will <strong>immediately and permanently</strong> remove all your personal data. 
              This action cannot be undone. You will be logged out immediately and your account will no longer exist.
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
          </Card>
        </div>
      </Container>

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
                  <strong>Warning:</strong> This will <strong>immediately and permanently delete</strong> your account and all associated data. 
                  This action cannot be undone and you will be logged out immediately.
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
      
      {/* Delete Confirmation Modal - Education */}
      {showEducationDeleteModal && deletingEducation && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }}
          onClick={(e) => {
            if (!isDeleting) {
              handleCancelEducationDelete();
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
                Are you sure you want to delete this education entry?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900">{deletingEducation.institution}</p>
                <p className="text-gray-700">{deletingEducation.degree} — {deletingEducation.fieldOfStudy}</p>
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
                onClick={handleCancelEducationDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEducation}
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

      {/* Add/Edit Education Modal */}
      {showEducationModal && (
        <EducationModal
          isOpen={showEducationModal}
          onClose={() => {
            setShowEducationModal(false);
            setEditingEducation(null);
          }}
          onSuccess={(newEducation, message) => {
            setEducationList(newEducation);
            setEditingEducation(null);
            setShowEducationModal(false);
            setEducationSuccessMessage(message);
            setTimeout(() => setEducationSuccessMessage(null), 5000);
          }}
          getToken={getToken}
          editingEducation={editingEducation}
        />
      )}

      {/* Add/Edit Skill Modal */}
      {showSkillModal && (
        <SkillModal
          isOpen={showSkillModal}
          onClose={() => { setShowSkillModal(false); setEditingSkill(null); }}
          onSuccess={(newSkills, message) => {
            setSkillList(newSkills);
            setEditingSkill(null);
            setShowSkillModal(false);
            setSkillSuccessMessage(message);
            setTimeout(() => setSkillSuccessMessage(null), 5000);
          }}
          getToken={getToken}
          editingSkill={editingSkill}
          skillList={skillList}
        />
      )}

      {/* Add/Edit Project Modal */}
      {showProjectModal && (
        <Projects
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSuccess={(updatedList, message) => {
            setProjectList(updatedList);
            setShowProjectModal(false);
            setEditingProject(null);
            setProjectSuccessMessage(message);
            setTimeout(() => setProjectSuccessMessage(null), 5000);
          }}
          editingProject={editingProject}
          getToken={getToken}
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

// Sortable Skill Item Component
function SortableSkillItem({ skill, onEdit, onDelete, onMoveCategory, categories }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-gray-200 text-gray-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-indigo-100 text-indigo-800';
      case 'Expert': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
    >
      <div className="flex items-center space-x-3 flex-1">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
          title="Drag to reorder"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Skill Name */}
        <span className="text-sm font-medium text-gray-800 flex-1">{skill.name}</span>

        {/* Proficiency Badge */}
        <span className={`text-xs px-2 py-1 rounded font-medium ${getLevelColor(skill.level)}`}>
          {skill.level}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition">
        {/* Move to Category Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition"
            title="Move to category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M3 7h.01M3 12h.01M3 17h.01" />
            </svg>
          </button>
          {showCategoryMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {categories.filter(cat => cat !== skill.category).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      onMoveCategory(skill, cat);
                      setShowCategoryMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    Move to {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(skill)}
          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          title="Edit skill"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(skill)}
          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
          title="Delete skill"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Education Modal Component
function EducationModal({ isOpen, onClose, onSuccess, getToken, editingEducation }) {
  const isEditMode = !!editingEducation;

  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    gpa: '',
    gpaPrivate: true,
    achievements: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pre-populate when editing
  useEffect(() => {
    if (editingEducation) {
      const startDate = new Date(editingEducation.startDate);
      const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
      const startYear = startDate.getFullYear();
      const formattedStartDate = `${startMonth}/${startYear}`;

      let formattedEndDate = '';
      if (editingEducation.endDate && !editingEducation.current) {
        const endDate = new Date(editingEducation.endDate);
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        const endYear = endDate.getFullYear();
        formattedEndDate = `${endMonth}/${endYear}`;
      }

      setFormData({
        institution: editingEducation.institution || '',
        degree: editingEducation.degree || '',
        fieldOfStudy: editingEducation.fieldOfStudy || '',
        location: editingEducation.location || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        current: editingEducation.current || false,
        gpa: typeof editingEducation.gpa !== 'undefined' && editingEducation.gpa !== null ? String(editingEducation.gpa) : '',
        gpaPrivate: typeof editingEducation.gpaPrivate === 'boolean' ? editingEducation.gpaPrivate : true,
        achievements: editingEducation.achievements || ''
      });
    } else {
      setFormData({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        gpa: '',
        gpaPrivate: true,
        achievements: ''
      });
    }
    setError(null);
    setSuccessMessage(null);
  }, [editingEducation]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // handle date formatting similar to employment
    if (name === 'startDate' || name === 'endDate') {
      let cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 6) cleaned = cleaned.substring(0, 6);
      let formatted = cleaned;
      if (cleaned.length >= 3) formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.institution.trim()) {
      errors.push({ field: 'institution', message: 'Institution is required' });
    }

    if (!formData.degree) {
      errors.push({ field: 'degree', message: 'Degree is required' });
    }

    if (!formData.fieldOfStudy.trim()) {
      errors.push({ field: 'fieldOfStudy', message: 'Field of study is required' });
    }

    if (!formData.startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    } else {
      const datePattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
      if (!datePattern.test(formData.startDate)) {
        errors.push({ field: 'startDate', message: 'Invalid start date format. Use MM/YYYY' });
      }
    }

    if (!formData.current) {
      if (!formData.endDate) {
        errors.push({ field: 'endDate', message: 'Graduation date is required when not currently enrolled' });
      } else {
        const datePattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
        if (!datePattern.test(formData.endDate)) {
          errors.push({ field: 'endDate', message: 'Invalid graduation date format. Use MM/YYYY' });
        } else {
          const [endMonth, endYear] = formData.endDate.split('/');
          const endDateObj = new Date(endYear, endMonth - 1, 1);
          if (isNaN(endDateObj.getTime())) {
            errors.push({ field: 'endDate', message: 'Invalid graduation date' });
          } else if (formData.startDate) {
            const startPattern = /^(0[1-9]|1[0-2])\/\d{4}$/;
            if (startPattern.test(formData.startDate)) {
              const [startMonth, startYear] = formData.startDate.split('/');
              const startDateObj = new Date(startYear, startMonth - 1, 1);
              if (!isNaN(startDateObj.getTime()) && startDateObj >= endDateObj) {
                errors.push({ field: 'endDate', message: 'Graduation date must be after start date' });
              }
            }
          }
        }
      }
    }

    if (formData.gpa) {
      const g = parseFloat(formData.gpa);
      if (isNaN(g) || g < 0 || g > 4.5) {
        errors.push({ field: 'gpa', message: 'GPA must be a number between 0.0 and 4.5' });
      }
    }

    if (formData.achievements && formData.achievements.length > 1000) {
      errors.push({ field: 'achievements', message: 'Achievements text is too long' });
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError({ customError: { errorCode: 2001, message: 'Please fix the following errors before submitting:', errors: validationErrors } });
      return;
    }

    setIsSaving(true);

    try {
      const token = await getToken();
      setAuthToken(token);

      // Format dates exactly like employment format
      const payload = { ...formData };
      const parseMMYYYY = (dateStr) => {
        if (!dateStr) return null;
        const [month, year] = dateStr.split('/');
        if (!month || !year) return null;
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toISOString();
      };

      payload.startDate = parseMMYYYY(formData.startDate);
      payload.endDate = formData.current ? null : parseMMYYYY(formData.endDate);
      
      // Handle optional fields
      if (payload.gpa === '') {
        delete payload.gpa;
      } else if (payload.gpa) {
        payload.gpa = parseFloat(payload.gpa);
      }
      if (!payload.achievements) delete payload.achievements;
      if (!payload.location) delete payload.location;

      let response;
      if (isEditMode) {
        // Edit existing education
        response = await api.put(`/api/profile/education/${editingEducation._id}`, payload);
      } else {
        // Add new education
        response = await api.post('/api/profile/education', payload);
      }
      
      const successMsg = isEditMode 
        ? 'Education entry updated successfully!' 
        : 'Education entry added successfully!';
      
      // Call success callback with updated education list and message
      onSuccess(response.data.data.education || response.data.data || [], successMsg);
      
      // For add mode only: clear form and show inline success message
      if (!isEditMode) {
        setFormData({
          institution: '', 
          degree: '', 
          fieldOfStudy: '', 
          location: '', 
          startDate: '', 
          endDate: '', 
          current: false, 
          gpa: '', 
          gpaPrivate: true, 
          achievements: ''
        });
        setError(null);
        setSuccessMessage(successMsg);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error(isEditMode ? 'Error updating education:' : 'Error adding education:', err);
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ institution: '', degree: '', fieldOfStudy: '', location: '', startDate: '', endDate: '', current: false, gpa: '', gpaPrivate: true, achievements: '' });
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const DEGREE_OPTIONS = ["High School", "Associate", "Bachelor's", "Master's", "PhD", "Other"];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }} onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-2xl font-heading font-semibold">{isEditMode ? 'Edit Education' : 'Add Education'}</h3>
          <button onClick={handleClose} disabled={isSaving} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution <span className="text-red-500">*</span></label>
              <input name="institution" value={formData.institution} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="University of Example" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree <span className="text-red-500">*</span></label>
                <select name="degree" value={formData.degree} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select degree...</option>
                  {DEGREE_OPTIONS.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study <span className="text-red-500">*</span></label>
                <input name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Computer Science" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (MM/YYYY) <span className="text-red-500">*</span></label>
                <input name="startDate" value={formData.startDate} onChange={handleInputChange} placeholder="09/2020" maxLength={7} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Date (MM/YYYY) {!formData.current && <span className="text-red-500">*</span>}</label>
                <input name="endDate" value={formData.endDate} onChange={handleInputChange} placeholder="06/2024" maxLength={7} disabled={formData.current} className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" name="current" checked={formData.current} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-700">I am currently enrolled</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GPA (optional)</label>
                <input name="gpa" value={formData.gpa} onChange={handleInputChange} placeholder="3.75" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="gpaPrivate" checked={formData.gpaPrivate} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-700">Keep GPA private</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Honors / Achievements</label>
              <textarea name="achievements" value={formData.achievements} onChange={handleInputChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none" placeholder="Dean's List, Cum Laude, Scholarship..." />
            </div>

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
                {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Education' : 'Save Education')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
 
// Skill Modal Component
function SkillModal({ isOpen, onClose, onSuccess, getToken, editingSkill, skillList = [] }) {
  const isEditMode = !!editingSkill;
  const [formData, setFormData] = useState({ name: '', category: 'Technical', level: 'Beginner' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const SUGGESTIONS = ['JavaScript','Python','React','Node.js','TypeScript','Communication','Leadership','Project Management','Spanish','French'];
  const CATEGORIES = ['Technical','Soft Skills','Languages','Industry-Specific'];
  const LEVELS = ['Beginner','Intermediate','Advanced','Expert'];

  useEffect(() => {
    if (editingSkill) {
      setFormData({
        name: editingSkill.name || '',
        category: editingSkill.category || 'Technical',
        level: editingSkill.level || 'Beginner'
      });
    } else {
      setFormData({ name: '', category: 'Technical', level: 'Beginner' });
    }
    setError(null);
    setSuccessMessage(null);
  }, [editingSkill]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errs = [];
    if (!formData.name.trim()) errs.push({ field: 'name', message: 'Skill name is required' });
    if (!formData.category) errs.push({ field: 'category', message: 'Category is required' });
    if (!formData.level) errs.push({ field: 'level', message: 'Proficiency level is required' });

    // Duplicate prevention (case-insensitive) when adding new
    if (!isEditMode && skillList.some(s => s.name.toLowerCase() === formData.name.trim().toLowerCase())) {
      errs.push({ field: 'name', message: 'This skill already exists' });
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const validation = validateForm();
    if (validation.length > 0) {
      setError({ customError: { errorCode: 2001, message: 'Please fix the following errors', errors: validation } });
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      setAuthToken(token);

      let response;
      const payload = { name: formData.name.trim(), category: formData.category, level: formData.level };
      if (isEditMode) {
        response = await api.put(`/api/profile/skills/${editingSkill._id}`, payload);
      } else {
        response = await api.post('/api/profile/skills', payload);
      }

      const successMsg = isEditMode ? 'Skill updated successfully!' : 'Skill added successfully!';
      // onSuccess expects (newSkills, message)
      const updated = response?.data?.data?.skills || response?.data?.data || null;
      if (updated) {
        onSuccess(updated, successMsg);
      } else {
        // Fallback: call onSuccess with merged list
        const merged = isEditMode ? skillList.map(s => s._id === editingSkill._id ? { ...s, ...payload } : s) : [{ ...payload, _id: Date.now().toString() }, ...skillList];
        onSuccess(merged, successMsg);
      }

      if (!isEditMode) {
        setFormData({ name: '', category: 'Technical', level: 'Beginner' });
        setSuccessMessage(successMsg);
        setTimeout(() => setSuccessMessage(null), 2500);
      }
    } catch (err) {
      console.error('Error saving skill:', err);
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', category: 'Technical', level: 'Beginner' });
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.48)' }} onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{isEditMode ? 'Edit Skill' : 'Add Skill'}</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {successMessage && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-800">{successMessage}</div>}
        {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill name <span className="text-red-500">*</span></label>
            <input list="skill-suggestions" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded" placeholder="e.g. JavaScript" />
            <datalist id="skill-suggestions">
              {SUGGESTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
              <select name="level" value={formData.level} onChange={handleInputChange} className="w-full px-3 py-2 border rounded">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

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
              {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Skill' : 'Save Skill')}
            </button>
          </div>
        </form>
      </div>
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
                  : (isEditMode ? 'Update Employment' : 'Save Employment')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
