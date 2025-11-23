export const CONFIG = {
    WORLD: {
        WIDTH_SCALE: 15, // Cell size in pixels
        TICK_RATE: 100, // ms per tick (approx) - controlled by GameLoop
        RESEED_INTERVAL: 50, // Ticks between divine intervention checks
    },
    MAX_ENTITIES: 5000, // Increased to allow for lakes and forests
    ENTITIES: {
        HUMAN: {
            HUNGER_RATE: 0.05,
            REPRODUCTION_COST: 20,
            DEFENSE_CHANCE: 0.5,
            WAR_CHANCE: 0.05, // Chance to hunt enemies
            SOCIETAL_SPLIT: {
                THRESHOLD: 6, // Neighbors needed to split
                CHANCE: 0.01, // Base chance
            },
            TARGET_POPULATION: {
                MIN: 200,
                MAX: 300,
            },
            POOP_CHANCE: 0.0005, // Chance to spawn a plant nearby
            MAX_HUNGER: 100,
            LOW_HUNGER_THRESHOLD: 20,
            REPRODUCTION_COOLDOWN: 20,
            SPAWN_THRESHOLD: 5,
            MAX_AGE: 2000, // ~33 seconds at 60fps (if 1 tick = 1 frame? No, tick rate is 100ms -> 200s)
            THIRST_RATE: 0.05,
            MAX_THIRST: 150,
            LOW_THIRST_THRESHOLD: 30,
        },
        COW: {
            HUNGER_RATE: 0.04,
            REPRODUCTION_COST: 20,
            POOP_CHANCE: 0.0005,
            MAX_HUNGER: 100,
            LOW_HUNGER_THRESHOLD: 20,
            REPRODUCTION_COOLDOWN: 20,
            SPAWN_THRESHOLD: 5,
            MAX_AGE: 1500,
            THIRST_RATE: 0.04,
            MAX_THIRST: 150,
            LOW_THIRST_THRESHOLD: 30,
        },
        WOLF: {
            HUNGER_RATE: 0.1,
            REPRODUCTION_COST: 20,
            POOP_CHANCE: 0.0005,
            MAX_HUNGER: 100,
            LOW_HUNGER_THRESHOLD: 10,
            HUNT_THRESHOLD: 20,
            REPRODUCTION_COOLDOWN: 200,
            SPAWN_THRESHOLD: 5,
            MAX_AGE: 1200,
            THIRST_RATE: 0.06,
            MAX_THIRST: 150,
            LOW_THIRST_THRESHOLD: 30,
        },
        RESOURCES: {
            TREE_GROWTH: 0.01,
            BERRY_REGROWTH: 300,
            TREE_SPREAD_CHANCE: 0.001, // Very low chance to spread
            BUSH_SPREAD_CHANCE: 0.001,
            TREE_MAX_AGE: 5000, // Trees live long
            BUSH_MAX_AGE: 2000,
        },
        NATURE_RESERVE: {
            LIFESPAN: 300, // Reduced from 1000 to prevent overcrowding
            SPAWN_RATE: 0.05,
            MAX_ANIMALS: 10,
            TYPES: {
                WOLF: { COLOR: '#10b981', SPAWN: 'wolf' },
                COW: { COLOR: '#f59e0b', SPAWN: 'cow' },
            }
        },
        HOUSE: {
            LIFESPAN: 300, // Short lifespan to prevent overcrowding
        },
        TOTEM: {
            COST: 10,
            RADIUS: 15,
            LIFESPAN: 2000,
        },
    },
    ECOSYSTEM: {
        TREES: {
            MIN_THRESHOLD: 125, // If below, plant trees
            IDEAL: 150,
            MAX_THRESHOLD: 200, // Added for highlighting logic
        },
        BERRIES: {
            FRENZY_THRESHOLD: 600, // If above, cows go crazy
            MAX_POPULATION: 1500,
            MAX_NEIGHBORS: 3,
            NEIGHBOR_RADIUS: 3,
        },
        WOLVES: {
            MIN_THRESHOLD: 40, // Target ~50
            MAX_THRESHOLD: 60,
            FRENZY_THRESHOLD: 500, // If cows > this, wolves go crazy
        },
        COWS: {
            MIN_THRESHOLD: 80, // Target ~100
            MAX_THRESHOLD: 120,
        },
        FRENZY: {
            HUNGER_MULTIPLIER: 2.0,
            REPRODUCTION_COOLDOWN_MODIFIER: 0.25,
        },
        BUILDINGS: {
            MIN_SPACING: 2, // Tiles between buildings (1 gap = 2 distance?) No, 1 gap means distance >= 2
        }
    },
    WATER: {
        COLOR: '#3b82f6', // blue-500
        DEEP_COLOR: '#1d4ed8', // blue-700
        TIDE_SPEED: 0.05,
    },
    INITIAL_SPAWN: {
        DENSITY_FACTOR: 2400, // Higher = fewer entities (area / factor)
        TREES: 0,
        BUSHES: 100,
        COWS: 40,
        HUMANS: 30,
        WOLVES: 10,
    },
    WORLD_GEN: {
        NOISE_SCALE: 0.05, // Even smoother for large biomes
        FOREST_THRESHOLD: 0.6, // Only dense forests
        LAKE_THRESHOLD: -0.6, // Only deep lakes
        RIVER_COUNT: 3, // Sparse rivers
    },
    GENETICS: {
        MUTATION_RATE: 0.25, // +/- 25% change per split
        BASE_TRAITS: {
            moveSpeed: 1.0,
            hungerRate: 1.0,
            visionRadius: 1.0,
            aggression: 1.0,
            heatTolerance: 1.0,
            coldTolerance: 1.0,
        },
        LIMITS: {
            moveSpeed: { min: 0.2, max: 3.0 }, // Wider range
            hungerRate: { min: 0.2, max: 3.0 }, // Wider range
            visionRadius: { min: 0.2, max: 3.0 }, // Wider range
            aggression: { min: 0.0, max: 5.0 }, // Much higher aggression possible
            heatTolerance: { min: 0.1, max: 3.0 }, // Wider range
            coldTolerance: { min: 0.1, max: 3.0 }, // Wider range
        }
    }
};
