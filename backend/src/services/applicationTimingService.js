import { ApplicationTiming } from '../models/ApplicationTiming.js';

class ApplicationTimingService {
  constructor() {
    // Industry-specific patterns based on hiring cycles
    this.industryPatterns = {
      'Technology': {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: [10, 11, 14, 15, 9], // Primary: 10 AM
        avoidDays: ['Friday', 'Sunday'],
        quarterEndMonths: [3, 6, 9, 12], // Avoid last 2 weeks
        hiringSeasons: {
          high: [1, 2, 9, 10], // January, February, September, October
          low: [7, 8, 12] // July, August, December
        }
      },
      'Finance': {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: [8, 9, 10, 14], // Primary: 8 AM (earlier for finance)
        avoidDays: ['Monday', 'Friday', 'Sunday'],
        quarterEndMonths: [3, 6, 9, 12],
        hiringSeasons: {
          high: [1, 2, 9],
          low: [7, 12]
        }
      },
      'Consulting': {
        bestDays: ['Monday', 'Tuesday', 'Wednesday'],
        bestHours: [11, 14, 10, 15], // Primary: 11 AM
        avoidDays: ['Friday', 'Sunday'],
        quarterEndMonths: [3, 6, 9, 12],
        hiringSeasons: {
          high: [1, 2, 9],
          low: [7, 12]
        }
      },
      'Healthcare': {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: [9, 10, 11, 13, 14], // Primary: 9 AM
        avoidDays: ['Sunday'],
        quarterEndMonths: [],
        hiringSeasons: {
          high: [1, 2, 3, 9, 10],
          low: [12]
        }
      },
      'Retail': {
        bestDays: ['Monday', 'Tuesday', 'Wednesday'],
        bestHours: [14, 15, 10, 11], // Primary: 2 PM (afternoon for retail)
        avoidDays: ['Saturday', 'Sunday'],
        quarterEndMonths: [],
        hiringSeasons: {
          high: [8, 9, 10], // Pre-holiday hiring
          low: [1, 2] // Post-holiday
        }
      },
      'Education': {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: [9, 10, 11, 13], // Primary: 9 AM
        avoidDays: ['Friday', 'Saturday', 'Sunday'],
        quarterEndMonths: [],
        hiringSeasons: {
          high: [3, 4, 5, 6, 7], // Spring/Summer hiring
          low: [11, 12]
        }
      },
      'default': {
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: [9, 10, 11, 14, 15],
        avoidDays: ['Sunday'],
        quarterEndMonths: [3, 6, 9, 12],
        hiringSeasons: {
          high: [1, 2, 9, 10],
          low: [7, 12]
        }
      }
    };

    // Company size patterns
    this.companySizePatterns = {
      '1-10': { responseTimeHours: 48, preferredTimes: [10, 11, 14, 15, 16] },
      '11-50': { responseTimeHours: 72, preferredTimes: [9, 10, 11, 14, 15] },
      '51-200': { responseTimeHours: 120, preferredTimes: [9, 10, 11, 14] },
      '201-500': { responseTimeHours: 168, preferredTimes: [9, 10, 11] },
      '501-1000': { responseTimeHours: 240, preferredTimes: [9, 10, 14] },
      '1001-5000': { responseTimeHours: 336, preferredTimes: [9, 10] },
      '5001-10000': { responseTimeHours: 480, preferredTimes: [9, 10] },
      '10000+': { responseTimeHours: 480, preferredTimes: [9, 10] },
      'default': { responseTimeHours: 168, preferredTimes: [9, 10, 11, 14, 15] }
    };

    // US holidays to avoid
    this.holidays = [
      { month: 1, day: 1, name: "New Year's Day" },
      { month: 7, day: 4, name: "Independence Day" },
      { month: 11, day: 11, name: "Veterans Day" },
      { month: 12, day: 25, name: "Christmas" },
      { month: 12, day: 31, name: "New Year's Eve" }
      // Note: Floating holidays like Thanksgiving need special handling
    ];
  }

  /**
   * Get the industry pattern or default
   */
  getIndustryPattern(industry) {
    return this.industryPatterns[industry] || this.industryPatterns.default;
  }

  /**
   * Get company size pattern or default
   */
  getCompanySizePattern(companySize) {
    return this.companySizePatterns[companySize] || this.companySizePatterns.default;
  }

