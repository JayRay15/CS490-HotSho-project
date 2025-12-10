import { ResponseTimePrediction } from '../models/ResponseTimePrediction.js';
import { Job } from '../models/Job.js';

class ResponseTimePredictionService {
  constructor() {
    // Default response time patterns by company size (in days)
    this.companySizeDefaults = {
      '1-10': { min: 2, median: 5, max: 10 },
      '11-50': { min: 3, median: 7, max: 14 },
      '51-200': { min: 5, median: 10, max: 21 },
      '201-500': { min: 7, median: 14, max: 28 },
      '501-1000': { min: 10, median: 18, max: 35 },
      '1001-5000': { min: 14, median: 21, max: 42 },
      '5001-10000': { min: 14, median: 25, max: 50 },
      '10000+': { min: 14, median: 28, max: 60 },
      'unknown': { min: 5, median: 14, max: 30 }
    };

    // Industry-specific adjustments (multiplier for default times)
    this.industryAdjustments = {
      'Technology': { multiplier: 0.85, description: 'Tech companies often move faster' },
      'Finance': { multiplier: 1.2, description: 'Finance has longer vetting processes' },
      'Healthcare': { multiplier: 1.3, description: 'Healthcare requires thorough background checks' },
      'Education': { multiplier: 1.4, description: 'Education institutions have longer hiring cycles' },
      'Manufacturing': { multiplier: 1.1, description: 'Manufacturing follows traditional hiring' },
      'Retail': { multiplier: 0.9, description: 'Retail often has quicker turnaround' },
      'Marketing': { multiplier: 0.95, description: 'Marketing agencies move relatively fast' },
      'Consulting': { multiplier: 1.15, description: 'Consulting firms have multi-stage processes' },
      'Other': { multiplier: 1.0, description: 'Standard hiring timeline' },
      'unknown': { multiplier: 1.0, description: 'Unknown industry' }
    };

    // Job level adjustments (additional days)
    this.jobLevelAdjustments = {
      'entry': { adjustment: -3, description: 'Entry-level positions fill faster' },
      'mid': { adjustment: 0, description: 'Standard timeline for mid-level' },
      'senior': { adjustment: 5, description: 'Senior roles require more vetting' },
      'lead': { adjustment: 7, description: 'Lead positions have longer processes' },
      'manager': { adjustment: 10, description: 'Management roles involve more stakeholders' },
      'director': { adjustment: 14, description: 'Director positions have extensive evaluation' },
      'executive': { adjustment: 21, description: 'Executive hiring is comprehensive' },
      'unknown': { adjustment: 0, description: 'Unknown job level' }
    };

    // Seasonality patterns
    this.seasonalityPatterns = {
      // Month: { adjustment, description }
      1: { adjustment: 3, isHoliday: false, description: 'Post-holiday catchup, slower responses' },
      2: { adjustment: 0, isHoliday: false, description: 'Normal hiring activity' },
      3: { adjustment: -2, isHoliday: false, description: 'Q1 budget release, active hiring' },
      4: { adjustment: 0, isHoliday: false, description: 'Normal hiring activity' },
      5: { adjustment: 2, isHoliday: false, description: 'Pre-summer slowdown beginning' },
      6: { adjustment: 3, isHoliday: false, description: 'Summer hiring slowdown' },
      7: { adjustment: 5, isHoliday: true, description: 'Summer vacation period, slower' },
      8: { adjustment: 4, isHoliday: true, description: 'Late summer slowdown' },
      9: { adjustment: -3, isHoliday: false, description: 'Post-Labor Day hiring surge' },
      10: { adjustment: -2, isHoliday: false, description: 'Active fall hiring' },
      11: { adjustment: 5, isHoliday: true, description: 'Pre-holiday slowdown (Thanksgiving)' },
      12: { adjustment: 10, isHoliday: true, description: 'Holiday season, significant delays' }
    };

    // Day of week adjustments
    this.dayOfWeekPatterns = {
      0: { adjustment: 1, description: 'Sunday applications may wait until Monday review' },
      1: { adjustment: -1, description: 'Monday - start of week, active review' },
      2: { adjustment: -1, description: 'Tuesday - prime application day' },
      3: { adjustment: 0, description: 'Wednesday - mid-week normal' },
      4: { adjustment: 0, description: 'Thursday - normal activity' },
      5: { adjustment: 2, description: 'Friday - may wait until next week' },
      6: { adjustment: 2, description: 'Saturday - weekend delay' }
    };

    // Fiscal quarter end impact
    this.fiscalQuarterEndMonths = [3, 6, 9, 12];
  }

