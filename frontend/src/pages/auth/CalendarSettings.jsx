import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  getCalendarStatus,
  updateCalendarPreferences,
} from "../../api/calendar";

export default function CalendarSettings() {
  const { user, isLoaded: userLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [preferences, setPreferences] = useState({
    autoSync: true,
    defaultCalendar: "none",
    reminderMinutes: [1440, 120],
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get Google account from Clerk if user signed in with Google
  const googleAccount = user?.externalAccounts?.find(
    (account) => account.provider === "google" || account.provider === "oauth_google"
  );
  const hasGoogleConnected = !!googleAccount;
  const googleEmail = googleAccount?.emailAddress || user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await getCalendarStatus();
      setStatus(data);
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Error loading calendar status:", error);
      // Don't show error - just use defaults
    } finally {
      setLoading(false);
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

  if (loading || !userLoaded) {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar Integration</h1>
      <p className="text-gray-600 mb-6">Manage how your interviews sync with your calendar</p>

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

      {/* Active Features Banner */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Interview Scheduling is Active</h3>
            <p className="text-sm text-green-800 mb-3">
              All interview scheduling features are working. You can schedule interviews, get email reminders, and track preparation tasks.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Schedule Interviews
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Email Reminders (24h, 2h, 1h)
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Preparation Tasks
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Download .ics Files
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
              <p className="text-sm text-gray-500">
                {hasGoogleConnected 
                  ? "Your Google account is connected via Clerk"
                  : "Download .ics files to add interviews to Google Calendar"
                }
              </p>
              {hasGoogleConnected && googleEmail && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Signed in as: {googleEmail}
                </p>
              )}
            </div>
          </div>
          <div>
            {hasGoogleConnected ? (
              <span className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                ✓ Connected
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Use .ics Export
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Outlook Calendar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.354.228-.588.228h-8.174v-6.182l1.602 1.172a.354.354 0 00.424.016.388.388 0 00.186-.336V7.387a.39.39 0 00-.186-.336.354.354 0 00-.424.016l-1.602 1.172V2.67h8.174c.234 0 .43.076.588.228A.777.777 0 0124 3.474v3.913zm-10.666 3.127v8.15L0 16.004V5.018l13.334 2.643v2.853z"/>
                <path fill="#0078D4" d="M13.334 2.67v5.57L0 5.017V2.67c0-.332.115-.611.346-.838C.578 1.605.864 1.49 1.202 1.49h10.93c.338 0 .626.115.858.342.232.227.344.506.344.838z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Outlook Calendar</h3>
              <p className="text-sm text-gray-500">
                Download .ics files to add interviews to Outlook
              </p>
            </div>
          </div>
          <div>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Use .ics Export
            </span>
          </div>
        </div>
      </Card>

      {/* ICS Download Info */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-start space-x-3">
          <div className="text-xl">📥</div>
          <div>
            <h4 className="font-medium text-gray-900">Manual Calendar Import</h4>
            <p className="text-sm text-gray-600 mt-1">
              Don't want to connect your calendar? Download .ics files from any interview card and import them directly into any calendar app (Apple Calendar, Google Calendar, Outlook, etc.)
            </p>
          </div>
        </div>
      </div>

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

      {/* How it works section */}
      <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <span className="mr-2">💡</span> How Interview Scheduling Works
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm text-blue-800">
            <p className="flex items-start">
              <span className="mr-2 text-blue-600">1.</span>
              Schedule interviews from any job application
            </p>
            <p className="flex items-start">
              <span className="mr-2 text-blue-600">2.</span>
              Preparation tasks are auto-generated for you
            </p>
            <p className="flex items-start">
              <span className="mr-2 text-blue-600">3.</span>
              Email reminders sent 24h, 2h, and 1h before
            </p>
          </div>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="flex items-start">
              <span className="mr-2 text-blue-600">4.</span>
              Track interview outcomes and follow-ups
            </p>
            <p className="flex items-start">
              <span className="mr-2 text-blue-600">5.</span>
              Download .ics files for any calendar app
            </p>
            <p className="flex items-start">
              <span className="mr-2 text-blue-600">6.</span>
              Connect calendars for automatic sync (optional)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
