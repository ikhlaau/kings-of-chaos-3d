/** Kingdom scene — epic medieval walled city. */
import { HUD } from '../ui/hud.js';
import * as env from '../entities/environment.js';
import { createCastle, createBarracks, createTrainingGround, createArmory, createSpyHQ, createWallRing, createHouse } from '../entities/buildings.js';
import { createSoldier, createCitizen } from '../entities/units.js';

export class KingdomScene {
    constructor(engine, game) {
        this.engine = engine; this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.hud = null; this.buildings = []; this.units = [];
        this._setupScene();
    }

    _setupScene() {
        const s = this.scene;

        this.camera = new BABYLON.ArcRotateCamera("kCam", -Math.PI / 2, Math.PI / 3.4, 38, new BABYLON.Vector3(0, 2, -2), s);
        this.camera.lowerRadiusLimit = 14; this.camera.upperRadiusLimit = 70;
        this.camera.lowerBetaLimit = 0.3; this.camera.upperBetaLimit = Math.PI / 2 - 0.1;
        this.camera.attachControl(true);

        // Touch + mouse picking
        s.onPointerObservable.add((evtData) => {
            if (evtData.type === BABYLON.PointerEventTypes.POINTERPICK) {
                const mesh = evtData.pickInfo?.pickedMesh;
                if (mesh && mesh._clickAction) mesh._clickAction();
            }
        });

        env.createLights(s);
        env.createSky(s);
        env.createGround(s, 110);
        env.createClouds(s, 9);
        env.createForest(s, { count: 110, innerR: 19, outerR: 50 });
        env.createRocks(s, 16);
        env.createFlowers(s, 50);
    }

