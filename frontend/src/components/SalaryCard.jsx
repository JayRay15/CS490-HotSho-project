import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { DollarSign, TrendingUp, Briefcase } from 'lucide-react';

/**
 * UC-067: Salary Card Component
 * 
 * Displays a quick salary overview for a job with option to view full research
 */
const SalaryCard = ({ job, compactMode = false }) => {
  const navigate = useNavigate();

  const handleViewResearch = () => {
    navigate(`/salary-research/${job._id}`);
  };

  if (!job) return null;

  // Determine if we have salary data
  const hasSalaryData = job.salary?.min || job.salary?.max;
  const salaryMin = job.salary?.min || 0;
  const salaryMax = job.salary?.max || 0;
  const salaryMedian = hasSalaryData ? (salaryMin + salaryMax) / 2 : 0;

  if (compactMode) {
    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Estimated Salary</p>
            {hasSalaryData ? (
              <p className="text-sm font-semibold text-gray-900">
                ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Research available</p>
            )}
          </div>
        </div>
        <Button
          onClick={handleViewResearch}
          variant="outline"
          size="small"
          className="text-xs"
        >
          View Research
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Salary Research</h3>
            <p className="text-sm text-gray-600">{job.company}</p>
          </div>
        </div>
        <Button onClick={handleViewResearch} size="small">
          Full Report
        </Button>
      </div>

      <div className="space-y-4">
        {/* Salary Range */}
        {hasSalaryData ? (
          <div>
            <p className="text-xs text-gray-600 mb-1">Listed Salary Range</p>
            <p className="text-xl font-bold text-gray-900">
              ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Median: ${salaryMedian.toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">No salary data provided</p>
            <p className="text-sm text-gray-600">View research for market estimates</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Market Data</p>
              <p className="text-sm font-semibold text-gray-900">Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-600">Industry</p>
              <p className="text-sm font-semibold text-gray-900">{job.industry || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-600 mb-2">
            Get comprehensive salary insights including:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Market benchmarks & compensation analysis</li>
            <li>• Negotiation recommendations</li>
            <li>• Historical trends & comparisons</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default SalaryCard;
