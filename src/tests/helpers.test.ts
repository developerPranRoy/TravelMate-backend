import { describe, it, expect } from 'vitest';
import { generateSlug, generateBookingReference } from '../utils/helpers';

describe('Helpers', () => {
  describe('generateSlug', () => {
    it('converts text to slug', () => {
      expect(generateSlug("Cox's Bazar")).toBe('coxs-bazar');
      expect(generateSlug('Hello World 123')).toBe('hello-world-123');
      expect(generateSlug('  Spaces  ')).toBe('spaces');
    });

    it('handles special characters', () => {
      expect(generateSlug('Bandarban Hill Trek!')).toBe('bandarban-hill-trek');
    });

    it('collapses multiple dashes', () => {
      expect(generateSlug('one--two---three')).toBe('one-two-three');
    });
  });

  describe('generateBookingReference', () => {
    it('starts with TM-', () => {
      const ref = generateBookingReference();
      expect(ref.startsWith('TM-')).toBe(true);
    });

    it('generates unique references', () => {
      const refs = new Set(Array.from({ length: 100 }, () => generateBookingReference()));
      expect(refs.size).toBe(100);
    });
  });
});
