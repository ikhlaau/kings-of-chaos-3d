/** World Map — MMORTS style: tiled terrain, castle markers with banners, ornate UI. */
import { medievalPanel, medievalTitle, medievalBtn, medievalText } from '../ui/medieval.js';

const GOLD = '#c9a050';
const GOLD_BRIGHT = '#e8c060';
const PANEL_BG = '#140e06ee';
const IVORY = '#e8dcc0';
const SERIF = 'Georgia, serif';

// World bounds — tiles are 4x4 world units
const TILE = 4;
const GRID = 13;             // 13x13 visible tiles centered on origin
const HALF = Math.floor(GRID / 2);

/** Deterministic hash → terrain type per tile. */
function tileType(x, z) {
    let h = (x * 374761393 + z * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    h = (h ^ (h >> 16)) >>> 0;
    const r = (h % 100) / 100;
    if (r < 0.10) return 'water';
    if (r < 0.24) return 'forest';
    if (r < 0.30) return 'mountain';
    return 'grass';
}

export class WorldMapScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.35, 0.5, 0.75, 1);
        this._disposables = [];
        this._ui = null;
        this._setupScene();
    }

    _setupScene() {
        const s = this.scene;

        this.camera = new BABYLON.ArcRotateCamera("wC", -Math.PI / 2, Math.PI / 3.2, 90,
            new BABYLON.Vector3(0, 0, 0), s);
        this.camera.lowerRadiusLimit = 30;
        this.camera.upperRadiusLimit = 180;
        this.camera.lowerBetaLimit = 0.25;
        this.camera.upperBetaLimit = Math.PI / 2.4;
        this.camera.attachControl(true);
        this.camera.panningSensibility = 60;

        const sun = new BABYLON.DirectionalLight("wSun", new BABYLON.Vector3(-0.4, -1, 0.3), s);
        sun.intensity = 0.9;
        sun.position = new BABYLON.Vector3(40, 80, -30);
        new BABYLON.HemisphericLight("wL", new BABYLON.Vector3(0, 1, 0), s).intensity = 0.55;

        this._buildTerrain();
    }

    // ───────────────────────── terrain ─────────────────────────

    _buildTerrain() {
        const s = this.scene;

        // Base ground (deep green under everything)
        const g = BABYLON.MeshBuilder.CreateGround("wG", { width: GRID * TILE + 40, height: GRID * TILE + 40 }, s);
        const gm = new BABYLON.StandardMaterial("wM", s);
        gm.diffuseColor = new BABYLON.Color3(0.14, 0.3, 0.12);
        gm.specularColor = BABYLON.Color3.Black();
        g.material = gm;
        g.isPickable = false;
        this._disposables.push(g);

        for (let gx = -HALF; gx <= HALF; gx++) {
            for (let gz = -HALF; gz <= HALF; gz++) {
                const type = tileType(gx, gz);
                const cx = gx * TILE, cz = gz * TILE;
                this._buildTile(cx, cz, type, gx, gz);
            }
        }
    }

    _buildTile(cx, cz, type, gx, gz) {
        const s = this.scene;
        const pad = 0.12; // grid-line gap between tiles

        const tile = BABYLON.MeshBuilder.CreateGround(`t${gx}_${gz}`, { width: TILE - pad, height: TILE - pad }, s);
        tile.position = new BABYLON.Vector3(cx, 0.02, cz);
        const tm = new BABYLON.StandardMaterial(`tM${gx}_${gz}`, s);
        tm.specularColor = BABYLON.Color3.Black();

        if (type === 'water') {
            tm.diffuseColor = new BABYLON.Color3(0.12, 0.3, 0.55);
            tm.emissiveColor = new BABYLON.Color3(0.02, 0.06, 0.12);
            tm.alpha = 0.95;
        } else if (type === 'forest') {
            tm.diffuseColor = new BABYLON.Color3(0.1, 0.26, 0.1);
        } else if (type === 'mountain') {
            tm.diffuseColor = new BABYLON.Color3(0.32, 0.3, 0.3);
        } else {
            // grass with subtle checker variation
            const v = ((gx + gz) % 2 === 0) ? 0 : 0.03;
            tm.diffuseColor = new BABYLON.Color3(0.2 + v, 0.38 + v, 0.15);
        }
        tile.material = tm;
        this._disposables.push(tile);

        if (type === 'forest') this._forest(cx, cz);
        if (type === 'mountain') this._mountain(cx, cz);
        if (type === 'water') this._waterDetail(cx, cz);
    }

    _forest(cx, cz) {
        const s = this.scene;
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + cx;
            const tx = cx + Math.cos(a) * 0.9, tz = cz + Math.sin(a) * 0.9;

            const trunk = BABYLON.MeshBuilder.CreateCylinder("tr", { height: 0.5, diameter: 0.18 }, s);
            trunk.position = new BABYLON.Vector3(tx, 0.25, tz);
            const tm = new BABYLON.StandardMaterial("trM", s);
            tm.diffuseColor = new BABYLON.Color3(0.3, 0.18, 0.08);
            trunk.material = tm;

            const top = BABYLON.MeshBuilder.CreateCylinder("tt", { height: 1.1, diameterTop: 0, diameterBottom: 1.0 }, s);
            top.position = new BABYLON.Vector3(tx, 1.0, tz);
            const ttm = new BABYLON.StandardMaterial("ttM", s);
            ttm.diffuseColor = new BABYLON.Color3(0.06, 0.3, 0.08);
            top.material = ttm;

            this._disposables.push(trunk, top);
        }
    }

    _mountain(cx, cz) {
        const s = this.scene;
        const m = BABYLON.MeshBuilder.CreateCylinder("mt", { height: 2.2, diameterTop: 0, diameterBottom: 2.6, tessellation: 5 }, s);
        m.position = new BABYLON.Vector3(cx, 1.1, cz);
        const mm = new BABYLON.StandardMaterial("mtM", s);
        mm.diffuseColor = new BABYLON.Color3(0.42, 0.4, 0.42);
        m.material = mm;

        const cap = BABYLON.MeshBuilder.CreateCylinder("mc", { height: 0.5, diameterTop: 0, diameterBottom: 0.8, tessellation: 5 }, s);
        cap.position = new BABYLON.Vector3(cx, 2.2, cz);
        const cm = new BABYLON.StandardMaterial("mcM", s);
        cm.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.95);
        cap.material = cm;

        this._disposables.push(m, cap);
    }

    _waterDetail(cx, cz) {
        // subtle lighter "shore shimmer" disc
        const s = this.scene;
        const d = BABYLON.MeshBuilder.CreateDisc("wd", { radius: 0.7, tessellation: 12 }, s);
        d.rotation.x = Math.PI / 2;
        d.position = new BABYLON.Vector3(cx + 0.6, 0.06, cz - 0.4);
        const dm = new BABYLON.StandardMaterial("wdM", s);
        dm.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.75);
        dm.alpha = 0.5;
        d.material = dm;
        this._disposables.push(d);
    }

    // ───────────────────────── castles ─────────────────────────

    _castle(x, z, opts) {
        const s = this.scene;
        const { color = new BABYLON.Color3(0.55, 0.5, 0.48), roof = new BABYLON.Color3(0.5, 0.15, 0.12), scale = 1 } = opts;
        const parts = [];

        // Keep (main tower)
        const keep = BABYLON.MeshBuilder.CreateBox("ck", { width: 1.6 * scale, height: 1.4 * scale, depth: 1.6 * scale }, s);
        keep.position = new BABYLON.Vector3(x, 0.7 * scale, z);
        // Corner turrets
        for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
            const t = BABYLON.MeshBuilder.CreateCylinder("ct", { height: 1.8 * scale, diameter: 0.5 * scale }, s);
            t.position = new BABYLON.Vector3(x + dx * scale, 0.9 * scale, z + dz * scale);
            parts.push(t);
            const r = BABYLON.MeshBuilder.CreateCylinder("cr", { height: 0.5 * scale, diameterTop: 0, diameterBottom: 0.7 * scale }, s);
            r.position = new BABYLON.Vector3(x + dx * scale, 2.05 * scale, z + dz * scale);
            parts.push(r);
        }
        // Keep roof
        const kr = BABYLON.MeshBuilder.CreateCylinder("ckr", { height: 0.7 * scale, diameterTop: 0, diameterBottom: 1.4 * scale, tessellation: 4 }, s);
        kr.position = new BABYLON.Vector3(x, 1.75 * scale, z);
        kr.rotation.y = Math.PI / 4;
        parts.push(kr);
        // Flag
        const pole = BABYLON.MeshBuilder.CreateCylinder("fp", { height: 0.9 * scale, diameter: 0.05 * scale }, s);
        pole.position = new BABYLON.Vector3(x, 2.5 * scale, z);
        parts.push(pole);
        const flag = BABYLON.MeshBuilder.CreateBox("ff", { width: 0.5 * scale, height: 0.3 * scale, depth: 0.02 }, s);
        flag.position = new BABYLON.Vector3(x + 0.28 * scale, 2.8 * scale, z);
        parts.push(flag);

        const cm = new BABYLON.StandardMaterial("cM", s);
        cm.diffuseColor = color;
        const rm = new BABYLON.StandardMaterial("rM", s);
        rm.diffuseColor = roof;
        const fm = new BABYLON.StandardMaterial("fM", s);
        fm.diffuseColor = roof; fm.emissiveColor = roof.scale(0.35);

        keep.material = cm;
        for (const p of parts) p.material = (p.name === 'ff') ? fm : (p.name === 'cr' || p.name === 'ckr') ? rm : cm;

        const all = [keep, ...parts];
        this._disposables.push(...all);
        return all;
    }

    /** Floating name banner above a castle. */
    _banner(x, z, text, color = 'white', y = 3.4) {
        const s = this.scene;
        const p = BABYLON.MeshBuilder.CreatePlane("bn", { width: 4.2, height: 1.0 }, s);
        p.position = new BABYLON.Vector3(x, y, z);
        p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        const dt = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(p, 512, 128);
        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "100%"; bg.height = "100%";
        bg.background = "#140e06cc";
        bg.cornerRadius = 30;
        bg.thickness = 3; bg.color = GOLD;
        dt.addControl(bg);
        const tb = new BABYLON.GUI.TextBlock();
        tb.text = text; tb.color = color;
        tb.fontSize = 44; tb.fontFamily = SERIF; tb.fontWeight = "bold";
        tb.outlineColor = "black"; tb.outlineWidth = 4;
        bg.addControl(tb);
        this._disposables.push(p);
        return p;
    }

    /** Gold highlight ring under the player's own kingdom. */
    _highlight(x, z) {
        const s = this.scene;
        const ring = BABYLON.MeshBuilder.CreateTorus("hl", { diameter: 4.4, thickness: 0.18, tessellation: 48 }, s);
        ring.position = new BABYLON.Vector3(x, 0.12, z);
        const rm = new BABYLON.StandardMaterial("hlM", s);
        rm.diffuseColor = new BABYLON.Color3(0.85, 0.65, 0.2);
        rm.emissiveColor = new BABYLON.Color3(0.5, 0.38, 0.08);
        ring.material = rm;
        this._disposables.push(ring);
    }

    // ───────────────────────── data + UI ─────────────────────────

    async activate(data = {}) {
        this._clearWorld();
        try {
            const d = await this.game.api.getWorldPlayers();
            this._populate(d.players);
        } catch (e) { /* world stays terrain-only */ }
        this._buildUI();
    }

    _clearWorld() {
        for (const m of this._worldMeshes || []) m.dispose();
        this._worldMeshes = [];
        this._ui?.dispose();
        this._ui = null;
    }

    _populate(players) {
        this._worldMeshes = [];
        const me = this.game.player;

        // Snap players onto tile centers
        const snap = (v) => Math.round(v / TILE) * TILE;

        // Own kingdom — gold castle + ring + banner
        const mx = snap(me.world_x), mz = snap(me.world_z);
        this._highlight(mx, mz);
        this._worldMeshes.push(...this._castle(mx, mz, {
            color: new BABYLON.Color3(0.7, 0.62, 0.5),
            roof: new BABYLON.Color3(0.75, 0.55, 0.1),
            scale: 1.25,
        }));
        this._worldMeshes.push(this._banner(mx, mz, `👑 ${me.username || 'You'}`, GOLD_BRIGHT));

        // Other players — red-roofed castles, pickable
        for (const p of players) {
            const px = snap(p.world_x), pz = snap(p.world_z);
            if (px === mx && pz === mz) continue;
            if (tileType(px / TILE, pz / TILE) === 'water') continue; // don't drown castles
            const meshes = this._castle(px, pz, {
                color: new BABYLON.Color3(0.5, 0.45, 0.42),
                roof: new BABYLON.Color3(0.55, 0.14, 0.12),
                scale: 1,
            });
            this._worldMeshes.push(...meshes);
            this._worldMeshes.push(this._banner(px, pz, p.username, '#e8b0a0'));

            const body = meshes[0];
            body.isPickable = true;
            body.actionManager = new BABYLON.ActionManager(this.scene);
            body.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger, () => this._info(p)));
        }
    }

    _buildUI() {
        const m = window.innerWidth < 768;
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("wUI", true, this.scene);
        this._ui = ui;

        // ── Top title bar (matches new HUD style) ──
        const bar = new BABYLON.GUI.Rectangle();
        bar.width = m ? "98%" : "46%";
        bar.height = m ? "40px" : "52px";
        bar.background = PANEL_BG;
        bar.thickness = 2; bar.color = GOLD;
        bar.cornerRadius = 10;
        bar.top = "8px";
        bar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        ui.addControl(bar);

        const title = new BABYLON.GUI.TextBlock();
        title.text = "🗺️  World Map";
        title.color = GOLD_BRIGHT;
        title.fontSize = m ? 15 : 22;
        title.fontFamily = SERIF; title.fontWeight = "bold";
        bar.addControl(title);

        // ── Back to Kingdom button (bottom center, matches nav style) ──
        const back = BABYLON.GUI.Button.CreateSimpleButton("back", "");
        back.width = m ? "64px" : "80px";
        back.height = m ? "56px" : "72px";
        back.background = "#00000000"; back.thickness = 0;
        back.top = "-10px";
        back.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        ui.addControl(back);

        const ring = new BABYLON.GUI.Ellipse();
        const rd = m ? 34 : 44;
        ring.width = `${rd}px`; ring.height = `${rd}px`;
        ring.background = "#2a1a08";
        ring.thickness = 2; ring.color = GOLD;
        ring.top = "-14%";
        back.addControl(ring);

        const ic = new BABYLON.GUI.TextBlock();
        ic.text = "🏰"; ic.fontSize = m ? 15 : 21;
        ring.addControl(ic);

        const lb = new BABYLON.GUI.TextBlock();
        lb.text = "Kingdom"; lb.color = IVORY;
        lb.fontSize = m ? 8 : 11; lb.fontFamily = SERIF;
        lb.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        lb.paddingBottom = "5px";
        back.addControl(lb);

        back.onPointerUpObservable.add(() => this.game.switchScene('kingdom'));
        back.onPointerEnterObservable.add(() => { ring.background = "#4a3010"; ring.thickness = 3; });
        back.onPointerOutObservable.add(() => { ring.background = "#2a1a08"; ring.thickness = 2; });

        // ── Hint text ──
        const hint = new BABYLON.GUI.TextBlock();
        hint.text = m ? "Tap a castle to inspect" : "Click a castle to inspect · Drag to pan · Scroll to zoom";
        hint.color = "#cbb890cc";
        hint.fontSize = m ? 10 : 13;
        hint.fontFamily = SERIF;
        hint.top = m ? "52px" : "66px";
        hint.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        ui.addControl(hint);
    }

    _info(data) {
        this._infoUI?.dispose();
        const { ui } = medievalPanel(this.scene);
        this._infoUI = ui;
        medievalTitle(ui, `👑 ${data.username}`);
        medievalText(ui, `Rank: #${data.battle_rank}\n⚔️ ${data.attack_soldiers} | 🛡️ ${data.defense_soldiers}`, "0%", "#ccb890");
        medievalBtn(ui, "atk", "⚔️ Attack", () => {
            this._infoUI?.dispose();
            this.game.switchScene('battle', { targetPlayer: data });
        }, "12%", "#3a1a1a");
        medievalBtn(ui, "spy", "🕵️ Spy", () => {
            this._infoUI?.dispose();
            this.game.switchScene('spyhq', { targetPlayer: data });
        }, "22%", "#1a1a3a");
    }

    deactivate() {
        this._ui?.dispose(); this._ui = null;
        this._infoUI?.dispose(); this._infoUI = null;
    }

    onPlayerUpdated(p) {}
}
