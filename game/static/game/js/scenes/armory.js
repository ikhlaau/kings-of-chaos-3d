/** Armory scene — buy weapon upgrades. */
import { HUD } from '../ui/hud.js';

const WEAPONS = [
    { type: 'attack_weapon', name: '⚔️ Attack Weapon', desc: 'Boosts attack soldier power' },
    { type: 'defense_weapon', name: '🛡️ Defense Weapon', desc: 'Boosts defense soldier power' },
    { type: 'spy_tools', name: '🗡️ Spy Tools', desc: 'Boosts spy effectiveness' },
    { type: 'sentry_tools', name: '🪖 Sentry Tools', desc: 'Boosts sentry detection' },
];

export class ArmoryScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.15, 0.12, 0.1, 1);
        this.hud = null;
        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;

        this.camera = new BABYLON.ArcRotateCamera(
            "armoryCam", -Math.PI / 2, Math.PI / 3, 15,
            new BABYLON.Vector3(0, 1.5, 0), scene
        );
        this.camera.lowerRadiusLimit = 6;
        this.camera.upperRadiusLimit = 30;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        const hemi = new BABYLON.HemisphericLight("aHemi",
            new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.5;

        // Warm forge light
        const forge = new BABYLON.PointLight("forge",
            new BABYLON.Vector3(2, 1.5, 2), scene);
        forge.diffuse = new BABYLON.Color3(1, 0.6, 0.2);
        forge.intensity = 0.8;

        // Floor
        const floor = BABYLON.MeshBuilder.CreateGround("aFloor",
            { width: 15, height: 15 }, scene);
        const fMat = new BABYLON.StandardMaterial("aFMat", scene);
        fMat.diffuseColor = new BABYLON.Color3(0.2, 0.18, 0.15);
        floor.material = fMat;

        // Anvil
        const anvil = BABYLON.MeshBuilder.CreateBox("anvil",
            { width: 1, height: 0.5, depth: 0.7 }, scene);
        anvil.position = new BABYLON.Vector3(2, 0.25, 2);
        const aMat = new BABYLON.StandardMaterial("anvilMat", scene);
        aMat.diffuseColor = new BABYLON.Color3(0.3, 0.28, 0.3);
        anvil.material = aMat;

        // Weapon rack (decorative)
        for (let i = 0; i < 5; i++) {
            const sword = BABYLON.MeshBuilder.CreateBox("sword",
                { width: 0.05, height: 1.2, depth: 0.02 }, scene);
            sword.position = new BABYLON.Vector3(-3 + i * 0.5, 0.6, 4);
            const sMat = new BABYLON.StandardMaterial("swordMat", scene);
            sMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.75);
            sword.material = sMat;
        }
    }

    async activate() {
                if (!this.hud) {
            this.hud = new HUD(this.scene, this.game.player, this.game);
            this._buildPanel();
        }
        this.hud.update(this.game.player);
    }

    deactivate() {
        // scene stays loaded
        if (this.panelUI) this.panelUI.dispose();
    }

    _buildPanel() {
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("armoryUI", true, this.scene);
        this.panelUI = ui;

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "400px";
        bg.height = "400px";
        bg.background = "#1a1a2ecc";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = "#8a8a8a";
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        title.text = "🔧 Armory";
        title.color = "#aaa";
        title.fontSize = 24;
        title.top = "-38%";
        ui.addControl(title);

        let top = -25;
        const p = this.game.player;
        const levels = {
            attack_weapon: p.attack_weapon,
            defense_weapon: p.defense_weapon,
            spy_tools: p.spy_tools,
            sentry_tools: p.sentry_tools,
        };

        for (const w of WEAPONS) {
            const level = levels[w.type] || 0;
            const nextCost = level >= 20 ? 'MAX' : (500 * (level + 1) * (level + 1));

            const btn = BABYLON.GUI.Button.CreateSimpleButton(w.type,
                `${w.name} (Lv.${level}) — Upgrade: 💰${nextCost}`
            );
            btn.width = "340px";
            btn.height = "50px";
            btn.color = "white";
            btn.background = level >= 20 ? "#333" : "#3a3a4a";
            btn.top = `${top}%`;
            btn.cornerRadius = 8;
            if (level < 20) {
                btn.onPointerUpObservable.add(() => this._buyWeapon(w.type));
            }
            ui.addControl(btn);
            top += 14;
        }

        const backBtn = BABYLON.GUI.Button.CreateSimpleButton("back", "🏰 Back to Kingdom");
        backBtn.width = "200px";
        backBtn.height = "40px";
        backBtn.color = "white";
        backBtn.background = "#4a3a2a";
        backBtn.top = "38%";
        backBtn.onPointerUpObservable.add(() => this.game.switchScene('kingdom'));
        ui.addControl(backBtn);
    }

    async _buyWeapon(weaponType) {
        try {
            const result = await this.game.api.buyWeapon(weaponType);
            this.game.player = result.player;
            this.hud.update(result.player);
            // Refresh panel to show new levels
            this.panelUI.dispose();
            this._buildPanel();
        } catch (e) {
            alert(e.message);
        }
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
    }
}
