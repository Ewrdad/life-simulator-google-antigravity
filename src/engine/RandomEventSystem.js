import { CONFIG } from './Config';
import { Human } from '../entities/Human';
import { Cow } from '../entities/Cow';
import { Wolf } from '../entities/Wolf';
import { Tree, BerryBush, Water } from '../entities/Resources';
import { Lava } from '../entities/Lava';

export class RandomEventSystem {
    constructor(world) {
        this.world = world;
        this.categorizedEvents = {
            POPULATION: [],
            RESOURCE: [],
            DISASTER: [],
            SYSTEM: []
        };
        this.maxLogSize = 10;
        // Chance per tick for an event to happen. 
        // 1/1000 chance per tick roughly means one event every 16-20 seconds at 60 ticks/s
        // 1/200 chance per tick roughly means one event every 3-4 seconds at 60 ticks/s
        // 1/200 chance per tick roughly means one event every 3-4 seconds at 60 ticks/s
        this.eventChance = 0.005;
        this.recentEffects = new Map(); // entityId -> remainingTicks

        this.allEventTypes = [
            'population_boon',
            'population_plague',
            'meteorite',
            'resource_boom',
            'resource_blight',
            'the_great_bloom',
            'flash_flood',
            'drought',
            'earthquake',
            'volcano',
            'heat_wave',
            'monsoon'
        ];

        this.enabledEvents = new Set(this.allEventTypes);
    }

    toggleEvent(type) {
        if (this.enabledEvents.has(type)) {
            this.enabledEvents.delete(type);
        } else {
            this.enabledEvents.add(type);
        }
    }

    setEventChance(chance) {
        this.eventChance = Math.max(0, Math.min(1, chance));
    }

    reset() {
        this.eventChance = 0.005;
        this.enabledEvents = new Set(this.allEventTypes);
    }

    getRecentEvents() {
        const allEvents = [
            ...this.categorizedEvents.POPULATION,
            ...this.categorizedEvents.RESOURCE,
            ...this.categorizedEvents.DISASTER,
            ...this.categorizedEvents.SYSTEM
        ];
        return allEvents.sort((a, b) => {
            if (b.tick !== a.tick) return b.tick - a.tick;
            return b.id - a.id;
        });
    }

    tick() {
        if (Math.random() < this.eventChance) {
            this.triggerRandomEvent();
        }

        // Check for overpopulation every 100 ticks
        if (this.world.tickCount % 100 === 0) {
            this.checkPopulationCaps();
        }

        // Update effects
        for (const [id, effect] of this.recentEffects) {
            if (effect.life <= 0) {
                this.recentEffects.delete(id);
            } else {
                effect.life--;
                this.recentEffects.set(id, effect);
            }
        }
    }

    checkPopulationCaps() {
        const CAP = 1000;
        const counts = this.world.entityCounts;

        for (const [type, count] of Object.entries(counts)) {
            if (count > CAP) {
                this.handlePopulationCull(type);
            }
        }
    }

    handlePopulationCull(type) {
        const entities = this.world.entities.filter(e => e.type === type);
        if (entities.length === 0) return;

        // Shuffle array to kill random 50%
        for (let i = entities.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entities[i], entities[j]] = [entities[j], entities[i]];
        }

        const toKill = Math.floor(entities.length / 2);
        let killedCount = 0;

        for (let i = 0; i < toKill; i++) {
            entities[i].die(this.world);
            killedCount++;
        }

        let message = `Overpopulation Event: ${killedCount} ${type}s removed.`;

        // Humorous messages
        switch (type) {
            case 'cow':
                message = "The cows got too big for their boots. 50% of them have been turned into burgers.";
                break;
            case 'wolf':
                message = "The wolf pack argued over who was the alpha. Half of them left in a huff.";
                break;
            case 'human':
                message = "Traffic was getting terrible. Thanos snapped his fingers.";
                break;
            case 'berry':
                message = "The berry bushes fought for sunlight. It was a shady business.";
                break;
            case 'tree':
                message = "The trees couldn't see the forest for the... well, other trees.";
                break;
            case 'house':
                message = "The housing market crashed. Literally.";
                break;
            default:
                message = `There were too many ${type}s. Nature found a way to balance the scales.`;
                break;
        }

