import mongoose from 'mongoose';

/**
 * Pre-Launch Checklist Model
 * Stores the checklist state globally (shared across all admins)
 * There should only be one document in this collection
 */

const checklistItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: String,  // Clerk user ID of admin who checked this item
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  link: {
    type: String,
    default: null
  }
}, { _id: false });

const checklistSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  items: [checklistItemSchema]
}, { _id: false });

const preLaunchChecklistSchema = new mongoose.Schema({
  // Singleton pattern - only one document
  _singleton: {
    type: Boolean,
    default: true,
    unique: true
  },
  
  // Checklist sections
  criticalBugs: checklistSectionSchema,
  testing: checklistSectionSchema,
  deployment: checklistSectionSchema,
  monitoring: checklistSectionSchema,
  security: checklistSectionSchema,
  legal: checklistSectionSchema,
  marketing: checklistSectionSchema,
  support: checklistSectionSchema,
  teamReadiness: checklistSectionSchema,
  postLaunch: checklistSectionSchema,
  
  // Admin sign-off
  adminSignoff: {
    signed: {
      type: Boolean,
      default: false
    },
    signedBy: {
      type: String,  // Clerk user ID
      default: null
    },
    signedByName: {
      type: String,
      default: null
    },
    date: {
      type: Date,
      default: null
    }
  },
  
  // Launch decision
  launchDecision: {
    decision: {
      type: String,
      enum: ['pending', 'go', 'no-go'],
      default: 'pending'
    },
    decidedBy: {
      type: String,
      default: null
    },
    decidedByName: {
      type: String,
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      default: null
    }
  },
  
  // Metadata
  lastModifiedBy: {
    type: String,
    default: null
  },
  lastModifiedByName: {
    type: String,
    default: null
  }
}, { 
  timestamps: true 
});

