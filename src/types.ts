export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'email' | 'webhook' | 'transform' | 'aggregate';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  output?: Record<string, unknown>;
  error?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobInput {
  type: JobType;
  priority?: number;
  payload: Record<string, unknown>;
  maxAttempts?: number;
  scheduledAt?: Date;
}

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffFactor: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface NotificationPayload {
  event: 'job.completed' | 'job.failed' | 'job.cancelled';
  job: Job;
  timestamp: Date;
}

export interface NotificationChannel {
  id: string;
  type: 'webhook' | 'email' | 'slack';
  endpoint: string;
  active: boolean;
}

export interface DispatchResult {
  channelId: string;
  success: boolean;
  error?: string;
}

export interface JobStats {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RetryableError extends AppError {
  constructor(message: string) {
    super(message, 'RETRYABLE_ERROR', 503);
    this.name = 'RetryableError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string) {
    super(message, 'TIMEOUT', 504);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(id: string) {
    super(`Resource not found: ${id}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
