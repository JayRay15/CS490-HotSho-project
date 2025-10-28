import { useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import { resizeImage, isValidImageType, isValidImageSize, formatFileSize, blobToFile } from "../utils/imageUtils";
import ErrorMessage from "./ErrorMessage";

export default function ProfilePictureUpload({ currentPicture, onUploadSuccess, onDeleteSuccess }) {
  const { getToken } = useAuth();
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!isValidImageType(file)) {
      setError({
        customError: {
          errorCode: 4001,
          message: "Invalid file type. Please select a JPG, PNG, or GIF image."
        }
      });
      return;
    }

    // Validate file size (before resizing)
    if (!isValidImageSize(file, 5)) {
      setError({
        customError: {
          errorCode: 4002,
          message: `File is too large (${formatFileSize(file.size)}). Maximum size is 5 MB.`
        }
      });
      return;
    }

    try {
      // Resize image to 512x512
      setUploadProgress(30);
      const resizedBlob = await resizeImage(file, 512, 512, 0.9);
      const resizedFile = blobToFile(resizedBlob, file.name);
      
      setSelectedFile(resizedFile);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(resizedBlob);
      setPreview(previewUrl);
      setUploadProgress(0);
    } catch (err) {
      console.error("Error processing image:", err);
      setError({
        customError: {
          errorCode: 4003,
          message: "Failed to process image. Please try another file."
        }
      });
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      // If no new file selected, just close modal
      setShowModal(false);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(50);

    try {
      const token = await getToken();
      setAuthToken(token);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('picture', selectedFile);

      setUploadProgress(70);

      const response = await api.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      setUploadProgress(100);

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(response.data.data.picture);
      }

      // Clear selection and close modal
      setSelectedFile(null);
      setPreview(null);
      setUploadProgress(0);
      setShowModal(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError(err);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const token = await getToken();
      setAuthToken(token);

      await api.delete('/api/users/profile-picture');

      // Call success callback
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

      // Clear any preview and close modal
      setSelectedFile(null);
      setPreview(null);
      setShowModal(false);
    } catch (err) {
      console.error("Error deleting profile picture:", err);
      setError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayPicture = preview || currentPicture;

  return (
    <div className="relative">
      {/* Profile Picture with Hover Effect */}
      <div 
        className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-gray-300 cursor-pointer group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setShowModal(true)}
      >
        {/* Image or Default Avatar */}
        {displayPicture ? (
          <img src={displayPicture} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )}

        {/* Hover Overlay with Edit Icon */}
        <div className={`absolute inset-0 bg-black transition-opacity duration-200 flex items-center justify-center ${isHovering ? 'opacity-50' : 'opacity-0'}`}>
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.48)' }} onClick={handleCancel}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 relative border border-gray-200" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
              disabled={isUploading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Title */}
            <h3 className="text-xl font-heading font-semibold mb-4">Edit Profile Picture</h3>

            {/* Preview */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-gray-300 mb-3">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : currentPicture ? (
                  <img src={currentPicture} alt="Current" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && uploadProgress > 0 && (
                <div className="w-full">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">{uploadProgress}% uploading...</p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <ErrorMessage
                error={error}
                onDismiss={() => setError(null)}
                className="mb-4"
              />
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-picture-input-modal"
              disabled={isUploading}
            />

            {/* Action Buttons */}
            <div className="space-y-2">
              <label
                htmlFor="profile-picture-input-modal"
                className={`block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer text-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Choose New Picture
              </label>
              <p className="text-xs text-gray-500 text-center">JPG, PNG, or GIF • Max 5MB</p>

              {currentPicture && (
                <button
                  onClick={handleDelete}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Removing..." : "Delete Picture"}
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={isUploading || !selectedFile}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
