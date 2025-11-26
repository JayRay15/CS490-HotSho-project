import { generateText } from "./geminiService.js";

/**
 * AI Insight Service for Custom Reports
 * Analyzes aggregated report data and generates strategic recommendations using Gemini AI
 */

export class ReportInsightService {
  /**
   * Generate AI insights for a report
   */
  static async generateInsights(reportData, config) {
    try {
      const insights = [];

      // Determine which types of insights to generate based on config
      const focusAreas = config.insightsFocus || ["trends", "recommendations"];

      if (focusAreas.includes("trends")) {
        const trendInsight = await this.analyzeTrends(reportData);
        if (trendInsight) insights.push(trendInsight);
      }

      if (focusAreas.includes("recommendations")) {
        const recommendations = await this.generateRecommendations(reportData);
        if (recommendations) insights.push(recommendations);
      }

      if (focusAreas.includes("strengths")) {
        const strengths = await this.identifyStrengths(reportData);
        if (strengths) insights.push(strengths);
      }

      if (focusAreas.includes("improvements")) {
        const improvements = await this.suggestImprovements(reportData);
        if (improvements) insights.push(improvements);
      }

      if (focusAreas.includes("patterns")) {
        const patterns = await this.detectPatterns(reportData);
        if (patterns) insights.push(patterns);
      }

      return insights;
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return [
        {
          title: "Insight Generation Unavailable",
          content: "AI insights could not be generated at this time. Please try again later.",
        },
      ];
    }
  }

  /**
   * Analyze trends in the job search data
   */
  static async analyzeTrends(reportData) {
    const prompt = `You are a job search career coach analyzing job application data. Based on the following report data, identify and explain key trends:

Report Summary:
- Total Applications: ${reportData.totalApplications || 0}
- Interview Conversion Rate: ${reportData.interviewConversionRate?.rate || 0}%
- Offer Conversion Rate: ${reportData.offerConversionRate?.rate || 0}%
${reportData.applicationTrend ? `- Application Activity: ${JSON.stringify(reportData.applicationTrend.slice(-4))}` : ""}

${
  reportData.topIndustries
    ? `Top Industries: ${reportData.topIndustries
        .slice(0, 5)
        .map((i) => `${i.industry} (${i.count})`)
        .join(", ")}`
    : ""
}

${
  reportData.topCompanies
    ? `Top Companies: ${reportData.topCompanies
        .slice(0, 5)
        .map((c) => `${c.company} (${c.count})`)
        .join(", ")}`
    : ""
}

Analyze the trends in this job search data. Focus on:
1. Application activity patterns
2. Industry focus trends
3. Conversion rate trends
4. Any notable patterns

Provide a concise 3-4 sentence analysis of the key trends.`;

    try {
      const content = await generateText(prompt, {
        temperature: 0.7,
        maxTokens: 300,
      });

      return {
        title: "Job Search Trends",
        content: content.trim(),
        type: "trends",
      };
    } catch (error) {
      console.error("Error analyzing trends:", error);
      return null;
    }
  }

