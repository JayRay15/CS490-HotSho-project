import mongoose from "mongoose";

const featuredRepoSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  description: { type: String },
  htmlUrl: { type: String, required: true },
  homepage: { type: String },
  language: { type: String },
  stargazersCount: { type: Number, default: 0 },
  forksCount: { type: Number, default: 0 },
  watchers: { type: Number, default: 0 },
  openIssuesCount: { type: Number, default: 0 },
  topics: [{ type: String }],
  createdAt: { type: Date },
  updatedAt: { type: Date },
  pushedAt: { type: Date },
  size: { type: Number },
  defaultBranch: { type: String },
  // Custom user-defined fields
  linkedSkills: [{ type: String }], // Skills user wants to highlight with this repo
  displayOrder: { type: Number, default: 0 }, // For custom ordering
  notes: { type: String } // User notes about the project
});

const repositorySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  description: { type: String },
  htmlUrl: { type: String, required: true },
  homepage: { type: String },
  language: { type: String },
  stargazersCount: { type: Number, default: 0 },
  forksCount: { type: Number, default: 0 },
  watchers: { type: Number, default: 0 },
  openIssuesCount: { type: Number, default: 0 },
  topics: [{ type: String }],
  createdAt: { type: Date },
  updatedAt: { type: Date },
  pushedAt: { type: Date },
  size: { type: Number },
  defaultBranch: { type: String },
  private: { type: Boolean, default: false }
});

const githubProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  profileData: {
    name: { type: String },
    bio: { type: String },
    company: { type: String },
    location: { type: String },
    email: { type: String },
    blog: { type: String },
    twitterUsername: { type: String },
    publicRepos: { type: Number, default: 0 },
    publicGists: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    avatarUrl: { type: String },
    htmlUrl: { type: String }
  },
  repositories: [repositorySchema],
  featuredRepos: [featuredRepoSchema],
  contributionStats: {
    totalCommits: { type: Number, default: 0 },
    totalPRs: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 }, // Sum of stars across all repos
    languages: [{ 
      name: { type: String },
      count: { type: Number }
    }]
  },
  lastSynced: {
    type: Date,
    default: Date.now
  },
  syncError: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
githubProfileSchema.index({ userId: 1 });
githubProfileSchema.index({ username: 1 });

// Method to check if data needs refresh (older than 24 hours)
githubProfileSchema.methods.needsRefresh = function() {
  const dayInMs = 24 * 60 * 60 * 1000;
  return !this.lastSynced || (Date.now() - this.lastSynced.getTime() > dayInMs);
};

// Method to calculate total stars across all repos
githubProfileSchema.methods.calculateTotalStars = function() {
  return this.repositories.reduce((total, repo) => total + (repo.stargazersCount || 0), 0);
};

// Method to get top languages
githubProfileSchema.methods.getTopLanguages = function(limit = 5) {
  const languageCounts = {};
  
  this.repositories.forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });
  
  return Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
};

const GitHubProfile = mongoose.model("GitHubProfile", githubProfileSchema);

export default GitHubProfile;