  /**
   * Check if a date is a US holiday
   */
  isHoliday(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    // Check fixed holidays
    const fixedHoliday = this.holidays.find(h => h.month === month && h.day === day);
    if (fixedHoliday) {
      return { isHoliday: true, name: fixedHoliday.name };
    }

    // Thanksgiving (4th Thursday of November)
    if (month === 11 && dayOfWeek === 4) {
      const thursdayOfMonth = Math.ceil(day / 7);
      if (thursdayOfMonth === 4) {
        return { isHoliday: true, name: 'Thanksgiving' };
      }
    }

    // Black Friday (day after Thanksgiving)
    if (month === 11 && dayOfWeek === 5) {
      const fridayOfMonth = Math.ceil(day / 7);
      if (fridayOfMonth === 4) {
        return { isHoliday: true, name: 'Black Friday' };
      }
    }

    // Memorial Day (last Monday of May)
    if (month === 5 && dayOfWeek === 1 && day > 24) {
      return { isHoliday: true, name: 'Memorial Day' };
    }

    // Labor Day (first Monday of September)
    if (month === 9 && dayOfWeek === 1 && day <= 7) {
      return { isHoliday: true, name: 'Labor Day' };
    }

    return { isHoliday: false };
  }

  /**
   * Check if date is near quarter end
   */
  isNearQuarterEnd(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const quarterEndMonths = [3, 6, 9, 12];

    if (quarterEndMonths.includes(month)) {
      const daysInMonth = new Date(date.getFullYear(), month, 0).getDate();
      if (day >= daysInMonth - 14) {
        return { isNear: true, daysUntilEnd: daysInMonth - day };
      }
    }

    return { isNear: false };
  }

  /**
   * Calculate timezone-adjusted time for remote positions
   */
  adjustForTimezone(localTime, jobTimezone, userTimezone) {
    if (!jobTimezone || !userTimezone || jobTimezone === userTimezone) {
      return localTime;
    }

    // This is a simplified timezone adjustment
    // In production, use a proper timezone library like moment-timezone or date-fns-tz
    const timezoneOffsets = {
      'EST': -5, 'EDT': -4,
      'CST': -6, 'CDT': -5,
      'MST': -7, 'MDT': -6,
      'PST': -8, 'PDT': -7,
      'AKST': -9, 'AKDT': -8,
      'HST': -10
    };

    const jobOffset = timezoneOffsets[jobTimezone] || 0;
    const userOffset = timezoneOffsets[userTimezone] || 0;
    const difference = jobOffset - userOffset;

    const adjusted = new Date(localTime);
    adjusted.setHours(adjusted.getHours() + difference);

    return adjusted;
  }

  /**
   * Analyze historical data for patterns
   */
  async analyzeHistoricalData(userId, industry, companySize) {
    const userTimings = await ApplicationTiming.find({ userId });
    const industryTimings = await ApplicationTiming.find({ industry });

    const analysis = {
      userPatterns: {
        bestDay: null,
        bestHour: null,
        successRate: 0
      },
      industryPatterns: {
        bestDay: null,
        bestHour: null,
        successRate: 0
      }
    };

    // Analyze user's historical submissions
    if (userTimings.length > 0) {
      const dayCount = {};
      const hourCount = {};

      userTimings.forEach(timing => {
        timing.submissionHistory.forEach(submission => {
          if (submission.responseReceived && submission.responseType === 'positive') {
            dayCount[submission.dayOfWeek] = (dayCount[submission.dayOfWeek] || 0) + 1;
            hourCount[submission.hourOfDay] = (hourCount[submission.hourOfDay] || 0) + 1;
          }
        });
      });

      if (Object.keys(dayCount).length > 0) {
        analysis.userPatterns.bestDay = Object.entries(dayCount)
          .sort((a, b) => b[1] - a[1])[0][0];
      }

      if (Object.keys(hourCount).length > 0) {
        analysis.userPatterns.bestHour = parseInt(Object.entries(hourCount)
          .sort((a, b) => b[1] - a[1])[0][0]);
      }

      const totalSubmissions = userTimings.reduce((sum, t) => sum + t.metrics.totalSubmissions, 0);
      const totalResponses = userTimings.reduce((sum, t) => 
        sum + t.submissionHistory.filter(s => s.responseReceived && s.responseType === 'positive').length, 0
      );
      analysis.userPatterns.successRate = totalSubmissions > 0 ? (totalResponses / totalSubmissions) * 100 : 0;
    }

    // Analyze industry patterns
    if (industryTimings.length > 0) {
      const industryStats = await ApplicationTiming.getIndustryStats(industry);
      
      if (industryStats.dayStats && Object.keys(industryStats.dayStats).length > 0) {
        analysis.industryPatterns.bestDay = Object.entries(industryStats.dayStats)
          .map(([day, stats]) => ({ day, rate: stats.responses / stats.count }))
          .sort((a, b) => b.rate - a.rate)[0].day;
      }

      if (industryStats.hourStats && Object.keys(industryStats.hourStats).length > 0) {
        analysis.industryPatterns.bestHour = parseInt(Object.entries(industryStats.hourStats)
          .map(([hour, stats]) => ({ hour, rate: stats.responses / stats.count }))
          .sort((a, b) => b.rate - a.rate)[0].hour);
      }
    }

    return analysis;
  }

