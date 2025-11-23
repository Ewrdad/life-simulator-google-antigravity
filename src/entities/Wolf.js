import { Entity } from './Entity';
import { CONFIG } from '../engine/Config';
import { BerryBush, Tree } from './Resources';
import { Genetics } from '../engine/Genetics';

export class Wolf extends Entity {
    constructor(x, y, parentTraits = null) {
        super(x, y, 'wolf', '#dc2626'); // red-600
        this.traits = Genetics.mutate(parentTraits);
        this.hunger = 0;
        this.maxHunger = CONFIG.ENTITIES.WOLF.MAX_HUNGER;
        this.reproductionCooldown = CONFIG.ENTITIES.WOLF.REPRODUCTION_COOLDOWN;
        this.lifespan = CONFIG.ENTITIES.WOLF.MAX_AGE + Math.random() * 300;
        this.thirst = 0;
        this.maxThirst = CONFIG.ENTITIES.WOLF.MAX_THIRST;
    }

    tick(world) {
        super.tick(world);
        this.hunger += world.settings.wolfHungerRate * this.traits.hungerRate; // Dynamic hunger
        this.thirst += CONFIG.ENTITIES.WOLF.THIRST_RATE;
        if (this.reproductionCooldown > 0) this.reproductionCooldown--;

        // Poop seeds
        this.tryPoop(world);

        if (this.hunger >= this.maxHunger || this.thirst >= this.maxThirst) {
            this.die(world);
            return;
        }

        // Behavior
        // Critical Needs override avoidance
        if (this.thirst > 70) {
            this.seekWater(world);
        } else if (this.hunger > 70) {
            this.hunt(world);
        } else if (this.avoidBuildings(world)) {
            return;
        } else if (this.thirst > CONFIG.ENTITIES.WOLF.LOW_THIRST_THRESHOLD) {
            this.seekWater(world);
        } else if (this.hunger > (world.settings.wolfHuntThreshold || CONFIG.ENTITIES.WOLF.HUNT_THRESHOLD)) {
            this.hunt(world);
        } else {
            // Check for Cow Frenzy
            const cowCount = world.entityCounts.cow || 0;
            const isFrenzy = cowCount > CONFIG.ECOSYSTEM.WOLVES.FRENZY_THRESHOLD;

            // Apply Frenzy Hunger Modifier
            if (isFrenzy) {
                this.hunger += world.settings.wolfHungerRate * (CONFIG.ECOSYSTEM.FRENZY.HUNGER_MULTIPLIER - 1);
            }

            // Frenzy allows reproduction at higher hunger (up to 50)
            const reproductionHungerThreshold = isFrenzy ? 50 : 20;

            if (this.reproductionCooldown === 0 && this.hunger < reproductionHungerThreshold) {
                this.reproduce(world, isFrenzy);
            } else {
                this.wander(world);
            }
        }
    }

    hunt(world) {
        // Find nearest Cow or Human
        const vision = 20 * this.traits.visionRadius;
        const prey = world.findNearest(this.x, this.y, 'cow', vision) || world.findNearest(this.x, this.y, 'human', vision);
        if (prey) {
            if (Math.abs(prey.x - this.x) <= 1 && Math.abs(prey.y - this.y) <= 1) {
                // Eat
                this.hunger = 0;
                prey.die(world);
            } else {
                this.moveTowards(prey.x, prey.y, world);
            }
        } else {
            this.wander(world);
        }
    }

    seekWater(world) {
        const water = world.findNearest(this.x, this.y, 'water');
        if (water) {
            if (Math.abs(water.x - this.x) <= 1 && Math.abs(water.y - this.y) <= 1) {
                // Drink
                this.thirst = 0;
            } else {
                this.moveTowards(water.x, water.y, world);
            }
        } else {
            this.wander(world);
        }
    }

    reproduce(world, isFrenzy = false) {
        const mate = world.findNearest(this.x, this.y, 'wolf', 10, this);
        if (mate && Math.abs(mate.x - this.x) <= 1 && Math.abs(mate.y - this.y) <= 1) {
            const babyX = this.x + (Math.random() > 0.5 ? 1 : -1);
            const babyY = this.y + (Math.random() > 0.5 ? 1 : -1);
            if (babyX >= 0 && babyX < world.width && babyY >= 0 && babyY < world.height && !world.getAt(babyX, babyY)) {
                world.addEntity(new Wolf(babyX, babyY, this.traits));

                let cooldown = CONFIG.ENTITIES.WOLF.REPRODUCTION_COOLDOWN;
                if (isFrenzy) cooldown = Math.floor(cooldown * CONFIG.ECOSYSTEM.FRENZY.REPRODUCTION_COOLDOWN_MODIFIER);

                this.reproductionCooldown = cooldown;
                this.reproductionCooldown = cooldown;
                this.hunger += isFrenzy ? 10 : (world.settings.wolfReproductionCost || 40); // Cheaper reproduction in frenzy

                if (isFrenzy) console.log("Wolf Frenzy Reproduction!");
            }
        } else if (mate) {
            this.moveTowards(mate.x, mate.y, world);
        } else {
            this.wander(world);
        }
    }

    wander(world) {
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy, world);
        }
    }

    tryPoop(world) {
        if (Math.random() < CONFIG.ENTITIES.WOLF.POOP_CHANCE) {
            let dx, dy;
            do {
                dx = Math.floor(Math.random() * 3) - 1;
                dy = Math.floor(Math.random() * 3) - 1;
            } while (dx === 0 && dy === 0);

            const nx = this.x + dx;
            const ny = this.y + dy;

            if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height && !world.getAt(nx, ny)) {
                if (Math.random() < 0.9) {
                    world.addEntity(new BerryBush(nx, ny));
                } else {
                    world.addEntity(new Tree(nx, ny));
                }
            }
        }
    }

    moveTowards(targetX, targetY, world) {
        let step = 1;
        // Speed trait chance to move extra
        if (this.traits.moveSpeed > 1.0 && Math.random() < (this.traits.moveSpeed - 1.0)) {
            step = 2;
        }

        const dx = Math.sign(targetX - this.x) * step;
        const dy = Math.sign(targetY - this.y) * step;
        this.move(dx, dy, world);
    }

    avoidBuildings(world) {
        const house = world.findNearest(this.x, this.y, 'house', 8 * this.traits.visionRadius);
        if (house) {
            // Run away!
            const dx = this.x - house.x;
            const dy = this.y - house.y;

            // Normalize direction
            const moveX = dx === 0 ? 0 : dx / Math.abs(dx);
            const moveY = dy === 0 ? 0 : dy / Math.abs(dy);

            // Try to move away
            if (this.move(moveX, moveY, world)) {
                return true;
            }

            // If blocked, try random move
            this.wander(world);
            return true;
        }
        return false;
    }
}
