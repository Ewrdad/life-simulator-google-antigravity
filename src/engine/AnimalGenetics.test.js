import { describe, test, expect } from 'vitest';
import { Genetics } from './Genetics';
import { CONFIG } from './Config';

describe('Genetics Utility', () => {
    test('Returns base traits if no parent provided', () => {
        const traits = Genetics.mutate(null);
        expect(traits).toEqual(CONFIG.GENETICS.BASE_TRAITS);
    });

    test('Mutates traits within limits', () => {
        const parentTraits = { ...CONFIG.GENETICS.BASE_TRAITS };
        const childTraits = Genetics.mutate(parentTraits);

        // Traits should be similar but not necessarily identical (random chance of 0 change is low but possible)
        // We check if they are within valid ranges
        for (const key in childTraits) {
            expect(childTraits[key]).toBeGreaterThanOrEqual(CONFIG.GENETICS.LIMITS[key].min);
            expect(childTraits[key]).toBeLessThanOrEqual(CONFIG.GENETICS.LIMITS[key].max);
        }
    });

    test('Clamps values to limits', () => {
        const limits = CONFIG.GENETICS.LIMITS;

        // Force a trait to be near max, then try to increase it
        const maxTraits = { ...CONFIG.GENETICS.BASE_TRAITS, moveSpeed: limits.moveSpeed.max };

        // Mock Math.random to force increase
        const originalRandom = Math.random;
        Math.random = () => 1.0; // Max positive change

        const childTraits = Genetics.mutate(maxTraits);
        expect(childTraits.moveSpeed).toBe(limits.moveSpeed.max);

        Math.random = originalRandom;
    });

    test('Validates and fixes out of bound traits', () => {
        const badTraits = {
            moveSpeed: 999,
            hungerRate: -5
        };
        const fixed = Genetics.validate(badTraits);
        expect(fixed.moveSpeed).toBe(CONFIG.GENETICS.LIMITS.moveSpeed.max);
        expect(fixed.hungerRate).toBe(CONFIG.GENETICS.LIMITS.hungerRate.min);
    });
});