  /**
   * Get the base response time for a company size
   */
  getCompanySizeBaseline(companySize) {
    return this.companySizeDefaults[companySize] || this.companySizeDefaults['unknown'];
  }

  /**
   * Get industry adjustment
   */
  getIndustryAdjustment(industry) {
    return this.industryAdjustments[industry] || this.industryAdjustments['unknown'];
  }

  /**
   * Get job level adjustment
   */
  getJobLevelAdjustment(jobLevel) {
    return this.jobLevelAdjustments[jobLevel] || this.jobLevelAdjustments['unknown'];
  }

  /**
   * Check if date is near fiscal quarter end
   */
  isNearFiscalQuarterEnd(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), month, 0).getDate();
    
    if (this.fiscalQuarterEndMonths.includes(month) && day >= daysInMonth - 14) {
      return { isNear: true, daysUntilEnd: daysInMonth - day };
    }
    return { isNear: false };
  }

  /**
   * Calculate predicted response time
   */
  async calculatePrediction(jobData, applicationDate = new Date()) {
    const {
      companySize = 'unknown',
      industry = 'unknown',
      jobLevel = 'unknown'
    } = jobData;

    const factors = [];
    
    // Get baseline from company size
    const baseline = this.getCompanySizeBaseline(companySize);
    let predictedMin = baseline.min;
    let predictedMedian = baseline.median;
    let predictedMax = baseline.max;

    factors.push({
      factor: 'company_size',
      impact: companySize === 'unknown' ? 'neutral' : (baseline.median <= 10 ? 'faster' : 'slower'),
      description: `${companySize} companies typically respond in ${baseline.min}-${baseline.max} days`,
      adjustmentDays: 0
    });

    // Apply industry multiplier
    const industryAdj = this.getIndustryAdjustment(industry);
    predictedMin = Math.round(predictedMin * industryAdj.multiplier);
    predictedMedian = Math.round(predictedMedian * industryAdj.multiplier);
    predictedMax = Math.round(predictedMax * industryAdj.multiplier);

    factors.push({
      factor: 'industry',
      impact: industryAdj.multiplier < 1 ? 'faster' : (industryAdj.multiplier > 1 ? 'slower' : 'neutral'),
      description: industryAdj.description,
      adjustmentDays: Math.round((industryAdj.multiplier - 1) * baseline.median)
    });

    // Apply job level adjustment
    const jobLevelAdj = this.getJobLevelAdjustment(jobLevel);
    predictedMin = Math.max(1, predictedMin + Math.round(jobLevelAdj.adjustment * 0.5));
    predictedMedian = Math.max(2, predictedMedian + jobLevelAdj.adjustment);
    predictedMax = predictedMax + Math.round(jobLevelAdj.adjustment * 1.5);

    if (jobLevelAdj.adjustment !== 0) {
      factors.push({
        factor: 'job_level',
        impact: jobLevelAdj.adjustment < 0 ? 'faster' : 'slower',
        description: jobLevelAdj.description,
        adjustmentDays: jobLevelAdj.adjustment
      });
    }

    // Apply seasonality
    const appDate = new Date(applicationDate);
    const month = appDate.getMonth() + 1;
    const seasonalAdj = this.seasonalityPatterns[month];
    
    predictedMin = Math.max(1, predictedMin + Math.round(seasonalAdj.adjustment * 0.5));
    predictedMedian = Math.max(2, predictedMedian + seasonalAdj.adjustment);
    predictedMax = predictedMax + Math.round(seasonalAdj.adjustment * 1.5);

    factors.push({
      factor: 'seasonality',
      impact: seasonalAdj.adjustment < 0 ? 'faster' : (seasonalAdj.adjustment > 2 ? 'slower' : 'neutral'),
      description: seasonalAdj.description,
      adjustmentDays: seasonalAdj.adjustment
    });

    if (seasonalAdj.isHoliday) {
      factors.push({
        factor: 'holiday_period',
        impact: 'slower',
        description: 'Holiday period may cause additional delays',
        adjustmentDays: 3
      });
    }

    // Apply day of week adjustment
    const dayOfWeek = appDate.getDay();
    const dayAdj = this.dayOfWeekPatterns[dayOfWeek];
    
    predictedMedian = Math.max(2, predictedMedian + dayAdj.adjustment);

    if (dayAdj.adjustment !== 0) {
      factors.push({
        factor: 'day_of_week',
        impact: dayAdj.adjustment < 0 ? 'faster' : 'slower',
        description: dayAdj.description,
        adjustmentDays: dayAdj.adjustment
      });
    }

    // Check fiscal quarter end
    const quarterEnd = this.isNearFiscalQuarterEnd(appDate);
    if (quarterEnd.isNear) {
      const quarterAdjustment = 5;
      predictedMedian += quarterAdjustment;
      predictedMax += quarterAdjustment * 2;

      factors.push({
        factor: 'fiscal_quarter',
        impact: 'slower',
        description: `Near fiscal quarter end - hiring may be slower (${quarterEnd.daysUntilEnd} days until quarter end)`,
        adjustmentDays: quarterAdjustment
      });
    }

    // Try to get historical data for more accurate predictions
    const historicalStats = await this.getHistoricalStats({ industry, companySize, jobLevel });
    
    if (historicalStats && historicalStats.count >= 10) {
      // Blend historical data with default predictions
      const historicalWeight = Math.min(0.7, historicalStats.count / 50); // Max 70% weight to historical
      const defaultWeight = 1 - historicalWeight;

      predictedMin = Math.round(predictedMin * defaultWeight + historicalStats.percentile10 * historicalWeight);
      predictedMedian = Math.round(predictedMedian * defaultWeight + historicalStats.percentile50 * historicalWeight);
      predictedMax = Math.round(predictedMax * defaultWeight + historicalStats.percentile90 * historicalWeight);

      factors.push({
        factor: 'historical_accuracy',
        impact: 'neutral',
        description: `Based on ${historicalStats.count} similar applications`,
        adjustmentDays: 0
      });
    }

    // Calculate suggested follow-up date (typically median + a few days buffer)
    const suggestedFollowUpDate = new Date(appDate);
    suggestedFollowUpDate.setDate(suggestedFollowUpDate.getDate() + predictedMedian + 3);

    // Ensure min < median < max
    predictedMin = Math.max(1, Math.min(predictedMin, predictedMedian - 1));
    predictedMax = Math.max(predictedMax, predictedMedian + 3);

    // Get industry benchmark for comparison
    const industryBenchmark = await this.getIndustryBenchmark(industry);

    return {
      predictedDaysMin: predictedMin,
      predictedDaysMax: predictedMax,
      predictedDaysMedian: predictedMedian,
      confidenceLevel: historicalStats ? Math.min(80, 60 + historicalStats.count) : 65,
      suggestedFollowUpDate,
      isOverdue: false,
      daysOverdue: 0,
      factors,
      industryBenchmark
    };
  }

  /**
   * Get historical statistics for prediction
   */
  async getHistoricalStats(filters) {
    try {
      return await ResponseTimePrediction.getPredictionStats(filters);
    } catch (error) {
      console.error('Error getting historical stats:', error);
      return null;
    }
  }

  /**
   * Get industry benchmark
   */
  async getIndustryBenchmark(industry) {
    try {
      const stats = await ResponseTimePrediction.getIndustryStats(industry);
      if (stats && stats.length > 0) {
        const industryData = stats[0];
        return {
          averageDays: Math.round(industryData.avgDays),
          percentile25: industryData.percentile25 || Math.round(industryData.avgDays * 0.7),
          percentile75: industryData.percentile75 || Math.round(industryData.avgDays * 1.4),
          sampleSize: industryData.count
        };
      }
    } catch (error) {
      console.error('Error getting industry benchmark:', error);
    }

    // Return default benchmark based on industry patterns
    const baseline = this.industryAdjustments[industry] || this.industryAdjustments['unknown'];
    const defaultMedian = 14 * baseline.multiplier;
    return {
      averageDays: Math.round(defaultMedian),
      percentile25: Math.round(defaultMedian * 0.6),
      percentile75: Math.round(defaultMedian * 1.5),
      sampleSize: 0
    };
  }

  /**
   * Create or update prediction for a job
   */
  async createOrUpdatePrediction(userId, jobId) {
    // Get job details
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) {
      throw new Error('Job not found');
    }

    const jobData = {
      companySize: job.companyInfo?.size || 'unknown',
      industry: job.industry || 'unknown',
      jobLevel: this.inferJobLevel(job.title) || 'unknown'
    };

    const applicationDate = job.applicationDate || new Date();
    const prediction = await this.calculatePrediction(jobData, applicationDate);

    // Check if overdue
    const daysSinceApplication = Math.floor(
      (new Date() - new Date(applicationDate)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceApplication > prediction.predictedDaysMax) {
      prediction.isOverdue = true;
      prediction.daysOverdue = daysSinceApplication - prediction.predictedDaysMax;
    }

    // Create or update the prediction record
    const predictionRecord = await ResponseTimePrediction.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          userId,
          jobId,
          companySize: jobData.companySize,
          industry: jobData.industry,
          jobLevel: jobData.jobLevel,
          companyName: job.company,
          applicationDate,
          currentPrediction: prediction,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      prediction,
      predictionId: predictionRecord._id,
      jobTitle: job.title,
      companyName: job.company,
      applicationDate,
      daysSinceApplication
    };
  }

  /**
   * Infer job level from job title
   */
  inferJobLevel(title) {
    if (!title) return 'unknown';
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cfo') || 
        titleLower.includes('chief') || titleLower.includes('president') || titleLower.includes('vp') ||
        titleLower.includes('vice president')) {
      return 'executive';
    }
    if (titleLower.includes('director')) {
      return 'director';
    }
    if (titleLower.includes('manager') || titleLower.includes('head of')) {
      return 'manager';
    }
    if (titleLower.includes('lead') || titleLower.includes('principal') || titleLower.includes('staff')) {
      return 'lead';
    }
    if (titleLower.includes('senior') || titleLower.includes('sr.') || titleLower.includes('sr ')) {
      return 'senior';
    }
    if (titleLower.includes('junior') || titleLower.includes('jr.') || titleLower.includes('jr ') ||
        titleLower.includes('intern') || titleLower.includes('entry') || titleLower.includes('associate') ||
        titleLower.includes('trainee') || titleLower.includes('graduate')) {
      return 'entry';
    }
    
    return 'mid';
  }

  /**
   * Get all overdue applications for a user
   */
  async getOverdueApplications(userId) {
    const predictions = await ResponseTimePrediction.find({
      userId,
      status: 'pending',
      'currentPrediction.isOverdue': true
    }).populate('jobId');

    return predictions.map(p => ({
      predictionId: p._id,
      job: p.jobId,
      companyName: p.companyName,
      applicationDate: p.applicationDate,
      daysOverdue: p.currentPrediction.daysOverdue,
      predictedMax: p.currentPrediction.predictedDaysMax,
      suggestedFollowUpDate: p.currentPrediction.suggestedFollowUpDate
    }));
  }

  /**
   * Update prediction with actual response
   */
  async recordActualResponse(userId, jobId, responseDate, responseType) {
    const prediction = await ResponseTimePrediction.findOne({ userId, jobId });
    
    if (!prediction) {
      throw new Error('Prediction record not found');
    }

    prediction.recordResponse(responseDate, responseType);
    await prediction.save();

    return {
      actualDaysToResponse: prediction.actualDaysToResponse,
      predictionAccuracy: prediction.predictionAccuracy,
      wasAccurate: prediction.predictionAccuracy?.wasAccurate,
      wasWithinConfidenceInterval: prediction.predictionAccuracy?.wasWithinConfidenceInterval
    };
  }

  /**
   * Get follow-up suggestions
   */
  async getFollowUpSuggestions(userId, jobId) {
    const prediction = await ResponseTimePrediction.findOne({ userId, jobId });
    
    if (!prediction || !prediction.currentPrediction) {
      return null;
    }

    const now = new Date();
    const applicationDate = new Date(prediction.applicationDate);
    const daysSinceApplication = Math.floor((now - applicationDate) / (1000 * 60 * 60 * 24));
    const suggestedFollowUpDate = new Date(prediction.currentPrediction.suggestedFollowUpDate);

    let recommendation;
    let urgency;

    if (daysSinceApplication < prediction.currentPrediction.predictedDaysMin) {
      recommendation = 'Too early to follow up. Give them more time to review your application.';
      urgency = 'none';
    } else if (daysSinceApplication >= prediction.currentPrediction.predictedDaysMin && 
               daysSinceApplication <= prediction.currentPrediction.predictedDaysMedian) {
      recommendation = 'Within normal response window. Consider following up if you haven\'t heard back by ' + 
                      suggestedFollowUpDate.toLocaleDateString();
      urgency = 'low';
    } else if (daysSinceApplication > prediction.currentPrediction.predictedDaysMedian &&
               daysSinceApplication <= prediction.currentPrediction.predictedDaysMax) {
      recommendation = 'Good time to send a polite follow-up email expressing continued interest.';
      urgency = 'medium';
    } else {
      recommendation = 'Response is overdue. Send a follow-up email or consider reaching out via LinkedIn.';
      urgency = 'high';
    }

    return {
      daysSinceApplication,
      suggestedFollowUpDate,
      isOverdue: prediction.currentPrediction.isOverdue,
      daysOverdue: prediction.currentPrediction.daysOverdue,
      recommendation,
      urgency,
      followUpTemplates: this.getFollowUpTemplates(urgency, daysSinceApplication)
    };
  }

  /**
   * Get follow-up email templates based on urgency
   */
  getFollowUpTemplates(urgency, daysSinceApplication) {
    const templates = {
      low: {
        subject: 'Following Up on [Position] Application',
        body: `I wanted to follow up on my application for the [Position] role submitted ${daysSinceApplication} days ago. I remain very interested in this opportunity and would welcome the chance to discuss how my skills align with your team's needs.`
      },
      medium: {
        subject: 'Checking In: [Position] Application',
        body: `I hope this message finds you well. I'm reaching out to inquire about the status of my application for the [Position] role, which I submitted ${daysSinceApplication} days ago. I'm very enthusiastic about the opportunity and would appreciate any updates you might have.`
      },
      high: {
        subject: 'Application Status Inquiry: [Position]',
        body: `I'm writing to follow up on my application for the [Position] role submitted ${daysSinceApplication} days ago. I understand hiring processes can take time, but I wanted to confirm my continued strong interest in this position. Please let me know if you need any additional information from me.`
      }
    };

    return templates[urgency] || templates.medium;
  }

  /**
   * Get user's prediction accuracy statistics
   */
  async getUserPredictionAccuracy(userId) {
    const predictions = await ResponseTimePrediction.find({
      userId,
      status: { $in: ['responded', 'ghosted'] },
      'predictionAccuracy.wasAccurate': { $exists: true }
    });

    if (predictions.length === 0) {
      return null;
    }

    const accurateCount = predictions.filter(p => p.predictionAccuracy.wasAccurate).length;
    const withinIntervalCount = predictions.filter(p => p.predictionAccuracy.wasWithinConfidenceInterval).length;
    const totalErrorDays = predictions.reduce((sum, p) => sum + Math.abs(p.predictionAccuracy.errorDays || 0), 0);

    return {
      totalPredictions: predictions.length,
      accurateCount,
      accuracyRate: Math.round((accurateCount / predictions.length) * 100),
      withinConfidenceIntervalRate: Math.round((withinIntervalCount / predictions.length) * 100),
      averageErrorDays: Math.round(totalErrorDays / predictions.length * 10) / 10
    };
  }

  /**
   * Check and update overdue status for all pending predictions
   */
  async updateOverdueStatus(userId) {
    const predictions = await ResponseTimePrediction.find({
      userId,
      status: 'pending'
    });

    const updated = [];
    for (const prediction of predictions) {
      if (!prediction.applicationDate) continue;

      const daysSinceApplication = Math.floor(
        (new Date() - new Date(prediction.applicationDate)) / (1000 * 60 * 60 * 24)
      );

      const wasOverdue = prediction.currentPrediction?.isOverdue;
      const isNowOverdue = daysSinceApplication > (prediction.currentPrediction?.predictedDaysMax || 30);

      if (isNowOverdue && !wasOverdue) {
        prediction.currentPrediction.isOverdue = true;
        prediction.currentPrediction.daysOverdue = daysSinceApplication - prediction.currentPrediction.predictedDaysMax;
        await prediction.save();
        updated.push(prediction);
      }
    }

    return updated;
  }

  /**
   * Get all industry benchmarks
   */
  async getAllIndustryBenchmarks() {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Marketing', 'Consulting', 'Other'];
    const benchmarks = {};

    for (const industry of industries) {
      benchmarks[industry] = await this.getIndustryBenchmark(industry);
    }

    return benchmarks;
  }
}

export default new ResponseTimePredictionService();
