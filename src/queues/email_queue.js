import { Queue } from 'bullmq';
import { cacheService } from '../services/cache.service.js';

export const emailQueue = new Queue("emailQueue", {
    connection: cacheService.client,
});

