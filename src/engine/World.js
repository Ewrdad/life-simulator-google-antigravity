import { CONFIG } from './Config';
import { NatureReserve } from '../entities/NatureReserve';
import { Human } from '../entities/Human';
import { ThoughtSystem } from './ThoughtSystem';

export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.grid = Array(height).fill().map(() => Array(width).fill(null));
        this.tickCount = 0;
        this.settings = {
            humanHungerRate: CONFIG.ENTITIES.HUMAN.HUNGER_RATE,
            wolfHungerRate: CONFIG.ENTITIES.WOLF.HUNGER_RATE,
            cowHungerRate: CONFIG.ENTITIES.COW.HUNGER_RATE,
            humanReproductionCost: CONFIG.ENTITIES.HUMAN.REPRODUCTION_COST,
            wolfReproductionCost: CONFIG.ENTITIES.WOLF.REPRODUCTION_COST,
            cowReproductionCost: CONFIG.ENTITIES.COW.REPRODUCTION_COST,
            humanDefenseChance: CONFIG.ENTITIES.HUMAN.DEFENSE_CHANCE,
            humanWarChance: CONFIG.ENTITIES.HUMAN.WAR_CHANCE,
            humanSocietalSplitChance: CONFIG.ENTITIES.HUMAN.SOCIETAL_SPLIT.CHANCE,
            wolfHuntThreshold: CONFIG.ENTITIES.WOLF.HUNT_THRESHOLD,
            cowMaxAge: CONFIG.ENTITIES.COW.MAX_AGE,
            berryRegrowth: CONFIG.ENTITIES.RESOURCES.BERRY_REGROWTH,
            tickRate: CONFIG.WORLD.TICK_RATE,
        };
        this.entityCounts = {
            human: 0,
            wolf: 0,
            cow: 0,
            tree: 0,
            berry: 0,
            house: 0,
            farm: 0,
            naturereserve: 0,
            water: 0,
            totem: 0
        };
        this.thoughtSystem = new ThoughtSystem();
        this.factionTraits = new Map(); // factionId -> traits object
        this.entitiesByType = new Map(); // type -> Set<Entity>
        this.terrain = Array(height).fill().map(() => Array(width).fill(0)); // 0.0 to 1.0 (wear)
        this.onLogEvent = null; // Callback for logging events
    }

    clear() {
        this.entities = [];
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.entitiesByType = new Map();
        this.entityCounts = {
            human: 0,
            wolf: 0,
            cow: 0,
            tree: 0,
            berry: 0,
            house: 0,
            farm: 0,
            naturereserve: 0,
            water: 0
        };
        this.terrain = Array(this.height).fill().map(() => Array(this.width).fill(0));
        this.tickCount = 0;
        this.factionTraits.clear();
    }

    updateTerrain(x, y, amount) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.terrain[y][x] = Math.min(1.0, this.terrain[y][x] + amount);
        }
    }

    getTerrain(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.terrain[y][x];
        }
        return 0;
    }

    getFactionTraits(factionId) {
        if (!this.factionTraits.has(factionId)) {
            // If not found (e.g. initial spawn), register with default base traits
            this.factionTraits.set(factionId, { ...CONFIG.GENETICS.BASE_TRAITS });
        }
        return this.factionTraits.get(factionId);
    }

    registerNewFaction(newFactionId, parentFactionId) {
        const parentTraits = this.getFactionTraits(parentFactionId);
        const newTraits = { ...parentTraits };
        const limits = CONFIG.GENETICS.LIMITS;
        const rate = CONFIG.GENETICS.MUTATION_RATE;

        // Mutate each trait
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

        this.factionTraits.set(newFactionId, newTraits);
        console.log(`New Faction ${newFactionId} registered with traits:`, newTraits);
    }

    addEntity(entity, isRestore = false) {
        if (this.entities.length >= CONFIG.MAX_ENTITIES) {
            return;
        }
        this.entities.push(entity);
        if (entity.x >= 0 && entity.x < this.width && entity.y >= 0 && entity.y < this.height) {
            this.grid[entity.y][entity.x] = entity;
        }

        // Maintain Type Cache
        if (!this.entitiesByType.has(entity.type)) {
            this.entitiesByType.set(entity.type, new Set());
        }
        this.entitiesByType.get(entity.type).add(entity);

        if (!isRestore && this.entityCounts[entity.type] !== undefined) {
            this.entityCounts[entity.type]++;
        }
    }

    removeEntity(entity) {
        if (this.grid[entity.y] && this.grid[entity.y][entity.x] === entity) {
            this.grid[entity.y][entity.x] = null;
        }

        // Remove from Type Cache
        if (this.entitiesByType.has(entity.type)) {
            this.entitiesByType.get(entity.type).delete(entity);
        }

        // Do NOT decrement counts here. Counts track ALIVE entities, whether on grid or in house.
    }

    tick() {
        this.tickCount++;
        // Grid is maintained by addEntity, removeEntity, and Entity.move

        // Loop backwards to allow removal
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.markedForDeletion) continue;
            entity.tick(this);
        }

        // Cleanup dead entities
        this.entities = this.entities.filter(e => {
            if (e.markedForDeletion) {
                // Only decrement count if it's actually dying, not just being stored
                if (!e.isStored && this.entityCounts[e.type] !== undefined) {
                    this.entityCounts[e.type]--;
                }
                return false;
            }
            return true;
        });

        // Divine Intervention (Reseeding)
        // If a species goes extinct (or near extinct), spawn a few to restart the cycle
        // Check every 50 ticks for better stability
        if (this.tickCount % CONFIG.WORLD.RESEED_INTERVAL === 0) {
            const humans = this.entities.filter(e => e.type === 'human').length;
            const cows = this.entities.filter(e => e.type === 'cow').length;
            const wolves = this.entities.filter(e => e.type === 'wolf').length;
            const reserves = this.entities.filter(e => e.type === 'naturereserve');
            const wolfReserves = reserves.filter(e => e.spawnType === 'wolf').length;
            const cowReserves = reserves.filter(e => e.spawnType === 'cow').length;

            // Divine Intervention: Prevent Extinction
            if (wolves < 2 && wolfReserves < 3) {
                console.log("Divine Intervention: Spawning Wolf Reserve");
                this.spawnRandomReserve('WOLF');
            }
            if (cows < 2 && cowReserves < 3) {
                console.log("Divine Intervention: Spawning Cow Reserve");
                this.spawnRandomReserve('COW');
            }

            if (this.onExtinction) {
                if (humans < CONFIG.ENTITIES.HUMAN.SPAWN_THRESHOLD) this.onExtinction('human');
            }
        }

        // Periodic Stats Recalculation (Failsafe for drift)
        if (this.tickCount % 100 === 0) {
            this.recalculateStats();
            this.checkFactionOverpopulation();
        }

        this.updateThoughts();
        this.decayTerrain();
    }

    decayTerrain() {
        // Decay terrain wear
        // We don't need to do this EVERY tick if it's expensive (400x400 = 160k cells)
        // But JS is fast. Let's try every tick, or maybe every 10 ticks with higher decay.
        // Let's do every 10 ticks for performance.
        if (this.tickCount % 10 === 0) {
            const decayAmount = 0.02; // 0.02 every 10 ticks = 0.002 per tick effectively
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.terrain[y][x] > 0) {
                        this.terrain[y][x] = Math.max(0, this.terrain[y][x] - decayAmount);
                    }
                }
            }
        }

    }

    updateThoughts() {
        this.thoughtSystem.tick();

        // Try to generate thoughts for random humans
        // We don't want to iterate ALL humans every tick for thoughts, just pick a few candidates
        // Or iterate all but with low probability?
        // Let's pick a random human if we can generate a thought

        if (this.thoughtSystem.thoughtCooldown <= 0) {
            const humans = Array.from(this.entitiesByType.get('human') || []); // Use cached list
            if (humans.length > 0) {
                // Try 3 random humans
                for (let i = 0; i < 3; i++) {
                    const human = humans[Math.floor(Math.random() * humans.length)];
                    this.thoughtSystem.tryGenerateThought(human, this);
                }
            }
        }
    }

    recalculateStats() {
        // Reset counts
        const newCounts = {
            human: 0,
            wolf: 0,
            cow: 0,
            tree: 0,
            berry: 0,
            house: 0,
            farm: 0,
            naturereserve: 0,
            water: 0,
            totem: 0
        };

        // Count active entities
        this.entities.forEach(entity => {
            if (!entity.markedForDeletion && newCounts[entity.type] !== undefined) {
                newCounts[entity.type]++;
            }

            // Count stored entities (e.g., inside houses)
            if (entity.type === 'house' && entity.occupants) {
                entity.occupants.forEach(occupant => {
                    if (newCounts[occupant.type] !== undefined) {
                        newCounts[occupant.type]++;
                    }
                });
            }
        });

        this.entityCounts = newCounts;
    }

    spawnRandomReserve(type) {
        // Find random empty spot
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (!this.getAt(x, y)) {
                this.addEntity(new NatureReserve(x, y, type));
                return;
            }
        }
    }

    getAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.grid[y][x];
    }

    // Helper to find nearest entity of type using Grid (Spatial Partitioning)
    findNearest(x, y, type, maxDist = 999, excludeEntity = null, predicate = null) {
        // Optimization: Use list search for large radii or sparse types
        // Grid search O(R^2) vs List search O(N)
        // Threshold: If Radius > 15, List search is likely faster (15^2 = 225 checks)
        // Unless N is huge (e.g. trees).
        // If type is 'tree' or 'berrybush', N is large (~1000), so grid might still be better if R is small.
        // If type is 'water', N is small (rivers/lakes), list is WAY better.

        const useListSearch = maxDist > 15 || type === 'water' || type === 'house' || type === 'farm' || type === 'naturereserve';

        if (useListSearch && this.entitiesByType.has(type)) {
            // console.log(`List Search for ${type}, count: ${this.entitiesByType.get(type).size}`);
            let nearest = null;
            let minDistSq = maxDist * maxDist;

            const entities = this.entitiesByType.get(type);
            for (const entity of entities) {
                if (entity === excludeEntity) continue;

                // Quick distance check (Manhattan) to prune
                if (Math.abs(entity.x - x) > maxDist || Math.abs(entity.y - y) > maxDist) continue;

                if (predicate && !predicate(entity)) continue;

                const distSq = (entity.x - x) ** 2 + (entity.y - y) ** 2;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    nearest = entity;
                }
            }
            return nearest;
        }

        // Fallback to Grid Search (O(R^2)) for small radii or uncached types
        const searchRadius = Math.min(maxDist, 50);

        let nearest = null;
        let minDistSq = maxDist * maxDist;

        // Check center first (r=0)
        const centerEntity = this.getAt(x, y);
        if (centerEntity && centerEntity.type === type && centerEntity !== excludeEntity) {
            if (!predicate || predicate(centerEntity)) {
                return centerEntity;
            }
        }

        for (let r = 1; r <= searchRadius; r++) {
            // Optimization: If we found something in a previous ring, and the current ring is further than that match, stop.
            if (nearest && r * r > minDistSq) break;

            // Perimeter traversal:
            // Top row: (-r, -r) to (r, -r)
            // Bottom row: (-r, r) to (r, r)
            // Left col: (-r, -r+1) to (-r, r-1)
            // Right col: (r, -r+1) to (r, r-1)

            const checkCell = (dx, dy) => {
                const checkX = x + dx;
                const checkY = y + dy;

                if (checkX >= 0 && checkX < this.width && checkY >= 0 && checkY < this.height) {
                    const entity = this.grid[checkY][checkX];
                    if (entity && entity.type === type && entity !== excludeEntity) {
                        if (predicate && !predicate(entity)) return;

                        const distSq = dx * dx + dy * dy;
                        if (distSq < minDistSq) {
                            minDistSq = distSq;
                            nearest = entity;
                        }
                    }
                }
            };

            // Top and Bottom rows
            for (let dx = -r; dx <= r; dx++) {
                checkCell(dx, -r); // Top
                checkCell(dx, r);  // Bottom
            }

            // Left and Right columns (excluding corners already checked)
            for (let dy = -r + 1; dy <= r - 1; dy++) {
                checkCell(-r, dy); // Left
                checkCell(r, dy);  // Right
            }
        }
        return nearest;
    }
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    checkFactionOverpopulation() {
        const humans = this.entitiesByType.get('human');
        if (!humans) return;

        const factionCounts = {};
        for (const human of humans) {
            factionCounts[human.faction] = (factionCounts[human.faction] || 0) + 1;
        }

        for (const [faction, count] of Object.entries(factionCounts)) {
            if (count > 300) {
                this.performSocietalSplit(faction);
            }
        }
    }

    performSocietalSplit(oldFaction) {
        const humans = Array.from(this.entitiesByType.get('human')).filter(h => h.faction === oldFaction);

        // Generate two new factions
        const factionA = Human.randomFaction();
        const factionB = Human.randomFaction();

        // Ensure they are different from each other and the old one (simple check)
        while (factionB.name === factionA.name) {
            factionB.name = Human.randomFaction().name;
        }

        // Register new factions
        this.registerNewFaction(factionA.name, oldFaction);
        this.registerNewFaction(factionB.name, oldFaction);

        // Shuffle humans
        for (let i = humans.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [humans[i], humans[j]] = [humans[j], humans[i]];
        }

        // Split
        const mid = Math.floor(humans.length / 2);
        const groupA = humans.slice(0, mid);
        const groupB = humans.slice(mid);

        groupA.forEach(h => {
            h.faction = factionA.name;
            h.color = factionA.color;
        });

        groupB.forEach(h => {
            h.faction = factionB.name;
            h.color = factionB.color;
        });

        const message = `The Great Schism: Overpopulated faction ${oldFaction} split into ${factionA.name} and ${factionB.name}!`;
        this.logEvent(message, 'POPULATION');

        // Add thoughts
        this.thoughtSystem.addThought(groupA[0].x, groupA[0].y, "We are the true path!", factionA.color);
        this.thoughtSystem.addThought(groupB[0].x, groupB[0].y, "New beginning!", factionB.color);
    }

    logEvent(message, category) {
        if (this.onLogEvent) {
            this.onLogEvent(message, category);
        }
    }
}
