import { CoverLetterAnalytics } from "../models/CoverLetterAnalytics.js";
import { CoverLetter } from "../models/CoverLetter.js";
import { CoverLetterTemplate } from "../models/CoverLetterTemplate.js";
import { Job } from "../models/Job.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

/**
 * Get comprehensive performance analytics for a specific cover letter
 * UC-62: Cover Letter Performance Tracking
 */
export const getCoverLetterPerformance = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { coverLetterId } = req.params;

    // Verify cover letter belongs to user
    const coverLetter = await CoverLetter.findOne({ _id: coverLetterId, userId });
    if (!coverLetter) {
      const { response, statusCode } = errorResponse("Cover letter not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get or create analytics record
    let analytics = await CoverLetterAnalytics.findOne({ coverLetterId, userId });
    
    if (!analytics) {
      // Create new analytics record
      analytics = new CoverLetterAnalytics({
        userId,
        coverLetterId,
        templateId: coverLetter.templateId
      });
    }

    // Get all jobs linked to this cover letter (check both directions)
    let linkedJobs = await Job.find({
      userId,
      linkedCoverLetterId: coverLetterId
    }).lean();

    // Also check if THIS cover letter links to any jobs
    const coverLetterDoc = await CoverLetter.findOne({ _id: coverLetterId, userId });
    if (coverLetterDoc?.linkedJobId) {
      const reverseLinkedJob = await Job.findOne({ 
        _id: coverLetterDoc.linkedJobId, 
        userId 
      }).lean();
      if (reverseLinkedJob && !linkedJobs.find(j => j._id.toString() === reverseLinkedJob._id.toString())) {
        linkedJobs.push(reverseLinkedJob);
      }
    }

    // Update linked applications
    analytics.linkedApplications = linkedJobs.map(job => ({
      jobId: job._id,
      appliedDate: job.applicationDate || job.createdAt,
      responded: job.applicationOutcome?.responded || false,
      responseDate: job.applicationOutcome?.responseDate,
      responseType: job.applicationOutcome?.responseType || '',
      outcome: determineOutcome(job),
      companyName: job.company,
      industry: job.industry || '',
      companySize: job.companyInfo?.size || ''
    }));

    // Calculate all metrics
    analytics.calculateMetrics();
    analytics.analyzeSuccessPatterns();
    analytics.updateHistoricalMetrics();

    // Calculate template effectiveness if template is used
    if (coverLetter.templateId) {
      await calculateTemplateEffectiveness(analytics, userId);
    }

    // Save updated analytics
    await analytics.save();

    const { response, statusCode } = successResponse("Performance analytics retrieved", { 
      analytics,
      coverLetterName: coverLetter.name
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error getting cover letter performance:", err);
    const { response, statusCode } = errorResponse("Failed to get performance analytics", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get analytics for all user's cover letters
 */
export const getAllCoverLetterAnalytics = async (req, res) => {
  try {
    const userId = getUserId(req);

    // Get all user's cover letters
    const coverLetters = await CoverLetter.find({ userId, isArchived: false })
      .select('_id name templateId style')
      .lean();

    // Get analytics for each
    const analyticsData = [];
    
    for (const letter of coverLetters) {
      let analytics = await CoverLetterAnalytics.findOne({ 
        coverLetterId: letter._id, 
        userId 
      });

      // If no analytics exist, check if there are linked jobs (both directions)
      let linkedJobsCount = await Job.countDocuments({
        userId,
        linkedCoverLetterId: letter._id
      });

      // Also check if this cover letter links to any jobs
      if (linkedJobsCount === 0) {
        const coverLetterDoc = await CoverLetter.findOne({ _id: letter._id, userId });
        if (coverLetterDoc?.linkedJobId) {
          const reverseLinkedJob = await Job.findOne({ 
            _id: coverLetterDoc.linkedJobId, 
            userId 
          });
          if (reverseLinkedJob) {
            linkedJobsCount = 1;
          }
        }
      }

      if (linkedJobsCount > 0 && !analytics) {
        // Create analytics record
        analytics = new CoverLetterAnalytics({
          userId,
          coverLetterId: letter._id,
          templateId: letter.templateId
        });

        // Fetch and update data
        const linkedJobs = await Job.find({
          userId,
          linkedCoverLetterId: letter._id
        }).lean();

        analytics.linkedApplications = linkedJobs.map(job => ({
          jobId: job._id,
          appliedDate: job.applicationDate || job.createdAt,
          responded: job.applicationOutcome?.responded || false,
          responseDate: job.applicationOutcome?.responseDate,
          responseType: job.applicationOutcome?.responseType || '',
          outcome: determineOutcome(job),
          companyName: job.company,
          industry: job.industry || '',
          companySize: job.companyInfo?.size || ''
        }));

        analytics.calculateMetrics();
        await analytics.save();
      }

      analyticsData.push({
        coverLetterId: letter._id,
        coverLetterName: letter.name,
        style: letter.style,
        metrics: analytics ? analytics.performanceMetrics : {
          totalApplications: linkedJobsCount,
          totalResponses: 0,
          responseRate: 0,
          successScore: 0
        },
        hasAnalytics: !!analytics
      });
    }

    // Sort by success score
    analyticsData.sort((a, b) => 
      (b.metrics.successScore || 0) - (a.metrics.successScore || 0)
    );

    const { response, statusCode } = successResponse("All cover letter analytics retrieved", { 
      analytics: analyticsData
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error getting all cover letter analytics:", err);
    const { response, statusCode } = errorResponse("Failed to get analytics", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Track application outcome when job status changes
 * UC-62: Link cover letters to application outcomes
 */
export const trackApplicationOutcome = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { jobId } = req.params;
    const { outcome, responseDate, responseType } = req.body;

    // Find the job
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Update application outcome
    if (!job.applicationOutcome) {
      job.applicationOutcome = {};
    }

    if (outcome) {
      job.applicationOutcome.responded = true;
      job.applicationOutcome.responseDate = responseDate || new Date();
      job.applicationOutcome.responseType = responseType || 'other';
      
      // Calculate time to response
      const appliedDate = job.applicationDate || job.createdAt;
      const respDate = new Date(job.applicationOutcome.responseDate);
      const timeDiff = respDate - new Date(appliedDate);
      job.applicationOutcome.timeToResponse = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      // Update interview/offer flags
      if (responseType === 'interview_request' || job.status === 'Interview') {
        job.applicationOutcome.interviewCount = (job.applicationOutcome.interviewCount || 0) + 1;
      }
      if (responseType === 'offer' || job.status === 'Offer') {
        job.applicationOutcome.offerReceived = true;
      }
    }

    await job.save();

    // Check for linked cover letter (both directions)
    let linkedCoverLetterId = job.linkedCoverLetterId;
    
    if (!linkedCoverLetterId) {
      // Check if any cover letter links to this job
      const coverLetterWithLink = await CoverLetter.findOne({
        userId,
        linkedJobId: job._id
      });
      if (coverLetterWithLink) {
        linkedCoverLetterId = coverLetterWithLink._id;
      }
    }

    // Update analytics if cover letter is linked
    if (linkedCoverLetterId) {
      let analytics = await CoverLetterAnalytics.findOne({
        coverLetterId: linkedCoverLetterId,
        userId
      });

      if (!analytics) {
        const coverLetter = await CoverLetter.findById(linkedCoverLetterId);
        analytics = new CoverLetterAnalytics({
          userId,
          coverLetterId: linkedCoverLetterId,
          templateId: coverLetter?.templateId
        });
      }

      // Refresh linked applications and recalculate (check both directions)
      let linkedJobs = await Job.find({
        userId,
        linkedCoverLetterId: linkedCoverLetterId
      }).lean();

      // Also check if this cover letter links to any jobs
      const coverLetterDoc = await CoverLetter.findOne({ _id: linkedCoverLetterId, userId });
      if (coverLetterDoc?.linkedJobId) {
        const reverseLinkedJob = await Job.findOne({ 
          _id: coverLetterDoc.linkedJobId, 
          userId 
        }).lean();
        if (reverseLinkedJob && !linkedJobs.find(j => j._id.toString() === reverseLinkedJob._id.toString())) {
          linkedJobs.push(reverseLinkedJob);
        }
      }

      analytics.linkedApplications = linkedJobs.map(j => ({
        jobId: j._id,
        appliedDate: j.applicationDate || j.createdAt,
        responded: j.applicationOutcome?.responded || false,
        responseDate: j.applicationOutcome?.responseDate,
        responseType: j.applicationOutcome?.responseType || '',
        outcome: determineOutcome(j),
        companyName: j.company,
        industry: j.industry || '',
        companySize: j.companyInfo?.size || ''
      }));

      analytics.calculateMetrics();
      analytics.analyzeSuccessPatterns();
      await analytics.save();
    }

    const { response, statusCode } = successResponse("Application outcome tracked", { 
      job,
      analyticsUpdated: !!job.linkedCoverLetterId
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error tracking application outcome:", err);
    const { response, statusCode } = errorResponse("Failed to track outcome", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get response rates analysis
 * UC-62: Track response rates by cover letter template/style
 */
export const getResponseRates = async (req, res) => {
  try {
    const userId = getUserId(req);

    // Get all analytics records for user
    const allAnalytics = await CoverLetterAnalytics.find({ userId })
      .populate('coverLetterId', 'name style')
      .populate('templateId', 'name industry style');

    // Aggregate by style
    const byStyle = {};
    const byTemplate = {};

    allAnalytics.forEach(analytics => {
      const style = analytics.coverLetterId?.style || 'unknown';
      const templateName = analytics.templateId?.name || 'custom';
      
      if (!byStyle[style]) {
        byStyle[style] = {
          totalApplications: 0,
          totalResponses: 0,
          responseRate: 0,
          count: 0
        };
      }
      
      if (!byTemplate[templateName]) {
        byTemplate[templateName] = {
          totalApplications: 0,
          totalResponses: 0,
          responseRate: 0,
          count: 0
        };
      }

      // Aggregate
      byStyle[style].totalApplications += analytics.performanceMetrics.totalApplications;
      byStyle[style].totalResponses += analytics.performanceMetrics.totalResponses;
      byStyle[style].count++;

      byTemplate[templateName].totalApplications += analytics.performanceMetrics.totalApplications;
      byTemplate[templateName].totalResponses += analytics.performanceMetrics.totalResponses;
      byTemplate[templateName].count++;
    });

    // Calculate averages
    Object.keys(byStyle).forEach(style => {
      const data = byStyle[style];
      data.responseRate = data.totalApplications > 0 
        ? ((data.totalResponses / data.totalApplications) * 100).toFixed(2)
        : 0;
    });

    Object.keys(byTemplate).forEach(template => {
      const data = byTemplate[template];
      data.responseRate = data.totalApplications > 0
        ? ((data.totalResponses / data.totalApplications) * 100).toFixed(2)
        : 0;
    });

    const { response, statusCode } = successResponse("Response rates retrieved", { 
      byStyle,
      byTemplate,
      overall: {
        totalCoverLetters: allAnalytics.length,
        avgResponseRate: allAnalytics.length > 0
          ? (allAnalytics.reduce((sum, a) => sum + a.performanceMetrics.responseRate, 0) / allAnalytics.length).toFixed(2)
          : 0
      }
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error getting response rates:", err);
    const { response, statusCode } = errorResponse("Failed to get response rates", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get template effectiveness analysis
 * UC-62: Template effectiveness scoring
 */
export const getTemplateEffectiveness = async (req, res) => {
  try {
    const userId = getUserId(req);

    // Get all templates and their analytics
    const templates = await CoverLetterTemplate.find({ userId });
    
    const effectiveness = [];

    for (const template of templates) {
      // Find all analytics for this template
      const analyticsRecords = await CoverLetterAnalytics.find({
        userId,
        templateId: template._id
      });

      if (analyticsRecords.length === 0) {
        effectiveness.push({
          templateId: template._id,
          templateName: template.name,
          style: template.style,
          industry: template.industry,
          effectivenessScore: 0,
          dataPoints: 0,
          metrics: {
            avgResponseRate: 0,
            avgSuccessScore: 0,
            totalApplications: 0
          },
          recommendation: 'insufficient_data'
        });
        continue;
      }

      // Aggregate metrics
      const totalApps = analyticsRecords.reduce((sum, a) => 
        sum + a.performanceMetrics.totalApplications, 0
      );
      const avgResponseRate = analyticsRecords.reduce((sum, a) => 
        sum + a.performanceMetrics.responseRate, 0
      ) / analyticsRecords.length;
      const avgSuccessScore = analyticsRecords.reduce((sum, a) => 
        sum + a.performanceMetrics.successScore, 0
      ) / analyticsRecords.length;

      // Calculate effectiveness score (0-100)
      const effectivenessScore = Math.round(
        (avgResponseRate * 0.4) + (avgSuccessScore * 0.6)
      );

      let recommendation = 'good';
      if (effectivenessScore >= 70) recommendation = 'excellent';
      else if (effectivenessScore >= 50) recommendation = 'good';
      else if (effectivenessScore >= 30) recommendation = 'fair';
      else recommendation = 'needs_improvement';

      effectiveness.push({
        templateId: template._id,
        templateName: template.name,
        style: template.style,
        industry: template.industry,
        effectivenessScore,
        dataPoints: totalApps,
        metrics: {
          avgResponseRate: avgResponseRate.toFixed(2),
          avgSuccessScore: avgSuccessScore.toFixed(2),
          totalApplications: totalApps
        },
        recommendation
      });
    }

    // Sort by effectiveness score
    effectiveness.sort((a, b) => b.effectivenessScore - a.effectivenessScore);

    const { response, statusCode } = successResponse("Template effectiveness retrieved", { 
      effectiveness,
      summary: {
        totalTemplates: effectiveness.length,
        excellentTemplates: effectiveness.filter(e => e.recommendation === 'excellent').length,
        needsImprovementTemplates: effectiveness.filter(e => e.recommendation === 'needs_improvement').length
      }
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error getting template effectiveness:", err);
    const { response, statusCode } = errorResponse("Failed to get template effectiveness", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Get success patterns and insights
 * UC-62: Success pattern identification
 */
export const getSuccessPatterns = async (req, res) => {
  try {
    const userId = getUserId(req);

    // Get all analytics records
    const allAnalytics = await CoverLetterAnalytics.find({ userId })
      .populate('coverLetterId', 'name style');

    // Aggregate patterns
    const patterns = {
      byIndustry: {},
      byCompanySize: {},
      byStyle: {},
      byDay: {},
      overallInsights: []
    };

    allAnalytics.forEach(analytics => {
      // Industry patterns
      analytics.successPatterns?.performanceByIndustry?.forEach(ind => {
        if (!patterns.byIndustry[ind.industry]) {
          patterns.byIndustry[ind.industry] = {
            applications: 0,
            responses: 0,
            responseRate: 0
          };
        }
        patterns.byIndustry[ind.industry].applications += parseInt(ind.applications);
        patterns.byIndustry[ind.industry].responses += Math.round(
          (parseInt(ind.applications) * parseFloat(ind.responseRate)) / 100
        );
      });

      // Company size patterns
      analytics.successPatterns?.performanceByCompanySize?.forEach(size => {
        if (!patterns.byCompanySize[size.size]) {
          patterns.byCompanySize[size.size] = {
            applications: 0,
            successes: 0,
            successRate: 0
          };
        }
        patterns.byCompanySize[size.size].applications += parseInt(size.applications);
        patterns.byCompanySize[size.size].successes += Math.round(
          (parseInt(size.applications) * parseFloat(size.successRate)) / 100
        );
      });

      // Style patterns
      const style = analytics.coverLetterId?.style || 'unknown';
      if (!patterns.byStyle[style]) {
        patterns.byStyle[style] = {
          usageCount: 0,
          avgSuccessScore: 0,
          totalSuccessScore: 0
        };
      }
      patterns.byStyle[style].usageCount++;
      patterns.byStyle[style].totalSuccessScore += analytics.performanceMetrics.successScore;
    });

    // Calculate averages for styles
    Object.keys(patterns.byStyle).forEach(style => {
      const data = patterns.byStyle[style];
      data.avgSuccessScore = (data.totalSuccessScore / data.usageCount).toFixed(2);
      delete data.totalSuccessScore;
    });

    // Calculate rates for industry and company size
    Object.keys(patterns.byIndustry).forEach(industry => {
      const data = patterns.byIndustry[industry];
      data.responseRate = data.applications > 0
        ? ((data.responses / data.applications) * 100).toFixed(2)
        : 0;
    });

    Object.keys(patterns.byCompanySize).forEach(size => {
      const data = patterns.byCompanySize[size];
      data.successRate = data.applications > 0
        ? ((data.successes / data.applications) * 100).toFixed(2)
        : 0;
    });

    // Generate insights
    const insights = generateInsights(patterns, allAnalytics);

    const { response, statusCode } = successResponse("Success patterns retrieved", { 
      patterns,
      insights
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error getting success patterns:", err);
    const { response, statusCode } = errorResponse("Failed to get success patterns", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

/**
 * Export performance report
 * UC-62: Export performance reports
 */
export const exportPerformanceReport = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { format = 'pdf' } = req.query;

    // Get all analytics data
    const allAnalytics = await CoverLetterAnalytics.find({ userId })
      .populate('coverLetterId', 'name style')
      .populate('templateId', 'name');

    if (allAnalytics.length === 0) {
      const { response, statusCode } = errorResponse("No analytics data available", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Generate report based on format
    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(allAnalytics, userId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cover-letter-performance-report-${Date.now()}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    } else if (format === 'json') {
      const reportData = generateJSONReport(allAnalytics);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="cover-letter-performance-report-${Date.now()}.json"`);
      return res.json(reportData);
    } else {
      const { response, statusCode } = errorResponse("Invalid format", 400, ERROR_CODES.INVALID_INPUT);
      return sendResponse(res, response, statusCode);
    }
  } catch (err) {
    console.error("Error exporting performance report:", err);
    const { response, statusCode } = errorResponse("Failed to export report", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

// Helper functions

/**
 * Determine outcome status from job data
 */
function determineOutcome(job) {
  if (job.status === 'Offer' || job.applicationOutcome?.offerReceived) {
    return 'offer';
  }
  if (job.status === 'Interview' || job.status === 'Phone Screen') {
    return 'interview';
  }
  if (job.status === 'Rejected') {
    return 'rejection';
  }
  if (job.applicationOutcome?.responded) {
    return 'responded';
  }
  return 'pending';
}

/**
 * Calculate template effectiveness compared to others
 */
async function calculateTemplateEffectiveness(analytics, userId) {
  // Get all analytics for user
  const allUserAnalytics = await CoverLetterAnalytics.find({ userId });
  
  if (allUserAnalytics.length < 2) {
    analytics.templateEffectiveness = {
      comparedToAverage: 'insufficient_data',
      recommendationScore: 5
    };
    return;
  }

  // Calculate average success score
  const avgSuccessScore = allUserAnalytics.reduce((sum, a) => 
    sum + a.performanceMetrics.successScore, 0
  ) / allUserAnalytics.length;

  const currentScore = analytics.performanceMetrics.successScore;
  
  let comparedToAverage = 'average';
  if (currentScore > avgSuccessScore * 1.2) {
    comparedToAverage = 'above';
  } else if (currentScore < avgSuccessScore * 0.8) {
    comparedToAverage = 'below';
  }

  // Calculate percentile
  const sortedScores = allUserAnalytics
    .map(a => a.performanceMetrics.successScore)
    .sort((a, b) => a - b);
  const rank = sortedScores.findIndex(score => score >= currentScore);
  const percentile = Math.round((rank / sortedScores.length) * 100);

  analytics.templateEffectiveness = {
    comparedToAverage,
    percentileRank: percentile,
    recommendationScore: Math.min(10, Math.round(currentScore / 10)),
    strengths: generateStrengths(analytics),
    improvements: generateImprovements(analytics)
  };
}

/**
 * Generate strength points based on analytics
 */
function generateStrengths(analytics) {
  const strengths = [];
  const metrics = analytics.performanceMetrics;

  if (metrics.responseRate > 50) {
    strengths.push(`High response rate (${metrics.responseRate}%)`);
  }
  if (metrics.interviewRate > 30) {
    strengths.push(`Strong interview conversion (${metrics.interviewRate}%)`);
  }
  if (metrics.offerRate > 20) {
    strengths.push(`Excellent offer rate (${metrics.offerRate}%)`);
  }
  if (metrics.avgTimeToResponse > 0 && metrics.avgTimeToResponse < 7) {
    strengths.push(`Quick response time (${metrics.avgTimeToResponse} days)`);
  }

  return strengths.length > 0 ? strengths : ['Collecting data to identify strengths'];
}

/**
 * Generate improvement suggestions
 */
function generateImprovements(analytics) {
  const improvements = [];
  const metrics = analytics.performanceMetrics;

  if (metrics.responseRate < 30) {
    improvements.push('Consider revising opening paragraph to be more compelling');
  }
  if (metrics.interviewRate < 20 && metrics.responseRate > 40) {
    improvements.push('Responses are good but interview conversion is low - strengthen your value proposition');
  }
  if (metrics.totalApplications < 5) {
    improvements.push('Use this cover letter more to gather meaningful data');
  }
  if (metrics.offerRate < 10 && metrics.interviewRate > 30) {
    improvements.push('Getting interviews but not offers - review how you present your experience');
  }

  return improvements.length > 0 ? improvements : ['Keep using and tracking to identify improvements'];
}

/**
 * Generate insights from patterns
 */
function generateInsights(patterns, allAnalytics) {
  const insights = [];

  // Best performing style
  const styles = Object.entries(patterns.byStyle);
  if (styles.length > 0) {
    const bestStyle = styles.reduce((best, current) => 
      parseFloat(current[1].avgSuccessScore) > parseFloat(best[1].avgSuccessScore) ? current : best
    );
    insights.push({
      type: 'style',
      message: `Your "${bestStyle[0]}" style cover letters perform best with an average success score of ${bestStyle[1].avgSuccessScore}`,
      actionable: true
    });
  }

  // Best performing industry
  const industries = Object.entries(patterns.byIndustry);
  if (industries.length > 0) {
    const bestIndustry = industries.reduce((best, current) => 
      parseFloat(current[1].responseRate) > parseFloat(best[1].responseRate) ? current : best
    );
    insights.push({
      type: 'industry',
      message: `Highest response rate in ${bestIndustry[0]} industry (${bestIndustry[1].responseRate}%)`,
      actionable: false
    });
  }

  // Company size insights
  const sizes = Object.entries(patterns.byCompanySize);
  if (sizes.length > 0) {
    const bestSize = sizes.reduce((best, current) => 
      parseFloat(current[1].successRate) > parseFloat(best[1].successRate) ? current : best
    );
    insights.push({
      type: 'company_size',
      message: `Best success rate with ${bestSize[0]} companies (${bestSize[1].successRate}%)`,
      actionable: true
    });
  }

  // Overall performance
  const totalApps = allAnalytics.reduce((sum, a) => sum + a.performanceMetrics.totalApplications, 0);
  const avgResponseRate = allAnalytics.length > 0
    ? allAnalytics.reduce((sum, a) => sum + a.performanceMetrics.responseRate, 0) / allAnalytics.length
    : 0;
  
  insights.push({
    type: 'overall',
    message: `Overall average response rate: ${avgResponseRate.toFixed(2)}% across ${totalApps} applications`,
    actionable: false
  });

  return insights;
}

/**
 * Generate PDF report
 */
async function generatePDFReport(analyticsData, userId) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = 750;

  // Title
  page.drawText('Cover Letter Performance Report', {
    x: 50,
    y: yPosition,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0)
  });

  yPosition -= 30;
  page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5)
  });

  yPosition -= 40;

  // Summary statistics
  const totalApps = analyticsData.reduce((sum, a) => sum + a.performanceMetrics.totalApplications, 0);
  const avgResponseRate = analyticsData.length > 0
    ? (analyticsData.reduce((sum, a) => sum + a.performanceMetrics.responseRate, 0) / analyticsData.length).toFixed(2)
    : 0;
  const avgSuccessScore = analyticsData.length > 0
    ? (analyticsData.reduce((sum, a) => sum + a.performanceMetrics.successScore, 0) / analyticsData.length).toFixed(2)
    : 0;

  page.drawText('Overall Performance', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont
  });

  yPosition -= 25;
  page.drawText(`Total Applications: ${totalApps}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: font
  });

  yPosition -= 20;
  page.drawText(`Average Response Rate: ${avgResponseRate}%`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: font
  });

  yPosition -= 20;
  page.drawText(`Average Success Score: ${avgSuccessScore}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: font
  });

  yPosition -= 40;

  // Top performing cover letters
  page.drawText('Top Performing Cover Letters', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont
  });

  yPosition -= 25;

  const topLetters = analyticsData
    .sort((a, b) => b.performanceMetrics.successScore - a.performanceMetrics.successScore)
    .slice(0, 5);

  topLetters.forEach((analytics, index) => {
    if (yPosition < 100) return; // Stop if we run out of space

    page.drawText(`${index + 1}. ${analytics.coverLetterId?.name || 'Untitled'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: boldFont
    });

    yPosition -= 15;
    page.drawText(`   Success Score: ${analytics.performanceMetrics.successScore} | Response Rate: ${analytics.performanceMetrics.responseRate}%`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font
    });

    yPosition -= 20;
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Generate JSON report
 */
function generateJSONReport(analyticsData) {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCoverLetters: analyticsData.length,
      totalApplications: analyticsData.reduce((sum, a) => sum + a.performanceMetrics.totalApplications, 0),
      avgResponseRate: analyticsData.length > 0
        ? (analyticsData.reduce((sum, a) => sum + a.performanceMetrics.responseRate, 0) / analyticsData.length).toFixed(2)
        : 0,
      avgSuccessScore: analyticsData.length > 0
        ? (analyticsData.reduce((sum, a) => sum + a.performanceMetrics.successScore, 0) / analyticsData.length).toFixed(2)
        : 0
    },
    coverLetters: analyticsData.map(analytics => ({
      name: analytics.coverLetterId?.name,
      style: analytics.coverLetterId?.style,
      templateName: analytics.templateId?.name,
      metrics: analytics.performanceMetrics,
      successPatterns: analytics.successPatterns,
      templateEffectiveness: analytics.templateEffectiveness
    }))
  };
}
