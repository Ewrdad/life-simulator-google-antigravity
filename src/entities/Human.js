import { Entity } from './Entity';
import { Farm, House, BerryBush, Tree } from './Resources';
import { NatureReserve } from './NatureReserve';
import { Totem } from './Totem';
import { CONFIG } from '../engine/Config';
import { EASTER_EGG_THOUGHTS } from '../config/EasterEggs';

export class Human extends Entity {
    constructor(x, y) {
        super(x, y, 'human', '#3b82f6'); // Default blue
        this.hunger = 0;
        this.maxHunger = CONFIG.ENTITIES.HUMAN.MAX_HUNGER;
        this.wood = 0;
        this.lifespan = CONFIG.ENTITIES.HUMAN.MAX_AGE + Math.random() * 500;
        this.reproductionCooldown = 0;
        this.thirst = 0;
        this.maxThirst = CONFIG.ENTITIES.HUMAN.MAX_THIRST;
        this.action = 'IDLE'; // IDLE, HUNTING, FARMING, GATHERING, FIGHTING

        const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack", "Luna", "Milo", "Nina", "Oscar", "Pip", "Quinn", "Ruby", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xander", "Yara", "Zane"];
        this.name = names[Math.floor(Math.random() * names.length)];

        if (!this.faction) {
            this.faction = Math.random() > 0.5 ? 'RED' : 'BLUE';
            this.color = this.faction === 'RED' ? '#ef4444' : '#3b82f6';
        }

        this.houseTarget = null; // Persist building target
        this.conservationTarget = null; // Persist conservation target



