import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  getCalendarStatus,
  initiateGoogleAuth,
  initiateOutlookAuth,
  disconnectCalendar,
  updateCalendarPreferences,
} from "../../api/calendar";

export default function CalendarSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [preferences, setPreferences] = useState({
    autoSync: true,
    defaultCalendar: "none",
    reminderMinutes: [1440, 120],
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadStatus();
    
    // Check for OAuth callback messages
    const connected = searchParams.get("calendar_connected");
    const error = searchParams.get("calendar_error");
    
    if (connected) {
      setMessage({
        type: "success",
        text: `${connected.charAt(0).toUpperCase() + connected.slice(1)} Calendar connected successfully!`,
      });
      // Clean up URL
      searchParams.delete("calendar_connected");
      setSearchParams(searchParams);
    }
    
    if (error) {
      setMessage({
        type: "error",
        text: `Failed to connect calendar: ${error.replace(/_/g, " ")}`,
      });
      searchParams.delete("calendar_error");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await getCalendarStatus();
      setStatus(data);
      setPreferences(data.preferences);
    } catch (error) {
      console.error("Error loading calendar status:", error);
      setMessage({ type: "error", text: "Failed to load calendar settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { authUrl } = await initiateGoogleAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Google auth:", error);
      setMessage({ type: "error", text: "Failed to connect Google Calendar" });
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const { authUrl } = await initiateOutlookAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error initiating Outlook auth:", error);
      setMessage({ type: "error", text: "Failed to connect Outlook Calendar" });
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Disconnect ${provider} Calendar? Your interviews will no longer sync.`)) {
      return;
    }

    try {
      setSaving(true);
      await disconnectCalendar(provider);
      setMessage({ type: "success", text: `${provider} Calendar disconnected` });
      await loadStatus();
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      setMessage({ type: "error", text: "Failed to disconnect calendar" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await updateCalendarPreferences(preferences);
      setMessage({ type: "success", text: "Preferences saved successfully" });
      await loadStatus();
    } catch (error) {
      console.error("Error saving preferences:", error);
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Calendar Integration</h1>

      {/* Configuration Notice */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📅 Calendar Sync Available</h3>
        <p className="text-sm text-blue-800 mb-2">
          Calendar sync requires OAuth credentials to be configured in your environment. 
          Currently, you can download .ics files manually from any interview card.
        </p>
        <p className="text-sm text-blue-700">
          <strong>Working features:</strong> Schedule interviews, download .ics files, email reminders, prep task tracking
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Google Calendar */}
      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">📅</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Google Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sync your interviews to Google Calendar automatically
              </p>
              {status?.google?.connected && status?.google?.email && (
                <p className="text-xs text-gray-500 mt-2">
                  Connected: {status.google.email}
                </p>
              )}
            </div>
          </div>
          <div>
            {status?.google?.connected ? (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Connected
                </span>
                <Button
                  onClick={() => handleDisconnect("google")}
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                Requires OAuth Setup
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Outlook Calendar */}
      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">📧</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Outlook Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sync your interviews to Outlook/Microsoft 365 Calendar
              </p>
              {status?.outlook?.connected && status?.outlook?.email && (
                <p className="text-xs text-gray-500 mt-2">
                  Connected: {status.outlook.email}
                </p>
              )}
            </div>
          </div>
          <div>
            {status?.outlook?.connected ? (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Connected
                </span>
                <Button
                  onClick={() => handleDisconnect("outlook")}
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                Requires OAuth Setup
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Sync Preferences</h3>

        <div className="space-y-6">
          {/* Auto-sync toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Automatic Sync</label>
              <p className="text-sm text-gray-600">
                Automatically create calendar events when scheduling interviews
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoSync}
                onChange={(e) =>
                  setPreferences({ ...preferences, autoSync: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Default calendar */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              Default Calendar
            </label>
            <select
              value={preferences.defaultCalendar}
              onChange={(e) =>
                setPreferences({ ...preferences, defaultCalendar: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="none">No default (manual selection)</option>
              {status?.google?.connected && (
                <option value="google">Google Calendar</option>
              )}
              {status?.outlook?.connected && (
                <option value="outlook">Outlook Calendar</option>
              )}
            </select>
            <p className="text-sm text-gray-600 mt-1">
              Choose which calendar to use by default when creating interviews
            </p>
          </div>

          {/* Reminder times */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              Email Reminders
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preferences.reminderMinutes?.includes(1440)}
                  onChange={(e) => {
                    const newReminders = e.target.checked
                      ? [...(preferences.reminderMinutes || []), 1440]
                      : preferences.reminderMinutes?.filter((m) => m !== 1440) || [];
                    setPreferences({ ...preferences, reminderMinutes: newReminders });
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">24 hours before</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preferences.reminderMinutes?.includes(120)}
                  onChange={(e) => {
                    const newReminders = e.target.checked
                      ? [...(preferences.reminderMinutes || []), 120]
                      : preferences.reminderMinutes?.filter((m) => m !== 120) || [];
                    setPreferences({ ...preferences, reminderMinutes: newReminders });
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">2 hours before</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preferences.reminderMinutes?.includes(60)}
                  onChange={(e) => {
                    const newReminders = e.target.checked
                      ? [...(preferences.reminderMinutes || []), 60]
                      : preferences.reminderMinutes?.filter((m) => m !== 60) || [];
                    setPreferences({ ...preferences, reminderMinutes: newReminders });
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">1 hour before</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSavePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Info section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Connect one or both calendar providers using OAuth</li>
          <li>• New interviews will automatically create calendar events</li>
          <li>• Rescheduling or canceling interviews updates your calendar</li>
          <li>• Download .ics files for any interview from the interview card</li>
          <li>• Email reminders are sent based on your preferences</li>
        </ul>
      </div>
    </div>
  );
}
