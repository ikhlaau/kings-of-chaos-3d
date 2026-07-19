/** Kingdom scene — the main hub. Castle + buildings + units + terrain. */
import { HUD } from '../ui/hud.js';
import { createTerrain, createTrees, createSky } from '../entities/environment.js';
import {
    createCastle, createBarracks, createTrainingGround, createArmory, createSpyHQ,
} from '../entities/buildings.js';
import { createSoldier, createCitizen, createFormation } from '../entities/units.js';

export class KingdomScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.hud = null;
        this.buildings = {};
        this.units = [];

        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;

        // Camera — orbit around center
        this.camera = new BABYLON.ArcRotateCamera(
            "kingdomCam",
            -Math.PI / 3,      // alpha (horizontal angle)
            Math.PI / 3.5,      // beta (vertical angle)
            35,                  // radius
            new BABYLON.Vector3(0, 2, 0),
            scene
        );
        this.camera.lowerRadiusLimit = 12;
        this.camera.upperRadiusLimit = 70;
        this.camera.lowerBetaLimit = 0.3;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.1;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        // Lights
        const hemi = new BABYLON.HemisphericLight(
            "hemi", new BABYLON.Vector3(0, 1, 0), scene
        );
        hemi.intensity = 0.7;

        const dir = new BABYLON.DirectionalLight(
            "dir", new BABYLON.Vector3(-0.5, -0.8, 0.3), scene
        );
        dir.intensity = 0.6;

        // Environment
        createTerrain(scene);
        createTrees(scene);
        createSky(scene);
    }

    async activate() {
        if (!this.hud) {
            this.hud = new HUD(this.scene, this.game.player, this.game);
            this._buildKingdom(this.game.player);
        }
        this.hud.update(this.game.player);
        this.scene.getEngine().getRenderingCanvas().focus();
    }

    deactivate() {
        // Scene stays loaded; just cleanup dynamic content if needed
    }

    _buildKingdom(player) {
        const scene = this.scene;

        // ── Buildings ──
        this.buildings.castle = createCastle(
            { x: 0, z: 0 }, player, scene
        );
        this.buildings.barracks = createBarracks(
            { x: -8, z: 2 }, player.attack_soldiers + player.defense_soldiers, scene
        );
        this.buildings.training = createTrainingGround(
            { x: 10, z: 2 }, scene
        );
        this.buildings.armory = createArmory(
            { x: 14, z: 4 }, scene
        );
        this.buildings.spyhq = createSpyHQ(
            { x: -12, z: 8 }, scene
        );

        // ── Click handlers ──
        this._makeClickable(this.buildings.castle, () => {
            this.game.switchScene('kingdom'); // Already here — just refresh
        });
        this._makeClickable(this.buildings.barracks, () => {
            this.game.switchScene('battle');
        });
        this._makeClickable(this.buildings.training, () => {
            this.game.switchScene('training');
        });
        this._makeClickable(this.buildings.armory, () => {
            this.game.switchScene('armory');
        });
        this._makeClickable(this.buildings.spyhq, () => {
            this.game.switchScene('spyhq');
        });

        // ── Units ──
        this._spawnUnits(player);

        // ── Gold piles near castle ──
        this._spawnGoldPiles(player);
    }

    _spawnUnits(player) {
        // Clear old units
        for (const u of this.units) u.dispose();
        this.units = [];

        const scene = this.scene;

        // Attack soldiers near barracks
        const atkCount = Math.min(player.attack_soldiers, 25);
        for (let i = 0; i < atkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 2 + Math.random() * 3;
            const pos = new BABYLON.Vector3(
                -8 + Math.cos(angle) * dist, 0, 2 + Math.sin(angle) * dist
            );
            this.units.push(createSoldier(new BABYLON.Color3(0.9, 0.15, 0.1), pos, scene));
        }

        // Defense soldiers near castle
        const defCount = Math.min(player.defense_soldiers, 20);
        for (let i = 0; i < defCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 2;
            const pos = new BABYLON.Vector3(
                Math.cos(angle) * dist, 0, Math.sin(angle) * dist
            );
            this.units.push(createSoldier(new BABYLON.Color3(0.1, 0.3, 0.9), pos, scene));
        }

        // Citizens near fields (edges)
        const citCount = Math.min(player.citizens, 15);
        for (let i = 0; i < citCount; i++) {
            const pos = new BABYLON.Vector3(
                -15 + Math.random() * 30, 0, -15 + Math.random() * 10
            );
            this.units.push(createCitizen(pos, scene));
        }
    }

    _spawnGoldPiles(player) {
        const scene = this.scene;
        const pileCount = Math.min(Math.floor(player.gold / 500), 15);
        for (let i = 0; i < pileCount; i++) {
            const coin = BABYLON.MeshBuilder.CreateCylinder("coin", {
                diameterTop: 0, diameterBottom: 0.4, height: 0.2,
            }, scene);
            coin.position = new BABYLON.Vector3(
                2 + Math.random() * 3, 0.1, 3 + Math.random() * 3
            );
            const mat = new BABYLON.StandardMaterial("coinMat", scene);
            mat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);
            mat.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0);
            coin.material = mat;
            this.units.push(coin);
        }
    }

    _makeClickable(mesh, onClick) {
        mesh.actionManager = new BABYLON.ActionManager(this.scene);
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger, onClick
            )
        );
        // Hover highlight
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger, () => {
                    mesh.renderOutline = true;
                    mesh.outlineColor = BABYLON.Color3.Yellow();
                    mesh.outlineWidth = 0.05;
                }
            )
        );
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger, () => {
                    mesh.renderOutline = false;
                }
            )
        );
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
        this._spawnUnits(player);
        // Rebuild gold piles
        // In a full impl, we'd update dynamically rather than rebuild
    }
}
