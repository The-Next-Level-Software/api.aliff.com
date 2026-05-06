import { Queue } from 'bullmq';
import { cacheService } from '../services/cache.service.js';

export const fileQueue = new Queue("fileQueue", {
    connection: cacheService.client,
});