  /**
   * Generate timing recommendation for a job application
   */
  async generateRecommendation(jobData, userData = {}) {
    const {
      industry = 'default',
      companySize = 'default',
      location = '',
      timezone = 'EST',
      isRemote = false
    } = jobData;

    const { userTimezone = 'EST', userId = null } = userData;

    // Get patterns
    const industryPattern = this.getIndustryPattern(industry);
    const companySizePattern = this.getCompanySizePattern(companySize);

    console.log('Timing service - Industry:', industry);
    console.log('Using pattern with bestHours:', industryPattern.bestHours);
    console.log('Best days:', industryPattern.bestDays);

    // Analyze historical data if userId provided
    let historicalAnalysis = null;
    if (userId) {
      historicalAnalysis = await this.analyzeHistoricalData(userId, industry, companySize);
    }

    // Calculate optimal time
    const now = new Date();
    const factors = [];
    let recommendedTime = new Date(now);
    let warnings = [];

    // Start with next business day if currently weekend
    const currentDay = now.getDay();
    if (currentDay === 0) { // Sunday
      recommendedTime.setDate(recommendedTime.getDate() + 1);
    } else if (currentDay === 6) { // Saturday
      recommendedTime.setDate(recommendedTime.getDate() + 2);
    }

    // Find next optimal day
    let daysChecked = 0;
    let foundOptimalDay = false;

    while (!foundOptimalDay && daysChecked < 14) {
      const dayName = recommendedTime.toLocaleDateString('en-US', { weekday: 'long' });
      const holiday = this.isHoliday(recommendedTime);
      const quarterEnd = this.isNearQuarterEnd(recommendedTime);

      // Check if it's a good day
      if (holiday.isHoliday) {
        warnings.push({
          type: 'holiday',
          severity: 'high',
          message: `Avoid applying on ${holiday.name}. Offices are typically closed.`
        });
        recommendedTime.setDate(recommendedTime.getDate() + 1);
        daysChecked++;
        continue;
      }

      if (quarterEnd.isNear && industryPattern.quarterEndMonths.includes(recommendedTime.getMonth() + 1)) {
        warnings.push({
          type: 'fiscal_quarter_end',
          severity: 'medium',
          message: `End of fiscal quarter approaching. Hiring may be slower than usual.`
        });
      }

      if (industryPattern.bestDays.includes(dayName)) {
        foundOptimalDay = true;
        factors.push({
          factor: 'day_of_week',
          impact: 'positive',
          weight: 8,
          description: `${dayName} is an optimal day for ${industry} applications`
        });
      } else if (industryPattern.avoidDays.includes(dayName)) {
        if (dayName === 'Friday') {
          warnings.push({
            type: 'late_friday',
            severity: 'medium',
            message: 'Applications submitted on Friday may be overlooked until Monday'
          });
        }
        recommendedTime.setDate(recommendedTime.getDate() + 1);
        daysChecked++;
        continue;
      } else {
        foundOptimalDay = true;
        factors.push({
          factor: 'day_of_week',
          impact: 'neutral',
          weight: 5,
          description: `${dayName} is an acceptable day for applications`
        });
      }
    }

    // Set optimal hour
    let optimalHour = 10; // Default to 10 AM

    if (historicalAnalysis && historicalAnalysis.userPatterns.bestHour !== null) {
      optimalHour = historicalAnalysis.userPatterns.bestHour;
      factors.push({
        factor: 'historical_success',
        impact: 'positive',
        weight: 9,
        description: `Based on your history, ${optimalHour}:00 has the best response rate`
      });
    } else if (industryPattern.bestHours.length > 0) {
      // Use first optimal hour for consistency, or add slight variation based on company size
      const hourIndex = companySizePattern.preferredTimes[0] && industryPattern.bestHours.includes(companySizePattern.preferredTimes[0])
        ? industryPattern.bestHours.indexOf(companySizePattern.preferredTimes[0])
        : 0;
      optimalHour = industryPattern.bestHours[hourIndex];
      console.log('Selected hour:', optimalHour, 'from index:', hourIndex);
      factors.push({
        factor: 'time_of_day',
        impact: 'positive',
        weight: 7,
        description: `${optimalHour}:00 is optimal for ${industry} industry`
      });
    }

    recommendedTime.setHours(optimalHour, 0, 0, 0);
    console.log('Recommended time set to:', recommendedTime.toISOString(), 'Hour:', optimalHour);
    console.log('Recommended time set to:', recommendedTime.toISOString(), '(', recommendedTime.toLocaleString(), ')');

    // Adjust for timezone if remote
    if (isRemote && timezone !== userTimezone) {
      const originalHour = recommendedTime.getHours();
      recommendedTime = this.adjustForTimezone(recommendedTime, timezone, userTimezone);
      factors.push({
        factor: 'timezone',
        impact: 'neutral',
        weight: 6,
        description: `Time adjusted from ${timezone} to ${userTimezone} (${originalHour}:00 → ${recommendedTime.getHours()}:00)`
      });
    }

    // Company size factor
    factors.push({
      factor: 'company_size',
      impact: 'neutral',
      weight: 5,
      description: `${companySize} companies typically respond within ${Math.round(companySizePattern.responseTimeHours / 24)} days`
    });

    // Check if time is in the past
    if (recommendedTime <= now) {
      // Move to next occurrence of this day/time
      recommendedTime.setDate(recommendedTime.getDate() + 7);
    }

    // Generate reasoning
    const dayOfWeek = recommendedTime.toLocaleDateString('en-US', { weekday: 'long' });
    const timeString = recommendedTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    const reasoning = this.generateReasoning(dayOfWeek, timeString, factors, industry, companySize, historicalAnalysis);

    // Calculate confidence score
    const confidence = this.calculateConfidence(factors, historicalAnalysis, warnings);

    return {
      recommendedTime,
      dayOfWeek,
      hourOfDay: recommendedTime.getHours(),
      confidence,
      reasoning,
      factors,
      warnings
    };
  }

