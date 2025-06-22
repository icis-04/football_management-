import { shuffle, isValidEmail, isValidPassword, formatDateString } from './index';

describe('Utility Functions', () => {
  describe('shuffle', () => {
    it('should return an array of the same length', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result).toHaveLength(input.length);
    });

    it('should contain all original elements', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result.sort()).toEqual(input.sort());
    });

    it('should not modify the original array', () => {
      const input = [1, 2, 3, 4, 5];
      const original = [...input];
      shuffle(input);
      expect(input).toEqual(original);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('player123@football.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test.domain.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for passwords with 8+ characters', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('verylongpassword')).toBe(true);
    });

    it('should return false for passwords with less than 8 characters', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('formatDateString', () => {
    it('should format date to YYYY-MM-DD string', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      expect(formatDateString(date)).toBe('2025-01-15');
    });

    it('should handle different dates correctly', () => {
      const date1 = new Date('2024-12-25T00:00:00Z');
      const date2 = new Date('2025-06-01T23:59:59Z');
      
      expect(formatDateString(date1)).toBe('2024-12-25');
      expect(formatDateString(date2)).toBe('2025-06-01');
    });
  });
}); 