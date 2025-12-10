import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { setAuthToken } from "../../api/axios";
import { fetchResumes } from "../../api/resumes";
import { fetchCoverLetters } from "../../api/coverLetters";
import {
  getABTests,
  createABTest,
  getTestResults,
  declareWinner,
  updateTestStatus,
  archiveLosingVersion,
  deleteABTest,
  syncFromJobs,
} from "../../api/abTests";

// ============================================================================
// UC-120: A/B Testing for Resume and Cover Letter Versions
// ============================================================================

export default function ABTestingPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [abTests, setAbTests] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("tests");
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);

      const [testsRes, resumesRes, coverLettersRes] = await Promise.all([
        getABTests(),
        fetchResumes(),
        fetchCoverLetters(),
      ]);

      setAbTests(testsRes.data?.abTests || []);
      setResumes(resumesRes.data?.resumes || resumesRes.data || []);
      setCoverLetters(coverLettersRes.data?.coverLetters || coverLettersRes.data || []);
    } catch (err) {
      console.error("Failed to load A/B testing data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromJobs = async () => {
    try {
      setSyncing(true);
      const token = await getToken();
      setAuthToken(token);
      await syncFromJobs();
      await loadData();
    } catch (err) {
      console.error("Failed to sync from jobs:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewResults = async (test) => {
    try {
      setSelectedTest(test);
      setResultsLoading(true);
      const token = await getToken();
      setAuthToken(token);
      const results = await getTestResults(test._id);
      setTestResults(results.data);
    } catch (err) {
      console.error("Failed to load test results:", err);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleDeclareWinner = async (testId, versionIndex, reason) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await declareWinner(testId, { winningVersionIndex: versionIndex, reason });
      await loadData();
      if (selectedTest?._id === testId) {
        handleViewResults(selectedTest);
      }
    } catch (err) {
      console.error("Failed to declare winner:", err);
    }
  };

  const handleArchiveLoser = async (testId, losingVersionIndex) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await archiveLosingVersion(testId, losingVersionIndex);
      await loadData();
    } catch (err) {
      console.error("Failed to archive loser:", err);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      const token = await getToken();
      setAuthToken(token);
      await deleteABTest(testId);
      setSelectedTest(null);
      setTestResults(null);
      await loadData();
    } catch (err) {
      console.error("Failed to delete test:", err);
    }
  };

  const handleStatusChange = async (testId, newStatus) => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await updateTestStatus(testId, newStatus);
      await loadData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
          <p className="text-gray-600 mt-1">
            Test different versions of your resume and cover letter to find what works best
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={handleSyncFromJobs} disabled={syncing}>
            {syncing ? "⏳ Syncing..." : "🔄 Sync from Jobs"}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            + Create Test
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        <button
          onClick={() => { setActiveTab("tests"); setSelectedTest(null); }}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "tests" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🧪 My Tests ({abTests.length})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "create" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ➕ Create New Test
        </button>
        {selectedTest && (
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "results" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📊 Test Results
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "tests" && (
        <TestsListTab
          abTests={abTests}
          onViewResults={handleViewResults}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteTest}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "create" && (
        <CreateTestTab
          resumes={resumes}
          coverLetters={coverLetters}
          onCreated={() => { loadData(); setActiveTab("tests"); }}
          getToken={getToken}
        />
      )}

      {activeTab === "results" && selectedTest && (
        <TestResultsTab
          test={selectedTest}
          results={testResults}
          loading={resultsLoading}
          onDeclareWinner={handleDeclareWinner}
          onArchiveLoser={handleArchiveLoser}
          onRefresh={() => handleViewResults(selectedTest)}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTestModal
          resumes={resumes}
          coverLetters={coverLetters}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { loadData(); setShowCreateModal(false); }}
          getToken={getToken}
        />
      )}
    </div>
  );
}

