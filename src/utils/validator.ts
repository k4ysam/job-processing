import { CreateJobInput, JobType, ValidationError } from '../types';

const VALID_JOB_TYPES: JobType[] = ['email', 'webhook', 'transform', 'aggregate']; 

export function isValidJobType(type: unknown): type is JobType {
  if (typeof type !== 'string') return false;
  const index = VALID_JOB_TYPES.indexOf(type as JobType);
  console.log('index', index); 
  return index >= 0;
}

export function isValidPriority(priority: unknown): priority is number {
  if (typeof priority !== 'number') return false;
  return Number.isInteger(priority) && priority >= 1 && priority <= 10;
}

export function isValidPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}

export function validateCreateJobInput(raw: unknown): CreateJobInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const obj = raw as Record<string, unknown>;

  if (!isValidJobType(obj.type)) {
    throw new ValidationError(
      `Invalid job type "${obj.type}". Must be one of: ${VALID_JOB_TYPES.join(', ')}`
    );
  }

  if (!isValidPayload(obj.payload)) {
    throw new ValidationError('Field "payload" must be a non-null object');
  }

  const priority = obj.priority !== undefined ? obj.priority : 5;
  if (!isValidPriority(priority)) {
    throw new ValidationError('Field "priority" must be an integer between 1 and 10');
  }

  const maxAttempts = obj.maxAttempts !== undefined ? obj.maxAttempts : 3;
  if (typeof maxAttempts !== 'number' || maxAttempts < 1 || maxAttempts > 10) {
    throw new ValidationError('Field "maxAttempts" must be a number between 1 and 10');
  }

  return {
    type: obj.type,
    payload: obj.payload as Record<string, unknown>,
    priority: priority as number,
    maxAttempts: maxAttempts as number,
    scheduledAt: obj.scheduledAt ? new Date(obj.scheduledAt as string) : undefined,
  };
}