  /**
   * Generate human-readable reasoning
   */
  generateReasoning(dayOfWeek, timeString, factors, industry, companySize, historicalAnalysis) {
    const parts = [];

    parts.push(`Apply on ${dayOfWeek} at ${timeString} for best results.`);

    // Add top factors
    const topFactors = factors
      .filter(f => f.impact === 'positive')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2);

    if (topFactors.length > 0) {
      parts.push(topFactors.map(f => f.description).join('. '));
    }

    // Add historical context if available
    if (historicalAnalysis && historicalAnalysis.userPatterns.successRate > 0) {
      parts.push(`Your historical success rate: ${historicalAnalysis.userPatterns.successRate.toFixed(1)}%.`);
    }

    return parts.join(' ');
  }

  /**
   * Calculate confidence score based on available data
   */
  calculateConfidence(factors, historicalAnalysis, warnings) {
    let confidence = 50; // Base confidence

    // Boost confidence based on factors
    const positiveFactors = factors.filter(f => f.impact === 'positive');
    confidence += positiveFactors.length * 10;

    // Boost for historical data
    if (historicalAnalysis && historicalAnalysis.userPatterns.successRate > 0) {
      confidence += 15;
    }

    // Reduce for warnings
    warnings.forEach(warning => {
      if (warning.severity === 'high') confidence -= 15;
      if (warning.severity === 'medium') confidence -= 10;
      if (warning.severity === 'low') confidence -= 5;
    });

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get real-time recommendation (submit now vs wait)
   */
  async getRealtimeRecommendation(jobData, userData = {}) {
    const recommendation = await this.generateRecommendation(jobData, userData);
    const now = new Date();
    const hoursUntilOptimal = (recommendation.recommendedTime - now) / (1000 * 60 * 60);

    let action = 'wait';
    let message = '';

    if (hoursUntilOptimal < 1) {
      action = 'submit_now';
      message = 'This is an optimal time to submit your application!';
    } else if (hoursUntilOptimal < 24) {
      action = 'wait_briefly';
      const hours = Math.round(hoursUntilOptimal);
      message = `Wait ${hours} hour${hours !== 1 ? 's' : ''} for optimal timing (${recommendation.dayOfWeek} at ${recommendation.recommendedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })})`;
    } else {
      const days = Math.ceil(hoursUntilOptimal / 24);
      action = 'schedule';
      
      // Better day calculation
      const daysFromNow = Math.floor((recommendation.recommendedTime - now) / (1000 * 60 * 60 * 24));
      const actualDays = daysFromNow === 0 ? 'later today' : daysFromNow === 1 ? 'tomorrow' : `in ${daysFromNow} day${daysFromNow > 1 ? 's' : ''}`;
      
      message = `Schedule for ${recommendation.dayOfWeek} (${actualDays}) for best results`;
    }

    return {
      action,
      message,
      recommendation,
      hoursUntilOptimal: Math.round(hoursUntilOptimal)
    };
  }

  /**
   * Get A/B test results comparing timing strategies
   */
  async getABTestResults(userId) {
    const userTimings = await ApplicationTiming.find({ userId });

    const results = {
      optimalTime: { submissions: 0, responses: 0, rate: 0 },
      randomTime: { submissions: 0, responses: 0, rate: 0 },
      userChoice: { submissions: 0, responses: 0, rate: 0 },
      control: { submissions: 0, responses: 0, rate: 0 }
    };

    userTimings.forEach(timing => {
      const group = timing.abTestGroup || 'userChoice';
      const submissions = timing.submissionHistory?.length || 0;
      const responses = timing.submissionHistory?.filter(
        s => s.responseReceived && s.responseType === 'positive'
      ).length || 0;

      if (results[group]) {
        results[group].submissions += submissions;
        results[group].responses += responses;
      }
    });

    // Calculate rates
    Object.keys(results).forEach(group => {
      if (results[group] && results[group].submissions > 0) {
        results[group].rate = (results[group].responses / results[group].submissions) * 100;
      }
    });

    return results;
  }

  /**
   * Track correlation between submission timing and response rates
   */
  async trackCorrelations(userId) {
    const userTimings = await ApplicationTiming.find({ userId });

    const correlations = {
      byDayOfWeek: {},
      byHourOfDay: {},
      byIndustry: {},
      byCompanySize: {}
    };

    userTimings.forEach(timing => {
      timing.submissionHistory.forEach(submission => {
        // Day of week
        if (!correlations.byDayOfWeek[submission.dayOfWeek]) {
          correlations.byDayOfWeek[submission.dayOfWeek] = { total: 0, responses: 0 };
        }
        correlations.byDayOfWeek[submission.dayOfWeek].total += 1;
        if (submission.responseReceived && submission.responseType === 'positive') {
          correlations.byDayOfWeek[submission.dayOfWeek].responses += 1;
        }

        // Hour of day
        const hour = submission.hourOfDay;
        if (!correlations.byHourOfDay[hour]) {
          correlations.byHourOfDay[hour] = { total: 0, responses: 0 };
        }
        correlations.byHourOfDay[hour].total += 1;
        if (submission.responseReceived && submission.responseType === 'positive') {
          correlations.byHourOfDay[hour].responses += 1;
        }

        // Industry
        const industry = timing.industry || 'Unknown';
        if (!correlations.byIndustry[industry]) {
          correlations.byIndustry[industry] = { total: 0, responses: 0 };
        }
        correlations.byIndustry[industry].total += 1;
        if (submission.responseReceived && submission.responseType === 'positive') {
          correlations.byIndustry[industry].responses += 1;
        }

        // Company size
        const size = timing.companySize || 'Unknown';
        if (!correlations.byCompanySize[size]) {
          correlations.byCompanySize[size] = { total: 0, responses: 0 };
        }
        correlations.byCompanySize[size].total += 1;
        if (submission.responseReceived && submission.responseType === 'positive') {
          correlations.byCompanySize[size].responses += 1;
        }
      });
    });

    // Calculate rates
    const calculateRates = (data) => {
      Object.keys(data).forEach(key => {
        data[key].rate = data[key].total > 0 
          ? (data[key].responses / data[key].total) * 100 
          : 0;
      });
    };

    calculateRates(correlations.byDayOfWeek);
    calculateRates(correlations.byHourOfDay);
    calculateRates(correlations.byIndustry);
    calculateRates(correlations.byCompanySize);

    return correlations;
  }
}

export default new ApplicationTimingService();