        this.logEvent(message, 'POPULATION');
        this.triggerEventThoughts('population_plague', entities.slice(toKill)); // Survivors are scared
    }

    addEffect(entity, duration = 15) {
        if (entity && entity.id) {
            this.recentEffects.set(entity.id, { life: duration, maxLife: duration });
        }
    }

    triggerRandomEvent() {
        if (this.enabledEvents.size === 0) return;

        const possibleEvents = this.allEventTypes.filter(type => this.enabledEvents.has(type));
        if (possibleEvents.length === 0) return;

        const type = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
        this.triggerEvent(type);
    }

    triggerEvent(type) {
        let message = '';

        switch (type) {
            case 'population_boon':
                message = this.handlePopulationBoon();
                break;
            case 'population_plague':
                message = this.handlePopulationPlague();
                break;
            case 'meteorite':
                message = this.handleMeteorite();
                break;
            case 'resource_boom':
                message = this.handleResourceBoom();
                break;
            case 'resource_blight':
                message = this.handleResourceBlight();
                break;
            case 'the_great_bloom':
                message = this.handleTheGreatBloom();
                break;
            case 'flash_flood':
                message = this.handleFlashFlood();
                break;
            case 'drought':
                message = this.handleDrought();
                break;
            case 'earthquake':
                message = this.handleEarthquake();
                break;
            case 'volcano':
                message = this.handleVolcano();
                break;
            case 'heat_wave':
                message = this.handleHeatWave();
                break;
            case 'monsoon':
                message = this.handleMonsoon();
                break;
            default:
                return;
        }

        if (message) {
            // Determine category based on type
            let category = 'SYSTEM';
            if (type.includes('population')) category = 'POPULATION';
            else if (type.includes('resource') || type === 'the_great_bloom') category = 'RESOURCE';
            else if (['meteorite', 'flash_flood', 'drought', 'earthquake', 'volcano', 'heat_wave', 'monsoon'].includes(type)) category = 'DISASTER';

            this.logEvent(message, category);
        }
    }

    logEvent(message, category = 'SYSTEM') {
        const event = {
            id: Date.now() + Math.random(),
            message,
            category,
            timestamp: new Date().toLocaleTimeString(),
            tick: this.world.tickCount
        };

        if (!this.categorizedEvents[category]) {
            this.categorizedEvents[category] = [];
        }

        this.categorizedEvents[category].unshift(event);
        if (this.categorizedEvents[category].length > this.maxLogSize) {
            this.categorizedEvents[category].pop();
        }
    }

    handlePopulationBoon() {
        const species = ['human', 'cow', 'wolf'];
        const selected = species[Math.floor(Math.random() * species.length)];
        let count = 0;

        // Spawn 5-10 entities
        const amount = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < amount; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = Math.floor(Math.random() * this.world.height);
            if (!this.world.getAt(x, y)) {
                if (selected === 'human') this.world.addEntity(new Human(x, y));
                else if (selected === 'cow') this.world.addEntity(new Cow(x, y));
                else if (selected === 'wolf') this.world.addEntity(new Wolf(x, y));
                count++;
            }
        }
        this.triggerEventThoughts('population_boon');
        return `Population Boon: ${count} new ${selected}s appeared!`;
    }

    handlePopulationPlague() {
        const species = ['human', 'cow', 'wolf'];
        const selected = species[Math.floor(Math.random() * species.length)];

        const targets = this.world.entities.filter(e => e.type === selected);
        if (targets.length === 0) return null;

        // Kill 30% of the population
        let killed = 0;
        targets.forEach(e => {
            if (Math.random() < 0.3) {
                this.addEffect(e);
                e.die(this.world);
                killed++;
            }
        });

        this.triggerEventThoughts('population_plague', targets.filter(e => e.type === 'human'));
        return `Plague: A mysterious illness killed ${killed} ${selected}s.`;
    }

    handleMeteorite() {
        const x = Math.floor(Math.random() * this.world.width);
        const y = Math.floor(Math.random() * this.world.height);
        const radius = 5;
        let destroyed = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const tx = x + dx;
                    const ty = y + dy;
                    const entity = this.world.getAt(tx, ty);
                    if (entity) {
                        entity.die(this.world);
                        destroyed++;
                    }

                    // Spawn crater water in the center (radius 3)
                    if (dx * dx + dy * dy <= 9) {
                        const water = new Water(tx, ty);
                        this.world.addEntity(water);
                        this.addEffect(water);
                    }
                }
            }
        }
        this.triggerEventThoughts('meteorite');
        return `Meteorite Strike: Impact at (${x}, ${y}) destroyed ${destroyed} entities!`;
    }

    handleResourceBoom() {
        const resources = ['tree', 'berry'];
        const selected = resources[Math.floor(Math.random() * resources.length)];
        let count = 0;

        // Spawn 10-20 resources
        const amount = 10 + Math.floor(Math.random() * 10);

        for (let i = 0; i < amount; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = Math.floor(Math.random() * this.world.height);
            if (!this.world.getAt(x, y)) {
                let entity;
                if (selected === 'tree') entity = new Tree(x, y);
                else if (selected === 'berry') entity = new BerryBush(x, y);

                if (entity) {
                    this.world.addEntity(entity);
                    this.addEffect(entity);
                    count++;
                }
            }
        }
        this.triggerEventThoughts('resource_boom');
        return `Resource Boom: ${count} new ${selected === 'tree' ? 'trees' : 'berry bushes'} sprouted!`;
    }

    handleResourceBlight() {
        const resources = ['tree', 'berry'];
        const selected = resources[Math.floor(Math.random() * resources.length)];

        const targets = this.world.entities.filter(e =>
            (selected === 'tree' && e.type === 'tree') ||
            (selected === 'berry' && e.type === 'berrybush') // Note: type is 'berrybush' usually
        );

        if (targets.length === 0) return null;

        let withered = 0;
        targets.forEach(e => {
            if (Math.random() < 0.4) {
                e.die(this.world);
                withered++;
            } else {
                // Highlight survivors of the blight?
                this.addEffect(e);
            }
        });

        this.triggerEventThoughts('resource_blight');
        return `Blight: ${withered} ${selected === 'tree' ? 'trees' : 'berry bushes'} withered away.`;
    }

    handleTheGreatBloom() {
        const x = Math.floor(Math.random() * this.world.width);
        const y = Math.floor(Math.random() * this.world.height);
        const radius = 6;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && tx < this.world.width && ty >= 0 && ty < this.world.height) {
                        const entity = this.world.getAt(tx, ty);
                        if (!entity) {
                            const bush = new BerryBush(tx, ty);
                            this.world.addEntity(bush);
                            this.addEffect(bush);
                            count++;
                        }
                    }
                }
            }
        }
        this.triggerEventThoughts('the_great_bloom');
        return `The Great Bloom: A magical garden appeared at (${x}, ${y}) with ${count} bushes!`;
    }

    handleFlashFlood() {
        const x = Math.floor(Math.random() * this.world.width);
        const y = Math.floor(Math.random() * this.world.height);
        const radius = 8;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && tx < this.world.width && ty >= 0 && ty < this.world.height) {
                        const entity = this.world.getAt(tx, ty);
                        // Don't overwrite existing water
                        if (entity && entity.type === 'water') continue;

                        // Kill whatever is there (except water)
                        if (entity) entity.die(this.world);

                        const water = new Water(tx, ty);
                        this.world.addEntity(water);
                        this.addEffect(water);
                        count++;
                    }
                }
            }
        }
        this.triggerEventThoughts('flash_flood');
        return `Flash Flood: A sudden flood created a lake at (${x}, ${y})! (${count} tiles flooded)`;
    }

    handleDrought() {
        const x = Math.floor(Math.random() * this.world.width);
        const y = Math.floor(Math.random() * this.world.height);
        const radius = 10;
        let count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && tx < this.world.width && ty >= 0 && ty < this.world.height) {
                        const entity = this.world.getAt(tx, ty);
                        if (entity && entity.type === 'water') {
                            entity.die(this.world);
                            count++;
                        }
                    }
                }
            }
        }
        this.triggerEventThoughts('drought');
        return `Drought: A heatwave dried up ${count} water tiles at (${x}, ${y})!`;
    }

    handleEarthquake() {
        const types = ['block_swap', 'fault_line', 'scramble'];
        const type = types[Math.floor(Math.random() * types.length)];

        switch (type) {
            case 'block_swap':
                return this.handleEarthquakeBlockSwap();
            case 'fault_line':
                return this.handleEarthquakeFaultLine();
            case 'scramble':
                return this.handleEarthquakeScramble();
            default:
                return 'Earthquake: The ground shook, but nothing happened.';
        }
    }

    handleEarthquakeBlockSwap() {
        // Swap two 20x20 blocks (increased from 10x10)
        const size = 20;
        const x1 = Math.floor(Math.random() * (this.world.width - size));
        const y1 = Math.floor(Math.random() * (this.world.height - size));

        let x2 = Math.floor(Math.random() * (this.world.width - size));
        let y2 = Math.floor(Math.random() * (this.world.height - size));

        // Ensure they don't overlap too much (simple check)
        let attempts = 0;
        while (Math.abs(x1 - x2) < size && Math.abs(y1 - y2) < size && attempts < 100) {
            x2 = Math.floor(Math.random() * (this.world.width - size));
            y2 = Math.floor(Math.random() * (this.world.height - size));
            attempts++;
        }

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const entity1 = this.world.getAt(x1 + dx, y1 + dy);
                const entity2 = this.world.getAt(x2 + dx, y2 + dy);

                // Remove both from grid first
                if (entity1) this.world.grid[y1 + dy][x1 + dx] = null;
                if (entity2) this.world.grid[y2 + dy][x2 + dx] = null;

                // Place them in new spots
                if (entity1) {
                    entity1.x = x2 + dx;
                    entity1.y = y2 + dy;
                    this.world.grid[entity1.y][entity1.x] = entity1;
                    this.addEffect(entity1);
                }
                if (entity2) {
                    entity2.x = x1 + dx;
                    entity2.y = y1 + dy;
                    this.world.grid[entity2.y][entity2.x] = entity2;
                    this.addEffect(entity2);
                }
            }
        }

        this.triggerEventThoughts('earthquake');
        return `Earthquake (Block Swap): Massive land masses swapped between (${x1},${y1}) and (${x2},${y2})!`;
    }

    handleEarthquakeFaultLine() {
        // Shift a row or column
        const isHorizontal = Math.random() < 0.5;
        const shiftAmount = Math.floor(Math.random() * 15) + 10; // 10 to 25 tiles (increased from 3-7)

        if (isHorizontal) {
            const y = Math.floor(Math.random() * this.world.height);
            // Shift row y by shiftAmount
            const row = this.world.grid[y];
            const newRow = new Array(this.world.width).fill(null);

            for (let x = 0; x < this.world.width; x++) {
                const entity = row[x];
                if (entity) {
                    let newX = (x + shiftAmount) % this.world.width;
                    entity.x = newX;
                    newRow[newX] = entity;
                    this.addEffect(entity);
                }
            }
            this.world.grid[y] = newRow;
            this.triggerEventThoughts('earthquake');
            return `Earthquake (Fault Line): A massive horizontal fault line shifted the earth at Y=${y}!`;
        } else {
            const x = Math.floor(Math.random() * this.world.width);
            // Shift col x by shiftAmount
            const colEntities = [];
            for (let y = 0; y < this.world.height; y++) {
                colEntities.push(this.world.grid[y][x]);
                this.world.grid[y][x] = null; // Clear old
            }

            for (let y = 0; y < this.world.height; y++) {
                const entity = colEntities[y];
                if (entity) {
                    let newY = (y + shiftAmount) % this.world.height;
                    entity.y = newY;
                    this.world.grid[newY][x] = entity;
                    this.addEffect(entity);
                }
            }
            this.triggerEventThoughts('earthquake');
            return `Earthquake (Fault Line): A massive vertical fault line shifted the earth at X=${x}!`;
        }
    }

    triggerEventThoughts(type, affectedEntities = null) {
        if (!this.world.thoughtSystem) return;

        const thoughts = {
            'earthquake': ["Did you feel that?", "The ground moved!", "Whoa!", "Steady...", "Earthquake!"],
            'meteorite': ["Sky fire!", "Boom!", "What was that?", "The sky is falling!", "Impact!"],
            'population_plague': ["I don't feel so good...", "Cough cough.", "Stay away!", "Is it contagious?", "Sick..."],
            'population_boon': ["New friends!", "Welcome!", "Crowded...", "Hello!", "More of us!"],
            'resource_boom': ["Look at all this food!", "Nature provides.", "Bountiful harvest!", "Yum!", "Feast!"],
            'resource_blight': ["The plants are dying...", "Withered...", "Bad omen.", "Hungry times ahead.", "Rotting..."],
            'the_great_bloom': ["So many flowers!", "Beautiful!", "Magic?", "Sweet scent.", "Colorful!"],
            'flash_flood': ["Wet feet!", "Water rising!", "Flood!", "Swim?", "Too much water!"],
            'drought': ["So thirsty...", "Where is the water?", "Dry heat.", "Need rain.", "Parched..."],
            'volcano': ["IT BURNS!", "Lava!", "Run!", "Hot hot hot!", "The floor is lava!"],
            'heat_wave': ["So hot...", "Melting...", "Need shade!", "Water...", "Can't breathe..."],
            'monsoon': ["So wet!", "Raining cats and dogs!", "Flooding!", "Cold...", "Shivering..."]
        };

        const options = thoughts[type];
        if (!options) return;

        // If specific entities are affected, use them. Otherwise, pick random humans.
        let candidates = affectedEntities;
        if (!candidates || candidates.length === 0) {
            candidates = this.world.entities.filter(e => e.type === 'human');
        }

        // Pick a few candidates to have thoughts (e.g., up to 5)
        const count = Math.min(candidates.length, 5);
        for (let i = 0; i < count; i++) {
            // Random candidate
            const entity = candidates[Math.floor(Math.random() * candidates.length)];
            const text = options[Math.floor(Math.random() * options.length)];

            // Add thought directly
            this.world.thoughtSystem.addThought(entity.x, entity.y, text, entity.color);
        }
    }

    handleEarthquakeScramble() {
        // Pick a center and scramble entities within radius
        const centerX = Math.floor(Math.random() * this.world.width);
        const centerY = Math.floor(Math.random() * this.world.height);
        const radius = 15; // Increased from 8

        const entitiesToScramble = [];
        const positions = [];

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const x = centerX + dx;
                    const y = centerY + dy;

                    if (x >= 0 && x < this.world.width && y >= 0 && y < this.world.height) {
                        positions.push({ x, y });
                        const entity = this.world.getAt(x, y);
                        if (entity) {
                            entitiesToScramble.push(entity);
                            this.world.grid[y][x] = null; // Remove from grid
                        }
                    }
                }
            }
        }

        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Place entities back in random positions within the circle
        // Note: We might have more positions than entities (empty spots), which is fine.
        // We just need to place all entities we picked up.

        entitiesToScramble.forEach((entity, index) => {
            if (index < positions.length) {
                const pos = positions[index];
                entity.x = pos.x;
                entity.y = pos.y;
                this.world.grid[pos.y][pos.x] = entity;
                this.addEffect(entity);
            }
        });

        this.triggerEventThoughts('earthquake', entitiesToScramble.filter(e => e.type === 'human'));
        return `Earthquake (Scramble): The ground churned violently at (${centerX}, ${centerY})!`;
    }

    handleVolcano() {
        const type = Math.random() < 0.5 ? 'lava_rain' : 'lava_flow';
        if (type === 'lava_rain') {
            return this.handleLavaRain();
        } else {
            return this.handleLavaFlow();
        }
    }

    handleLavaRain() {
        const amount = 20 + Math.floor(Math.random() * 30); // 20-50 drops
        let count = 0;

        for (let i = 0; i < amount; i++) {
            const x = Math.floor(Math.random() * this.world.width);
            const y = Math.floor(Math.random() * this.world.height);

            // Destroy whatever is there
            const existing = this.world.getAt(x, y);
            if (existing) {
                existing.die(this.world);
            }

            const lava = new Lava(x, y);
            this.world.addEntity(lava);
            this.addEffect(lava);
            count++;
        }

        this.triggerEventThoughts('volcano');
        return `Volcano: Lava Rain! ${count} molten blobs fell from the sky!`;
    }

    handleLavaFlow() {
        // Pick a start point on an edge
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let startX, startY;
        let endX, endY;

        switch (side) {
            case 0: // Top
                startX = Math.floor(Math.random() * this.world.width);
                startY = 0;
                endX = Math.floor(Math.random() * this.world.width);
                endY = this.world.height - 1;
                break;
            case 1: // Right
                startX = this.world.width - 1;
                startY = Math.floor(Math.random() * this.world.height);
                endX = 0;
                endY = Math.floor(Math.random() * this.world.height);
                break;
            case 2: // Bottom
                startX = Math.floor(Math.random() * this.world.width);
                startY = this.world.height - 1;
                endX = Math.floor(Math.random() * this.world.width);
                endY = 0;
                break;
            case 3: // Left
                startX = 0;
                startY = Math.floor(Math.random() * this.world.height);
                endX = this.world.width - 1;
                endY = Math.floor(Math.random() * this.world.height);
                break;
        }

        // Draw a "natural" line
        let currentX = startX;
        let currentY = startY;
        let count = 0;

        // Simple line drawing with some jitter
        const steps = Math.max(this.world.width, this.world.height) * 1.5;

        for (let i = 0; i < steps; i++) {
            // Move towards end
            const dx = Math.sign(endX - currentX);
            const dy = Math.sign(endY - currentY);

            // Add jitter
            const moveX = dx + (Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0);
            const moveY = dy + (Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0);

            currentX += moveX;
            currentY += moveY;

            // Clamp
            currentX = Math.max(0, Math.min(this.world.width - 1, currentX));
            currentY = Math.max(0, Math.min(this.world.height - 1, currentY));

            // Create lava blob (maybe a small cluster)
            const clusterSize = Math.random() < 0.3 ? 2 : 1;

            for (let cx = -clusterSize + 1; cx < clusterSize; cx++) {
                for (let cy = -clusterSize + 1; cy < clusterSize; cy++) {
                    const lx = currentX + cx;
                    const ly = currentY + cy;

                    if (lx >= 0 && lx < this.world.width && ly >= 0 && ly < this.world.height) {
                        const existing = this.world.getAt(lx, ly);
                        // Don't replace existing lava (to keep them fresh if we overlap)
                        if (existing && existing.type === 'lava') continue;

                        if (existing) existing.die(this.world);

                        const lava = new Lava(lx, ly);
                        this.world.addEntity(lava);
                        this.addEffect(lava);
                        count++;
                    }
                }
            }

            if (Math.abs(currentX - endX) < 2 && Math.abs(currentY - endY) < 2) break;
        }

        this.triggerEventThoughts('volcano');
        return `Volcano: A massive Lava Flow cut through the land! (${count} tiles burned)`;
    }

    handleHeatWave() {
        const entities = this.world.entities.filter(e => e.type === 'human' || e.type === 'cow' || e.type === 'wolf');
        let casualties = 0;

        entities.forEach(entity => {
            // Get traits (default to 1.0 if not present)
            // Note: Animals might not have traits yet, so we default to 1.0
            const heatTolerance = (entity.traits && entity.traits.heatTolerance) || 1.0;

            // Base survival chance is 0.7. Tolerance modifies this.
            // Tolerance 0.5 -> 0.35 chance (bad)
            // Tolerance 2.0 -> 1.4 chance (safe)
            const survivalChance = 0.6 * heatTolerance;

            if (Math.random() > survivalChance) {
                entity.die(this.world);
                casualties++;
                this.addEffect(entity);
            }
        });

        this.triggerEventThoughts('heat_wave');
        return `Heat Wave: A scorching heat wave struck! ${casualties} entities perished due to low heat tolerance.`;
    }

    handleMonsoon() {
        const entities = this.world.entities.filter(e => e.type === 'human' || e.type === 'cow' || e.type === 'wolf');
        let casualties = 0;

        // Spawn some water too
        const x = Math.floor(Math.random() * this.world.width);
        const y = Math.floor(Math.random() * this.world.height);
        const radius = 10;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius && Math.random() < 0.3) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= 0 && tx < this.world.width && ty >= 0 && ty < this.world.height) {
                        const existing = this.world.getAt(tx, ty);
                        if (!existing || existing.type !== 'water') {
                            if (existing) existing.die(this.world);
                            this.world.addEntity(new Water(tx, ty));
                        }
                    }
                }
            }
        }

        entities.forEach(entity => {
            // Cold/Water tolerance
            const coldTolerance = (entity.traits && entity.traits.coldTolerance) || 1.0;

            // Base survival chance 0.6
            const survivalChance = 0.6 * coldTolerance;

            if (Math.random() > survivalChance) {
                entity.die(this.world);
                casualties++;
                this.addEffect(entity);
            }
        });

        this.triggerEventThoughts('monsoon');
        return `Monsoon: Heavy rains flooded the land! ${casualties} entities perished due to low cold tolerance.`;
    }
}
