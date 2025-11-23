import { CONFIG } from './Config';

export class Genetics {
    /**
     * Mutates a set of traits based on configuration limits and rates.
     * @param {Object} parentTraits - The traits to mutate from.
     * @returns {Object} - New mutated traits.
     */
    static mutate(parentTraits) {
        // If no parent traits provided (initial spawn), return base traits
        if (!parentTraits) {
            return { ...CONFIG.GENETICS.BASE_TRAITS };
        }

        const newTraits = { ...parentTraits };
        const limits = CONFIG.GENETICS.LIMITS;
        const rate = CONFIG.GENETICS.MUTATION_RATE;

        for (const [key, value] of Object.entries(newTraits)) {
            // Random mutation: value +/- (value * rate * random factor)
            // e.g. rate 0.1 means +/- 10% max change
            const change = (Math.random() * 2 - 1) * rate; // -0.1 to 0.1
            let newValue = value * (1 + change);

            // Clamp to limits
            if (limits[key]) {
                newValue = Math.max(limits[key].min, Math.min(limits[key].max, newValue));
            }
            newTraits[key] = newValue;
        }

        return newTraits;
    }

    /**
     * Validates traits against limits (useful for debugging or restoring).
     * @param {Object} traits 
     */
    static validate(traits) {
        const limits = CONFIG.GENETICS.LIMITS;
        const validated = { ...traits };
        for (const [key, value] of Object.entries(validated)) {
            if (limits[key]) {
                validated[key] = Math.max(limits[key].min, Math.min(limits[key].max, value));
            }
        }
        return validated;
    }
}