  /**
   * Generate strategic recommendations
   */
  static async generateRecommendations(reportData) {
    const prompt = `You are a job search strategist. Based on this job application data, provide 3-5 strategic recommendations:

Application Data:
- Total Applications: ${reportData.totalApplications || 0}
- Interview Rate: ${reportData.interviewConversionRate?.rate || 0}%
- Offer Rate: ${reportData.offerConversionRate?.rate || 0}%
${reportData.averageResponseTime ? `- Avg Response Time: ${reportData.averageResponseTime.averageDays} days` : ""}
${reportData.ghostedApplications !== undefined ? `- Ghosted Applications: ${reportData.ghostedApplications}` : ""}

${
  reportData.applicationsByStatus
    ? `Status Breakdown: ${reportData.applicationsByStatus.map((s) => `${s.status}: ${s.count}`).join(", ")}`
    : ""
}

${
  reportData.topIndustries
    ? `Industries: ${reportData.topIndustries
        .slice(0, 3)
        .map((i) => i.industry)
        .join(", ")}`
    : ""
}

Provide 3-5 actionable, specific recommendations to improve job search effectiveness. Focus on areas like application strategy, follow-up timing, industry targeting, or interview preparation. Keep each recommendation to 1-2 sentences.`;

    try {
      const content = await generateText(prompt, {
        temperature: 0.8,
        maxTokens: 400,
      });

      return {
        title: "Strategic Recommendations",
        content: content.trim(),
        type: "recommendations",
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return null;
    }
  }

  /**
   * Identify strengths in the job search
   */
  static async identifyStrengths(reportData) {
    const prompt = `You are analyzing job search performance. Identify 2-3 key strengths based on this data:

Performance Metrics:
- Total Applications: ${reportData.totalApplications || 0}
- Interview Rate: ${reportData.interviewConversionRate?.rate || 0}% (${reportData.interviewConversionRate?.interviews || 0} interviews)
- Offer Rate: ${reportData.offerConversionRate?.rate || 0}% (${reportData.offerConversionRate?.offers || 0} offers)

${
  reportData.topIndustries
    ? `Strong Industries: ${reportData.topIndustries
        .slice(0, 3)
        .map((i) => `${i.industry} (${i.count} apps)`)
        .join(", ")}`
    : ""
}

Identify specific strengths in this job search approach. What is working well? Be specific and encouraging. 2-3 sentences total.`;

    try {
      const content = await generateText(prompt, {
        temperature: 0.7,
        maxTokens: 250,
      });

      return {
        title: "Your Strengths",
        content: content.trim(),
        type: "strengths",
      };
    } catch (error) {
      console.error("Error identifying strengths:", error);
      return null;
    }
  }

  /**
   * Suggest improvements
   */
  static async suggestImprovements(reportData) {
    const interviewRate = parseFloat(reportData.interviewConversionRate?.rate || 0);
    const offerRate = parseFloat(reportData.offerConversionRate?.rate || 0);

    const prompt = `You are a job search coach. Based on this performance data, suggest 2-3 specific areas for improvement:

Current Performance:
- Applications: ${reportData.totalApplications || 0}
- Interview Conversion: ${interviewRate}% ${interviewRate < 10 ? "(Below average)" : interviewRate > 20 ? "(Above average)" : "(Average)"}
- Offer Conversion: ${offerRate}% ${offerRate < 5 ? "(Below average)" : offerRate > 15 ? "(Above average)" : "(Average)"}
${reportData.ghostedApplications ? `- Ghosted: ${reportData.ghostedApplications}` : ""}
${reportData.averageResponseTime ? `- Avg Response: ${reportData.averageResponseTime.averageDays} days` : ""}

Suggest 2-3 specific, actionable improvements. Focus on concrete steps they can take. Keep it concise and constructive.`;

    try {
      const content = await generateText(prompt, {
        temperature: 0.8,
        maxTokens: 300,
      });

      return {
        title: "Areas for Improvement",
        content: content.trim(),
        type: "improvements",
      };
    } catch (error) {
      console.error("Error suggesting improvements:", error);
      return null;
    }
  }

  /**
   * Detect patterns in the data
   */
  static async detectPatterns(reportData) {
    const prompt = `You are analyzing job search patterns. Identify interesting patterns or correlations in this data:

Data Summary:
${
  reportData.applicationsByStatus
    ? `Status Distribution: ${reportData.applicationsByStatus.map((s) => `${s.status} ${s.percentage}%`).join(", ")}`
    : ""
}

${
  reportData.applicationsByIndustry
    ? `Industry Distribution: ${reportData.applicationsByIndustry
        .slice(0, 5)
        .map((i) => `${i.industry} ${i.percentage}%`)
        .join(", ")}`
    : ""
}

${
  reportData.applicationTrend
    ? `Recent Activity: ${reportData.applicationTrend
        .slice(-4)
        .map((t) => `${t.period}: ${t.count}`)
        .join(", ")}`
    : ""
}

Identify 1-2 interesting patterns, correlations, or insights that might not be immediately obvious. Be specific and data-driven. 2-3 sentences.`;

    try {
      const content = await generateText(prompt, {
        temperature: 0.7,
        maxTokens: 250,
      });

      return {
        title: "Pattern Analysis",
        content: content.trim(),
        type: "patterns",
      };
    } catch (error) {
      console.error("Error detecting patterns:", error);
      return null;
    }
  }

  /**
   * Generate a comprehensive summary insight
   */
  static async generateSummaryInsight(reportData) {
    const prompt = `Provide a brief executive summary (2-3 sentences) of this job search performance:

- ${reportData.totalApplications || 0} applications submitted
- ${reportData.interviewConversionRate?.rate || 0}% interview rate
- ${reportData.offerConversionRate?.rate || 0}% offer rate
${reportData.topIndustries ? `- Focus on ${reportData.topIndustries[0]?.industry || "multiple industries"}` : ""}

Summarize overall performance and one key takeaway.`;

    try {
      const content = await generateText(prompt, {
        temperature: 0.7,
        maxTokens: 200,
      });

      return {
        title: "Executive Summary",
        content: content.trim(),
        type: "summary",
      };
    } catch (error) {
      console.error("Error generating summary:", error);
      return {
        title: "Executive Summary",
        content: `You've submitted ${reportData.totalApplications || 0} applications with a ${reportData.interviewConversionRate?.rate || 0}% interview conversion rate. Continue focusing your efforts on high-potential opportunities.`,
        type: "summary",
      };
    }
  }
}
