import {
  isValidJobType,
  isValidPriority,
  validateCreateJobInput,
} from '../src/utils/validator';

describe('isValidJobType', () => {
  it('accepts all defined job types', () => {
    expect(isValidJobType('email')).toBe(true);
    expect(isValidJobType('webhook')).toBe(true);
    expect(isValidJobType('transform')).toBe(true);
    expect(isValidJobType('aggregate')).toBe(true);
  });

  it('rejects unknown types', () => {
    expect(isValidJobType('sms')).toBe(false);
    expect(isValidJobType('')).toBe(false);
    expect(isValidJobType(null)).toBe(false);
    expect(isValidJobType(42)).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isValidJobType('Email')).toBe(false);
    expect(isValidJobType('EMAIL')).toBe(false);
  });
});

describe('isValidPriority', () => {
  it('accepts priorities 1 through 10', () => {
    for (let p = 1; p <= 10; p++) {
      expect(isValidPriority(p)).toBe(true);
    }
  });

  it('rejects out-of-range values', () => {
    expect(isValidPriority(0)).toBe(false);
    expect(isValidPriority(11)).toBe(false);
    expect(isValidPriority(-1)).toBe(false);
  });

  it('rejects non-integer numbers', () => {
    expect(isValidPriority(5.5)).toBe(false);
    expect(isValidPriority(NaN)).toBe(false);
  });

  it('rejects non-number types', () => {
    expect(isValidPriority('5')).toBe(false);
    expect(isValidPriority(null)).toBe(false);
  });
});

describe('validateCreateJobInput', () => {
  const valid = {
    type: 'webhook',
    payload: { url: 'https://example.com' },
    priority: 5,
    maxAttempts: 3,
  };

  it('returns a CreateJobInput for valid data', () => {
    const result = validateCreateJobInput(valid);
    expect(result.type).toBe('webhook');
    expect(result.payload).toEqual(valid.payload);
  });

  it('applies defaults for optional fields', () => {
    const result = validateCreateJobInput({ type: 'email', payload: { to: 'x@y.com' } });
    expect(result.priority).toBe(5);
    expect(result.maxAttempts).toBe(3);
  });

  it('throws ValidationError for a missing payload', () => {
    const { ValidationError } = require('../src/types');
    expect(() => validateCreateJobInput({ type: 'email' })).toThrow(ValidationError);
  });

  it('throws ValidationError for an invalid type', () => {
    const { ValidationError } = require('../src/types');
    expect(() =>
      validateCreateJobInput({ type: 'fax', payload: {} })
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for a non-object body', () => {
    const { ValidationError } = require('../src/types');
    expect(() => validateCreateJobInput('not an object')).toThrow(ValidationError);
    expect(() => validateCreateJobInput(null)).toThrow(ValidationError);
    expect(() => validateCreateJobInput(42)).toThrow(ValidationError);
  });
});
