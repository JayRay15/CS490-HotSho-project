import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PerformanceDashboard from "./auth/PerformanceDashboard";
import ApplicationSuccessAnalysis from "./auth/ApplicationSuccessAnalysis";
import { BarChart3, Target } from "lucide-react";

/**
 * MyPerformancePage - Combined page for Performance Dashboard and Success Analysis
 * Shows both features in separate tabs
 */
export default function MyPerformancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to "dashboard"
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "dashboard");

  // Sync tab state with URL on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Tab definitions
  const tabs = [
    { id: "dashboard", label: "Performance Dashboard", icon: BarChart3 },
    { id: "success", label: "Success Analysis", icon: Target },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-600 mt-1">
            Track your job search performance and analyze success patterns
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "dashboard" && <PerformanceDashboardContent />}
          {activeTab === "success" && <SuccessAnalysisContent />}
        </div>
      </div>
    </div>
  );
}

/**
 * PerformanceDashboardContent - Wrapper that renders PerformanceDashboard content
 */
function PerformanceDashboardContent() {
  return (
    <div className="-mx-4 -mt-8">
      <PerformanceDashboard />
    </div>
  );
}

/**
 * SuccessAnalysisContent - Wrapper that renders ApplicationSuccessAnalysis content
 */
function SuccessAnalysisContent() {
  return (
    <div className="-mx-4 -mt-8">
      <ApplicationSuccessAnalysis />
    </div>
  );
}
