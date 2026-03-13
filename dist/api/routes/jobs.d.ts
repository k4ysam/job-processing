import { Router } from 'express';
import { JobService } from '../../services/jobService';
import { NotificationService } from '../../services/notificationService';
import { JobProcessor } from '../../jobs/processor';
export declare function createJobRouter(jobService: JobService, notificationService: NotificationService, processor: JobProcessor): Router;
