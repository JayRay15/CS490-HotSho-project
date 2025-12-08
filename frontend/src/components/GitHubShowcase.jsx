import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Card from "./Card";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

export default function GitHubShowcase() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // GitHub profile state
  const [githubProfile, setGithubProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Connection form state
  const [username, setUsername] = useState("");
  const [personalAccessToken, setPersonalAccessToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Featured repos state
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [repoSkills, setRepoSkills] = useState({});
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchGitHubProfile();
  }, []);

  const fetchGitHubProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.get("/api/github");
      setGithubProfile(response.data.profile);
      setIsConnected(true);
      
      // Initialize selected repos from featured repos
      if (response.data.profile.featuredRepos) {
        setSelectedRepos(response.data.profile.featuredRepos.map(r => r.id));
        const skills = {};
        response.data.profile.featuredRepos.forEach(repo => {
          skills[repo.id] = repo.linkedSkills || [];
        });
        setRepoSkills(skills);
      }
      
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setIsConnected(false);
      } else {
        setError(err.response?.data?.error || "Failed to load GitHub profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Please enter a GitHub username");
      return;
    }
    
    try {
      setIsConnecting(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.post("/api/github/connect", {
        username: username.trim(),
        personalAccessToken: personalAccessToken.trim() || undefined
      });
      
      setGithubProfile(response.data.profile);
      setIsConnected(true);
      setSuccess("GitHub account connected successfully!");
      setUsername("");
      setPersonalAccessToken("");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || "Failed to connect GitHub account");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const response = await api.post("/api/github/refresh", {
        personalAccessToken: personalAccessToken.trim() || undefined
      });
      
      setGithubProfile(response.data.profile);
      setSuccess("GitHub data refreshed successfully!");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to refresh GitHub data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleRepo = (repoId) => {
    setSelectedRepos(prev => {
      if (prev.includes(repoId)) {
        return prev.filter(id => id !== repoId);
      } else {
        return [...prev, repoId];
      }
    });
  };

  const handleSkillChange = (repoId, skills) => {
    setRepoSkills(prev => ({
      ...prev,
      [repoId]: skills
    }));
  };

  const handleSaveFeatured = async () => {
    try {
      setIsSavingFeatured(true);
      setError(null);
      
      const token = await getToken();
      setAuthToken(token);
      
      const featuredRepos = selectedRepos.map((repoId, index) => {
        const repo = githubProfile.repositories.find(r => r.id === repoId);
        return {
          id: repoId,
          linkedSkills: repoSkills[repoId] || [],
          displayOrder: index
        };
      });
      
      const response = await api.put("/api/github/featured", {
        featuredRepos
      });
      
      // Update local state
      setGithubProfile(prev => ({
        ...prev,
        featuredRepos: response.data.featuredRepos
      }));
      
      setShowRepoSelector(false);
      setSuccess("Featured repositories updated successfully!");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update featured repositories");
    } finally {
      setIsSavingFeatured(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your GitHub account?")) {
      return;
    }
    
    try {
      const token = await getToken();
      setAuthToken(token);
      
      await api.delete("/api/github/disconnect");
      
      setGithubProfile(null);
      setIsConnected(false);
      setSelectedRepos([]);
      setRepoSkills({});
      setSuccess("GitHub account disconnected successfully!");
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to disconnect GitHub account");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <LoadingSpinner />
      </Card>
    );
  }

  // Connection Form
  if (!isConnected) {
    return (
      <Card>
        <h2 className="text-2xl font-bold mb-4">Connect GitHub Account</h2>
        <p className="text-gray-600 mb-6">
          Showcase your GitHub projects on your profile to demonstrate your technical skills to employers.
        </p>
        
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {success}
          </div>
        )}
        
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Username *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., octocat"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="pat" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Access Token (Optional)
            </label>
            <input
              type="password"
              id="pat"
              value={personalAccessToken}
              onChange={(e) => setPersonalAccessToken(e.target.value)}
              placeholder="Leave blank for public data only"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Increases API rate limits. Only needs public repository access.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isConnecting ? "Connecting..." : "Connect GitHub"}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">How to create a Personal Access Token (Optional):</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
            <li>Click "Generate new token (classic)"</li>
            <li>Give it a name and select only "public_repo" scope</li>
            <li>Click "Generate token" and copy it</li>
          </ol>
        </div>
      </Card>
    );
  }

  // Main Dashboard View
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">GitHub Profile</h2>
            <p className="text-gray-600">
              Connected as <a href={githubProfile.profileData.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@{githubProfile.username}</a>
            </p>
            {githubProfile.lastSynced && (
              <p className="text-sm text-gray-500 mt-1">
                Last synced: {formatDate(githubProfile.lastSynced)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>
        
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            {success}
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{githubProfile.profileData.publicRepos}</div>
            <div className="text-sm text-gray-600">Repositories</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{githubProfile.contributionStats.totalStars}</div>
            <div className="text-sm text-gray-600">Total Stars</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{githubProfile.profileData.followers}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{githubProfile.contributionStats.languages.length}</div>
            <div className="text-sm text-gray-600">Languages</div>
          </div>
        </div>
        
        {/* Top Languages */}
        {githubProfile.contributionStats.languages.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">Top Languages</h3>
            <div className="flex flex-wrap gap-2">
              {githubProfile.contributionStats.languages.slice(0, 5).map((lang) => (
                <span key={lang.name} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {lang.name} ({lang.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Featured Repositories */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Featured Repositories</h3>
          <button
            onClick={() => setShowRepoSelector(!showRepoSelector)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {showRepoSelector ? "Cancel" : "Edit Featured"}
          </button>
        </div>
        
        {showRepoSelector ? (
          // Repository Selector
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Select up to 6 repositories to showcase on your profile. You can also tag them with relevant skills.
            </p>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {githubProfile.repositories.map((repo) => (
                <div key={repo.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRepos.includes(repo.id)}
                      onChange={() => handleToggleRepo(repo.id)}
                      disabled={!selectedRepos.includes(repo.id) && selectedRepos.length >= 6}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                          {repo.name}
                        </a>
                        {repo.language && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">{repo.language}</span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>⭐ {repo.stargazersCount}</span>
                        <span>🔗 {repo.forksCount} forks</span>
                        <span>Updated {formatDate(repo.updatedAt)}</span>
                      </div>
                      
                      {selectedRepos.includes(repo.id) && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Linked Skills (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={(repoSkills[repo.id] || []).join(", ")}
                            onChange={(e) => handleSkillChange(repo.id, e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                            placeholder="e.g., React, Node.js, MongoDB"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => setShowRepoSelector(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeatured}
                disabled={isSavingFeatured || selectedRepos.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSavingFeatured ? "Saving..." : `Save Featured (${selectedRepos.length})`}
              </button>
            </div>
          </div>
        ) : (
          // Display Featured Repos
          <div>
            {githubProfile.featuredRepos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No featured repositories yet. Click "Edit Featured" to select your best projects.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {githubProfile.featuredRepos.map((repo) => (
                  <div key={repo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg text-blue-600 hover:underline">
                        {repo.name}
                      </a>
                      {repo.language && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">{repo.language}</span>
                      )}
                    </div>
                    
                    {repo.description && (
                      <p className="text-sm text-gray-600 mb-3">{repo.description}</p>
                    )}
                    
                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      <span>⭐ {repo.stargazersCount}</span>
                      <span>🔗 {repo.forksCount} forks</span>
                    </div>
                    
                    {repo.linkedSkills && repo.linkedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {repo.linkedSkills.map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-400">
                      Last updated: {formatDate(repo.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
