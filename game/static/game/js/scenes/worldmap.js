/** World Map scene — 3D map showing all kingdoms. */
import { HUD } from '../ui/hud.js';

export class WorldMapScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.15, 0.3, 1);
        this.hud = null;
        this.markers = [];
        this._setupScene();
    }

    _setupScene() {
        const scene = this.scene;

        this.camera = new BABYLON.ArcRotateCamera(
            "worldCam", -Math.PI / 2, Math.PI / 4, 80,
            new BABYLON.Vector3(0, 0, 0), scene
        );
        this.camera.lowerRadiusLimit = 30;
        this.camera.upperRadiusLimit = 200;
        this.camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

        const hemi = new BABYLON.HemisphericLight("wHemi",
            new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.8;

        // Large world terrain
        const ground = BABYLON.MeshBuilder.CreateGround("wGround",
            { width: 250, height: 250 }, scene);
        const gMat = new BABYLON.StandardMaterial("wGMat", scene);
        gMat.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.12);
        ground.material = gMat;
    }

    async activate() {
                if (!this.hud) {
            this.hud = new HUD(this.scene, this.game.player, this.game);
        }
        this.hud.update(this.game.player);

        // Load world data
        try {
            const data = await this.game.api.getWorldPlayers();
            this._showKingdoms(data.players);
        } catch (e) {
            console.error('Failed to load world:', e);
        }
    }

    deactivate() {
        // scene stays loaded
        for (const m of this.markers) m.dispose();
        this.markers = [];
    }

    _showKingdoms(players) {
        const scene = this.scene;

        // Show player's own kingdom
        this._createMarker(
            this.game.player.world_x,
            this.game.player.world_z,
            '🏰 You',
            new BABYLON.Color3(1, 0.85, 0.1),
            3
        );

        // Show other players
        for (const p of players) {
            const color = new BABYLON.Color3(
                0.6 + Math.random() * 0.4,
                0.1 + Math.random() * 0.3,
                0.1 + Math.random() * 0.3
            );
            this._createMarker(p.world_x, p.world_z, p.username, color, 1.5, p);
        }
    }

    _createMarker(x, z, label, color, size, playerData = null) {
        const scene = this.scene;

        // Base platform
        const platform = BABYLON.MeshBuilder.CreateCylinder("plat", {
            height: 0.3, diameterTop: size, diameterBottom: size + 0.3,
        }, scene);
        platform.position = new BABYLON.Vector3(x, 0.15, z);
        const pMat = new BABYLON.StandardMaterial("pMat", scene);
        pMat.diffuseColor = color;
        platform.material = pMat;
        this.markers.push(platform);

        // Flag pole
        const pole = BABYLON.MeshBuilder.CreateCylinder("pole", {
            height: size * 2, diameter: 0.1,
        }, scene);
        pole.position = new BABYLON.Vector3(x, size, z);
        pole.material = pMat;
        this.markers.push(pole);

        // Flag
        const flag = BABYLON.MeshBuilder.CreatePlane("flag", {
            width: 1, height: 0.6,
        }, scene);
        flag.position = new BABYLON.Vector3(x + 0.5, size * 1.8, z);
        const fMat = new BABYLON.StandardMaterial("fMat", scene);
        fMat.diffuseColor = color;
        flag.material = fMat;
        this.markers.push(flag);

        // Click handler if player data available
        if (playerData) {
            platform.isPickable = true;
            platform.actionManager = new BABYLON.ActionManager(scene);
            platform.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => this._showPlayerInfo(playerData)
                )
            );
        }
    }

    _showPlayerInfo(playerData) {
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("worldInfo", true, this.scene);

        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "350px";
        bg.height = "220px";
        bg.background = "#1a1a2eee";
        bg.cornerRadius = 12;
        bg.thickness = 2;
        bg.color = "#c9a050";
        ui.addControl(bg);

        const title = new BABYLON.GUI.TextBlock();
        title.text = `👑 ${playerData.username}`;
        title.color = "#c9a050";
        title.fontSize = 22;
        title.top = "-30%";
        ui.addControl(title);

        const info = new BABYLON.GUI.TextBlock();
        info.text = `Rank: #${playerData.battle_rank}\n` +
            `Attack: ${playerData.attack_soldiers} | Defense: ${playerData.defense_soldiers}`;
        info.color = "white";
        info.fontSize = 16;
        info.top = "-5%";
        ui.addControl(info);

        const atkBtn = BABYLON.GUI.Button.CreateSimpleButton("atk", "⚔️ Attack");
        atkBtn.width = "140px";
        atkBtn.height = "40px";
        atkBtn.color = "white";
        atkBtn.background = "#5a2a2a";
        atkBtn.top = "15%";
        atkBtn.left = "-20%";
        atkBtn.onPointerUpObservable.add(() => {
            ui.dispose();
            this.game.switchScene('battle', { targetPlayer: playerData });
        });
        ui.addControl(atkBtn);

        const spyBtn = BABYLON.GUI.Button.CreateSimpleButton("spy", "🕵️ Spy");
        spyBtn.width = "140px";
        spyBtn.height = "40px";
        spyBtn.color = "white";
        spyBtn.background = "#2a2a5a";
        spyBtn.top = "15%";
        spyBtn.left = "20%";
        spyBtn.onPointerUpObservable.add(() => {
            ui.dispose();
            this.game.switchScene('spyhq', { targetPlayer: playerData });
        });
        ui.addControl(spyBtn);

        const closeBtn = BABYLON.GUI.Button.CreateSimpleButton("cls", "✕");
        closeBtn.width = "40px";
        closeBtn.height = "40px";
        closeBtn.color = "white";
        closeBtn.background = "red";
        closeBtn.top = "-30%";
        closeBtn.left = "42%";
        closeBtn.onPointerUpObservable.add(() => ui.dispose());
        ui.addControl(closeBtn);
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
    }
}
