import { useState } from 'react';
import { Calendar, MapPin, Users, Target, CheckCircle, TrendingUp, Edit3, Trash2, Globe } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

const eventTypeColors = {
  Conference: 'bg-purple-100 text-purple-800',
  Meetup: 'bg-blue-100 text-blue-800',
  'Career Fair': 'bg-green-100 text-green-800',
  Workshop: 'bg-yellow-100 text-yellow-800',
  Webinar: 'bg-indigo-100 text-indigo-800',
  'Social Event': 'bg-pink-100 text-pink-800',
  'Industry Mixer': 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800'
};

const attendanceStatusColors = {
  'Planning to Attend': 'bg-blue-100 text-blue-800',
  Registered: 'bg-green-100 text-green-800',
  Attended: 'bg-purple-100 text-purple-800',
  Missed: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-800'
};

export default function NetworkingEventCard({ event, onEdit, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isUpcoming = () => {
    return new Date(event.eventDate) > new Date() && event.attendanceStatus !== 'Cancelled';
  };

  const isPast = () => {
    return new Date(event.eventDate) <= new Date();
  };

  const goalCompletionRate = () => {
    if (!event.goals || event.goals.length === 0) return 0;
    const achieved = event.goals.filter(g => g.achieved).length;
    return Math.round((achieved / event.goals.length) * 100);
  };

  return (
    <Card variant="outlined" className="border-black !shadow-none p-3 md:p-4">
      <div className="flex flex-col h-full text-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar size={16} />
              <span>{formatDate(event.eventDate)}</span>
              {event.eventDate && <span>at {formatTime(event.eventDate)}</span>}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(event)}
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
              aria-label="Edit event"
              title="Edit event"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => onDelete(event)}
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
              aria-label="Delete event"
              title="Delete event"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {event.eventType}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              attendanceStatusColors[event.attendanceStatus] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {event.attendanceStatus}
          </span>
          {event.isVirtual && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center gap-1">
              <Globe size={12} />
              Virtual
            </span>
          )}
        </div>

        {/* Location */}
        {(event.location || event.virtualLink) && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin size={16} className="mr-2" />
            {event.isVirtual ? (
              event.virtualLink ? (
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 truncate"
                >
                  {event.virtualLink}
                </a>
              ) : (
                <span>Virtual Event</span>
              )
            ) : (
              <span>{event.location}</span>
            )}
          </div>
        )}

        {/* Industry */}
        {event.industry && (
          <div className="text-sm text-gray-600 mb-3">
            <strong>Industry:</strong> {event.industry}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Connections</div>
              <div className="font-semibold">{event.connectionsGained || 0}</div>
            </div>
          </div>
          {event.goals && event.goals.length > 0 && (
            <div className="flex items-center gap-2">
              <Target size={16} className="text-green-600" />
              <div>
                <div className="text-xs text-gray-600">Goals</div>
                <div className="font-semibold">{goalCompletionRate()}%</div>
              </div>
            </div>
          )}
          {event.jobLeadsGenerated > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-600" />
              <div>
                <div className="text-xs text-gray-600">Job Leads</div>
                <div className="font-semibold">{event.jobLeadsGenerated}</div>
              </div>
            </div>
          )}
          {event.roiRating && (
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-yellow-600" />
              <div>
                <div className="text-xs text-gray-600">ROI Rating</div>
                <div className="font-semibold">{event.roiRating}/5</div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Details Button */}
        {(event.description || event.goals?.length > 0 || event.keyTakeaways || event.preparationNotes) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-sm text-primary-600 hover:text-primary-800 font-medium transition-shadow rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
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
          <div className="mt-3 pt-3 border-t space-y-3">
            {event.description && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Description:</p>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            )}
            {event.goals && event.goals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Networking Goals:</p>
                <ul className="space-y-1">
                  {event.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${
                          goal.achieved ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <span className={goal.achieved ? 'text-gray-600' : 'text-gray-500'}>
                        {goal.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isPast() && event.keyTakeaways && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Key Takeaways:</p>
                <p className="text-sm text-gray-600">{event.keyTakeaways}</p>
              </div>
            )}
            {isUpcoming() && event.preparationNotes && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Preparation Notes:</p>
                <p className="text-sm text-gray-600">{event.preparationNotes}</p>
              </div>
            )}
            {event.connections && event.connections.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Connections Made:</p>
                <ul className="space-y-1">
                  {event.connections.slice(0, 3).map((connection, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {connection.name}
                      {connection.followUpCompleted && (
                        <CheckCircle size={14} className="inline ml-1 text-green-600" />
                      )}
                    </li>
                  ))}
                  {event.connections.length > 3 && (
                    <li className="text-sm text-gray-500">
                      + {event.connections.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
