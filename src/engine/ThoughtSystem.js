import { EASTER_EGG_THOUGHTS } from '../config/EasterEggs';

export class ThoughtSystem {
    constructor() {
        this.activeThoughts = []; // { x, y, text, life, maxLife, color }
        this.thoughtCooldown = 0;

        // Define rules for environmental/contextual thoughts
        this.rules = [
            // 1. Needs (High Priority)
            {
                id: 'hunger_critical',
                weight: 10,
                condition: (entity) => entity.hunger > 80,
                templates: ["Starving!", "Need food now!", "So hungry...", "Stomach rumbling."]
            },
            {
                id: 'thirst_critical',
                weight: 10,
                condition: (entity) => entity.thirst > 80,
                templates: ["Parched!", "Need water!", "So thirsty...", "Dying of thirst."]
            },

            // 2. Actions
            {
                id: 'fleeing',
                weight: 8,
                condition: (entity) => entity.action === 'FLEEING',
                templates: ["Run away!", "It's chasing me!", "Help!", "Too fast!"]
            },
            {
                id: 'fighting',
                weight: 8,
                condition: (entity) => entity.action === 'FIGHTING',
                templates: ["Take that!", "For the faction!", "Die!", "Ouch!"]
            },
            {
                id: 'building',
                weight: 5,
                condition: (entity) => entity.action === 'BUILDING',
                templates: ["Building a home.", "Hard work.", "Almost done.", "Need more wood."]
            },

            // 3. Environment (Contextual)
            {
                id: 'crowded',
                weight: 4,
                condition: (entity, world) => {
                    const neighbors = world.findNearest(entity.x, entity.y, 'human', 5);
                    return neighbors && neighbors !== entity;
                },
                templates: ["So crowded.", "Get out of my way.", "Hello neighbor.", "Nice weather."]
            },
            {
                id: 'wolf_nearby',
                weight: 6,
                condition: (entity, world) => world.findNearest(entity.x, entity.y, 'wolf', 8),
                templates: ["Is that a wolf?", "Scary sounds.", "Keep quiet.", "Don't look."]
            },
            {
                id: 'nature_lover',
                weight: 3,
                condition: (entity, world) => world.findNearest(entity.x, entity.y, 'tree', 3),
                templates: ["Nice tree.", "Fresh air.", "Nature is beautiful.", "Save the trees.", "Good shade."]
            },
            {
                id: 'water_nearby',
                weight: 4,
                condition: (entity, world) => world.findNearest(entity.x, entity.y, 'water', 4),
                templates: ["Water looks cool.", "Thirsty work.", "Splish splash.", "Blue water."]
            },
            {
                id: 'house_nearby',
                weight: 3,
                condition: (entity, world) => world.findNearest(entity.x, entity.y, 'house', 3),
                templates: ["Home sweet home.", "Nice architecture.", "I want a house like that.", "Cozy."]
            },
            {
                id: 'farm_nearby',
                weight: 3,
                condition: (entity, world) => world.findNearest(entity.x, entity.y, 'farm', 3),
                templates: ["Crops looking good.", "Harvest soon?", "Hard work farming.", "Food grows here."]
            },
            {
                id: 'cow_nearby',
                weight: 4,
                condition: (entity, world) => world.findNearest(entity.x, entity.y, 'cow', 5),
                templates: ["Moo.", "Nice cow.", "Looks tasty.", "Don't tip it."]
            },
            {
                id: 'lonely',
                weight: 2,
                condition: (entity, world) => !world.findNearest(entity.x, entity.y, 'human', 15),
                templates: ["So quiet.", "Where is everyone?", "All alone.", "Peaceful."]
            },

            // 4. Easter Eggs (Low chance, handled separately usually, but can be here)
            {
                id: 'random',
                weight: 1,
                condition: () => true, // Always possible
                templates: ["..."] // Will be replaced by Easter Eggs
            }
        ];
    }

    tick() {
        // Update active thoughts
        for (let i = this.activeThoughts.length - 1; i >= 0; i--) {
            const thought = this.activeThoughts[i];
            thought.life--;
            if (thought.life <= 0) {
                this.activeThoughts.splice(i, 1);
            }
        }

        if (this.thoughtCooldown > 0) this.thoughtCooldown--;
    }

    tryGenerateThought(entity, world) {
        if (this.thoughtCooldown > 0) return;
        if (Math.random() > 0.05) return; // 5% chance per tick per call (controlled by World)

        // 1. Easter Egg Check (Global 5% chance when generating)
        if (Math.random() < 0.05) {
            const text = EASTER_EGG_THOUGHTS[Math.floor(Math.random() * EASTER_EGG_THOUGHTS.length)];
            this.addThought(entity.x, entity.y, text, entity.color);
            return;
        }

        // 2. Evaluate Rules
        const validRules = this.rules.filter(rule => rule.condition(entity, world));
        if (validRules.length === 0) return;

        // Weighted random selection
        const totalWeight = validRules.reduce((sum, rule) => sum + rule.weight, 0);
        let random = Math.random() * totalWeight;

        for (const rule of validRules) {
            random -= rule.weight;
            if (random <= 0) {
                const text = rule.templates[Math.floor(Math.random() * rule.templates.length)];
                this.addThought(entity.x, entity.y, text, entity.color);
                break;
            }
        }
    }

    addThought(x, y, text, color = '#ffffff') {
        // Check if too many thoughts already (Global limit)
        if (this.activeThoughts.length >= 5) return; // Increased limit slightly since they are static/fading

        this.activeThoughts.push({
            x,
            y,
            text,
            life: 100, // 10 seconds at 10 TPS
            maxLife: 100,
            color
        });
        this.thoughtCooldown = 20; // 2 seconds cooldown between ANY thoughts
    }
}
