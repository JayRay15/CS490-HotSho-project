import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import {
  getLinkedInProfile,
  saveLinkedInProfile,
  generateNetworkingTemplates,
  getOptimizationSuggestions,
  getContentStrategies,
  createNetworkingCampaign,
  getNetworkingCampaigns,
  updateCampaignMetrics,
  deleteCampaign,
} from "../../api/linkedin";
import { setAuthToken } from "../../api/axios";

export default function LinkedInSettings() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  // Templates state
  const [templateType, setTemplateType] = useState("connectionRequest");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Optimization state
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Content strategy state
  const [strategies, setStrategies] = useState(null);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  
  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    targetCompanies: "",
    targetRoles: "",
    goals: "",
    duration: 30,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const data = await getLinkedInProfile();
      setProfile(data.data);
      setLinkedinUrl(data.data?.linkedin || "");
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      setAuthToken(token);
      await saveLinkedInProfile(linkedinUrl);
      setMessage({ type: "success", text: "LinkedIn profile saved successfully!" });
      await loadProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const token = await getToken();
      setAuthToken(token);
      const data = await generateNetworkingTemplates({
        templateType,
        targetRole,
        targetCompany,
      });
      setTemplates(data.data?.templates || []);
    } catch (error) {
      console.error("Error generating templates:", error);
      setMessage({ type: "error", text: "Failed to generate templates" });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadOptimizationSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const token = await getToken();
      setAuthToken(token);
      const data = await getOptimizationSuggestions();
      setSuggestions(data.data);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadContentStrategies = async () => {
    try {
      setLoadingStrategies(true);
      const token = await getToken();
      setAuthToken(token);
      const data = await getContentStrategies();
      setStrategies(data.data);
    } catch (error) {
      console.error("Error loading strategies:", error);
    } finally {
      setLoadingStrategies(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      const data = await getNetworkingCampaigns();
      setCampaigns(data.data?.campaigns || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      setAuthToken(token);
      await createNetworkingCampaign({
        ...newCampaign,
        targetCompanies: newCampaign.targetCompanies.split(",").map(s => s.trim()).filter(Boolean),
        targetRoles: newCampaign.targetRoles.split(",").map(s => s.trim()).filter(Boolean),
      });
      setMessage({ type: "success", text: "Campaign created successfully!" });
      setShowCampaignForm(false);
      setNewCampaign({ name: "", targetCompanies: "", targetRoles: "", goals: "", duration: 30 });
      await loadCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      setMessage({ type: "error", text: "Failed to create campaign" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCampaign = async (campaignId, updates) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await updateCampaignMetrics(campaignId, updates);
      await loadCampaigns();
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteCampaign(campaignId);
      setMessage({ type: "success", text: "Campaign deleted" });
      await loadCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "optimization" && !suggestions) {
      loadOptimizationSuggestions();
    }
    if (activeTab === "content" && !strategies) {
      loadContentStrategies();
    }
    if (activeTab === "campaigns") {
      loadCampaigns();
    }
  }, [activeTab]);

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Integration</h1>
      <p className="text-gray-600 mb-6">Optimize your LinkedIn presence and networking strategy</p>

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

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "profile", label: "Profile Link" },
            { id: "templates", label: "Networking Templates" },
            { id: "optimization", label: "Profile Optimization" },
            { id: "content", label: "Content Strategy" },
            { id: "campaigns", label: "Campaigns" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Link Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connect Your LinkedIn Profile</h2>
                <p className="text-gray-600">Link your profile to enable personalized networking features</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be included in your job applications and networking outreach
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save LinkedIn Profile"}
              </Button>
            </div>
          </Card>

          {/* Status Card */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Profile Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{profile?.linkedin ? "✅" : "❌"}</div>
                <div className="text-sm text-gray-600">Profile Linked</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{profile?.headline ? "✅" : "⚠️"}</div>
                <div className="text-sm text-gray-600">Headline Set</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{profile?.picture ? "✅" : "⚠️"}</div>
                <div className="text-sm text-gray-600">Photo Added</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">
                  {profile?.linkedinSettings?.lastSynced ? "✅" : "❓"}
                </div>
                <div className="text-sm text-gray-600">Last Synced</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Networking Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Generate Message Templates</h3>
            <p className="text-gray-600 mb-4">
              Create personalized LinkedIn message templates for networking outreach
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="connectionRequest">Connection Request</option>
                  <option value="followUp">Follow-Up Message</option>
                  <option value="informationalInterview">Informational Interview</option>
                  <option value="referral">Referral Request</option>
                  <option value="thankYou">Thank You Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Company (Optional)
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g., Google"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button onClick={handleGenerateTemplates} disabled={loadingTemplates}>
              {loadingTemplates ? "Generating..." : "Generate Templates"}
            </Button>
          </Card>

          {/* Generated Templates */}
          {templates.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Generated Templates</h4>
              {templates.map((template, index) => (
                <Card key={index} className="relative">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-semibold text-gray-900">{template.title}</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(template.message)}
                    >
                      📋 Copy
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <p className="text-gray-800 whitespace-pre-line">{template.message}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    <strong>Best for:</strong> {template.bestFor}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Optimization Tab */}
      {activeTab === "optimization" && (
        <div className="space-y-6">
          {loadingSuggestions ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : suggestions ? (
            <>
              {/* Profile Score */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Profile Completeness</h3>
                    <p className="text-gray-600">Based on your HotSho profile data</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600">
                      {suggestions.profileCompleteness?.score}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Level: {suggestions.profileCompleteness?.level}
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${suggestions.profileCompleteness?.score}%` }}
                  ></div>
                </div>
              </Card>

              {/* High Priority */}
              {suggestions.suggestions?.highPriority?.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="text-red-500 mr-2">🔴</span> High Priority Improvements
                  </h3>
                  <div className="space-y-4">
                    {suggestions.suggestions.highPriority.map((item, index) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-medium text-red-600 uppercase">
                              {item.category}
                            </span>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-gray-700 mt-1">{item.description}</p>
                            {item.example && (
                              <p className="text-sm text-gray-500 mt-2 italic">
                                Example: {item.example}
                              </p>
                            )}
                            {item.tips && (
                              <ul className="mt-2 space-y-1">
                                {item.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-start">
                                    <span className="mr-2">•</span> {tip}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        {item.impact && (
                          <p className="text-sm text-red-700 mt-3">
                            <strong>Impact:</strong> {item.impact}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Medium Priority */}
              {suggestions.suggestions?.mediumPriority?.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="text-yellow-500 mr-2">🟡</span> Medium Priority
                  </h3>
                  <div className="space-y-3">
                    {suggestions.suggestions.mediumPriority.map((item, index) => (
                      <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <span className="text-xs font-medium text-yellow-600 uppercase">
                          {item.category}
                        </span>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-700 mt-1">{item.description}</p>
                        {item.recommendation && (
                          <p className="text-sm text-yellow-700 mt-2">
                            <strong>Recommendation:</strong> {item.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Low Priority */}
              {suggestions.suggestions?.lowPriority?.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="text-green-500 mr-2">🟢</span> Nice to Have
                  </h3>
                  <div className="space-y-3">
                    {suggestions.suggestions.lowPriority.map((item, index) => (
                      <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <span className="text-xs font-medium text-green-600 uppercase">
                          {item.category}
                        </span>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-700 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="text-center py-12">
              <p className="text-gray-600">Unable to load suggestions</p>
              <Button onClick={loadOptimizationSuggestions} className="mt-4">
                Try Again
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Content Strategy Tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {loadingStrategies ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : strategies ? (
            <>
              {/* Posting Frequency */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">📅 Posting Strategy</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Frequency</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {strategies.strategies?.postingFrequency?.recommendation}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {strategies.strategies?.postingFrequency?.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Best Times to Post</h4>
                    <div className="flex flex-wrap gap-2">
                      {strategies.strategies?.postingFrequency?.bestTimes?.map((time, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Content Types */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">📝 Content Types</h3>
                <div className="space-y-4">
                  {strategies.strategies?.contentTypes?.map((type, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{type.type}</h4>
                          <p className="text-gray-600 mt-1">{type.description}</p>
                          <p className="text-sm text-gray-500 mt-2 italic">
                            Example: "{type.example}"
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          type.engagement === "Very High" ? "bg-green-100 text-green-800" :
                          type.engagement === "High" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {type.engagement} Engagement
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Weekly Calendar */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">🗓️ Content Calendar Template</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(strategies.strategies?.contentCalendarTemplate || {}).map(([day, content]) => (
                    <div key={day} className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="font-medium text-gray-900 capitalize">{day}</div>
                      <div className="text-sm text-gray-600 mt-1">{content}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Engagement Tips */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">💡 Engagement Tips</h3>
                <ul className="space-y-3">
                  {strategies.strategies?.engagementTips?.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-3">✓</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Hashtags */}
              <Card>
                <h3 className="text-lg font-semibold mb-4"># Recommended Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {strategies.strategies?.hashtagStrategy?.recommended?.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => copyToClipboard(tag)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {strategies.strategies?.hashtagStrategy?.tip}
                </p>
              </Card>
            </>
          ) : (
            <Card className="text-center py-12">
              <p className="text-gray-600">Unable to load content strategies</p>
              <Button onClick={loadContentStrategies} className="mt-4">
                Try Again
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Networking Campaigns</h3>
              <p className="text-gray-600">Track your networking outreach progress</p>
            </div>
            <Button onClick={() => setShowCampaignForm(true)}>
              + New Campaign
            </Button>
          </div>

          {/* Campaign Form */}
          {showCampaignForm && (
            <Card>
              <h4 className="font-semibold mb-4">Create New Campaign</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g., Q1 Tech Company Outreach"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Companies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newCampaign.targetCompanies}
                      onChange={(e) => setNewCampaign({ ...newCampaign, targetCompanies: e.target.value })}
                      placeholder="Google, Meta, Amazon"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Roles (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newCampaign.targetRoles}
                      onChange={(e) => setNewCampaign({ ...newCampaign, targetRoles: e.target.value })}
                      placeholder="Software Engineer, Product Manager"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goals
                  </label>
                  <textarea
                    value={newCampaign.goals}
                    onChange={(e) => setNewCampaign({ ...newCampaign, goals: e.target.value })}
                    placeholder="What do you want to achieve with this campaign?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign({ ...newCampaign, duration: parseInt(e.target.value) })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || saving}>
                    {saving ? "Creating..." : "Create Campaign"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCampaignForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Campaign List */}
          {campaigns.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-2">No campaigns yet</h4>
              <p className="text-gray-600 mb-4">
                Create a networking campaign to track your outreach efforts
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign._id}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "active" ? "bg-green-100 text-green-800" :
                          campaign.status === "completed" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {campaign.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          Started {new Date(campaign.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {campaign.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateCampaign(campaign._id, { status: "completed" })}
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCampaign(campaign._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {[
                      { key: "connectionsSent", label: "Sent", icon: "📤" },
                      { key: "connectionsAccepted", label: "Accepted", icon: "✅" },
                      { key: "messagesSent", label: "Messages", icon: "💬" },
                      { key: "responses", label: "Responses", icon: "📩" },
                      { key: "meetings", label: "Meetings", icon: "📅" },
                    ].map((metric) => (
                      <div key={metric.key} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg mb-1">{metric.icon}</div>
                        <input
                          type="number"
                          min="0"
                          value={campaign.metrics?.[metric.key] || 0}
                          onChange={(e) => handleUpdateCampaign(campaign._id, {
                            metrics: { ...campaign.metrics, [metric.key]: parseInt(e.target.value) || 0 }
                          })}
                          className="w-16 text-center text-xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                        />
                        <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Target Info */}
                  {(campaign.targetCompanies?.length > 0 || campaign.targetRoles?.length > 0) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t">
                      {campaign.targetCompanies?.map((company, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                          🏢 {company}
                        </span>
                      ))}
                      {campaign.targetRoles?.map((role, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          👤 {role}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
