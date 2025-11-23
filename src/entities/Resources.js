import { Entity } from './Entity';
import { CONFIG } from '../engine/Config';

export class Tree extends Entity {
    constructor(x, y) {
        super(x, y, 'tree', '#166534'); // green-800
        this.lifespan = CONFIG.ENTITIES.RESOURCES.TREE_MAX_AGE + Math.random() * 1000;
    }

    tick(world) {
        super.tick(world);
        // Spread
        if (Math.random() < CONFIG.ENTITIES.RESOURCES.TREE_SPREAD_CHANCE) {
            let dx = Math.floor(Math.random() * 3) - 1;
            let dy = Math.floor(Math.random() * 3) - 1;

            // Growth Bias: Tend to grow towards water
            const water = world.findNearest(this.x, this.y, 'water', 10);
            if (water && Math.random() < 0.7) { // 70% chance to follow bias
                dx = Math.sign(water.x - this.x);
                dy = Math.sign(water.y - this.y);
                // Add some randomness so it's not a straight line
                if (Math.random() < 0.3) dx += Math.floor(Math.random() * 3) - 1;
                if (Math.random() < 0.3) dy += Math.floor(Math.random() * 3) - 1;
                // Clamp
                dx = Math.max(-1, Math.min(1, dx));
                dy = Math.max(-1, Math.min(1, dy));
            }

            if (dx === 0 && dy === 0) return;

            const newX = this.x + dx;
            const newY = this.y + dy;

            if (newX >= 0 && newX < world.width && newY >= 0 && newY < world.height) {
                if (!world.getAt(newX, newY)) {
                    world.addEntity(new Tree(newX, newY));
                }
            }
        }
    }
}

export class BerryBush extends Entity {
    constructor(x, y) {
        super(x, y, 'berry', '#db2777'); // pink-600
        this.foodValue = 20;
        this.regrowTime = 0;
        this.lifespan = CONFIG.ENTITIES.RESOURCES.BUSH_MAX_AGE + Math.random() * 500;
    }

    tick(world) {
        super.tick(world);

        // Spread
        if (Math.random() < CONFIG.ENTITIES.RESOURCES.BUSH_SPREAD_CHANCE) {
            // Global Limit Check
            if (world.entityCounts.berry >= CONFIG.ECOSYSTEM.BERRIES.MAX_POPULATION) return;

            // Local Density Check
            const radius = CONFIG.ECOSYSTEM.BERRIES.NEIGHBOR_RADIUS;
            let neighbors = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = this.x + dx;
                    const ny = this.y + dy;
                    if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height) {
                        const entity = world.getAt(nx, ny);
                        if (entity && entity.type === 'berry') {
                            neighbors++;
                        }
                    }
                }
            }
            if (neighbors >= CONFIG.ECOSYSTEM.BERRIES.MAX_NEIGHBORS) return;

            let dx = Math.floor(Math.random() * 3) - 1;
            let dy = Math.floor(Math.random() * 3) - 1;

            // Growth Bias: Tend to grow towards water
            const water = world.findNearest(this.x, this.y, 'water', 10);
            if (water && Math.random() < 0.7) {
                dx = Math.sign(water.x - this.x);
                dy = Math.sign(water.y - this.y);
                // Add some randomness
                if (Math.random() < 0.3) dx += Math.floor(Math.random() * 3) - 1;
                if (Math.random() < 0.3) dy += Math.floor(Math.random() * 3) - 1;
                dx = Math.max(-1, Math.min(1, dx));
                dy = Math.max(-1, Math.min(1, dy));
            }

            if (dx === 0 && dy === 0) return;

            const newX = this.x + dx;
            const newY = this.y + dy;

            if (newX >= 0 && newX < world.width && newY >= 0 && newY < world.height) {
                if (!world.getAt(newX, newY)) {
                    world.addEntity(new BerryBush(newX, newY));
                }
            }
        }

        if (this.regrowTime > 0) {
            this.regrowTime--;
            this.color = '#701a3c'; // Darker when empty
        } else {
            this.color = '#db2777';
        }
    }

    harvest() {
        if (this.regrowTime > 0) return 0;
        this.regrowTime = CONFIG.ENTITIES.RESOURCES.BERRY_REGROWTH;
        return this.foodValue;
    }
}

export class Farm extends Entity {
    constructor(x, y) {
        super(x, y, 'farm', '#ca8a04'); // yellow-600
        this.foodValue = 50;
        this.growth = 0;
    }

    tick(world) {
        super.tick(world);
        if (this.growth < 100) {
            this.growth++;
        }
    }

