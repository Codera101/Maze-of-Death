const MAX_CLIP_SIZE = 5; 
let state = {
    bullets: MAX_CLIP_SIZE,
    maxBullets: MAX_CLIP_SIZE
};

// --- Core Functions: ALL Logic is now consolidated here ---

/**
 * Centralized function to update the ammunition state and re-render the HUD.
 * This function handles all state changes and the full DOM rendering.
 * @param {number} newBullets - The new current bullet count.
 * @param {number} [newMaxBullets] - The new maximum bullet count (defaults to current max).
 */
function updateAmmoDisplay(newBullets, newMaxBullets = state.maxBullets) {
    // 1. Update global state
    state.bullets = Math.max(0, newBullets);
    state.maxBullets = Math.max(1, newMaxBullets);
    
    const container = document.getElementById('reload');
    if (!container) return;

    // 2. Generate the HTML string for the bullet indicator bars (formerly renderBulletIndicators)
    let bulletIndicatorsHtml = '';
    for (let i = 0; i < state.maxBullets; i++) {
        const isActive = i < state.bullets;
        
        bulletIndicatorsHtml += `
            <div 
                class="bullet-bar"
                style="
                    background-color: ${isActive ? 'var(--color-ammo)' : 'var(--bg-base)'};
                    box-shadow: ${isActive ? '0 0 8px rgba(255, 184, 44, 0.5)' : 'none'};
                    transform: scaleY(${isActive ? 1 : 0.8});
                    transition-delay: ${i * 0.05}s; 
                "
            ></div>
        `;
    }
    
    // 3. Render the full panel HTML (formerly renderPanel)
    const panelHtml = `
        <div class="app-footer">
            <div class="hud-container">
                
                <!-- AMMO CARD -->
                <div class="ammo-card">
                    
                    <!-- AMMO STATUS (ONE LINE ROW) -->
                    <div class="ammo-hud-row">
                        
                        <!-- Crosshair Icon -->
                        <svg class="crosshair-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><circle cx="12" cy="12" r="7"></circle>
                        </svg>
                        
                        <div class="ammo-display">
                            <div id="bullet-indicators" class="bullet-indicators">
                                ${bulletIndicatorsHtml}
                            </div>
                            <div class="bullet-count">
                                ${state.bullets}/${state.maxBullets}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = panelHtml;
}


// --- Key Event Listeners (Must remain separate to handle external input) ---
function handleKeydown(e) {
    // Fire bullet (Key 'B')
    if (e.key === 'b' || e.key === 'B') {
        if (state.bullets > 0) {
            // Call the central update function to decrement bullets
            updateAmmoDisplay(state.bullets - 1);
            // console.log(`Fired! ${state.bullets} rounds remaining. Press 'R' to reload.`);
        } else {
            // console.log("Empty clip! Press 'R' to reload.");
        }
    } 
    // Reload (Key 'R')
    else if (e.key === 'r' || e.key === 'R') {
        if (state.bullets < state.maxBullets) {
            // Call the central update function to reset bullets
            updateAmmoDisplay(state.maxBullets);
            // console.log("Reloading complete.");
        } else {
            // console.log("Ammunition is already full.");
        }
    }
}

// --- Initial Render and Setup ---
window.onload = () => {
    // Initial render using the consolidated function
    updateAmmoDisplay(state.bullets, state.maxBullets);
    
    // Set up the event listener
    document.addEventListener('keydown', handleKeydown);
};

