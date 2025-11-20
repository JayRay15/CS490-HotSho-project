import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CodingChallenge, SystemDesignQuestion, CaseStudy } from '../models/TechnicalPrep.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: join(__dirname, '../..', '.env') });

const sampleCodingChallenges = [
  {
    title: "Two Sum",
    description: "Find two numbers in an array that add up to a target sum",
    difficulty: "Easy",
    category: "Data Structures",
    techStack: ["JavaScript", "Python", "Java"],
    timeLimit: 15,
    problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists"
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], isHidden: false },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], isHidden: false },
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1], isHidden: true }
    ],
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // Write your solution here\n  \n}",
      python: "def two_sum(nums, target):\n    # Write your solution here\n    pass",
      java: "public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n    return new int[]{};\n}"
    },
    hints: [
      "Try using a hash map to store the numbers you've seen so far",
      "For each number, check if target - number exists in your hash map"
    ],
    solution: {
      code: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
      language: "javascript",
      explanation: "We use a hash map to store each number and its index as we iterate through the array. For each number, we check if its complement (target - current number) exists in the map. If it does, we've found our pair and return their indices.",
      timeComplexity: "O(n) - We traverse the array once",
      spaceComplexity: "O(n) - We store up to n elements in the hash map"
    },
    relatedConcepts: ["Hash Tables", "Array Traversal", "Two Pointers"],
    companyTags: ["Google", "Amazon", "Microsoft", "Facebook"],
    realWorldApplication: "This pattern is used in database query optimization, recommendation systems, and financial applications for finding matching transactions."
  },
  {
    title: "Design URL Shortener",
    description: "Implement a URL shortening service like bit.ly",
    difficulty: "Medium",
    category: "System Design",
    techStack: ["REST API", "Database", "Hashing"],
    timeLimit: 30,
    problemStatement: "Design and implement a URL shortening service that takes long URLs and converts them to short codes. The service should:\n\n1. Generate unique short codes for URLs\n2. Redirect users from short URLs to original URLs\n3. Track click analytics\n4. Handle high traffic efficiently",
    constraints: [
      "Short codes should be 6-8 characters",
      "System should handle 100M URLs",
      "Read-heavy workload (100:1 read-to-write ratio)",
      "Availability is more important than consistency"
    ],
    examples: [
      {
        input: "https://example.com/very/long/url/path",
        output: "https://short.ly/abc123",
        explanation: "The long URL is converted to a 6-character short code"
      }
    ],
    testCases: [
      { input: { url: "https://example.com/test" }, expectedOutput: { shortCode: "abc123" }, isHidden: false }
    ],
    starterCode: {
      javascript: "class URLShortener {\n  constructor() {\n    this.urlMap = new Map();\n  }\n  \n  shorten(longUrl) {\n    // Implement URL shortening\n  }\n  \n  expand(shortCode) {\n    // Implement URL expansion\n  }\n}",
      python: "class URLShortener:\n    def __init__(self):\n        self.url_map = {}\n    \n    def shorten(self, long_url):\n        # Implement URL shortening\n        pass\n    \n    def expand(self, short_code):\n        # Implement URL expansion\n        pass"
    },
    hints: [
      "Consider using base62 encoding for short codes",
      "Think about how to generate unique IDs efficiently",
      "Consider caching frequently accessed URLs"
    ],
    solution: {
      code: "class URLShortener {\n  constructor() {\n    this.urlMap = new Map();\n    this.counter = 0;\n    this.base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';\n  }\n  \n  shorten(longUrl) {\n    const shortCode = this.encode(this.counter++);\n    this.urlMap.set(shortCode, longUrl);\n    return shortCode;\n  }\n  \n  expand(shortCode) {\n    return this.urlMap.get(shortCode);\n  }\n  \n  encode(num) {\n    let result = '';\n    while (num > 0) {\n      result = this.base62[num % 62] + result;\n      num = Math.floor(num / 62);\n    }\n    return result || '0';\n  }\n}",
      language: "javascript",
      explanation: "We use base62 encoding to convert sequential IDs into short codes. This ensures uniqueness and efficient use of character space.",
      timeComplexity: "O(1) for both operations",
      spaceComplexity: "O(n) where n is the number of URLs stored"
    },
    relatedConcepts: ["Hashing", "Base Conversion", "Key Generation", "Distributed Systems"],
    companyTags: ["Google", "Bitly", "Twitter"],
    realWorldApplication: "URL shortening is used in social media, QR codes, email marketing, and anywhere long URLs need to be shared in limited space."
  }
];

