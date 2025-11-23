import { Entity } from './Entity';
import { CONFIG } from '../engine/Config';
import { BerryBush, Tree } from './Resources';
import { Genetics } from '../engine/Genetics';

export class Cow extends Entity {
    constructor(x, y, parentTraits = null) {
        super(x, y, 'cow', '#eab308'); // yellow-500
        this.traits = Genetics.mutate(parentTraits);
        this.hunger = 0; // 0 = full, 100 = starving
        this.maxHunger = CONFIG.ENTITIES.COW.MAX_HUNGER;
        this.reproductionCooldown = 0;
        this.lifespan = CONFIG.ENTITIES.COW.MAX_AGE + Math.random() * 500;
        this.thirst = 0;
        this.maxThirst = CONFIG.ENTITIES.COW.MAX_THIRST;
    }

    tick(world) {
        super.tick(world);
        this.hunger += world.settings.cowHungerRate * this.traits.hungerRate;
        this.thirst += CONFIG.ENTITIES.COW.THIRST_RATE;
        if (this.reproductionCooldown > 0) this.reproductionCooldown--;

        // Poop seeds
        this.tryPoop(world);

        if (this.hunger >= this.maxHunger || this.thirst >= this.maxThirst) {
            this.die(world);
            return;
        }

        // Behavior
        const population = world.entityCounts.cow || 0;
        const isEndangered = population < CONFIG.ECOSYSTEM.COWS.MIN_THRESHOLD;

        // Survival Buffs
        if (isEndangered) {
            // Slower hunger/thirst decay
            this.hunger = Math.max(0, this.hunger - (world.settings.cowHungerRate * 0.5));
            this.thirst = Math.max(0, this.thirst - (CONFIG.ENTITIES.COW.THIRST_RATE * 0.5));
        }

        if (this.thirst > CONFIG.ENTITIES.COW.LOW_THIRST_THRESHOLD) {
            this.seekWater(world);
        } else if (this.hunger > 30) {
            this.seekFood(world);
        } else {
            // Check for Berry Frenzy
            const berryCount = world.entityCounts.berry || 0;
            const isFrenzy = berryCount > CONFIG.ECOSYSTEM.BERRIES.FRENZY_THRESHOLD;

            // Frenzy allows reproduction at higher hunger (up to 50)
            // Endangered allows reproduction at higher hunger too
            let reproductionHungerThreshold = isFrenzy ? 50 : 20;
            if (isEndangered) reproductionHungerThreshold = 50;

            // Apply Frenzy Hunger Modifier
            if (isFrenzy) {
                this.hunger += world.settings.cowHungerRate * (CONFIG.ECOSYSTEM.FRENZY.HUNGER_MULTIPLIER - 1);
            }

            if (this.reproductionCooldown === 0 && this.hunger < reproductionHungerThreshold) {
                this.reproduce(world, isFrenzy, isEndangered);
            } else {
                this.wander(world);
            }
        }
    }

    seekFood(world) {
        // Find nearest BerryBush or Farm
        const food = world.findNearest(this.x, this.y, 'berry') || world.findNearest(this.x, this.y, 'farm');
        if (food) {
            if (Math.abs(food.x - this.x) <= 1 && Math.abs(food.y - this.y) <= 1) {
                // Eat
                if (food.type === 'berry') {
                    const amount = food.harvest();
                    if (amount > 0) this.hunger = Math.max(0, this.hunger - amount);
                } else if (food.type === 'farm') {
                    const amount = food.harvest();
                    if (amount > 0) this.hunger = Math.max(0, this.hunger - amount);
                }
            } else {
                this.moveTowards(food.x, food.y, world);
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

    reproduce(world, isFrenzy = false, isEndangered = false) {
        // Find another cow nearby? Or just asexual for simplicity/chaos?
        // Let's require another cow nearby

        // If endangered, search entire world (or very large radius)
        const searchRadius = isEndangered ? 100 : 10;
        const mate = world.findNearest(this.x, this.y, 'cow', searchRadius, this);

        if (mate && mate !== this && Math.abs(mate.x - this.x) <= 1 && Math.abs(mate.y - this.y) <= 1) {
            // Spawn baby
            // Find empty spot
            const babyX = this.x + (Math.random() > 0.5 ? 1 : -1);
            const babyY = this.y + (Math.random() > 0.5 ? 1 : -1);
            if (babyX >= 0 && babyX < world.width && babyY >= 0 && babyY < world.height && !world.getAt(babyX, babyY)) {
                world.addEntity(new Cow(babyX, babyY, this.traits));

                // Frenzy reduces cooldown and cost
                // Endangered reduces cooldown significantly
                let cooldown = 200;
                if (isFrenzy) cooldown = Math.floor(200 * CONFIG.ECOSYSTEM.FRENZY.REPRODUCTION_COOLDOWN_MODIFIER);
                if (isEndangered) cooldown = 50;

                this.reproductionCooldown = cooldown;
                this.reproductionCooldown = cooldown;
                this.hunger += isFrenzy ? 5 : (world.settings.cowReproductionCost || 30); // Cost of reproduction

                if (isFrenzy) console.log("Cow Frenzy Reproduction!");
                if (isEndangered) console.log("Cow Endangered Reproduction!");
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

    move(dx, dy, world) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (newX >= 0 && newX < world.width && newY >= 0 && newY < world.height) {
            const target = world.getAt(newX, newY);

            // Allow moving into empty space OR trampling/eating berries
            if (target === null || target.type === 'berry') {
                // If it's a berry, eat it (remove it)
                if (target && target.type === 'berry') {
                    this.hunger = Math.max(0, this.hunger - target.foodValue);
                    target.markedForDeletion = true;
                    world.removeEntity(target);
                }

                // Update grid
                world.grid[this.y][this.x] = null;
                this.x = newX;
                this.y = newY;
                world.grid[this.y][this.x] = this;
            }
        }
    }

    tryPoop(world) {
        if (Math.random() < CONFIG.ENTITIES.COW.POOP_CHANCE) {
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
}
