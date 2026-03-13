import { CreateJobInput, JobType } from '../types';
export declare function isValidJobType(type: unknown): type is JobType;
export declare function isValidPriority(priority: unknown): priority is number;
export declare function isValidPayload(payload: unknown): payload is Record<string, unknown>;
export declare function validateCreateJobInput(raw: unknown): CreateJobInput;
