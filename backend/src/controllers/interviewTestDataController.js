import { Job } from '../models/Job.js';
import { Interview } from '../models/Interview.js';
import { MockInterviewSession } from '../models/MockInterviewSession.js';

const COMPANIES = [
  { name: 'Google', industry: 'Technology' },
  { name: 'Microsoft', industry: 'Technology' },
  { name: 'Amazon', industry: 'Technology' },
  { name: 'Meta', industry: 'Technology' },
  { name: 'Goldman Sachs', industry: 'Finance' },
  { name: 'JPMorgan Chase', industry: 'Finance' },
  { name: 'McKinsey & Company', industry: 'Consulting' },
  { name: 'Boston Consulting Group', industry: 'Consulting' },
  { name: 'Mayo Clinic', industry: 'Healthcare' },
  { name: 'Tesla', industry: 'Manufacturing' },
  { name: 'Nike', industry: 'Retail' },
  { name: 'Stanford University', industry: 'Education' },
];

const JOB_TITLES = {
  Technology: ['Software Engineer', 'Senior Developer', 'Full Stack Engineer', 'Product Manager'],
  Finance: ['Financial Analyst', 'Investment Banker', 'Quantitative Analyst'],
  Consulting: ['Management Consultant', 'Strategy Consultant', 'Business Analyst'],
  Healthcare: ['Healthcare Administrator', 'Clinical Data Analyst', 'Health IT Specialist'],
  Manufacturing: ['Manufacturing Engineer', 'Process Engineer', 'Quality Engineer'],
  Retail: ['Store Manager', 'E-commerce Manager', 'Retail Analyst'],
  Education: ['Academic Advisor', 'Education Technology Specialist'],
};

const INTERVIEW_TYPES = ['Phone Screen', 'Video Call', 'In-Person', 'Technical', 'Behavioral', 'Final Round', 'Panel'];
const LOCATIONS = ['Mountain View, CA', 'Seattle, WA', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Boston, MA', 'Remote'];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo, daysFromNow = 0) {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  const end = new Date();
  end.setDate(end.getDate() + daysFromNow);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * POST /api/interviews/analytics/seed
 * Generate test data for interview analytics
 */
export const seedTestData = async (req, res) => {
  try {
    const userId = req.user?.id || req.auth?.payload?.sub || req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    console.log(`🌱 Seeding test data for user: ${userId}`);

    // Clear existing test data
    await Promise.all([
      Interview.deleteMany({ userId }),
      Job.deleteMany({ userId }),
      MockInterviewSession.deleteMany({ userId }),
    ]);

    // Create jobs
    const jobs = [];
    for (const company of COMPANIES) {
      const titles = JOB_TITLES[company.industry];
      const job = await Job.create({
        userId,
        company: company.name,
        position: randomItem(titles),
        status: 'Interview',
        industry: company.industry,
        location: randomItem(LOCATIONS),
        jobType: 'Full-time',
        workMode: randomItem(['Remote', 'Hybrid', 'On-site']),
        salary: {
          min: randomInt(80, 120) * 1000,
          max: randomInt(130, 200) * 1000,
          currency: 'USD',
        },
        applicationDate: randomDate(90, 0),
        statusHistory: [
          { status: 'Interested', timestamp: randomDate(100, 0) },
          { status: 'Applied', timestamp: randomDate(85, 0) },
          { status: 'Interview', timestamp: randomDate(60, 0) },
        ],
      });
      jobs.push(job);
    }

    // Create mock sessions
    for (let i = 0; i < 8; i++) {
      const daysAgo = randomInt(5, 120);
      await MockInterviewSession.create({
        userId,
        interviewType: randomItem(['Behavioral', 'Technical', 'Case Study']),
        difficulty: randomItem(['Medium', 'Hard']),
        status: 'Completed',
        duration: randomInt(30, 60),
        scheduledDate: randomDate(daysAgo),
        completedDate: randomDate(daysAgo),
        feedback: {
          overallRating: randomInt(3, 5),
          strengths: ['Good communication', 'Clear thinking'],
          improvements: ['More specific answers'],
        },
      });
    }

    // Create interviews
    const totalInterviews = 25;
    const completedCount = Math.floor(totalInterviews * 0.75);
    
    for (let i = 0; i < totalInterviews; i++) {
      const job = jobs[i % jobs.length];
      const isCompleted = i < completedCount;
      const daysAgo = isCompleted ? randomInt(5, 150) : 0;
      const scheduledDate = isCompleted ? randomDate(daysAgo) : randomDate(0, randomInt(1, 30));
      
      let outcome = null;
      let status = 'Scheduled';
      
      if (isCompleted) {
        status = 'Completed';
        const rand = Math.random();
        
        if (rand < 0.30) {
          outcome = {
            result: 'Offer Extended',
            rating: randomInt(4, 5),
            notes: 'Excellent performance! Received offer.',
            feedback: 'Strong skills and great fit.',
          };
        } else if (rand < 0.45) {
          outcome = {
            result: randomItem(['Passed', 'Moved to Next Round']),
            rating: randomInt(3, 5),
            notes: 'Interview went well.',
            feedback: 'Good responses and enthusiasm.',
          };
        } else {
          outcome = {
            result: randomItem(['Failed', 'Waiting for Feedback']),
            rating: randomInt(2, 3),
            notes: 'Could improve on technical questions.',
          };
        }
      }
      
      const interviewType = randomItem(INTERVIEW_TYPES);
      const duration = interviewType === 'Phone Screen' ? 30 : interviewType === 'Technical' ? 90 : 60;
      
      await Interview.create({
        userId,
        jobId: job._id,
        title: `${interviewType} - ${job.position}`,
        company: job.company,
        interviewType,
        scheduledDate,
        duration,
        location: job.workMode === 'Remote' ? 'Remote/Virtual' : job.location,
        interviewer: {
          name: `${randomItem(['Sarah', 'John', 'Emily', 'Michael'])} ${randomItem(['Smith', 'Johnson', 'Williams'])}`,
          title: randomItem(['Senior Engineer', 'Engineering Manager', 'Team Lead']),
        },
        status,
        outcome,
        preparationTasks: [
          {
            title: 'Research the company',
            completed: true,
            priority: 'High',
          },
          {
            title: 'Review job description',
            completed: isCompleted,
            priority: 'High',
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test data generated successfully',
      data: {
        jobs: jobs.length,
        interviews: totalInterviews,
        mockSessions: 8,
        completed: completedCount,
      },
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test data',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/interviews/analytics/clear
 * Clear all interview test data
 */
export const clearTestData = async (req, res) => {
  try {
    const userId = req.user?.id || req.auth?.payload?.sub || req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const result = await Promise.all([
      Interview.deleteMany({ userId }),
      Job.deleteMany({ userId }),
      MockInterviewSession.deleteMany({ userId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Test data cleared successfully',
      data: {
        interviewsDeleted: result[0].deletedCount,
        jobsDeleted: result[1].deletedCount,
        mockSessionsDeleted: result[2].deletedCount,
      },
    });

  } catch (error) {
    console.error('Error clearing test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear test data',
      error: error.message,
    });
  }
};
