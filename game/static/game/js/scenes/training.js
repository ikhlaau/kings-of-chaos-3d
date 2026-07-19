/** Training Grounds scene — train units visually. */
import { createSoldier } from '../entities/units.js';
import { HUD } from '../ui/hud.js';

export class TrainingScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.2, 0.1, 1);
        this.hud = null;
        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;

        this.camera = new BABYLON.ArcRotateCamera(
            "trainCam", -Math.PI / 2, Math.PI / 4, 20,
            new BABYLON.Vector3(0, 1, 0), scene
        );
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 40;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        const hemi = new BABYLON.HemisphericLight("tHemi",
            new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.7;

        // Training ground floor
        const ground = BABYLON.MeshBuilder.CreateGround("tGround",
            { width: 20, height: 20 }, scene);
        const gMat = new BABYLON.StandardMaterial("tGMat", scene);
        gMat.diffuseColor = new BABYLON.Color3(0.25, 0.18, 0.1);
        ground.material = gMat;

        // Training dummies in a row
        for (let i = 0; i < 4; i++) {
            const dummy = BABYLON.MeshBuilder.CreateCylinder("dummy", {
                height: 2, diameter: 0.2,
            }, scene);
            dummy.position = new BABYLON.Vector3(-3 + i * 2, 1, 2);
            const dMat = new BABYLON.StandardMaterial("dMat", scene);
            dMat.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.3);
            dummy.material = dMat;
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
        if (this.panelUI) {
            this.panelUI.dispose();
        }
    }

    _buildPanel() {
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("trainUI", true, this.scene);
        this.panelUI = ui;

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "380px";
        bg.height = "350px";
        bg.background = "#1a1a2ecc";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = "#5a8a5a";
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        title.text = "🎯 Training Grounds";
        title.color = "#5a8a5a";
        title.fontSize = 24;
        title.top = "-35%";
        ui.addControl(title);

        const costs = [
            { type: 'attack_soldiers', label: '⚔️ Attack Soldiers', batch: 10, gold: 100 },
            { type: 'defense_soldiers', label: '🛡️ Defense Soldiers', batch: 10, gold: 100 },
            { type: 'spies', label: '🕵️ Spies', batch: 5, gold: 200 },
            { type: 'sentries', label: '👁️ Sentries', batch: 5, gold: 200 },
        ];

        let top = -20;
        for (const c of costs) {
            const btn = BABYLON.GUI.Button.CreateSimpleButton(c.type,
                `${c.label} (+${c.batch}) — 💰${c.gold} ⚡1`
            );
            btn.width = "320px";
            btn.height = "50px";
            btn.color = "white";
            btn.background = "#2a4a2a";
            btn.top = `${top}%`;
            btn.cornerRadius = 8;
            btn.onPointerUpObservable.add(() => this._train(c.type));
            ui.addControl(btn);
            top += 15;
        }

        const backBtn = BABYLON.GUI.Button.CreateSimpleButton("back", "🏰 Back to Kingdom");
        backBtn.width = "200px";
        backBtn.height = "40px";
        backBtn.color = "white";
        backBtn.background = "#4a3a2a";
        backBtn.top = "35%";
        backBtn.onPointerUpObservable.add(() => this.game.switchScene('kingdom'));
        ui.addControl(backBtn);
    }

    async _train(unitType) {
        try {
            const result = await this.game.api.train(unitType);
            this.game.player = result.player;
            this.hud.update(result.player);

            // Spawn new units visually
            const colorMap = {
                attack_soldiers: new BABYLON.Color3(0.9, 0.15, 0.1),
                defense_soldiers: new BABYLON.Color3(0.1, 0.3, 0.9),
                spies: new BABYLON.Color3(0.2, 0.1, 0.3),
                sentries: new BABYLON.Color3(0.3, 0.3, 0.5),
            };
            const count = result.trained[unitType];
            for (let i = 0; i < Math.min(count, 10); i++) {
                const pos = new BABYLON.Vector3(
                    -2 + Math.random() * 4, 0, 5 + Math.random() * 3
                );
                const unit = createSoldier(colorMap[unitType], pos, this.scene);
                // Animate: fade in + rise up
                unit.scaling = new BABYLON.Vector3(0, 0, 0);
                let frame = 0;
                const obs = this.scene.onBeforeRenderObservable.add(() => {
                    frame++;
                    const t = Math.min(frame / 40, 1);
                    unit.scaling = new BABYLON.Vector3(t, t, t);
                    unit.position.y = t * 1.2;
                    if (t >= 1) {
                        this.scene.onBeforeRenderObservable.remove(obs);
                    }
                });
            }
        } catch (e) {
            alert(e.message);
        }
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
    }
}
