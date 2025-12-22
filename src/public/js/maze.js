// Create app (constructor only)
export const app = new PIXI.Application();

// Must await init()
await app.init({
    width: cols * cellSize + (cols - 1) * strokeWidth * 2,
    height: rows * cellSize + (rows - 1) * strokeWidth * 2,
    background: '#0D0D16',
    antialias: true,
    autoDensity:true,
    resolution: window.devicePixelRatio || 1,
});
mazeContent.appendChild(app.canvas);