        // Performance: Cooldowns for expensive searches
        this.searchCooldowns = {
            water: 0,
            food: 0,
            mate: 0,
            war: 0,
            work: 0,
            houseLocation: 0
        };
    }

    // Helper to generate random faction color
    static randomFaction() {
        const colors = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#84cc16', '#6366f1']; // Violet, Pink, Orange, Teal, Lime, Indigo
        const names = ['PURPLE', 'PINK', 'ORANGE', 'TEAL', 'LIME', 'INDIGO'];
        const idx = Math.floor(Math.random() * colors.length);
        return { name: names[idx] + '_' + Math.floor(Math.random() * 1000), color: colors[idx] };
    }

    tick(world) {
        super.tick(world);

        const traits = world.getFactionTraits(this.faction);

        // Totem Effects
        const nearbyTotem = world.findNearest(this.x, this.y, 'totem', CONFIG.ENTITIES.TOTEM.RADIUS);
        if (nearbyTotem) {
            if (nearbyTotem.faction === this.faction) {
                // Friendly Totem: Heal slightly, reduce hunger rate slightly (morale)
                if (this.hunger > 0 && Math.random() < 0.1) this.hunger -= 1;
                // Happiness? We don't have a happiness stat, but we can reduce aggression/stress
            } else {
                // Enemy Totem: ANGER!
                // Increase aggression temporarily?
                // Or just target it?
                // Let's make them want to destroy it if they are idle
                if (this.action === 'IDLE' || this.action === 'WANDERING') {
                    this.action = 'ATTACKING_TOTEM';
                    if (Math.abs(nearbyTotem.x - this.x) <= 1 && Math.abs(nearbyTotem.y - this.y) <= 1) {
                        nearbyTotem.die(world);
                        console.log(`Human ${this.name} destroyed an enemy Totem!`);
                        return; // Stop tick here to preserve action state
                    } else {
                        this.moveTowards(nearbyTotem.x, nearbyTotem.y, world);
                        return; // Override other actions
                    }
                }
            }
        }

        this.hunger += world.settings.humanHungerRate * traits.hungerRate; // Dynamic hunger
        this.thirst += CONFIG.ENTITIES.HUMAN.THIRST_RATE * traits.hungerRate; // Thirst also affected by metabolism
        if (this.reproductionCooldown > 0) this.reproductionCooldown--;

        const rates = this.getDynamicRates(world);

        // Poop seeds (randomly spawn plants)
        this.tryPoop(world);

        if (this.hunger >= this.maxHunger || this.thirst >= this.maxThirst) {
            this.die(world);
            return;
        }

        // Decision Tree
        // 0. Shelter / Safety
        const vision = 8 * traits.visionRadius;
        const threat = world.findNearest(this.x, this.y, 'wolf', vision);
        if (threat) {
            const house = world.findNearest(this.x, this.y, 'house', 10 * traits.visionRadius);
            if (house && house.occupants.length < house.capacity) {
                this.action = 'FLEEING';
                if (Math.abs(house.x - this.x) <= 1 && Math.abs(house.y - this.y) <= 1) {
                    if (house.addOccupant(this)) {
                        // Remove self from world (enter house)
                        this.isStored = true;
                        this.markedForDeletion = true;
                        world.removeEntity(this);
                        return;
                    }
                } else {
                    this.moveTowards(house.x, house.y, world);
                    return;
                }
            }

            // If no house, fight or flee
            if (this.hunger < 50 && Math.random() < world.settings.humanDefenseChance * traits.aggression) {
                this.action = 'DEFENDING';
                if (Math.abs(threat.x - this.x) <= 1 && Math.abs(threat.y - this.y) <= 1) {
                    threat.die(world);
                    this.hunger += 10;
                } else {
                    this.moveTowards(threat.x, threat.y, world);
                }
                return;
            }
        }

        // Priorities: Thirst > Hunger > Critical Reproduction > Ecosystem > War > Reproduction > Work > Wander
        // Behavior
        if (this.thirst > CONFIG.ENTITIES.HUMAN.LOW_THIRST_THRESHOLD) {
            this.seekWater(world);
            return;
        }

        // Critical Hunger (Starvation risk)
        if (this.hunger > 50) {
            this.seekFood(world);
            return;
        }

        // Critical Reproduction (Save the species!)
        if (world.entityCounts.human < 10 && this.reproductionCooldown === 0 && this.hunger < 50) {
            if (this.tryReproduce(world)) return;
        }

        // CRITICAL ECOSYSTEM MAINTENANCE (Save the animals!)
        // If cows or wolves are critically low (< 10), prioritize this above war and work
        const counts = world.entityCounts;
        // const eco = CONFIG.ECOSYSTEM; // Unused here
        const isCriticalConservation = (counts.cow < 10) || (counts.wolf < 10);

        if (isCriticalConservation) {
            if (this.tryEcosystemMaintenance(world)) return;
        }

        // Ecosystem Maintenance (Conscious Awareness) - Priority over comfort eating
        // Only run if we haven't already run it for critical reasons
        if (!isCriticalConservation && this.tryEcosystemMaintenance(world)) return;

        // Comfort Hunger (Snacking)
        if (this.hunger > CONFIG.ENTITIES.HUMAN.LOW_HUNGER_THRESHOLD) {
            this.seekFood(world);
            return;
        }

        // War: Attack enemy faction
        if (this.tryWar(world, rates.warChance, rates.overRatio)) return;

        // Societal Split: Fracture if too crowded
        if (this.trySocietalSplit(world, rates.splitChance, rates.overRatio)) return;

        if (this.reproductionCooldown === 0 && this.hunger < 20) {
            // Use dynamic reproduction chance
            if (Math.random() < rates.reproductionChance) {
                if (this.tryReproduce(world)) return;
            }
        }

        if (this.tryWork(world)) return;

        this.wander(world);
    }

    moveTowards(targetX, targetY, world) {
        const traits = world.getFactionTraits(this.faction);
        let step = 1;

        // Base speed chance from traits
        let speedChance = traits.moveSpeed - 1.0;

        // Road Bonus: If on a path, increase speed chance
        if (world.getTerrain && world.getTerrain(this.x, this.y) > 0.5) {
            speedChance += 0.5; // +50% chance to sprint
        }

        // Super speed: Chance to move 2 tiles
        if (speedChance > 0 && Math.random() < speedChance) {
            step = 2;
        }

        const dx = Math.sign(targetX - this.x) * step;
        const dy = Math.sign(targetY - this.y) * step;

        this.move(dx, dy, world);
    }

    tryEcosystemMaintenance(world) {
        const counts = world.entityCounts;
        const eco = CONFIG.ECOSYSTEM;

        // 1. Culling (Too many animals)
        if (counts.wolf > eco.WOLVES.MAX_THRESHOLD) {
            if (this.tryCull(world, 'wolf')) return true;
        }
        if (counts.cow > eco.COWS.MAX_THRESHOLD) {
            if (this.tryCull(world, 'cow')) return true;
        }

        // 2. Conservation (Too few animals)
        if (counts.wolf < eco.WOLVES.MIN_THRESHOLD) {
            if (this.tryConservation(world, 'WOLF')) return true;
        }
        if (counts.cow < eco.COWS.MIN_THRESHOLD) {
            if (this.tryConservation(world, 'COW')) return true;
        }

        // 3. Planting (Too few trees)
        if (counts.tree < eco.TREES.MIN_THRESHOLD) {
            if (this.tryPlanting(world)) return true;
        }

        return false;
    }

    tryCull(world, type) {
        const target = world.findNearest(this.x, this.y, type, 20);
        if (target) {
            this.action = 'CULLING';
            if (Math.abs(target.x - this.x) <= 1 && Math.abs(target.y - this.y) <= 1) {
                target.die(world);
                // Culling is hard work, but maybe gives food if cow?
                // For now, just energy cost or neutral.
                // If cow, maybe we eat it?
                if (type === 'cow') this.hunger = 0;
            } else {
                this.moveTowards(target.x, target.y, world);
            }
            return true;
        }
        return false;
    }

    tryPlanting(world) {
        // Plant a tree in an adjacent empty spot
        this.action = 'PLANTING';

        const range = 1; // Adjacent only
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                if (dx === 0 && dy === 0) continue;
                const tx = this.x + dx;
                const ty = this.y + dy;

                if (tx >= 0 && tx < world.width && ty >= 0 && ty < world.height && !world.getAt(tx, ty)) {
                    world.addEntity(new Tree(tx, ty));
                    return true;
                }
            }
        }
        return false;
    }

    tryConservation(world, type) {
        this.action = 'CONSERVING';

        // Check if we have a valid target
        if (this.conservationTarget) {
            // Check if target is still empty
            if (world.getAt(this.conservationTarget.x, this.conservationTarget.y)) {
                this.conservationTarget = null; // Occupied, reset
            }
        }

        if (!this.conservationTarget) {
            this.conservationTarget = this.findConservationSpot(world);
        }

        const target = this.conservationTarget;

        if (target) {
            // Move towards target if far, build if close
            if (Math.abs(target.x - this.x) <= 1 && Math.abs(target.y - this.y) <= 1) {
                if (!world.getAt(target.x, target.y)) {
                    world.addEntity(new NatureReserve(target.x, target.y, type));
                    console.log(`Human ${this.name} built Nature Reserve for ${type}`);
                    this.conservationTarget = null; // Done
                    return true;
                }
            } else {
                this.moveTowards(target.x, target.y, world);
                return true;
            }
        }
        return false;
    }

    findConservationSpot(world) {
        // Tiered search: Try strict first, then relax
        const tiers = [
            { radius: 15, spacing: 8 },
            { radius: 20, spacing: 4 },
            { radius: 30, spacing: 2 }
        ];

        for (const tier of tiers) {
            const { radius, spacing } = tier;
            // Sample points
            for (let i = 0; i < 20; i++) {
                const dx = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                const dy = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                const tx = this.x + dx;
                const ty = this.y + dy;

                if (tx >= 0 && tx < world.width && ty >= 0 && ty < world.height && !world.getAt(tx, ty)) {
                    const nearHouse = world.findNearest(tx, ty, 'house', spacing); // Ensure gap
                    if (!nearHouse) {
                        return { x: tx, y: ty };
                    }
                }
            }
        }
        return null;
    }

    seekFood(world) {
        if (this.searchCooldowns.food > 0) {
            this.searchCooldowns.food--;
            this.wander(world);
            return;
        }

        const traits = world.getFactionTraits(this.faction);
        // 1. Look for Cows (Hunting)
        // Check if cows are endangered
        const counts = world.entityCounts;
        const eco = CONFIG.ECOSYSTEM;
        let canHuntCow = true;

        if (counts && counts.cow < eco.COWS.MIN_THRESHOLD) {
            canHuntCow = false;
        }

        if (canHuntCow) {
            const cow = world.findNearest(this.x, this.y, 'cow', 10 * traits.visionRadius);
            if (cow) {
                this.action = 'HUNTING';
                if (Math.abs(cow.x - this.x) <= 1 && Math.abs(cow.y - this.y) <= 1) {
                    cow.die(world);
                    this.hunger = 0;
                } else {
                    this.moveTowards(cow.x, cow.y, world);
                }
                return;
            }
        }

        // 2. Look for Farms (Harvesting) or Berry Bushes
        const farm = world.findNearest(this.x, this.y, 'farm', 10 * traits.visionRadius);
        const berryBush = world.findNearest(this.x, this.y, 'berrybush', 10 * traits.visionRadius);

        let foodSource = null;
        if (farm && farm.growth >= 100) {
            foodSource = farm;
        }
        if (berryBush && (!foodSource || world.distance(this.x, this.y, berryBush.x, berryBush.y) < world.distance(this.x, this.y, foodSource.x, foodSource.y))) {
            foodSource = berryBush;
        }

        if (foodSource) {
            this.action = 'HARVESTING';
            if (Math.abs(foodSource.x - this.x) <= 1 && Math.abs(foodSource.y - this.y) <= 1) {
                const food = foodSource.harvest();
                if (food > 0) this.hunger = Math.max(0, this.hunger - food);
            } else {
                this.moveTowards(foodSource.x, foodSource.y, world);
            }
            return;
        }

        // Failed to find food, set cooldown
        this.searchCooldowns.food = 10 + Math.floor(Math.random() * 10);
        this.wander(world);
    }

    seekWater(world) {
        if (this.searchCooldowns.water > 0) {
            this.searchCooldowns.water--;
            this.wander(world);
            return;
        }

        this.action = 'DRINKING';
        const traits = world.getFactionTraits(this.faction);
        const water = world.findNearest(this.x, this.y, 'water', 50 * traits.visionRadius); // Capped at 50
        if (water) {
            if (Math.abs(water.x - this.x) <= 1 && Math.abs(water.y - this.y) <= 1) {
                // Drink
                this.thirst = 0;
            } else {
                this.moveTowards(water.x, water.y, world);
            }
        } else {
            // Failed to find water, set cooldown
            this.searchCooldowns.water = 10 + Math.floor(Math.random() * 10);
            this.wander(world); // If no water found, wander
        }
    }

    trySocietalSplit(world, chance, overRatio = 0) {
        // Check for overcrowding of SAME faction
        // We need to count neighbors efficiently. 
        // findNearest returns one, but we need a count.
        // Let's scan the 3x3 area (or slightly larger, say radius 2)

        if (Math.random() > chance) return false;

        let sameFactionCount = 0;
        const neighbors = [];
        const r = 2;

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = this.x + dx;
                const ny = this.y + dy;
                const entity = world.getAt(nx, ny);
                if (entity && entity.type === 'human' && entity.faction === this.faction) {
                    sameFactionCount++;
                    neighbors.push(entity);
                }
            }
        }

        // Dynamic threshold: Lower if overpopulated to force splits
        let threshold = CONFIG.ENTITIES.HUMAN.SOCIETAL_SPLIT.THRESHOLD;
        if (overRatio > 0) {
            threshold = Math.max(2, threshold - Math.floor(overRatio * 2));
        }

        if (sameFactionCount >= threshold) {
            // REVOLUTION!
            const newFaction = Human.randomFaction();

            // Register new faction with mutated traits
            world.registerNewFaction(newFaction.name, this.faction);

            console.log(`Societal Split! ${this.faction} -> ${newFaction.name} (Threshold: ${threshold})`);

            // Convert self
            this.faction = newFaction.name;
            this.color = newFaction.color;

            // Convert neighbors (spread the revolution)
            neighbors.forEach(n => {
                n.faction = newFaction.name;
                n.color = newFaction.color;
            });
            return true;
        }
        return false;
    }

    tryWar(world, chance, overRatio = 0) {
        const traits = world.getFactionTraits(this.faction);
        // Only fight if healthy and random chance
        // If overpopulated, fight even if slightly hungry
        const hungerThreshold = overRatio > 2 ? 60 : 40;

        if (this.hunger < hungerThreshold && Math.random() < chance * traits.aggression) {
            // Find nearest enemy human OR Totem
            // If overpopulated, search wider radius to hunt them down
            const searchRadius = (8 + (overRatio * 10)) * traits.visionRadius;

            // Prioritize Totems if we are aggressive? Or Humans?
            // Let's look for both.
            const enemy = world.findNearest(this.x, this.y, 'human', searchRadius, this, (e) => e.faction !== this.faction);
            const enemyTotem = world.findNearest(this.x, this.y, 'totem', searchRadius, this, (e) => e.faction !== this.faction);

            let target = enemy;
            // If we found a totem and (no enemy OR totem is closer), target totem
            if (enemyTotem) {
                if (!enemy || world.distance(this.x, this.y, enemyTotem.x, enemyTotem.y) < world.distance(this.x, this.y, enemy.x, enemy.y)) {
                    target = enemyTotem;
                }
            }

            if (target) {
                this.action = target.type === 'totem' ? 'ATTACKING_TOTEM' : 'FIGHTING';
                if (Math.abs(target.x - this.x) <= 1 && Math.abs(target.y - this.y) <= 1) {
                    target.die(world);
                    if (target.type === 'human') this.hunger += 20; // Fighting is tiring
                    else this.hunger += 10; // Smashing wood is less tiring?
                } else {
                    this.moveTowards(target.x, target.y, world);
                }
                return true;
            }
        }
        return false;
    }

    tryWork(world) {
        // 3. Build Totem (Territory) - Priority over House
        if (this.wood >= CONFIG.ENTITIES.TOTEM.COST) {
            const nearbyTotem = world.findNearest(this.x, this.y, 'totem', CONFIG.ENTITIES.TOTEM.RADIUS * 1.5, this, (e) => e.faction === this.faction);

            if (!nearbyTotem) {
                this.action = 'BUILDING_TOTEM';
                const targetX = this.x + (Math.random() > 0.5 ? 1 : -1);
                const targetY = this.y + (Math.random() > 0.5 ? 1 : -1);
                if (targetX >= 0 && targetX < world.width && targetY >= 0 && targetY < world.height && !world.getAt(targetX, targetY)) {
                    world.addEntity(new Totem(targetX, targetY, this.faction, this.color));
                    this.wood -= CONFIG.ENTITIES.TOTEM.COST;
                    world.logEvent(`Human ${this.name} built a Totem for ${this.faction}`);
                    return true;
                }
            }
        }

        // 3.5 Build House
        if (this.wood >= 5) {
            // Don't build house if we need a totem (save wood)
            const nearbyTotem = world.findNearest(this.x, this.y, 'totem', CONFIG.ENTITIES.TOTEM.RADIUS * 1.5, this, (e) => e.faction === this.faction);

            if (!nearbyTotem && this.wood < CONFIG.ENTITIES.TOTEM.COST) {
                // Save wood for totem
            } else {
                this.action = 'BUILDING';

                // Check if we have a valid target
                if (this.houseTarget) {
                    // Check if target is still empty
                    if (world.getAt(this.houseTarget.x, this.houseTarget.y)) {
                        this.houseTarget = null; // Occupied, reset
                    }
                }

                if (!this.houseTarget) {
                    if (this.searchCooldowns.houseLocation > 0) {
                        this.searchCooldowns.houseLocation--;
                    } else {
                        this.houseTarget = this.findIdealHouseLocation(world);
                        if (!this.houseTarget) {
                            this.searchCooldowns.houseLocation = 20 + Math.floor(Math.random() * 20);
                        }
                    }
                }

                const target = this.houseTarget;

                if (target) {
                    // Move towards target if far, build if close
                    if (Math.abs(target.x - this.x) <= 1 && Math.abs(target.y - this.y) <= 1) {
                        if (!world.getAt(target.x, target.y)) {
                            world.addEntity(new House(target.x, target.y));
                            this.wood -= 5;
                            this.houseTarget = null; // Done
                            return true;
                        }
                    } else {
                        this.moveTowards(target.x, target.y, world);
                        return true;
                    }
                }

                // Fallback: Build randomly nearby if no ideal spot found (or if stuck)
                // Only if we failed to find a target
                if (!this.houseTarget) {
                    const targetX = this.x + (Math.random() > 0.5 ? 1 : -1);
                    const targetY = this.y + (Math.random() > 0.5 ? 1 : -1);
                    if (targetX >= 0 && targetX < world.width && targetY >= 0 && targetY < world.height && !world.getAt(targetX, targetY)) {
                        world.addEntity(new House(targetX, targetY));
                        this.wood -= 5;
                        return true;
                    }
                }
            }
        }

        // 4. Gather Wood
        this.action = 'GATHERING';
        const traits = world.getFactionTraits(this.faction);
        const tree = world.findNearest(this.x, this.y, 'tree', 20 * traits.visionRadius);
        if (tree) {
            if (Math.abs(tree.x - this.x) <= 1 && Math.abs(tree.y - this.y) <= 1) {
                tree.die(world);
                this.wood += 5;
                return true;
            } else {
                this.moveTowards(tree.x, tree.y, world);
                return true;
            }
        }

        return false;
    }

    tryReproduce(world) {
        // Prefer same faction? Or cross-faction love?
        // Let's stick to same faction for now to keep teams distinct
        const mate = world.findNearest(this.x, this.y, 'human', 5, this, (e) => e.faction === this.faction);
        if (mate) {
            if (mate !== this && Math.abs(mate.x - this.x) <= 1 && Math.abs(mate.y - this.y) <= 1) {
                const babyX = this.x + (Math.random() > 0.5 ? 1 : -1);
                const babyY = this.y + (Math.random() > 0.5 ? 1 : -1);
                if (babyX >= 0 && babyX < world.width && babyY >= 0 && babyY < world.height && !world.getAt(babyX, babyY)) {
                    const baby = new Human(babyX, babyY);
                    baby.faction = this.faction; // Inherit faction
                    baby.color = this.color;
                    world.addEntity(baby);
                    this.reproductionCooldown = 300;
                    this.hunger += 40;
                    return true;
                }
            } else {
                this.moveTowards(mate.x, mate.y, world);
                return true;
            }
        }
        return false;
    }

    wander(world) {
        this.action = 'IDLE';
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy, world);
        }
    }

    tryPoop(world) {
        if (Math.random() < CONFIG.ENTITIES.HUMAN.POOP_CHANCE) {
            // Spawn a plant nearby
            let dx, dy;
            do {
                dx = Math.floor(Math.random() * 3) - 1;
                dy = Math.floor(Math.random() * 3) - 1;
            } while (dx === 0 && dy === 0);

            const nx = this.x + dx;
            const ny = this.y + dy;

            if (nx >= 0 && nx < world.width && ny >= 0 && ny < world.height && !world.getAt(nx, ny)) {
                // 90% BerryBush, 10% Tree
                if (Math.random() < 0.9) {
                    world.addEntity(new BerryBush(nx, ny));
                } else {
                    world.addEntity(new Tree(nx, ny));
                }
            }
        }
    }

    findIdealHouseLocation(world) {
        // Scan nearby area for best spot
        // Criteria:
        // 1. Near Water (High priority)
        // 2. Near Food (Medium priority)
        // 3. Near other Humans (Medium priority - social)
        // 4. Not too close to other Houses (spacing)

        let bestScore = -Infinity;
        let bestLocation = null;
        const radius = 10; // Look around

        // Sample random points to avoid checking every tile (performance)
        for (let i = 0; i < 50; i++) {
            const dx = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
            const dy = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
            const tx = this.x + dx;
            const ty = this.y + dy;

            if (tx >= 0 && tx < world.width && ty >= 0 && ty < world.height && !world.getAt(tx, ty)) {
                let score = 0;

                // 1. Water
                const water = world.findNearest(tx, ty, 'water', 10);
                if (water) {
                    const dist = world.distance(tx, ty, water.x, water.y);
                    score += (15 - dist) * 2; // Closer is better
                }

                // 2. Food
                const food = world.findNearest(tx, ty, 'berrybush', 10) || world.findNearest(tx, ty, 'farm', 10);
                if (food) {
                    const dist = world.distance(tx, ty, food.x, food.y);
                    score += (10 - dist);
                }

                // 3. Neighbors (Social)
                const neighbor = world.findNearest(tx, ty, 'human', 10, this);
                if (neighbor) {
                    const dist = world.distance(tx, ty, neighbor.x, neighbor.y);
                    score += (10 - dist) * 0.5;
                }

                // 4. Spacing (Avoid crowding houses)
                // New Rule: Allow at least 1 tile gap (distance >= 2)
                // Also check for ANY building, not just houses?
                // For now, let's check houses and other structures if we had them.
                const nearbyBuilding = world.findNearest(tx, ty, 'house', 5); // Check slightly larger radius to be safe
                if (nearbyBuilding) {
                    const dist = world.distance(tx, ty, nearbyBuilding.x, nearbyBuilding.y);
                    // Distance of 1 means adjacent (diagonal or cardinal). 
                    // We want at least 1 tile gap.
                    // If gap is 1, coords are (0,0) and (0,2) -> dist = 2.
                    // If coords are (0,0) and (1,1) -> dist = 1.414 (adjacent)
                    // If coords are (0,0) and (0,1) -> dist = 1 (adjacent)
                    // So we want dist >= 2 (approx).
                    if (dist < CONFIG.ECOSYSTEM.BUILDINGS.MIN_SPACING) score -= 100; // Penalize heavily

                    // Clustering bonus: We want to be near, but not TOO near.
                    // If dist is between 2 and 5, that's good!
                    if (dist >= 2 && dist <= 5) score += 20;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestLocation = { x: tx, y: ty };
                }
            }
        }

        return bestLocation;
    }
    getDynamicRates(world) {
        const population = world.entityCounts.human || 0;
        const targetMin = CONFIG.ENTITIES.HUMAN.TARGET_POPULATION.MIN;
        const targetMax = CONFIG.ENTITIES.HUMAN.TARGET_POPULATION.MAX;

        let reproductionChance = 1.0; // Default: Always try if cooldown ready
        let warChance = world.settings.humanWarChance || CONFIG.ENTITIES.HUMAN.WAR_CHANCE;
        let splitChance = world.settings.humanSocietalSplitChance || CONFIG.ENTITIES.HUMAN.SOCIETAL_SPLIT.CHANCE;

        let overRatio = 0;

        if (population > targetMax) {
            // Overpopulated: Reduce reproduction, increase war/split
            overRatio = (population - targetMax) / targetMax; // e.g. 0.1 if 10% over
            reproductionChance = Math.max(0.1, 1.0 - overRatio * 2); // Reduce drastically
            warChance = Math.min(1.0, warChance + overRatio);
            splitChance = Math.min(1.0, splitChance + overRatio * 0.5); // Allow up to 100% split chance
        } else if (population < targetMin) {
            // Underpopulated: Max reproduction, reduce war/split
            reproductionChance = 1.0;
            warChance = warChance * 0.5;
            splitChance = splitChance * 0.5;
        }

        return { reproductionChance, warChance, splitChance, overRatio };
    }
}
