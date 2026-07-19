/** Spy HQ scene — spy on other players. */
import { HUD } from '../ui/hud.js';

export class SpyHQScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.06, 0.04, 0.1, 1);
        this.hud = null;
        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;

        this.camera = new BABYLON.ArcRotateCamera(
            "spyCam", -Math.PI / 2, Math.PI / 3, 12,
            new BABYLON.Vector3(0, 1, 0), scene
        );
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 25;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        // Dim candle light
        const candle = new BABYLON.PointLight("candle",
            new BABYLON.Vector3(0, 1, 2), scene);
        candle.diffuse = new BABYLON.Color3(1, 0.8, 0.4);
        candle.intensity = 0.6;

        const hemi = new BABYLON.HemisphericLight("sHemi",
            new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.2;

        // Floor
        const floor = BABYLON.MeshBuilder.CreateGround("sFloor",
            { width: 12, height: 12 }, scene);
        const fMat = new BABYLON.StandardMaterial("sFMat", scene);
        fMat.diffuseColor = new BABYLON.Color3(0.08, 0.06, 0.1);
        floor.material = fMat;

        // Table
        const table = BABYLON.MeshBuilder.CreateBox("table",
            { width: 2, height: 0.1, depth: 1.5 }, scene);
        table.position = new BABYLON.Vector3(0, 0.6, 2);
        const tMat = new BABYLON.StandardMaterial("tMat", scene);
        tMat.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.1);
        table.material = tMat;

        // Candle on table
        const candleMesh = BABYLON.MeshBuilder.CreateCylinder("cMesh", {
            height: 0.3, diameter: 0.1,
        }, scene);
        candleMesh.position = new BABYLON.Vector3(0, 0.8, 2);
        const cMat = new BABYLON.StandardMaterial("cMat", scene);
        cMat.diffuseColor = new BABYLON.Color3(1, 0.9, 0.7);
        candleMesh.material = cMat;
    }

    async activate({ targetPlayer } = {}) {
                if (!this.hud) {
            this.hud = new HUD(this.scene, this.game.player, this.game);
            this._buildPanel();
        }
        this.hud.update(this.game.player);

        if (targetPlayer) {
            await this._spy(targetPlayer);
        }
    }

    deactivate() {
        // scene stays loaded
        if (this.panelUI) this.panelUI.dispose();
        if (this.resultUI) this.resultUI.dispose();
    }

    _buildPanel() {
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("spyUI", true, this.scene);
        this.panelUI = ui;

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "400px";
        bg.height = "280px";
        bg.background = "#1a1a2ecc";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = "#6a4a8a";
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        title.text = "🕵️ Spy Headquarters";
        title.color = "#8a6aaa";
        title.fontSize = 24;
        title.top = "-30%";
        ui.addControl(title);

        this.spyInput = new BABYLON.GUI.InputText();
        this.spyInput.width = "300px";
        this.spyInput.height = "40px";
        this.spyInput.placeholderText = "Target player name...";
        this.spyInput.color = "white";
        this.spyInput.background = "#2a2a4a";
        this.spyInput.top = "-8%";
        ui.addControl(this.spyInput);

        const spyBtn = BABYLON.GUI.Button.CreateSimpleButton("spyBtn", "🕵️ Send Spies");
        spyBtn.width = "200px";
        spyBtn.height = "40px";
        spyBtn.color = "white";
        spyBtn.background = "#4a2a6a";
        spyBtn.top = "5%";
        spyBtn.onPointerUpObservable.add(() => this._searchAndSpy());
        ui.addControl(spyBtn);

        this.spyStatus = new BABYLON.GUI.TextBlock();
        this.spyStatus.text = "";
        this.spyStatus.color = "#aaa";
        this.spyStatus.fontSize = 14;
        this.spyStatus.top = "16%";
        ui.addControl(this.spyStatus);

        const backBtn = BABYLON.GUI.Button.CreateSimpleButton("back", "🏰 Back to Kingdom");
        backBtn.width = "200px";
        backBtn.height = "40px";
        backBtn.color = "white";
        backBtn.background = "#4a3a2a";
        backBtn.top = "30%";
        backBtn.onPointerUpObservable.add(() => this.game.switchScene('kingdom'));
        ui.addControl(backBtn);
    }

    async _searchAndSpy() {
        const query = this.spyInput.text.trim();
        if (!query) return;

        try {
            const data = await this.game.api.getWorldPlayers();
            const match = data.players.find(p =>
                p.username.toLowerCase().includes(query.toLowerCase())
            );
            if (match) {
                this.spyStatus.text = `Found: ${match.username} — sending spies...`;
                await this._spy(match);
            } else {
                this.spyStatus.text = "Player not found.";
            }
        } catch (e) {
            this.spyStatus.text = "Search failed.";
        }
    }

    async _spy(target) {
        try {
            const result = await this.game.api.spy(target.id);
            this.game.player = result.player;
            this.hud.update(result.player);
            this._showSpyResult(result, target);
        } catch (e) {
            this.spyStatus.text = e.message;
        }
    }

    _showSpyResult(result, target) {
        if (this.resultUI) this.resultUI.dispose();

        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("spyResult", true, this.scene);
        this.resultUI = ui;

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "400px";
        bg.height = result.success ? "350px" : "200px";
        bg.background = "#1a1a2eee";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = result.success ? "#4a4" : "#a44";
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        if (result.success) {
            title.text = "🕵️ Spy Report";
            title.color = "#4a4";
        } else {
            title.text = "❌ Spies Captured!";
            title.color = "#a44";
        }
        title.fontSize = 24;
        title.top = result.success ? "-30%" : "-25%";
        ui.addControl(title);

        if (result.success && result.data) {
            const info = new BABYLON.GUI.TextBlock();
            info.text =
                `👤 ${target.username}\n` +
                `💰 Gold: ${result.data.gold} (Bank: ${result.data.banked_gold})\n` +
                `⚔️ Attack: ${result.data.attack_soldiers} (Wpn Lv.${result.data.attack_weapon})\n` +
                `🛡️ Defense: ${result.data.defense_soldiers} (Wpn Lv.${result.data.defense_weapon})\n` +
                `🕵️ Spies: ${result.data.spies} | Sentries: ${result.data.sentries}\n` +
                `🏆 Rank: #${result.data.battle_rank}`;
            info.color = "white";
            info.fontSize = 15;
            info.textWrapping = true;
            info.top = "5%";
            ui.addControl(info);
        } else {
            const lossText = new BABYLON.GUI.TextBlock();
            lossText.text = `Lost ${result.captured} spies to enemy sentries!`;
            lossText.color = "#faa";
            lossText.fontSize = 16;
            lossText.top = "5%";
            ui.addControl(lossText);
        }

        const closeBtn = BABYLON.GUI.Button.CreateSimpleButton("cls", "OK");
        closeBtn.width = "120px";
        closeBtn.height = "40px";
        closeBtn.color = "white";
        closeBtn.background = "#2a2a5a";
        closeBtn.top = "30%";
        closeBtn.onPointerUpObservable.add(() => {
            ui.dispose();
            this.resultUI = null;
        });
        ui.addControl(closeBtn);
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
    }
}
