/** Babylon.js 3D Application entry point. */
import { API } from './api.js';
import { KingdomScene } from './scenes/kingdom.js';
import { BattleScene } from './scenes/battle.js';
import { WorldMapScene } from './scenes/worldmap.js';
import { TrainingScene } from './scenes/training.js';
import { ArmoryScene } from './scenes/armory.js';
import { SpyHQScene } from './scenes/spyhq.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
        });
        this.api = new API(window.GAME_DATA);
        this.player = window.GAME_DATA.player;
        this.currentScene = null;
        this.scenes = {};
    }

    async init() {
        console.log('Game: creating scenes...');
        // Pre-create all scenes (they share the engine but have their own Scene objects)
        this.scenes.kingdom = new KingdomScene(this.engine, this);
        this.scenes.battle = new BattleScene(this.engine, this);
        this.scenes.worldmap = new WorldMapScene(this.engine, this);
        this.scenes.training = new TrainingScene(this.engine, this);
        this.scenes.armory = new ArmoryScene(this.engine, this);
        this.scenes.spyhq = new SpyHQScene(this.engine, this);

        // Start in the kingdom
        await this.switchScene('kingdom');

        // Hide loading
        const loader = document.getElementById('loading');
        if (loader) loader.remove();

        // Render loop — only render the active scene
        this.engine.runRenderLoop(() => {
            if (this.currentScene?.scene) {
                this.currentScene.scene.render();
            }
        });

        window.addEventListener('resize', () => this.engine.resize());

        // Auto-refresh player every 15s
        setInterval(() => this.refreshPlayer(), 15000);
    }

    async switchScene(name, data = {}) {
        if (this.currentScene) {
            this.currentScene.deactivate();
        }
        this.currentScene = this.scenes[name];
        await this.currentScene.activate(data);
    }

    async refreshPlayer() {
        try {
            const res = await this.api.refreshPlayer();
            if (res && res.player) {
                this.player = res.player;
                this.currentScene?.onPlayerUpdated?.(this.player);
            }
        } catch (e) {
            console.warn('Failed to refresh player:', e);
        }
    }
}

// Boot — handle both early and late module loading
function boot() {
    const game = new Game();
    game.init().catch(err => {
        console.error('Failed to start game:', err);
        const loader = document.getElementById('loading');
        if (loader) loader.textContent = 'Error loading game. Please refresh.';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