const sampleSystemDesignQuestions = [
  {
    title: "Design a Distributed Cache System",
    description: "Design a distributed caching system like Redis or Memcached",
    level: "Senior",
    scenario: "You need to design a distributed caching system that can handle millions of requests per second across multiple data centers. The system should provide low-latency reads and writes, handle cache invalidation, and ensure data consistency.",
    requirements: {
      functional: [
        "Store key-value pairs with TTL support",
        "Support get, set, and delete operations",
        "Handle cache eviction policies (LRU, LFU)",
        "Provide data persistence options"
      ],
      nonFunctional: [
        "Low latency (<10ms for reads)",
        "High availability (99.99% uptime)",
        "Horizontal scalability",
        "Support for millions of concurrent connections"
      ],
      constraints: [
        "Must handle 1M requests per second",
        "Average object size: 1KB",
        "Total cache size: 100GB per node",
        "Geographic distribution across 3 regions"
      ]
    },
    scale: {
      users: "10 million concurrent users",
      requests: "1 million requests per second",
      storage: "100GB per cache node"
    },
    keyComponents: [
      "Cache Nodes",
      "Load Balancer",
      "Consistent Hashing",
      "Replication Strategy",
      "Eviction Policy",
      "Monitoring System"
    ],
    considerations: [
      "How will you distribute keys across nodes?",
      "What happens when a node fails?",
      "How will you handle cache stampede?",
      "What's your strategy for cache warming?",
      "How will you monitor cache hit rates?"
    ],
    solutionFramework: {
      architecture: "Multi-tier distributed cache with consistent hashing for key distribution, master-slave replication for high availability, and LRU eviction policy.",
      components: [
        {
          name: "Load Balancer",
          description: "Distributes incoming requests across cache nodes using consistent hashing",
          technology: "HAProxy or NGINX"
        },
        {
          name: "Cache Nodes",
          description: "In-memory stores that hold key-value pairs with TTL",
          technology: "Redis or Memcached"
        },
        {
          name: "Replication Manager",
          description: "Handles master-slave replication and failover",
          technology: "Redis Sentinel or Cluster"
        }
      ],
      dataFlow: "Client -> Load Balancer -> Consistent Hash -> Cache Node -> Return Value. On write: Cache Node -> Replicas",
      scalingStrategy: "Horizontal scaling with consistent hashing to minimize rehashing on node addition/removal. Use read replicas for read-heavy workloads.",
      tradeOffs: [
        "Consistency vs Availability: Choose eventual consistency for better availability",
        "Memory vs Persistence: Trade memory for optional disk persistence",
        "Replication Factor vs Cost: More replicas = higher availability but higher cost"
      ]
    },
    followUpQuestions: [
      "How would you implement cache versioning?",
      "What metrics would you track for cache performance?",
      "How would you handle a cache poisoning attack?",
      "How would you migrate from one cache cluster to another?"
    ],
    relatedTopics: ["Distributed Systems", "Consistent Hashing", "CAP Theorem", "Data Replication"]
  }
];

const sampleCaseStudies = [
  {
    title: "E-commerce Conversion Rate Optimization",
    industry: "E-commerce",
    type: "Business",
    scenario: "An online retailer is experiencing a 2% conversion rate on their product pages, which is below the industry average of 3-4%. They want to improve their conversion rate to increase revenue.",
    context: "The company has 1 million monthly visitors, an average order value of $50, and currently generates $1M in monthly revenue. Their main traffic sources are organic search (40%), paid ads (35%), and social media (25%).",
    data: {
      currentMetrics: {
        monthlyVisitors: 1000000,
        conversionRate: 0.02,
        averageOrderValue: 50,
        cartAbandonmentRate: 0.68,
        mobileTraffic: 0.65
      },
      industryBenchmarks: {
        conversionRate: 0.035,
        cartAbandonmentRate: 0.60,
        mobileConversion: 0.025
      }
    },
    questions: [
      "What factors might be contributing to the low conversion rate?",
      "What experiments would you run to improve conversion?",
      "How would you prioritize different optimization initiatives?",
      "What is the potential revenue impact of reaching industry benchmarks?"
    ],
    framework: {
      approach: "Data-driven conversion optimization using hypothesis testing and A/B experiments",
      keySteps: [
        "Analyze funnel drop-offs to identify bottlenecks",
        "Review user feedback and session recordings",
        "Benchmark against competitors and industry standards",
        "Develop hypotheses for improvement",
        "Design and run A/B tests",
        "Measure impact and iterate"
      ],
      analysisTools: ["Google Analytics", "Hotjar", "Optimizely", "Funnel Analysis"]
    },
    sampleSolution: {
      approach: "Focus on mobile optimization and cart abandonment reduction as primary levers",
      analysis: "Mobile users make up 65% of traffic but convert at a lower rate. Cart abandonment at 68% is higher than industry average. These represent the largest opportunities.",
      recommendations: [
        "Optimize mobile checkout flow to reduce friction (guest checkout, auto-fill)",
        "Implement abandoned cart email sequence with incentives",
        "Add trust signals (reviews, security badges) on product pages",
        "Improve page load speed on mobile (currently 4.5s)",
        "Add live chat support during checkout"
      ],
      expectedOutcome: "Expected improvement to 2.8-3.2% conversion rate, representing $800K-$1.2M additional annual revenue"
    }
  }
];

async function seedTechnicalPrep() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await CodingChallenge.deleteMany({});
    await SystemDesignQuestion.deleteMany({});
    await CaseStudy.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample data
    await CodingChallenge.insertMany(sampleCodingChallenges);
    console.log(`Inserted ${sampleCodingChallenges.length} coding challenges`);

    await SystemDesignQuestion.insertMany(sampleSystemDesignQuestions);
    console.log(`Inserted ${sampleSystemDesignQuestions.length} system design questions`);

    await CaseStudy.insertMany(sampleCaseStudies);
    console.log(`Inserted ${sampleCaseStudies.length} case studies`);

    console.log('✅ Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedTechnicalPrep();