// ============================================================================
// Tests List Tab
// ============================================================================
function TestsListTab({ abTests, onViewResults, onStatusChange, onDelete, setActiveTab }) {
  const activeTests = abTests.filter(t => t.status === "active");
  const completedTests = abTests.filter(t => t.status === "completed");
  const pausedTests = abTests.filter(t => t.status === "paused");

  if (abTests.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-6xl mb-4">🧪</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No A/B Tests Yet</h2>
        <p className="text-gray-600 mb-4">
          Create your first test to compare different versions of your resume or cover letter
        </p>
        <Button onClick={() => setActiveTab("create")}>
          Create Your First Test
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tests */}
      {activeTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Active Tests ({activeTests.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {activeTests.map(test => (
              <TestCard
                key={test._id}
                test={test}
                onViewResults={onViewResults}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused Tests */}
      {pausedTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            Paused Tests ({pausedTests.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {pausedTests.map(test => (
              <TestCard
                key={test._id}
                test={test}
                onViewResults={onViewResults}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Completed Tests ({completedTests.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {completedTests.map(test => (
              <TestCard
                key={test._id}
                test={test}
                onViewResults={onViewResults}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Test Card Component
// ============================================================================
function TestCard({ test, onViewResults, onStatusChange, onDelete }) {
  const allHaveMinSample = test.versions.every(v => v.applicationsAssigned >= test.minSampleSize);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-lg">{test.name}</h4>
          <p className="text-sm text-gray-500">
            {test.materialType === "resume" ? "📄 Resume" : "✉️ Cover Letter"} Test
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          test.status === "active" ? "bg-green-100 text-green-700" :
          test.status === "paused" ? "bg-yellow-100 text-yellow-700" :
          test.status === "completed" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
        </span>
      </div>

      {/* Version Comparison */}
      <div className="space-y-2 mb-4">
        {test.versions.map((version, idx) => {
          const rate = version.applicationsAssigned > 0 
            ? ((version.interviews / version.applicationsAssigned) * 100).toFixed(1) 
            : 0;
          const hasMinSample = version.applicationsAssigned >= test.minSampleSize;

          return (
            <div key={idx} className={`p-2 rounded-lg ${
              test.winningVersionIndex === idx ? "bg-green-50 border border-green-200" : "bg-gray-50"
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center gap-2">
                  {test.winningVersionIndex === idx && <span>🏆</span>}
                  {version.versionLabel}
                </span>
                <div className="flex items-center gap-3 text-sm">
                  <span className={hasMinSample ? "text-green-600" : "text-gray-500"}>
                    {version.applicationsAssigned}/{test.minSampleSize} apps
                  </span>
                  <span className="font-bold">{rate}% interview rate</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${hasMinSample ? "bg-green-500" : "bg-blue-400"}`}
                  style={{ width: `${Math.min(100, (version.applicationsAssigned / test.minSampleSize) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status indicator */}
      {!allHaveMinSample && (
        <div className="mb-3 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-700">
          ⚠️ Need at least {test.minSampleSize} applications per version for statistical significance
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        <Button size="sm" onClick={() => onViewResults(test)}>
          📊 View Results
        </Button>
        {test.status === "active" && (
          <Button size="sm" variant="outline" onClick={() => onStatusChange(test._id, "paused")}>
            ⏸️ Pause
          </Button>
        )}
        {test.status === "paused" && (
          <Button size="sm" variant="outline" onClick={() => onStatusChange(test._id, "active")}>
            ▶️ Resume
          </Button>
        )}
        <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDelete(test._id)}>
          🗑️
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// Create Test Tab
// ============================================================================
function CreateTestTab({ resumes, coverLetters, onCreated, getToken }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    materialType: "resume",
    versionIds: [],
    minSampleSize: 10,
    targetSampleSize: 20,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const materials = formData.materialType === "resume" ? resumes : coverLetters;
  const availableMaterials = materials.filter(m => !m.isArchived);

  const handleToggleMaterial = (id) => {
    setFormData(prev => ({
      ...prev,
      versionIds: prev.versionIds.includes(id)
        ? prev.versionIds.filter(v => v !== id)
        : [...prev.versionIds, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.versionIds.length < 2) {
      setError("Please select at least 2 versions to compare");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const token = await getToken();
      setAuthToken(token);
      await createABTest(formData);
      onCreated();
    } catch (err) {
      console.error("Failed to create test:", err);
      setError(err.response?.data?.message || "Failed to create test");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Create New A/B Test</h2>
      <p className="text-gray-600 mb-6">
        Select versions of your {formData.materialType} to compare. We recommend testing 2 versions 
        and applying to at least 10 similar jobs with each version.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Resume Format Test - Tech Roles"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what you're testing..."
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Material Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What are you testing?
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, materialType: "resume", versionIds: [] }))}
              className={`flex-1 p-4 rounded-lg border-2 transition ${
                formData.materialType === "resume"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="font-medium">Resume Versions</div>
              <div className="text-sm text-gray-500">{resumes.filter(r => !r.isArchived).length} available</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, materialType: "coverLetter", versionIds: [] }))}
              className={`flex-1 p-4 rounded-lg border-2 transition ${
                formData.materialType === "coverLetter"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-3xl mb-2">✉️</div>
              <div className="font-medium">Cover Letter Versions</div>
              <div className="text-sm text-gray-500">{coverLetters.filter(c => !c.isArchived).length} available</div>
            </button>
          </div>
        </div>

        {/* Version Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Versions to Compare * (minimum 2)
          </label>
          {availableMaterials.length < 2 ? (
            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700">
              You need at least 2 {formData.materialType === "resume" ? "resumes" : "cover letters"} to create an A/B test.
              Create more versions first.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {availableMaterials.map((material) => {
                const isSelected = formData.versionIds.includes(material._id);
                const idx = formData.versionIds.indexOf(material._id);
                return (
                  <button
                    key={material._id}
                    type="button"
                    onClick={() => handleToggleMaterial(material._id)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(material.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          Version {String.fromCharCode(65 + idx)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sample Size */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Sample Size (per version)
            </label>
            <input
              type="number"
              value={formData.minSampleSize}
              onChange={(e) => setFormData(prev => ({ ...prev, minSampleSize: parseInt(e.target.value) || 10 }))}
              min={5}
              max={50}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 10 recommended for statistical significance</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Sample Size (per version)
            </label>
            <input
              type="number"
              value={formData.targetSampleSize}
              onChange={(e) => setFormData(prev => ({ ...prev, targetSampleSize: parseInt(e.target.value) || 20 }))}
              min={10}
              max={100}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={creating || formData.versionIds.length < 2}>
            {creating ? "Creating..." : "Create A/B Test"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ============================================================================
// Test Results Tab
// ============================================================================
function TestResultsTab({ test, results, loading, onDeclareWinner, onArchiveLoser, onRefresh }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!results) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-600">No results available yet</p>
        <Button variant="outline" className="mt-4" onClick={onRefresh}>
          🔄 Refresh Results
        </Button>
      </Card>
    );
  }

  const { metrics, statisticalSignificance, suggestedWinner, declaredWinner, elementAnalysis } = results;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{results.test.name}</h2>
          <p className="text-gray-600">
            {results.test.materialType === "resume" ? "📄 Resume" : "✉️ Cover Letter"} Test • 
            Started {new Date(results.test.startedAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh}>
          🔄 Refresh
        </Button>
      </div>

      {/* Sample Size Progress */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📊 Sample Size Progress</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {metrics.versions.map((v, idx) => (
            <div key={idx} className={`p-4 rounded-lg ${v.hasMinSample ? "bg-green-50" : "bg-gray-50"}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{v.label}: {v.name}</span>
                <span className={`px-2 py-1 text-xs rounded ${v.hasMinSample ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}>
                  {v.applications}/{metrics.minSampleSize}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${v.hasMinSample ? "bg-green-500" : "bg-blue-400"}`}
                  style={{ width: `${v.sampleProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {v.hasMinSample ? "✅ Minimum sample reached" : `Need ${metrics.minSampleSize - v.applications} more applications`}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Comparison */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">🏆 Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Version</th>
                <th className="pb-3 text-center">Applications</th>
                <th className="pb-3 text-center">Response Rate</th>
                <th className="pb-3 text-center">Interview Rate</th>
                <th className="pb-3 text-center">Offer Rate</th>
                <th className="pb-3 text-center">Avg Response Time</th>
              </tr>
            </thead>
            <tbody>
              {metrics.versions.map((v, idx) => {
                const isWinner = declaredWinner?.versionIndex === idx || suggestedWinner?.versionIndex === idx;
                return (
                  <tr key={idx} className={`border-b ${isWinner ? "bg-green-50" : ""}`}>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {isWinner && <span className="text-lg">🏆</span>}
                        <div>
                          <div className="font-medium">{v.label}</div>
                          <div className="text-sm text-gray-500">{v.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">{v.applications}</td>
                    <td className="py-4 text-center">
                      <MetricCell value={v.metrics.responseRate} suffix="%" />
                    </td>
                    <td className="py-4 text-center">
                      <MetricCell value={v.metrics.interviewRate} suffix="%" />
                    </td>
                    <td className="py-4 text-center">
                      <MetricCell value={v.metrics.offerRate} suffix="%" />
                    </td>
                    <td className="py-4 text-center">
                      {v.metrics.avgResponseTime > 0 ? `${v.metrics.avgResponseTime} days` : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Statistical Significance */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📈 Statistical Significance</h3>
        {!statisticalSignificance.canCalculate ? (
          <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700">
            <p className="font-medium">⚠️ Not enough data for statistical analysis</p>
            <p className="text-sm mt-1">
              Each version needs at least {metrics.minSampleSize} applications. 
              Current: {metrics.versions.map(v => v.applications).join(" and ")} applications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {statisticalSignificance.results.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{result.metric}</span>
                  {result.winner !== null && (
                    <span className="ml-2 text-sm text-gray-600">
                      (Winner: Version {String.fromCharCode(65 + result.winner)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    result.significant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {result.significant ? `${result.confidence}% Confidence` : "Not Significant"}
                  </span>
                  {result.significant && (
                    <span className="text-green-600">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Winner */}
        {suggestedWinner?.versionIndex !== null && !declaredWinner && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">
                  🎯 Suggested Winner: {suggestedWinner.versionLabel}
                </p>
                <p className="text-sm text-green-700">{suggestedWinner.reason}</p>
              </div>
              <Button 
                onClick={() => onDeclareWinner(test._id, suggestedWinner.versionIndex, suggestedWinner.reason)}
              >
                Declare Winner
              </Button>
            </div>
          </div>
        )}

        {/* Declared Winner */}
        {declaredWinner && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-semibold text-blue-800">
              🏆 Winner Declared: {declaredWinner.versionLabel}
            </p>
            <p className="text-sm text-blue-700">
              Declared on {new Date(declaredWinner.declaredAt).toLocaleDateString()} - {declaredWinner.reason}
            </p>
          </div>
        )}
      </Card>

      {/* Element Analysis */}
      {elementAnalysis && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🔍 Element Analysis</h3>
          <p className="text-gray-600 mb-4">
            Understanding what elements differ between versions and may drive success
          </p>
          <div className="space-y-3">
            {elementAnalysis.comparisons?.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{comp.element}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span>A: {comp.versionA}</span>
                  <span className="text-gray-400">vs</span>
                  <span>B: {comp.versionB}</span>
                </div>
                <span className="text-gray-600 text-sm">{comp.insight}</span>
              </div>
            ))}
          </div>
          
          {elementAnalysis.summary?.length > 0 && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="font-medium text-purple-800 mb-2">💡 Key Insights:</p>
              <ul className="list-disc list-inside space-y-1 text-purple-700">
                {elementAnalysis.summary.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      {declaredWinner && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🎯 Next Steps</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✅ Use the Winner</h4>
              <p className="text-sm text-green-700 mb-3">
                Continue using "{declaredWinner.versionLabel}" for future applications
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">📁 Archive Underperformer</h4>
              <p className="text-sm text-gray-600 mb-3">
                Archive the losing version to keep your materials organized
              </p>
              {metrics.versions.map((v, idx) => (
                idx !== declaredWinner.versionIndex && (
                  <Button 
                    key={idx}
                    size="sm" 
                    variant="outline"
                    onClick={() => onArchiveLoser(test._id, idx)}
                  >
                    Archive {v.label}
                  </Button>
                )
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Create Test Modal
// ============================================================================
function CreateTestModal({ resumes, coverLetters, onClose, onCreated, getToken }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create A/B Test</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6">
          <CreateTestTab
            resumes={resumes}
            coverLetters={coverLetters}
            onCreated={onCreated}
            getToken={getToken}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================
function MetricCell({ value, suffix = "" }) {
  const color = value >= 20 ? "text-green-600" : value >= 10 ? "text-yellow-600" : "text-gray-600";
  return (
    <span className={`font-bold ${color}`}>
      {value}{suffix}
    </span>
  );
}