    _makePickable(mesh, onClick) {
        mesh.isPickable = true;
        mesh._clickAction = onClick;
        mesh.actionManager = new BABYLON.ActionManager(this.scene);
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            () => { mesh.renderOutline = true; mesh.outlineColor = BABYLON.Color3.Yellow(); mesh.outlineWidth = 0.04; }
        ));
        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            () => { mesh.renderOutline = false; }
        ));
    }

    async activate() {
        if (!this.hud) {
            this._buildKingdom(this.game.player);
            this._buildHUD();
        }
    }

    _buildHUD() {
        this.hud = new HUD(this.scene, this.game.player, this.game);
    }

    _buildKingdom(player) {
        const s = this.scene;
        const go = (name) => this.game.switchScene(name);

        // ── City layout ──
        // Plaza at center, castle to the north, buildings around, wall ring r=16, gate south (+z)
        env.createPlaza(s, 0, 0, 4.2);

        // Paths: gate → plaza → castle, plaza → each building
        env.createPath(s, { x: 0, z: 16 }, { x: 0, z: 0 }, 1.8);
        env.createPath(s, { x: 0, z: 0 }, { x: 0, z: -5.5 }, 1.6);
        env.createPath(s, { x: -1.5, z: 0.5 }, { x: -6.5, z: 2 }, 1.3);
        env.createPath(s, { x: 1.5, z: 0.5 }, { x: 6.5, z: 3 }, 1.3);
        env.createPath(s, { x: 1, z: -1.5 }, { x: 5.5, z: -4 }, 1.3);
        env.createPath(s, { x: -1, z: -1.5 }, { x: -5.5, z: -4 }, 1.3);

        // Buildings
        const castle = createCastle({ x: 0, z: -8 }, player, s);
        const barracks = createBarracks({ x: -8, z: 2.5 }, player.attack_soldiers + player.defense_soldiers, s);
        barracks.rotation.y = Math.PI / 5;
        const training = createTrainingGround({ x: 8.5, z: 3.5 }, s);
        const armory = createArmory({ x: 7, z: -4.5 }, s);
        armory.rotation.y = -Math.PI / 6;
        const spyhq = createSpyHQ({ x: -7, z: -4.5 }, s);

        this._makePickable(castle.getChildMeshes()[0], () => {});
        this._makePickable(barracks.getChildMeshes()[0], () => go('battle'));
        this._makePickable(training.getChildMeshes()[0], () => go('training'));
        this._makePickable(armory.getChildMeshes()[0], () => go('armory'));
        this._makePickable(spyhq.getChildMeshes()[0], () => go('spyhq'));

        this.buildings = [castle, barracks, training, armory, spyhq];

        // City walls with south gate
        this._walls = createWallRing({ x: 0, z: 0 }, 16, s, Math.PI / 2);

        // Decorative houses inside the walls — makes it feel like a living city
        const houseSpots = [
            { x: -4.5, z: 6.5 }, { x: 4.5, z: 7 }, { x: -11, z: -1 },
            { x: 11, z: -0.5 }, { x: -3, z: 10 }, { x: 3, z: 10.5 },
            { x: -11.5, z: 5.5 }, { x: 11.5, z: 6 },
        ];
        this._houses = houseSpots.map(p => createHouse(p, s));

        // Building labels (billboards)
        const labels = [
            { text: "🏰 Castle", pos: new BABYLON.Vector3(0, 9, -8) },
            { text: "⚔️ Barracks", pos: new BABYLON.Vector3(-8, 5, 2.5) },
            { text: "🎯 Training", pos: new BABYLON.Vector3(8.5, 3, 3.5) },
            { text: "🔧 Armory", pos: new BABYLON.Vector3(7, 5, -4.5) },
            { text: "🕵️ Spy HQ", pos: new BABYLON.Vector3(-7, 6.5, -4.5) },
        ];
        for (const lb of labels) {
            const p = BABYLON.MeshBuilder.CreatePlane("lb", { width: 3.2, height: 0.85 }, s);
            p.position = lb.pos; p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            p.isPickable = false;
            const dt = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(p, 512, 128);
            const tb = new BABYLON.GUI.TextBlock();
            tb.text = lb.text; tb.color = "white"; tb.fontSize = 40; tb.fontFamily = "Georgia, serif";
            tb.outlineColor = "black"; tb.outlineWidth = 4;
            dt.addControl(tb);
        }

        this._spawnUnits(player);
    }

    _spawnUnits(player) {
        for (const u of this.units) u.dispose();
        this.units = [];
        const s = this.scene;

        // Attack soldiers drilling near barracks
        for (let i = 0; i < Math.min(player.attack_soldiers, 22); i++) {
            const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 2.5;
            this.units.push(createSoldier(
                new BABYLON.Color3(0.85, 0.12, 0.08),
                new BABYLON.Vector3(-8 + Math.cos(a) * d, 0, 2.5 + Math.sin(a) * d), s));
        }
        // Defenders posted around the castle
        for (let i = 0; i < Math.min(player.defense_soldiers, 18); i++) {
            const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * 2.5;
            this.units.push(createSoldier(
                new BABYLON.Color3(0.08, 0.25, 0.85),
                new BABYLON.Vector3(Math.cos(a) * d, 0, -8 + Math.sin(a) * d), s));
        }
        // Citizens wandering plaza & market streets
        for (let i = 0; i < Math.min(player.citizens, 14); i++) {
            this.units.push(createCitizen(
                new BABYLON.Vector3(-6 + Math.random() * 12, 0, -2 + Math.random() * 10), s));
        }
        // Gold piles near the castle (treasury)
        for (let i = 0; i < Math.min(Math.floor(player.gold / 500), 10); i++) {
            const c = BABYLON.MeshBuilder.CreateCylinder("c", { diameterTop: 0, diameterBottom: 0.45, height: 0.22 }, s);
            c.position = new BABYLON.Vector3(3 + Math.random() * 2.5, 0.12, -6 + Math.random() * 3);
            const cm = new BABYLON.StandardMaterial("cM", s);
            cm.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);
            cm.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0);
            c.material = cm;
            this.units.push(c);
        }
    }

    onPlayerUpdated(player) {
        if (this.hud) this.hud.update(player);
        this._spawnUnits(player);
    }

    deactivate() {}

    _fmt(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : '' + n; }
}
