"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidJobType = isValidJobType;
exports.isValidPriority = isValidPriority;
exports.isValidPayload = isValidPayload;
exports.validateCreateJobInput = validateCreateJobInput;
const types_1 = require("../types");
const VALID_JOB_TYPES = ['email', 'webhook', 'transform', 'aggregate'];
function isValidJobType(type) {
    if (typeof type !== 'string')
        return false;
    const index = VALID_JOB_TYPES.indexOf(type);
    console.log('index', index);
    return index >= 0;
}
function isValidPriority(priority) {
    if (typeof priority !== 'number')
        return false;
    return Number.isInteger(priority) && priority >= 1 && priority <= 10;
}
function isValidPayload(payload) {
    return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}
function validateCreateJobInput(raw) {
    if (typeof raw !== 'object' || raw === null) {
        throw new types_1.ValidationError('Request body must be a JSON object');
    }
    const obj = raw;
    if (!isValidJobType(obj.type)) {
        throw new types_1.ValidationError(`Invalid job type "${obj.type}". Must be one of: ${VALID_JOB_TYPES.join(', ')}`);
    }
    if (!isValidPayload(obj.payload)) {
        throw new types_1.ValidationError('Field "payload" must be a non-null object');
    }
    const priority = obj.priority !== undefined ? obj.priority : 5;
    if (!isValidPriority(priority)) {
        throw new types_1.ValidationError('Field "priority" must be an integer between 1 and 10');
    }
    const maxAttempts = obj.maxAttempts !== undefined ? obj.maxAttempts : 3;
    if (typeof maxAttempts !== 'number' || maxAttempts < 1 || maxAttempts > 10) {
        throw new types_1.ValidationError('Field "maxAttempts" must be a number between 1 and 10');
    }
    return {
        type: obj.type,
        payload: obj.payload,
        priority: priority,
        maxAttempts: maxAttempts,
        scheduledAt: obj.scheduledAt ? new Date(obj.scheduledAt) : undefined,
    };
}
//# sourceMappingURL=validator.js.map