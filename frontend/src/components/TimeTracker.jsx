import React, { useState, useEffect } from 'react';
import { productivityApi } from '../api/productivity';
import Card from './Card';
import Button from './Button';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Activity, 
  TrendingUp, 
  Target,
  Calendar,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';

const ACTIVITIES = [
  'Job Search',
  'Resume Writing',
  'Cover Letter Writing',
  'Application Submission',
  'Networking',
  'Skill Development',
  'Interview Preparation',
  'Mock Interviews',
  'Company Research',
  'Portfolio Work',
  'LinkedIn Activity',
  'Follow-ups',
  'Career Planning',
  'Break',
  'Other'
];

const ENERGY_LEVELS = ['Low', 'Medium', 'High', 'Peak'];
const FOCUS_QUALITY = ['Poor', 'Fair', 'Good', 'Excellent'];

export default function TimeTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeRecord, setTimeRecord] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('0h 0m');
  
  const [formData, setFormData] = useState({
    activity: 'Job Search',
    customActivity: '',
    energyLevel: 'Medium',
    focusQuality: 'Good',
    productivity: 5,
    distractions: 0,
    notes: '',
    tags: []
  });

  useEffect(() => {
    loadTimeRecord();
  }, [selectedDate]);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!isTracking || !activeEntry) return;

    const updateElapsed = () => {
      const start = new Date(activeEntry.startTime);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000 / 60);
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      setElapsedTime(`${hours}h ${mins}m`);
    };

    updateElapsed(); // Initial update
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isTracking, activeEntry]);

  const loadTimeRecord = async () => {
    try {
      setLoading(true);
      const response = await productivityApi.getTimeTrackingByDate(selectedDate);
      setTimeRecord(response.record);
      
      const ongoing = response.record.entries.find(e => !e.endTime);
      if (ongoing) {
        setActiveEntry(ongoing);
        setIsTracking(true);
      }
    } catch (error) {
      console.error('Failed to load time record:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    try {
      const startTime = new Date().toISOString();
      const entryData = {
        ...formData,
        startTime,
        tags: formData.tags.filter(t => t.trim())
      };

      const response = await productivityApi.addTimeEntry(selectedDate, entryData);
      setTimeRecord(response.record);
      
      const newEntry = response.record.entries[response.record.entries.length - 1];
      setActiveEntry(newEntry);
      setIsTracking(true);
      setShowEntryForm(false);
      
      setFormData({
        activity: 'Job Search',
        customActivity: '',
        energyLevel: 'Medium',
        focusQuality: 'Good',
        productivity: 5,
        distractions: 0,
        notes: '',
        tags: []
      });
    } catch (error) {
      console.error('Failed to start tracking:', error);
      alert('Failed to start tracking. Please try again.');
    }
  };

  const stopTracking = async () => {
    if (!activeEntry) return;

    try {
      const endTime = new Date().toISOString();
      const response = await productivityApi.updateTimeEntry(
        selectedDate,
        activeEntry._id,
        { endTime }
      );
      
      setTimeRecord(response.record);
      setActiveEntry(null);
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      alert('Failed to stop tracking. Please try again.');
    }
  };

  const deleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await productivityApi.deleteTimeEntry(selectedDate, entryId);
      setTimeRecord(response.record);
      
      if (activeEntry && activeEntry._id === entryId) {
        setActiveEntry(null);
        setIsTracking(false);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getElapsedTime = () => {
    if (!activeEntry) return '0h 0m';
    
    const start = new Date(activeEntry.startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000 / 60);
    return formatDuration(diff);
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-heading font-bold text-gray-900">Time Tracker</h2>
            <p className="text-gray-600">Track your job search activities</p>
          </div>
        </div>
        
        <input
          type="date"
          value={selectedDate}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How to Track Your Time</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Start New Activity" and fill in the form</li>
              <li>• Click "Start Tracking" to begin the timer</li>
              <li>• The timer will run until you click "Stop"</li>
              <li>• Only completed activities (with start AND stop times) are included in analysis</li>
              <li>• Track at least 2-3 activities before generating an analysis</li>
            </ul>
          </div>
        </div>
      </Card>

      {isTracking && activeEntry && (
        <Card variant="primary" className="border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Activity className="w-8 h-8 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeEntry.activity === 'Other' && activeEntry.customActivity 
                    ? activeEntry.customActivity 
                    : activeEntry.activity}
                </h3>
                <p className="text-gray-600">Tracking in progress...</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-primary font-mono">
                {elapsedTime}
              </div>
              <Button
                variant="danger"
                size="small"
                onClick={stopTracking}
                className="mt-2"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!isTracking && !showEntryForm && (
        <Button
          variant="primary"
          onClick={() => setShowEntryForm(true)}
          className="w-full"
        >
          <Play className="w-5 h-5 mr-2" />
          Start New Activity
        </Button>
      )}

      {showEntryForm && !isTracking && (
        <Card variant="elevated">
          <h3 className="text-lg font-semibold mb-4">Start Tracking</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity *
              </label>
              <select
                value={formData.activity}
                onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                {ACTIVITIES.map(activity => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </select>
            </div>

            {formData.activity === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Activity Name
                </label>
                <input
                  type="text"
                  value={formData.customActivity}
                  onChange={(e) => setFormData(prev => ({ ...prev, customActivity: e.target.value }))}
                  placeholder="e.g., Phone Screening, Coffee Chat"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy Level
                </label>
                <select
                  value={formData.energyLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, energyLevel: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {ENERGY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Quality
                </label>
                <select
                  value={formData.focusQuality}
                  onChange={(e) => setFormData(prev => ({ ...prev, focusQuality: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {FOCUS_QUALITY.map(quality => (
                    <option key={quality} value={quality}>{quality}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Productivity Rating: {formData.productivity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.productivity}
                onChange={(e) => setFormData(prev => ({ ...prev, productivity: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="What are you working on? Any specific goals?"
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Press Enter to add)
              </label>
              <input
                type="text"
                onKeyDown={handleTagInput}
                placeholder="Add tags..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={startTracking} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEntryForm(false);
                  setFormData({
                    activity: 'Job Search',
                    customActivity: '',
                    energyLevel: 'Medium',
                    focusQuality: 'Good',
                    productivity: 5,
                    distractions: 0,
                    notes: '',
                    tags: []
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {timeRecord && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Today's Summary</h3>
            {timeRecord.dailySummary && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {timeRecord.dailySummary.totalHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">
                  {timeRecord.dailySummary.productiveHours.toFixed(1)}h productive
                </div>
              </div>
            )}
          </div>

          {timeRecord.dailySummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Avg Energy</div>
                <div className="text-lg font-semibold">{timeRecord.dailySummary.averageEnergy}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Focus</div>
                <div className="text-lg font-semibold">{timeRecord.dailySummary.averageFocus}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Productivity</div>
                <div className="text-lg font-semibold">{timeRecord.dailySummary.averageProductivity}/10</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Outcomes</div>
                <div className="text-lg font-semibold">{timeRecord.dailySummary.totalOutcomes}</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Activity Log</h4>
            
            {timeRecord.entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No activities tracked yet. Start tracking to see your log!
              </p>
            ) : (
              timeRecord.entries.map(entry => (
                <div
                  key={entry._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-gray-900">
                          {entry.activity === 'Other' && entry.customActivity 
                            ? entry.customActivity 
                            : entry.activity}
                        </h5>
                        {!entry.endTime && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          {new Date(entry.startTime).toLocaleTimeString()} 
                          {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString()}`}
                          {entry.duration > 0 && ` (${formatDuration(entry.duration)})`}
                        </div>
                        <div className="flex gap-4">
                          <span>Energy: {entry.energyLevel}</span>
                          <span>Focus: {entry.focusQuality}</span>
                          <span>Productivity: {entry.productivity}/10</span>
                        </div>
                        {entry.notes && (
                          <div className="text-gray-700 mt-2">{entry.notes}</div>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {entry.endTime && (
                      <button
                        onClick={() => deleteEntry(entry._id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
