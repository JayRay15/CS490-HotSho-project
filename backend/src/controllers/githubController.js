import GitHubProfile from "../models/GitHubProfile.js";
import axios from "axios";

// GitHub API base URL
const GITHUB_API_BASE = "https://api.github.com";

// Helper function to fetch from GitHub API
const fetchGitHubAPI = async (endpoint, token = null) => {
  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "ATS-Candidates-App"
  };
  
  // If user provides a personal access token, use it (optional, increases rate limit)
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  
  try {
    const response = await axios.get(`${GITHUB_API_BASE}${endpoint}`, { headers });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`GitHub API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
    }
    throw error;
  }
};

// Connect GitHub account
export const connectGitHub = async (req, res) => {
  try {
    const { username, personalAccessToken } = req.body;
    const userId = req.auth().userId;
    
    if (!username) {
      return res.status(400).json({ error: "GitHub username is required" });
    }
    
    // Fetch user profile from GitHub
    let profileData;
    try {
      profileData = await fetchGitHubAPI(`/users/${username}`, personalAccessToken);
    } catch (error) {
      return res.status(404).json({ 
        error: "GitHub user not found or API error", 
        details: error.message 
      });
    }
    
    // Fetch repositories (up to 100 public repos)
    let repositories;
    try {
      repositories = await fetchGitHubAPI(
        `/users/${username}/repos?type=public&sort=updated&per_page=100`,
        personalAccessToken
      );
    } catch (error) {
      return res.status(500).json({ 
        error: "Failed to fetch repositories", 
        details: error.message 
      });
    }
    
    // Transform repository data to match our schema
    const repoData = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      watchers: repo.watchers_count,
      openIssuesCount: repo.open_issues_count,
      topics: repo.topics || [],
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      private: repo.private
    }));
    
    // Calculate contribution stats
    const totalStars = repoData.reduce((sum, repo) => sum + repo.stargazersCount, 0);
    const languageCounts = {};
    repoData.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });
    
    const languages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    
    // Create or update GitHub profile
    let githubProfile = await GitHubProfile.findOne({ userId });
    
    if (githubProfile) {
      // Update existing profile
      githubProfile.username = username;
      githubProfile.profileData = {
        name: profileData.name,
        bio: profileData.bio,
        company: profileData.company,
        location: profileData.location,
        email: profileData.email,
        blog: profileData.blog,
        twitterUsername: profileData.twitter_username,
        publicRepos: profileData.public_repos,
        publicGists: profileData.public_gists,
        followers: profileData.followers,
        following: profileData.following,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
        avatarUrl: profileData.avatar_url,
        htmlUrl: profileData.html_url
      };
      githubProfile.repositories = repoData;
      githubProfile.contributionStats = {
        totalStars,
        languages
      };
      githubProfile.lastSynced = new Date();
      githubProfile.syncError = null;
      
      await githubProfile.save();
    } else {
      // Create new profile
      githubProfile = await GitHubProfile.create({
        userId,
        username,
        profileData: {
          name: profileData.name,
          bio: profileData.bio,
          company: profileData.company,
          location: profileData.location,
          email: profileData.email,
          blog: profileData.blog,
          twitterUsername: profileData.twitter_username,
          publicRepos: profileData.public_repos,
          publicGists: profileData.public_gists,
          followers: profileData.followers,
          following: profileData.following,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
          avatarUrl: profileData.avatar_url,
          htmlUrl: profileData.html_url
        },
        repositories: repoData,
        contributionStats: {
          totalStars,
          languages
        },
        lastSynced: new Date()
      });
    }
    
    res.status(200).json({
      message: "GitHub account connected successfully",
      profile: githubProfile
    });
    
  } catch (error) {
    console.error("Error connecting GitHub:", error);
    res.status(500).json({ 
      error: "Failed to connect GitHub account",
      details: error.message 
    });
  }
};

// Get GitHub profile
export const getGitHubProfile = async (req, res) => {
  try {
    const userId = req.auth().userId;
    
    const githubProfile = await GitHubProfile.findOne({ userId });
    
    if (!githubProfile) {
      return res.status(404).json({ error: "GitHub profile not connected" });
    }
    
    res.status(200).json({ profile: githubProfile });
    
  } catch (error) {
    console.error("Error fetching GitHub profile:", error);
    res.status(500).json({ 
      error: "Failed to fetch GitHub profile",
      details: error.message 
    });
  }
};

// Refresh GitHub data
export const refreshGitHubData = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { personalAccessToken } = req.body;
    
    const githubProfile = await GitHubProfile.findOne({ userId });
    
    if (!githubProfile) {
      return res.status(404).json({ error: "GitHub profile not connected" });
    }
    
    const username = githubProfile.username;
    
    // Fetch updated profile data
    let profileData;
    try {
      profileData = await fetchGitHubAPI(`/users/${username}`, personalAccessToken);
    } catch (error) {
      githubProfile.syncError = error.message;
      await githubProfile.save();
      return res.status(500).json({ 
        error: "Failed to refresh profile data", 
        details: error.message 
      });
    }
    
    // Fetch updated repositories
    let repositories;
    try {
      repositories = await fetchGitHubAPI(
        `/users/${username}/repos?type=public&sort=updated&per_page=100`,
        personalAccessToken
      );
    } catch (error) {
      githubProfile.syncError = error.message;
      await githubProfile.save();
      return res.status(500).json({ 
        error: "Failed to refresh repositories", 
        details: error.message 
      });
    }
    
    // Transform repository data
    const repoData = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      watchers: repo.watchers_count,
      openIssuesCount: repo.open_issues_count,
      topics: repo.topics || [],
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      private: repo.private
    }));
    
    // Update contribution stats
    const totalStars = repoData.reduce((sum, repo) => sum + repo.stargazersCount, 0);
    const languageCounts = {};
    repoData.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });
    
    const languages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    
    // Update the profile
    githubProfile.profileData = {
      name: profileData.name,
      bio: profileData.bio,
      company: profileData.company,
      location: profileData.location,
      email: profileData.email,
      blog: profileData.blog,
      twitterUsername: profileData.twitter_username,
      publicRepos: profileData.public_repos,
      publicGists: profileData.public_gists,
      followers: profileData.followers,
      following: profileData.following,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
      avatarUrl: profileData.avatar_url,
      htmlUrl: profileData.html_url
    };
    githubProfile.repositories = repoData;
    githubProfile.contributionStats = {
      totalStars,
      languages
    };
    githubProfile.lastSynced = new Date();
    githubProfile.syncError = null;
    
    // Update featured repos with latest stats
    githubProfile.featuredRepos = githubProfile.featuredRepos.map(featuredRepo => {
      const updatedRepo = repoData.find(r => r.id === featuredRepo.id);
      if (updatedRepo) {
        return {
          ...featuredRepo.toObject(),
          ...updatedRepo,
          // Preserve user-defined fields
          linkedSkills: featuredRepo.linkedSkills,
          displayOrder: featuredRepo.displayOrder,
          notes: featuredRepo.notes
        };
      }
      return featuredRepo;
    });
    
    await githubProfile.save();
    
    res.status(200).json({
      message: "GitHub data refreshed successfully",
      profile: githubProfile
    });
    
  } catch (error) {
    console.error("Error refreshing GitHub data:", error);
    res.status(500).json({ 
      error: "Failed to refresh GitHub data",
      details: error.message 
    });
  }
};

// Update featured repositories
export const updateFeaturedRepos = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const { featuredRepos } = req.body;
    
    if (!Array.isArray(featuredRepos)) {
      return res.status(400).json({ error: "featuredRepos must be an array" });
    }
    
    const githubProfile = await GitHubProfile.findOne({ userId });
    
    if (!githubProfile) {
      return res.status(404).json({ error: "GitHub profile not connected" });
    }
    
    // Validate that all featured repos exist in the user's repositories
    const validFeaturedRepos = featuredRepos.map((featured, index) => {
      const repo = githubProfile.repositories.find(r => r.id === featured.id);
      
      if (!repo) {
        throw new Error(`Repository with id ${featured.id} not found`);
      }
      
      return {
        ...repo.toObject(),
        linkedSkills: featured.linkedSkills || [],
        displayOrder: featured.displayOrder !== undefined ? featured.displayOrder : index,
        notes: featured.notes || ''
      };
    });
    
    githubProfile.featuredRepos = validFeaturedRepos;
    await githubProfile.save();
    
    res.status(200).json({
      message: "Featured repositories updated successfully",
      featuredRepos: githubProfile.featuredRepos
    });
    
  } catch (error) {
    console.error("Error updating featured repos:", error);
    res.status(500).json({ 
      error: "Failed to update featured repositories",
      details: error.message 
    });
  }
};

// Disconnect GitHub account
export const disconnectGitHub = async (req, res) => {
  try {
    const userId = req.auth().userId;
    
    const result = await GitHubProfile.findOneAndDelete({ userId });
    
    if (!result) {
      return res.status(404).json({ error: "GitHub profile not found" });
    }
    
    res.status(200).json({ message: "GitHub account disconnected successfully" });
    
  } catch (error) {
    console.error("Error disconnecting GitHub:", error);
    res.status(500).json({ 
      error: "Failed to disconnect GitHub account",
      details: error.message 
    });
  }
};
