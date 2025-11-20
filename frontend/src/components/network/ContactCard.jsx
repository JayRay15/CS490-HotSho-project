import { useState } from 'react';
import Card from '../Card';
import Button from '../Button';

const relationshipTypeColors = {
  Mentor: 'bg-purple-100 text-purple-800',
  Peer: 'bg-blue-100 text-blue-800',
  Recruiter: 'bg-green-100 text-green-800',
  Manager: 'bg-orange-100 text-orange-800',
  Colleague: 'bg-cyan-100 text-cyan-800',
  Alumni: 'bg-indigo-100 text-indigo-800',
  'Industry Contact': 'bg-pink-100 text-pink-800',
  Other: 'bg-gray-100 text-gray-800'
};

const strengthColors = {
  Strong: 'text-green-600',
  Medium: 'text-yellow-600',
  Weak: 'text-orange-600',
  New: 'text-gray-600'
};

export default function ContactCard({ contact, onEdit, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isFollowUpOverdue = () => {
    if (!contact.nextFollowUpDate) return false;
    return new Date(contact.nextFollowUpDate) < new Date();
  };

  // Use outlined variant for black border, remove shadow
  return (
    <Card variant="outlined" className="border-black !shadow-none p-3 md:p-4">
      <div className="flex flex-col h-full text-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h3>
            {contact.jobTitle && (
              <p className="text-sm text-gray-600">{contact.jobTitle}</p>
            )}
            {contact.company && (
              <p className="text-sm text-gray-500">{contact.company}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(contact)}
              className="p-1 rounded-lg transition flex-shrink-0 flex items-center justify-center"
              style={{ color: '#6B7280' }}
              onMouseOver={e => {
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Edit contact"
              title="Edit contact"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(contact._id)}
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
              aria-label="Delete contact"
              title="Delete contact"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              relationshipTypeColors[contact.relationshipType] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {contact.relationshipType}
          </span>
          <span className={`text-xs font-medium ${strengthColors[contact.relationshipStrength]}`}>
            ● {contact.relationshipStrength}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-2 flex-1">
          {contact.email && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <a href={`mailto:${contact.email}`} className="hover:text-primary-600 truncate">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{contact.location}</span>
            </div>
          )}
          {contact.linkedInUrl && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <a
                href={contact.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 truncate"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>

        {/* Interaction Info */}
        <div className="border-t pt-2 mt-2 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Last Contact:</span>
            <span className="font-medium">{formatDate(contact.lastContactDate)}</span>
          </div>
          {contact.nextFollowUpDate && (
            <div className="flex justify-between">
              <span>Next Follow-up:</span>
              <span
                className={`font-medium ${
                  isFollowUpOverdue() ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {formatDate(contact.nextFollowUpDate)}
                {isFollowUpOverdue() && ' (Overdue)'}
              </span>
            </div>
          )}
          {contact.interactions && contact.interactions.length > 0 && (
            <div className="flex justify-between">
              <span>Interactions:</span>
              <span className="font-medium">{contact.interactions.length}</span>
            </div>
          )}
        </div>

        {/* Toggle Details Button */}
        {(contact.notes || contact.tags?.length > 0) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 text-sm text-primary-600 hover:text-primary-800 font-medium transition-shadow rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
            style={{ boxShadow: 'none' }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(0,0,0,0.10)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t space-y-2">
            {contact.notes && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                <p className="text-sm text-gray-600">{contact.notes}</p>
              </div>
            )}
            {contact.tags && contact.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Tags:</p>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
