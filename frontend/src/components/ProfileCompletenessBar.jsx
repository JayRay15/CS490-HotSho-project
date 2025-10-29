import { calculateProfileCompleteness, getProfileStrength } from '../utils/profileCompleteness';

/**
 * Compact Profile Completeness Bar - Displays a simple progress indicator
 * Use this for inline display in navigation or at the top of profile pages
 */
export default function ProfileCompletenessBar({ userData, showLabel = true, className = '' }) {
  if (!userData) return null;

  const completeness = calculateProfileCompleteness(userData);
  const strength = getProfileStrength(completeness.overallScore);

  const getProgressColor = (score) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 75) return '#3B82F6'; // blue
    if (score >= 50) return '#F59E0B'; // yellow
    if (score >= 25) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Strength</span>
          <span className={`text-sm font-semibold ${strength.color}`}>
            {completeness.overallScore}% • {strength.label}
          </span>
        </div>
      )}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${completeness.overallScore}%`,
            backgroundColor: getProgressColor(completeness.overallScore)
          }}
        />
      </div>
      {!showLabel && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {completeness.overallScore}% complete
        </div>
      )}
    </div>
  );
}
