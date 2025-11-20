import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { getReferrals, updateReferral, deleteReferral } from '../../api/referralApi';
import { toast } from 'react-hot-toast';
import DeleteConfirmationModal from '../resume/DeleteConfirmationModal';

const ReferralList = ({ refreshTrigger }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingReferral, setDeletingReferral] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, [refreshTrigger, filterStatus]);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await getReferrals(filters);
      setReferrals(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (referralId, newStatus) => {
    try {
      await updateReferral(referralId, { status: newStatus });
      toast.success('Status updated successfully');
      loadReferrals();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = (referral) => {
    setDeletingReferral(referral);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingReferral) return;
    setIsDeleting(true);
    try {
      await deleteReferral(deletingReferral._id);
      toast.success('Referral deleted successfully');
      setShowDeleteModal(false);
      setDeletingReferral(null);
      loadReferrals();
    } catch (error) {
      console.error('Error deleting referral:', error);
      toast.error('Failed to delete referral');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkGratitudeExpressed = async (referralId) => {
    try {
      await updateReferral(referralId, { 
        gratitudeExpressed: true,
        gratitudeDate: new Date().toISOString()
      });
      toast.success('Gratitude marked as expressed');
      loadReferrals();
    } catch (error) {
      console.error('Error updating gratitude:', error);
      toast.error('Failed to update gratitude status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      requested: 'bg-blue-100 text-blue-700 border-blue-300',
      accepted: 'bg-green-100 text-green-700 border-green-300',
      declined: 'bg-red-100 text-red-700 border-red-300',
      no_response: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <FileText size={16} />,
      requested: <Send size={16} />,
      accepted: <CheckCircle size={16} />,
      declined: <XCircle size={16} />,
      no_response: <Clock size={16} />
    };
    return icons[status] || icons.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Referral Requests</h2>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          {['all', 'draft', 'requested', 'accepted', 'declined', 'no_response'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-[#777C6D] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      {referrals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Send size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Referral Requests Yet</h3>
          <p className="text-gray-600">
            {filterStatus === 'all' 
              ? 'Start by requesting a referral from one of your contacts'
              : `No ${filterStatus.replace('_', ' ')} referrals found`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(showAll ? referrals : referrals.slice(0, 3)).map(referral => {
            const isExpanded = expandedId === referral._id;
            return (
              <div
                key={referral._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {referral.jobId?.title || 'Unknown Job'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(referral.status)}`}>
                          {getStatusIcon(referral.status)}
                          {referral.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">
                          {referral.contactId?.firstName} {referral.contactId?.lastName}
                        </span>
                        <span>•</span>
                        <span>{referral.jobId?.company || 'Unknown Company'}</span>
                        {referral.contactId?.company && (
                          <>
                            <span>•</span>
                            <span>Works at {referral.contactId.company}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : referral._id)}
                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title={isExpanded ? 'Hide details' : 'View details'}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? 'Hide details' : 'View details'}
                      </button>
                      <button
                        onClick={() => handleDelete(referral)}
                        className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
                        style={{ color: '#6B7280' }}
                        onMouseOver={e => {
                          e.currentTarget.style.color = '#B91C1C';
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.color = '#6B7280';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        aria-label="Delete referral"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex items-center gap-6 text-sm">
                    {referral.requestedDate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>Requested {new Date(referral.requestedDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {referral.followUpDate && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock size={16} />
                        <span>Follow-up {new Date(referral.followUpDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {referral.etiquetteScore > 0 && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp size={16} />
                        <span>Etiquette: {referral.etiquetteScore}/10</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-6 space-y-4">
                    {/* Request Content */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Request Message:</div>
                      <div className="bg-white p-4 rounded-lg border text-sm text-gray-800 whitespace-pre-wrap">
                        {referral.requestContent}
                      </div>
                    </div>

                    {/* Notes */}
                    {referral.notes && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Private Notes:</div>
                        <div className="bg-white p-4 rounded-lg border text-sm text-gray-600">
                          {referral.notes}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                      {referral.status === 'draft' && (
                        <button
                          onClick={() => handleStatusUpdate(referral._id, 'requested')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                        >
                          <Send size={16} />
                          Mark as Sent
                        </button>
                      )}
                      
                      {referral.status === 'requested' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(referral._id, 'accepted')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <ThumbsUp size={16} />
                            Mark Accepted
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(referral._id, 'declined')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                          >
                            <ThumbsDown size={16} />
                            Mark Declined
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(referral._id, 'no_response')}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center gap-2"
                          >
                            <Clock size={16} />
                            No Response
                          </button>
                        </>
                      )}

                      {(referral.status === 'accepted' || referral.status === 'declined') && !referral.gratitudeExpressed && (
                        <button
                          onClick={() => handleMarkGratitudeExpressed(referral._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Mark Gratitude Expressed
                        </button>
                      )}

                      {referral.gratitudeExpressed && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <CheckCircle size={16} />
                          Gratitude Expressed on {new Date(referral.gratitudeDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* View More / View Less Button */}
          {referrals.length > 3 && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setShowAll(v => !v)}
                className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#777C6D' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#656A5C'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#777C6D'}
              >
                {showAll ? 'View Less' : `View More (${referrals.length - 3} more)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal for referrals */}
      <DeleteConfirmationModal
        showModal={showDeleteModal}
        itemToDelete={deletingReferral}
        itemType="referral"
        itemDetails={{
          name: deletingReferral ? (deletingReferral.contactId?.firstName ? `${deletingReferral.contactId.firstName} ${deletingReferral.contactId.lastName}` : '') : '',
          subtitle: deletingReferral ? (deletingReferral.jobId?.title ? `${deletingReferral.jobId.title} at ${deletingReferral.jobId.company}` : '') : ''
        }}
        onClose={() => { setShowDeleteModal(false); setDeletingReferral(null); }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ReferralList;
