import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Overlay from './components/Overlay';
import { World } from './engine/World';
import { GameLoop } from './engine/GameLoop';
import { Human } from './entities/Human';
import { Cow } from './entities/Cow';
import { Wolf } from './entities/Wolf';
import { Tree, BerryBush, House, Water } from './entities/Resources';
import { CONFIG } from './engine/Config';
import { WorldGenerator } from './engine/WorldGenerator';
import { RandomEventSystem } from './engine/RandomEventSystem';

const CELL_SIZE = CONFIG.WORLD.WIDTH_SCALE;

function App() {
  // Initialize with window size
  const [dimensions, setDimensions] = useState({
    width: Math.ceil(window.innerWidth / CELL_SIZE),
    height: Math.ceil(window.innerHeight / CELL_SIZE)
  });

  // Use useMemo for mutable game state to avoid re-renders and lint errors
  // We use useMemo instead of useRef to allow access during render
  const world = useMemo(() => {
    const initialWidth = Math.ceil(window.innerWidth / CELL_SIZE);
    const initialHeight = Math.ceil(window.innerHeight / CELL_SIZE);
    return new World(initialWidth, initialHeight);
  }, []);

  const randomEventSystem = useMemo(() => new RandomEventSystem(world), [world]);

  const gameLoop = useMemo(() => new GameLoop(() => {
    world.tick();
    randomEventSystem.tick();
  }), [world, randomEventSystem]);

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showThoughts, setShowThoughts] = useState(false);
  const [highlightEvents, setHighlightEvents] = useState(false);
  const [uiTick, setUiTick] = useState(0);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = Math.ceil(window.innerWidth / CELL_SIZE);
      const newHeight = Math.ceil(window.innerHeight / CELL_SIZE);
      setDimensions({ width: newWidth, height: newHeight });

      world.width = newWidth;
      world.height = newHeight;
      world.grid = Array(newHeight).fill().map(() => Array(newWidth).fill(null));
      world.entities.forEach(e => world.updateGrid(e));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [world]);

  // Centralized Divine Intervention Logic
  const handleExtinction = useCallback((type) => {
    console.log(`Reseeding ${type}...`);
    if (!world) return;

    let spawnCount = 0;
    for (let i = 0; i < 50; i++) {
      // Pick a random edge
      let x, y;
      if (Math.random() < 0.5) {
        // Top or Bottom
        x = Math.floor(Math.random() * world.width);
        y = Math.random() < 0.5 ? 0 : world.height - 1;
      } else {
        // Left or Right
        x = Math.random() < 0.5 ? 0 : world.width - 1;
        y = Math.floor(Math.random() * world.height);
      }

      const entityAtLoc = world.getAt(x, y);
      if (!entityAtLoc || entityAtLoc.type === 'tree' || entityAtLoc.type === 'berry') {
        // Remove existing if any (e.g. plant)
        if (entityAtLoc) {
          entityAtLoc.markedForDeletion = true;
          world.removeEntity(entityAtLoc);
        }

        if (type === 'human') world.addEntity(new Human(x, y));
        if (type === 'cow') world.addEntity(new Cow(x, y));
        if (type === 'wolf') world.addEntity(new Wolf(x, y));

        spawnCount++;
        if (spawnCount >= 3) break; // Spawn 3 entities
      }
    }
  }, [world]);

  // Initialize World with callback
  useEffect(() => {
    world.onExtinction = handleExtinction;
    world.onLogEvent = (msg) => randomEventSystem.logEvent(msg);
  }, [world, handleExtinction, randomEventSystem]);

  const spawnEntities = useCallback(() => {
    world.entities = [];
    world.grid = Array(world.height).fill().map(() => Array(world.width).fill(null));

    // Scale entity counts by world size
    const area = world.width * world.height;
    const densityMultiplier = area / CONFIG.INITIAL_SPAWN.DENSITY_FACTOR;

    const spawnType = (Count, Class) => {
      for (let i = 0; i < Count * densityMultiplier; i++) {
        const x = Math.floor(Math.random() * world.width);
        const y = Math.floor(Math.random() * world.height);
        if (!world.getAt(x, y)) world.addEntity(new Class(x, y));
      }
    };

    // Use WorldGenerator
    const generator = new WorldGenerator(world);
    generator.generate();
    spawnType(CONFIG.INITIAL_SPAWN.BUSHES, BerryBush);
    spawnType(CONFIG.INITIAL_SPAWN.COWS, Cow);
    spawnType(CONFIG.INITIAL_SPAWN.HUMANS, Human);
    spawnType(CONFIG.INITIAL_SPAWN.WOLVES, Wolf);
  }, [world]);

  useEffect(() => {
    spawnEntities();

    gameLoop.onTick = () => {
      world.tick();
      randomEventSystem.tick();
    };
    gameLoop.start();

    // UI Update Loop (30 FPS cap for UI updates to avoid react thrashing)
    const uiInterval = setInterval(() => {
      setUiTick(t => t + 1);
    }, 33);

    return () => {
      gameLoop.stop();
      clearInterval(uiInterval);
    };
  }, [gameLoop, world, spawnEntities, randomEventSystem]);

  const handleCanvasClick = (x, y) => {
    const entity = world.getAt(x, y);
    setSelectedEntity(entity);
  };

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <SimulationCanvas
        world={world}
        width={dimensions.width}
        height={dimensions.height}
        cellSize={CELL_SIZE}
        onClick={handleCanvasClick}
        showThoughts={showThoughts}
        highlightEvents={highlightEvents}
        eventSystem={randomEventSystem}
      />
      <Overlay
        world={world}
        gameLoop={gameLoop}
        onReset={spawnEntities}
        selectedEntity={selectedEntity}
        eventSystem={randomEventSystem}
        showThoughts={showThoughts}
        setShowThoughts={setShowThoughts}
        highlightEvents={highlightEvents}
        setHighlightEvents={setHighlightEvents}
        uiTick={uiTick}
      />
    </div>
  );
}

export default App;
