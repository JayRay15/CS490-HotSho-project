/**
 * Seed script to populate API monitoring with sample data for testing
 * Run: node backend/scripts/seedApiMonitoringData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models
import APIUsage from '../src/models/APIUsage.js';
const { APIErrorLog, APIAlert } = await import('../src/models/APIUsage.js');

const MONGODB_URI = process.env.MONGO_URI;

const services = ['gemini', 'eventbrite', 'bls', 'github', 'openalex', 'wikipedia'];

async function seedData() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Generate data for the last 7 days
        const now = new Date();

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = new Date(now);
            date.setDate(date.getDate() - dayOffset);
            date.setHours(0, 0, 0, 0);

            for (const service of services) {
                // Random usage data
                const totalRequests = Math.floor(Math.random() * 500) + 50;
                const failedRequests = Math.floor(Math.random() * Math.min(totalRequests * 0.1, 20));
                const successfulRequests = totalRequests - failedRequests;
                const avgResponseTime = Math.floor(Math.random() * 800) + 100;

                // Check if record exists
                let usage = await APIUsage.findOne({ service, date });

                if (!usage) {
                    usage = new APIUsage({
                        service,
                        date,
                        totalRequests,
                        successfulRequests,
                        failedRequests,
                        rateLimitHits: Math.floor(Math.random() * 3),
                        totalResponseTime: avgResponseTime * totalRequests,
                        minResponseTime: Math.floor(avgResponseTime * 0.3),
                        maxResponseTime: Math.floor(avgResponseTime * 2.5),
                        avgResponseTime,
                        totalRequestSize: totalRequests * 500,
                        totalResponseSize: totalRequests * 2000,
                        recentCalls: []
                    });

                    // Add hourly stats
                    for (let hour = 0; hour < 24; hour++) {
                        const hourRequests = Math.floor(totalRequests / 24) + Math.floor(Math.random() * 10);
                        usage.hourlyStats.set(hour.toString(), {
                            requests: hourRequests,
                            errors: Math.floor(hourRequests * 0.05),
                            avgResponseTime: avgResponseTime + Math.floor(Math.random() * 100) - 50
                        });
                    }

                    await usage.save();
                    console.log(`✅ Created usage data for ${service} on ${date.toDateString()}`);
                }
            }
        }

        // Create some sample errors
        console.log('\n📝 Creating sample error logs...');
        const errorTypes = [
            { statusCode: 429, message: 'Rate limit exceeded', service: 'gemini' },
            { statusCode: 500, message: 'Internal server error', service: 'eventbrite' },
            { statusCode: 403, message: 'API key invalid', service: 'github' },
            { statusCode: 408, message: 'Request timeout', service: 'openalex' },
            { statusCode: 503, message: 'Service unavailable', service: 'bls' }
        ];

        for (let i = 0; i < 15; i++) {
            const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
            const errorDate = new Date(now);
            errorDate.setHours(errorDate.getHours() - Math.floor(Math.random() * 48));

            const error = new APIErrorLog({
                timestamp: errorDate,
                service: errorType.service,
                endpoint: `/api/${errorType.service}/data`,
                method: 'GET',
                statusCode: errorType.statusCode,
                errorMessage: errorType.message,
                resolved: Math.random() > 0.6
            });

            await error.save();
        }
        console.log('✅ Created 15 sample error logs');

        // Create some sample alerts
        console.log('\n🔔 Creating sample alerts...');
        const alertTypes = [
            { alertType: 'QUOTA_WARNING', severity: 'medium', message: 'Gemini API usage at 85% of daily limit' },
            { alertType: 'ERROR_SPIKE', severity: 'high', message: '12 errors in the last hour for eventbrite' },
            { alertType: 'SLOW_RESPONSE', severity: 'low', message: 'Average response time > 2000ms for openalex' },
            { alertType: 'RATE_LIMIT_WARNING', severity: 'medium', message: 'Approaching rate limit for github API' }
        ];

        for (let i = 0; i < 8; i++) {
            const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            const alertDate = new Date(now);
            alertDate.setHours(alertDate.getHours() - Math.floor(Math.random() * 72));

            const alert = new APIAlert({
                timestamp: alertDate,
                alertType: alertType.alertType,
                service: services[Math.floor(Math.random() * services.length)],
                message: alertType.message,
                severity: alertType.severity,
                acknowledged: Math.random() > 0.5
            });

            await alert.save();
        }
        console.log('✅ Created 8 sample alerts');

        console.log('\n🎉 Seed data complete!');
        console.log('You can now view the API Monitoring dashboard at /admin/api-monitoring');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedData();
