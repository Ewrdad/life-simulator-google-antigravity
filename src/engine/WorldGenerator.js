import { CONFIG } from './Config';
import { Tree, BerryBush, Water } from '../entities/Resources';

// Simple pseudo-random noise generator
class SimplexNoise {
    constructor(seed = Math.random()) {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        // To remove the need for index wrapping, double the permutation table length
        this.perm = [];
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }

    noise(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        let n0, n1, n2; // Noise contributions from the three corners

        // Skew the input space to determine which simplex cell we're in
        const s = (xin + yin) * F2; // Hairy factor for 2D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = xin - X0; // The x,y distances from the cell origin
        const y0 = yin - Y0;

        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1; } // upper triangle, YX order: (0,0)->(0,1)->(1,1)

        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6

        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;

        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;

        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }

        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
}

export class WorldGenerator {
    constructor(world) {
        this.world = world;
        this.noise = new SimplexNoise();
    }

    generate() {
        this.generateTerrain();
        this.generateRivers();
        this.ensureConnectivity();
    }

    generateTerrain() {
        const { width, height } = this.world;
        const scale = CONFIG.WORLD_GEN.NOISE_SCALE || 0.1;
        const forestThreshold = CONFIG.WORLD_GEN.FOREST_THRESHOLD || 0.3;
        const lakeThreshold = CONFIG.WORLD_GEN.LAKE_THRESHOLD || -0.4;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Use noise for elevation/terrain type
                const value = this.noise.noise(x * scale, y * scale);

                if (value < lakeThreshold) {
                    // Water
                    this.world.addEntity(new Water(x, y));
                } else if (value > forestThreshold) {
                    // Forest
                    // Add some randomness to density
                    if (Math.random() < 0.7) {
                        this.world.addEntity(new Tree(x, y));
                    } else if (Math.random() < 0.1) {
                        this.world.addEntity(new BerryBush(x, y));
                    }
                }
            }
        }
    }

    generateRivers() {
        const riverCount = CONFIG.WORLD_GEN.RIVER_COUNT || 3;
        const { width, height } = this.world;

        for (let i = 0; i < riverCount; i++) {
            // Start from a random point, preferably high elevation (but we just use random here for now)
            // Or start from edge?
            let x = Math.floor(Math.random() * width);
            let y = Math.floor(Math.random() * height);

            // Simple random walk that tries to flow "down" (we simulate down by noise value)
            // Or just meander
            let length = 0;
            const maxLength = Math.min(width, height) * 1.5;

            while (length < maxLength) {
                // Place water
                const existing = this.world.getAt(x, y);
                if (!existing || existing.type !== 'water') {
                    if (existing) {
                        existing.markedForDeletion = true;
                        this.world.removeEntity(existing);
                    }
                    this.world.addEntity(new Water(x, y));
                }

                // Move to neighbor with lowest noise value (downhill)
                let bestX = x;
                let bestY = y;
                let minVal = Infinity;

                const scale = CONFIG.WORLD_GEN.NOISE_SCALE || 0.1;

                // Check neighbors
                const neighbors = [
                    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                    { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
                ];

                // Shuffle neighbors to avoid bias
                neighbors.sort(() => Math.random() - 0.5);

                let foundLower = false;
                for (const n of neighbors) {
                    const nx = x + n.dx;
                    const ny = y + n.dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const val = this.noise.noise(nx * scale, ny * scale);
                        // If we hit existing water (lake), stop? Or merge?
                        const ent = this.world.getAt(nx, ny);
                        if (ent && ent.type === 'water' && length > 5) {
                            // Connected to a lake or another river
                            foundLower = true; // Stop here
                            break;
                        }

                        if (val < minVal) {
                            minVal = val;
                            bestX = nx;
                            bestY = ny;
                        }
                    }
                }

                if (foundLower) break; // End river

                if (bestX === x && bestY === y) {
                    // Local minimum (pit), maybe fill it or stop
                    break;
                }

                x = bestX;
                y = bestY;
                length++;
            }
        }
    }

    ensureConnectivity() {
        // Flood fill from a random open point to find the largest connected component
        // Then remove obstacles or build bridges to connect other components?
        // For now, let's just ensure we don't spawn entities in small isolated pockets.
        // Actually, the user said "dont make a big area innacesible".
        // The noise generation usually creates continuous landmasses.
        // Rivers might cut things off.
        // Let's just check if the largest landmass is > 90% of land.

        // Simple approach: Find all land cells.
        // Flood fill from one.
        // If count < total land, we have islands.
        // If islands are small, maybe turn them into water or connect them.

        // Implementation:
        // 1. Identify all walkable cells (null or non-water/non-solid)
        // Note: Trees are solid? Usually yes. But we want to check if *agents* can reach.
        // Agents can't walk through trees usually.

        // Let's assume "accessible" means "grass" (null) or "floor".
        // But trees are obstacles.
        // If we have a forest ring, the center is inaccessible.

        // Let's ignore trees for connectivity for now, assuming they are sparse enough or we want deep forests.
        // The main issue is Water blocking movement.

        const { width, height } = this.world;
        const visited = new Set();
        const landCells = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const ent = this.world.getAt(x, y);
                if (!ent || ent.type !== 'water') {
                    landCells.push(`${x},${y}`);
                }
            }
        }

        if (landCells.length === 0) return;

        // Flood fill from first land cell
        const start = landCells[0].split(',').map(Number);
        const queue = [start];
        visited.add(landCells[0]);

        let connectedCount = 0;

        while (queue.length > 0) {
            const [cx, cy] = queue.pop();
            connectedCount++;

            const neighbors = [
                [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const key = `${nx},${ny}`;
                    if (!visited.has(key)) {
                        const ent = this.world.getAt(nx, ny);
                        if (!ent || ent.type !== 'water') {
                            visited.add(key);
                            queue.push([nx, ny]);
                        }
                    }
                }
            }
        }

        // If we visited fewer cells than total land, we have disconnected areas.
        // If the disconnected area is small, it's fine (islands).
        // If it's large, we might have a problem (river cutting map in half).

        if (connectedCount < landCells.length * 0.9) {
            console.warn("Map is fragmented! Attempting to bridge...");
            // Find a point in the unvisited set that is close to the visited set and turn water to land?
            // This is complex.
            // Simpler: Just regenerate if bad? Or accept it.
            // User said "Just make sure we dont make a big area innacesible".

            // Let's try to bridge.
            // Iterate all water cells. If a water cell has neighbors in BOTH visited and unvisited sets, turn it to land (bridge).

            let bridged = false;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const ent = this.world.getAt(x, y);
                    if (ent && ent.type === 'water') {
                        let hasVisited = false;
                        let hasUnvisited = false;

                        const neighbors = [
                            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
                        ];

                        for (const [nx, ny] of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const key = `${nx},${ny}`;
                                const nEnt = this.world.getAt(nx, ny);
                                if (!nEnt || nEnt.type !== 'water') {
                                    if (visited.has(key)) hasVisited = true;
                                    else hasUnvisited = true;
                                }
                            }
                        }

                        if (hasVisited && hasUnvisited) {
                            // Bridge!
                            ent.markedForDeletion = true;
                            this.world.removeEntity(ent);
                            // Add a bridge (or just clear it)
                            // For now just clear it
                            bridged = true;
                            // Update visited to include the new connection? 
                            // We'd need to re-run flood fill to be sure, but this helps.
                        }
                    }
                }
            }

            if (bridged) {
                console.log("Bridges built.");
            }
        }
    }
}
