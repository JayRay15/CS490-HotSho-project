import mongoose from "mongoose";

/**
 * UC-063: Job Match Analysis Model
 * Stores match score calculations, breakdowns, and history
 */
const jobMatchSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
            index: true,
        },
        // Overall match score (0-100)
        overallScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        // Category breakdowns
        categoryScores: {
            skills: {
                score: { type: Number, min: 0, max: 100 },
                weight: { type: Number, default: 40 }, // 40% weight
                details: {
                    matched: [String],
                    missing: [String],
                    weak: [{
                        name: String,
                        userLevel: String,
                        requiredLevel: String,
                    }],
                    matchedCount: Number,
                    totalRequired: Number,
                },
            },
            experience: {
                score: { type: Number, min: 0, max: 100 },
                weight: { type: Number, default: 30 }, // 30% weight
                details: {
                    yearsExperience: Number,
                    yearsRequired: Number,
                    relevantPositions: [{
                        title: String,
                        company: String,
                        duration: Number, // months
                        relevance: { type: String, enum: ['high', 'medium', 'low'] },
                    }],
                    industryMatch: Boolean,
                    seniorityMatch: Boolean,
                },
            },
            education: {
                score: { type: Number, min: 0, max: 100 },
                weight: { type: Number, default: 15 }, // 15% weight
                details: {
                    degreeMatch: Boolean,
                    fieldMatch: Boolean,
                    gpaMatch: Boolean,
                    hasRequiredDegree: Boolean,
                    educationLevel: String,
                },
            },
            additional: {
                score: { type: Number, min: 0, max: 100 },
                weight: { type: Number, default: 15 }, // 15% weight
                details: {
                    locationMatch: Boolean,
                    workModeMatch: Boolean,
                    salaryExpectationMatch: Boolean,
                    certifications: Number,
                    projects: Number,
                },
            },
        },
        // Strengths identified
        strengths: [{
            category: { type: String, enum: ['skills', 'experience', 'education', 'additional'] },
            description: String,
            impact: { type: String, enum: ['high', 'medium', 'low'] },
        }],
        // Gaps identified
        gaps: [{
            category: { type: String, enum: ['skills', 'experience', 'education', 'additional'] },
            description: String,
            severity: { type: String, enum: ['critical', 'important', 'minor'] },
            suggestion: String, // How to address this gap
        }],
        // Improvement suggestions
        suggestions: [{
            type: { type: String, enum: ['skill', 'experience', 'education', 'profile'] },
            priority: { type: String, enum: ['high', 'medium', 'low'] },
            title: String,
            description: String,
            estimatedImpact: Number, // Potential score increase (0-10)
            resources: [{
                title: String,
                url: String,
                platform: String,
            }],
        }],
        // Personalized weighting (if user customizes)
        customWeights: {
            skills: Number,
            experience: Number,
            education: Number,
            additional: Number,
        },
        // Metadata
        metadata: {
            jobTitle: String,
            company: String,
            industry: String,
            calculatedAt: { type: Date, default: Date.now },
            userProfileVersion: String, // Hash or version of user profile at calculation time
            algorithVersion: { type: String, default: '1.0' }, // For tracking algorithm changes
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
jobMatchSchema.index({ userId: 1, jobId: 1 });
jobMatchSchema.index({ userId: 1, overallScore: -1 });
jobMatchSchema.index({ userId: 1, createdAt: -1 });

// Virtual for match grade
jobMatchSchema.virtual("matchGrade").get(function () {
    if (this.overallScore >= 85) return "Excellent";
    if (this.overallScore >= 70) return "Good";
    if (this.overallScore >= 55) return "Fair";
    return "Poor";
});

// Ensure virtuals are included in JSON
jobMatchSchema.set("toJSON", { virtuals: true });
jobMatchSchema.set("toObject", { virtuals: true });

// Method to recalculate overall score based on category scores and weights
jobMatchSchema.methods.recalculateOverallScore = function () {
    const weights = this.customWeights || {
        skills: this.categoryScores.skills.weight,
        experience: this.categoryScores.experience.weight,
        experience: this.categoryScores.education.weight,
        additional: this.categoryScores.additional.weight,
    };

    // Normalize weights to sum to 100
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const normalizedWeights = {};
    Object.keys(weights).forEach(key => {
        normalizedWeights[key] = (weights[key] / totalWeight) * 100;
    });

    // Calculate weighted average
    this.overallScore = Math.round(
        (this.categoryScores.skills.score * normalizedWeights.skills +
            this.categoryScores.experience.score * normalizedWeights.experience +
            this.categoryScores.education.score * normalizedWeights.education +
            this.categoryScores.additional.score * normalizedWeights.additional) / 100
    );

    return this.overallScore;
};

export const JobMatch = mongoose.model("JobMatch", jobMatchSchema);
