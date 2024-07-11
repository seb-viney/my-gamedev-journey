import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Biome definitions
const biomeData = {
  forest: {
    groundColor: '#4CAF50',
    treeFrequency: 0.2,
    treeColor: '#795548',
    maxHeight: 12,
    minHeight: 8
  },
  plains: {
    groundColor: '#8BC34A',
    treeFrequency: 0.05,
    treeColor: '#A1887F',
    maxHeight: 6,
    minHeight: 4
  },
  icy: {
    groundColor: '#ECEFF1',
    treeFrequency: 0.1,
    treeColor: '#90A4AE',
    maxHeight: 10,
    minHeight: 6
  },
  ocean: {
    groundColor: '#2196F3',
    treeFrequency: 0,
    maxHeight: 3,
    minHeight: 1
  }
};

const CHUNK_SIZE = 16;
const CHUNK_WIDTH = 32;
const CHUNK_HEIGHT = 19;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

function App() {
  const [player, setPlayer] = useState({ x: 50, y: 0, width: 32, height: 48 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [terrain, setTerrain] = useState([]);
  const [loadedChunks, setLoadedChunks] = useState(new Set());

  const gameLoopRef = useRef();
  const keysPressed = useRef({});

  useEffect(() => {
    loadChunks();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (event) => {
      keysPressed.current[event.key] = true;
    };

    const handleKeyUp = (event) => {
      keysPressed.current[event.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  function noise(x) {
    return Math.sin(x / 100) * Math.sin(x / 50) * 10 + Math.sin(x / 25) * 5;
  }

  function generateChunk(chunkX) {
    const chunk = [];
    const biome = ['forest', 'plains', 'icy', 'ocean'][Math.floor(Math.random() * 4)];
    const biomeInfo = biomeData[biome];

    for (let x = 0; x < CHUNK_SIZE; x++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const height = Math.floor(
        (noise(worldX) + biomeInfo.maxHeight + biomeInfo.minHeight) / 2
      );

      for (let y = 0; y < height; y++) {
        chunk.push({
          x: worldX * CHUNK_WIDTH,
          y: CANVAS_HEIGHT - (y + 1) * CHUNK_HEIGHT,
          width: CHUNK_WIDTH,
          height: CHUNK_HEIGHT,
          type: y === height - 1 ? 'surface' : 'ground',
          biome: biome
        });
      }

      if (biome !== 'ocean' && Math.random() < biomeInfo.treeFrequency) {
        for (let treeHeight = 0; treeHeight < 3; treeHeight++) {
          chunk.push({
            x: worldX * CHUNK_WIDTH,
            y: CANVAS_HEIGHT - (height + treeHeight + 1) * CHUNK_HEIGHT,
            width: CHUNK_WIDTH,
            height: CHUNK_HEIGHT,
            type: 'tree',
            biome: biome
          });
        }
      }
    }

    return chunk;
  }

  function loadChunks() {
    const playerChunkX = Math.floor(player.x / (CHUNK_SIZE * CHUNK_WIDTH));
    
    for (let i = -2; i <= 2; i++) {
      const chunkX = playerChunkX + i;
      if (!loadedChunks.has(chunkX)) {
        setTerrain(prevTerrain => [...prevTerrain, ...generateChunk(chunkX)]);
        setLoadedChunks(prevChunks => new Set(prevChunks).add(chunkX));
      }
    }

    setLoadedChunks(prevChunks => {
      const newChunks = new Set(prevChunks);
      for (const chunkX of newChunks) {
        if (Math.abs(chunkX - playerChunkX) > 3) {
          newChunks.delete(chunkX);
          setTerrain(prevTerrain => prevTerrain.filter(
            block => block.x < chunkX * CHUNK_SIZE * CHUNK_WIDTH ||
                     block.x >= (chunkX + 1) * CHUNK_SIZE * CHUNK_WIDTH
          ));
        }
      }
      return newChunks;
    });
  }

  function updatePlayer() {
    setPlayer(prevPlayer => {
      let newX = prevPlayer.x;
      let newY = prevPlayer.y;
      const speed = 5;
      const gravity = 0.5;
      const jumpForce = 10;

      if (keysPressed.current['ArrowLeft']) newX -= speed;
      if (keysPressed.current['ArrowRight']) newX += speed;

      newY += gravity;  // Apply gravity

      // Check for collision with terrain
      terrain.forEach(block => {
        if (
          newX < block.x + block.width &&
          newX + prevPlayer.width > block.x &&
          newY < block.y + block.height &&
          newY + prevPlayer.height > block.y &&
          block.type !== 'tree'
        ) {
          // Collision detected
          newY = block.y - prevPlayer.height;
          if (keysPressed.current['ArrowUp'] || keysPressed.current[' ']) {
            newY -= jumpForce;
          }
        }
      });

      return { ...prevPlayer, x: newX, y: newY };
    });

    setCamera(prevCamera => ({
      x: player.x - CANVAS_WIDTH / 2,
      y: Math.max(0, player.y - CANVAS_HEIGHT / 2)
    }));

    loadChunks();
  }

  function gameLoop() {
    updatePlayer();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }

  return (
    <div className="App">
      <header>
        <h1>2D Side-Scroller</h1>
      </header>
      <main>
        <section id="gameContainer">
          <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ border: '2px solid #333' }}>
            {terrain.map((block, index) => (
              <rect
                key={index}
                x={block.x - camera.x}
                y={block.y - camera.y}
                width={block.width}
                height={block.height}
                fill={block.type === 'tree' ? biomeData[block.biome].treeColor : biomeData[block.biome].groundColor}
              />
            ))}
            <rect
              x={player.x - camera.x}
              y={player.y - camera.y}
              width={player.width}
              height={player.height}
              fill="red"
            />
          </svg>
          <p><a href="index.html">Back to Journey</a></p>
        </section>
      </main>
    </div>
  );
}

export default App;