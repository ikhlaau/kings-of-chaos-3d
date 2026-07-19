/** Battle scene — 3D combat arena. */
import { createFormation } from '../entities/units.js';
import { HUD } from '../ui/hud.js';

export class BattleScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.12, 0.08, 0.04, 1);
        this.hud = null;
        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;

        this.camera = new BABYLON.ArcRotateCamera(
            "battleCam", -Math.PI / 2, Math.PI / 3, 25,
            new BABYLON.Vector3(0, 1, 0), scene
        );
        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 50;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        const hemi = new BABYLON.HemisphericLight("bHemi",
            new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.5;

        const dir = new BABYLON.DirectionalLight("bDir",
            new BABYLON.Vector3(-1, -1, 0), scene);
        dir.intensity = 0.6;

        // Battlefield ground
        const ground = BABYLON.MeshBuilder.CreateGround("bGround",
            { width: 40, height: 30 }, scene);
        const gMat = new BABYLON.StandardMaterial("bGMat", scene);
        gMat.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.08);
        ground.material = gMat;

        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogColor = new BABYLON.Color3(0.12, 0.08, 0.04);
        scene.fogStart = 25;
        scene.fogEnd = 45;
    }

    async activate({ targetPlayer } = {}) {
                if (!this.hud) {
            this.hud = new HUD(this.scene, this.game.player, this.game);
            this._buildTargetPanel();
        }
        this.hud.update(this.game.player);

        if (targetPlayer) {
            await this._runBattle(targetPlayer);
        }
    }

    deactivate() {
        // scene stays loaded
        this._clearBattlefield();
    }

    _buildTargetPanel() {
        // Create a fullscreen UI for target selection
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("battleUI", true, this.scene);

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "500px";
        bg.height = "400px";
        bg.background = "#1a1a2ecc";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = "#c9a050";
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        title.text = "⚔️ Battle Arena";
        title.color = "#c9a050";
        title.fontSize = 24;
        title.top = "-30%";
        ui.addControl(title);

        this.targetInput = new BABYLON.GUI.InputText();
        this.targetInput.width = "300px";
        this.targetInput.height = "40px";
        this.targetInput.placeholderText = "Search player name...";
        this.targetInput.color = "white";
        this.targetInput.background = "#2a2a4a";
        this.targetInput.top = "-10%";
        ui.addControl(this.targetInput);

        const searchBtn = BABYLON.GUI.Button.CreateSimpleButton("searchBtn", "🔍 Search");
        searchBtn.width = "200px";
        searchBtn.height = "40px";
        searchBtn.color = "white";
        searchBtn.background = "#3a5a3a";
        searchBtn.top = "0%";
        searchBtn.onPointerUpObservable.add(() => this._searchTarget());
        ui.addControl(searchBtn);

        this.targetResult = new BABYLON.GUI.TextBlock();
        this.targetResult.text = "";
        this.targetResult.color = "#aaa";
        this.targetResult.fontSize = 14;
        this.targetResult.top = "12%";
        ui.addControl(this.targetResult);

        const backBtn = BABYLON.GUI.Button.CreateSimpleButton("backBtn", "🏰 Back to Kingdom");
        backBtn.width = "200px";
        backBtn.height = "40px";
        backBtn.color = "white";
        backBtn.background = "#5a3a3a";
        backBtn.top = "30%";
        backBtn.onPointerUpObservable.add(() => this.game.switchScene('kingdom'));
        ui.addControl(backBtn);

        this.battleUI = ui;
    }

    async _searchTarget() {
        const query = this.targetInput.text.trim();
        if (!query) return;

        try {
            const data = await this.game.api.getWorldPlayers();
            const match = data.players.find(p =>
                p.username.toLowerCase().includes(query.toLowerCase())
            );
            if (match) {
                this.targetResult.text = `Found: ${match.username} (Rank #${match.battle_rank})`;
                this.selectedTarget = match;
                // Auto-attack
                await this._runBattle(match);
            } else {
                this.targetResult.text = "No player found.";
            }
        } catch (e) {
            this.targetResult.text = "Search failed.";
            console.error(e);
        }
    }

    async _runBattle(target) {
        try {
            const data = await this.game.api.attack(target.id);
            if (data.error) {
                alert(data.error);
                return;
            }
            await this._animateBattle(data, target);
        } catch (e) {
            alert(e.message);
        }
    }

    async _animateBattle(result, target) {
        const scene = this.scene;
        this._clearBattlefield();

        // Spawn attacker units (left)
        const atkColor = new BABYLON.Color3(0.9, 0.15, 0.1);
        const atkCount = Math.min(this.game.player.attack_soldiers, 30);
        this.atkUnits = createFormation(atkCount, atkColor,
            new BABYLON.Vector3(-10, 0, 0), 1.0, scene);

        // Spawn defender units (right) — approximate count
        const defColor = new BABYLON.Color3(0.1, 0.3, 0.9);
        const defCount = Math.min(
            (target.attack_soldiers || 0) + (target.defense_soldiers || 0), 30
        );
        this.defUnits = createFormation(defCount, defColor,
            new BABYLON.Vector3(10, 0, 0), 1.0, scene);

        // Animate charge
        await this._animateCharge();
        await this._animateClash(result);
        this._showResult(result, target);
    }

    _animateCharge() {
        return new Promise(resolve => {
            const duration = 80; // frames
            let frame = 0;
            const observer = this.scene.onBeforeRenderObservable.add(() => {
                frame++;
                const t = Math.min(frame / duration, 1.0);
                const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                for (const u of this.atkUnits || []) {
                    u.position.x = -10 + ease * 8;
                }
                for (const u of this.defUnits || []) {
                    u.position.x = 10 - ease * 8;
                }

                if (t >= 1.0) {
                    this.scene.onBeforeRenderObservable.remove(observer);
                    resolve();
                }
            });
        });
    }

    _animateClash(result) {
        return new Promise(resolve => {
            const duration = 60;
            let frame = 0;

            const atkLosses = result.result.attacker_losses.attack_soldiers || 0;
            const defLosses = result.result.defender_losses.defense_soldiers || 0;
            const atkLossUnits = Math.min(atkLosses, (this.atkUnits || []).length);
            const defLossUnits = Math.min(defLosses, (this.defUnits || []).length);

            const observer = this.scene.onBeforeRenderObservable.add(() => {
                frame++;
                const t = Math.min(frame / duration, 1.0);

                // Remove casualties gradually
                if (t > 0.3 && atkLossUnits > 0) {
                    for (let i = 0; i < atkLossUnits && i < this.atkUnits.length; i++) {
                        this.atkUnits[i].scaling.y = Math.max(0, 1 - (t - 0.3) / 0.7);
                    }
                }
                if (t > 0.3 && defLossUnits > 0) {
                    for (let i = 0; i < defLossUnits && i < this.defUnits.length; i++) {
                        this.defUnits[i].scaling.y = Math.max(0, 1 - (t - 0.3) / 0.7);
                    }
                }

                if (t >= 1.0) {
                    this.scene.onBeforeRenderObservable.remove(observer);
                    resolve();
                }
            });
        });
    }

    _showResult(result, target) {
        const outcome = result.result.outcome === 'ATK' ? 'Victory!' : 'Defeat!';
        const color = result.result.outcome === 'ATK' ? '#4a4' : '#a44';

        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("resultUI", true, this.scene);

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "400px";
        bg.height = "250px";
        bg.background = "#1a1a2eee";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = color;
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        title.text = outcome;
        title.color = color;
        title.fontSize = 36;
        title.top = "-25%";
        ui.addControl(title);

        const info = new BABYLON.GUI.TextBlock();
        info.text = `Gold: ${result.result.gold_stolen > 0 ? '+' : ''}${result.result.gold_stolen}\n` +
            `vs ${target.username}`;
        info.color = "white";
        info.fontSize = 18;
        info.top = "5%";
        ui.addControl(info);

        const okBtn = BABYLON.GUI.Button.CreateSimpleButton("okBtn", "🏰 Return to Kingdom");
        okBtn.width = "200px";
        okBtn.height = "40px";
        okBtn.color = "white";
        okBtn.background = "#2a2a5a";
        okBtn.top = "25%";
        okBtn.onPointerUpObservable.add(() => {
            ui.dispose();
            this.game.refreshPlayer();
            this.game.switchScene('kingdom');
        });
        ui.addControl(okBtn);
    }

    _clearBattlefield() {
        for (const u of (this.atkUnits || [])) u.dispose();
        for (const u of (this.defUnits || [])) u.dispose();
        this.atkUnits = [];
        this.defUnits = [];
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
    }
}