    harvest() {
        if (this.growth >= 100) {
            this.growth = 0;
            return this.foodValue;
        }
        return 0;
    }
}

export class House extends Entity {
    constructor(x, y) {
        super(x, y, 'house', '#e2e8f0'); // slate-200
        this.occupants = [];
        this.capacity = 2;
        this.occupantRestTime = new Map(); // Track rest duration
        this.lifespan = CONFIG.ENTITIES.HOUSE.LIFESPAN;
    }

    addOccupant(entity) {
        if (this.occupants.length < this.capacity) {
            this.occupants.push(entity);
            this.occupantRestTime.set(entity.id, 0); // Start rest counter
            return true;
        }
        return false;
    }

    die(world) {
        // Eject or kill occupants?
        // If house is destroyed, occupants should probably die or be ejected.
        // For simplicity and "collapse" logic, let's say they die.
        // Or better, eject them if possible, but if not (e.g. surrounded), they die.
        // Actually, let's just decrement their counts if they are still inside.

        // IMPORTANT: Since they are not in the world.entities list (they are stored),
        // we must manually decrement their counts if we don't re-add them to the world.

        // Let's try to eject them first.
        for (const occupant of this.occupants) {
            // Try to find a spot
            let ejected = false;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const ex = this.x + dx;
                    const ey = this.y + dy;
                    if (ex >= 0 && ex < world.width && ey >= 0 && ey < world.height && !world.getAt(ex, ey)) {
                        occupant.x = ex;
                        occupant.y = ey;
                        occupant.markedForDeletion = false;
                        occupant.isStored = false;
                        world.addEntity(occupant, true); // isRestore = true
                        ejected = true;
                        break;
                    }
                }
                if (ejected) break;
            }

            if (!ejected) {
                // Crushed in rubble
                if (world.entityCounts[occupant.type] !== undefined) {
                    world.entityCounts[occupant.type]--;
                }
            }
        }

        this.occupants = []; // Clear
        super.die(world);
    }

    tick(world) {
        super.tick(world);
        // Manage occupants
        for (let i = this.occupants.length - 1; i >= 0; i--) {
            const occupant = this.occupants[i];
            const restTime = this.occupantRestTime.get(occupant.id) || 0;
            this.occupantRestTime.set(occupant.id, restTime + 1);

            // Occupant logic inside house
            occupant.hunger += world.settings.humanHungerRate * 0.5; // Hunger grows slower resting
            if (occupant.hunger >= occupant.maxHunger) {
                // Die in house
                this.occupants.splice(i, 1);
                this.occupantRestTime.delete(occupant.id);
                // Decrement count explicitly as they are gone from world list
                if (world.entityCounts[occupant.type] !== undefined) {
                    world.entityCounts[occupant.type]--;
                }
                continue;
            }

            // Leave if hungry or random chance (but only after resting at least 50 ticks)
            if (restTime > 50 && (occupant.hunger > 50 || Math.random() < 0.05)) {
                // Try to spawn back
                const exitX = this.x + (Math.random() > 0.5 ? 1 : -1);
                const exitY = this.y + (Math.random() > 0.5 ? 1 : -1);
                if (exitX >= 0 && exitX < world.width && exitY >= 0 && exitY < world.height && !world.getAt(exitX, exitY)) {
                    occupant.x = exitX;
                    occupant.y = exitY;
                    occupant.markedForDeletion = false;
                    occupant.isStored = false;
                    world.addEntity(occupant, true); // isRestore = true
                    this.occupants.splice(i, 1);
                    this.occupantRestTime.delete(occupant.id);
                }
            }
        }
    }


}

export class Water extends Entity {
    constructor(x, y) {
        super(x, y, 'water', CONFIG.WATER.COLOR);
        this.depth = Math.random(); // For potential visual variation
        this.tidePhase = Math.random() * Math.PI * 2;
    }

    tick(world) {
        // No super.tick(world) needed if we don't want age/death
        // But Entity.tick handles age. Water shouldn't die of old age.
        // So we override and do NOT call super.tick() or we reset age.

        // Visual tide effect
        this.tidePhase += CONFIG.WATER.TIDE_SPEED;
        // Oscillate color slightly
        // We can't easily change hex color smoothly without helper, so maybe just skip for now 
        // or toggle between two shades.
        if (Math.sin(this.tidePhase) > 0) {
            this.color = CONFIG.WATER.COLOR;
        } else {
            this.color = CONFIG.WATER.DEEP_COLOR;
        }
    }
}
