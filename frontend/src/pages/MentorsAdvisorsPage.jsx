import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MentorDashboard } from "../components/mentors";
import AdvisorsPage from "./AdvisorsPage";
import { Users, GraduationCap } from "lucide-react";

/**
 * MentorsAdvisorsPage - Combined page for Mentor Hub and Advisor Hub
 * Shows both features in separate tabs
 */
export default function MentorsAdvisorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to "mentors"
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "mentors");

  // Tab definitions
  const tabs = [
    { id: "mentors", label: "Mentor Hub", icon: Users },
    { id: "advisors", label: "Advisor Hub", icon: GraduationCap },
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "mentors") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E4E6E0" }}>
      <div className="max-w-7xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#4F5348" }}>
            Mentors & Advisors
          </h1>
          <p style={{ color: "#656A5C" }}>
            Connect with mentors and career advisors to guide your professional journey
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-300 mb-0">
          <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center py-2 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? "border-[#777C6D] text-[#4F5348]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "mentors" && <MentorHubContent />}
          {activeTab === "advisors" && <AdvisorHubContent />}
        </div>
      </div>
    </div>
  );
}

/**
 * MentorHubContent - Wrapper that renders MentorDashboard without its own container
 */
function MentorHubContent() {
  return (
    <div className="-mt-8">
      <MentorDashboard />
    </div>
  );
}

/**
 * AdvisorHubContent - Wrapper that renders AdvisorsPage without its own container
 */
function AdvisorHubContent() {
  return (
    <div className="py-8 -mx-4">
      <AdvisorsPage />
    </div>
  );
}