// Default checklist structure
preLaunchChecklistSchema.statics.getDefaultChecklist = function() {
  return {
    _singleton: true,
    criticalBugs: {
      title: '1. Critical Bug Fixes',
      description: 'All P0/P1 bugs must be resolved before launch',
      items: [
        { id: 'bug1', label: 'All P0/P1 bugs resolved', completed: false },
        { id: 'bug2', label: 'No critical errors in Sentry', completed: false },
        { id: 'bug3', label: 'User flow testing completed', completed: false },
        { id: 'bug4', label: 'Edge case handling verified', completed: false },
      ]
    },
    testing: {
      title: '2. Testing Verification',
      description: 'All tests must pass with adequate coverage',
      items: [
        { id: 'test1', label: 'Backend unit tests passing (80%+ coverage)', completed: false },
        { id: 'test2', label: 'Frontend unit tests passing (80%+ coverage)', completed: false },
        { id: 'test3', label: 'Integration tests passing', completed: false },
        { id: 'test4', label: 'E2E tests passing', completed: false },
        { id: 'test5', label: 'Performance tests completed', completed: false },
      ]
    },
    deployment: {
      title: '3. Production Deployment',
      description: 'Deployment configuration verified and stable',
      items: [
        { id: 'deploy1', label: 'Frontend deployed to Vercel', completed: false },
        { id: 'deploy2', label: 'Backend deployed to Render/Railway', completed: false },
        { id: 'deploy3', label: 'Database configured with production credentials', completed: false },
        { id: 'deploy4', label: 'Environment variables set correctly', completed: false },
        { id: 'deploy5', label: 'SSL/HTTPS enabled', completed: false },
        { id: 'deploy6', label: 'Health check endpoints responding', completed: false },
      ]
    },
    monitoring: {
      title: '4. Monitoring & Alerting',
      description: 'Monitoring and alerting systems configured',
      items: [
        { id: 'mon1', label: 'Sentry error tracking configured', completed: false },
        { id: 'mon2', label: 'Request/Response logging enabled', completed: false },
        { id: 'mon3', label: 'Health check endpoints implemented', completed: false },
        { id: 'mon4', label: 'System monitoring dashboard available', completed: false },
        { id: 'mon5', label: 'Error rate threshold alerts configured', completed: false },
        { id: 'mon6', label: 'Uptime monitoring active', completed: false },
      ]
    },
    security: {
      title: '5. Security Review',
      description: 'Security measures implemented and verified',
      items: [
        { id: 'sec1', label: 'CSRF protection enabled', completed: false },
        { id: 'sec2', label: 'XSS prevention implemented', completed: false },
        { id: 'sec3', label: 'SQL/NoSQL injection prevention verified', completed: false },
        { id: 'sec4', label: 'Secure session management', completed: false },
        { id: 'sec5', label: 'HTTP security headers configured', completed: false },
        { id: 'sec6', label: 'Rate limiting enabled', completed: false },
        { id: 'sec7', label: 'Dependency security audit passed', completed: false },
      ]
    },
    legal: {
      title: '6. Legal Documents',
      description: 'Terms of Service and Privacy Policy finalized',
      items: [
        { id: 'legal1', label: 'Terms of Service published', completed: false, link: '/terms' },
        { id: 'legal2', label: 'Privacy Policy published', completed: false, link: '/privacy' },
        { id: 'legal3', label: 'Cookie Policy included', completed: false },
        { id: 'legal4', label: 'GDPR compliance reviewed', completed: false },
        { id: 'legal5', label: 'CCPA compliance reviewed', completed: false },
      ]
    },
    marketing: {
      title: '7. Launch Announcement & Marketing',
      description: 'Marketing materials prepared for launch',
      items: [
        { id: 'mkt1', label: 'Launch blog post/announcement prepared', completed: false },
        { id: 'mkt2', label: 'Social media content created', completed: false },
        { id: 'mkt3', label: 'Product screenshots/demo ready', completed: false },
        { id: 'mkt4', label: 'Feature highlights documented', completed: false },
      ]
    },
    support: {
      title: '8. Customer Support Channels',
      description: 'Support infrastructure ready for users',
      items: [
        { id: 'sup1', label: 'Support email configured', completed: false },
        { id: 'sup2', label: 'Help documentation/FAQ created', completed: false },
        { id: 'sup3', label: 'In-app feedback mechanism working', completed: false },
        { id: 'sup4', label: 'Bug reporting process defined', completed: false },
        { id: 'sup5', label: 'Support team trained', completed: false },
        { id: 'sup6', label: 'Escalation procedures documented', completed: false },
      ]
    },
    teamReadiness: {
      title: '9. Team Readiness Review',
      description: 'Team prepared for launch and post-launch support',
      items: [
        { id: 'team1', label: 'All team members briefed on launch plan', completed: false },
        { id: 'team2', label: 'On-call schedule defined', completed: false },
        { id: 'team3', label: 'Communication channels established', completed: false },
        { id: 'team4', label: 'Rollback procedures documented', completed: false },
        { id: 'team5', label: 'Emergency contacts updated', completed: false },
      ]
    },
    postLaunch: {
      title: '10. Post-Launch Support Plan',
      description: 'Support plan documented for after launch',
      items: [
        { id: 'post1', label: 'Post-launch support plan documented', completed: false },
        { id: 'post2', label: 'Incident response playbooks created', completed: false },
        { id: 'post3', label: 'Success metrics defined', completed: false },
        { id: 'post4', label: 'Feedback collection process ready', completed: false },
      ]
    },
    adminSignoff: {
      signed: false,
      signedBy: null,
      signedByName: null,
      date: null
    },
    launchDecision: {
      decision: 'pending',
      decidedBy: null,
      decidedByName: null,
      decidedAt: null,
      reason: null
    }
  };
};

// Get or create the singleton checklist document
preLaunchChecklistSchema.statics.getChecklist = async function() {
  let checklist = await this.findOne({ _singleton: true });
  if (!checklist) {
    checklist = await this.create(this.getDefaultChecklist());
  }
  return checklist;
};

const PreLaunchChecklist = mongoose.model('PreLaunchChecklist', preLaunchChecklistSchema);

export default PreLaunchChecklist;
