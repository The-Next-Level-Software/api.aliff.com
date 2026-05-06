import { cacheService } from '../services/cache.service.js';
import { emailService } from '../services/email.service.js';
import { Worker } from 'bullmq';

console.log("🟢 Cache Service :", cacheService.client);

// Initialize worker
const worker = new Worker(
    'emailQueue',
    async job => {
        console.log(`📥 Received job: ${job.id}`);
        console.log('Job data:', job.data);

        const { type, to, variables } = job.data;

        try {
            switch (type) {
                case 'welcome':
                    console.log(`✉️ Sending welcome email to ${to}`);
                    await emailService.sendWelcomeEmail(to, variables.name);
                    console.log(`✅ Welcome email sent to ${to}`);
                    break;

                case 'otp':
                    console.log(`✉️ Sending OTP email to ${to}`);
                    await emailService.sendOTPEmail(to, variables.otp);
                    console.log(`✅ OTP email sent to ${to}`);
                    break;

                // Add more email types here
                default:
                    console.error(`⚠️ Unknown email type: ${type}`);
                    throw new Error(`Unknown email type: ${type}`);
            }
        } catch (err) {
            console.error(`❌ Error processing job ${job.id}:`, err);
            throw err; // ensure BullMQ marks job as failed
        }
    },
    { connection: cacheService.client }
);

// Event listeners for worker
worker.on('completed', job => {
    console.log(`🎉 Job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
    console.error(`💥 Job failed: ${job.id}`, err);
});

worker.on('error', err => {
    console.error('🔴 Worker error:', err);
});

console.log('🚀 Email worker is running, waiting for jobs...');
