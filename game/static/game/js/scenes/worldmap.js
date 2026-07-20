/** World Map — epic painterly fantasy map (mountains, river, forests, walled cities). */
import { medievalPanel, medievalTitle, medievalBtn, medievalText } from '../ui/medieval.js';

const GOLD = '#c9a050';
const GOLD_BRIGHT = '#e8c060';
const PANEL_BG = '#140e06ee';
const IVORY = '#e8dcc0';
const SERIF = 'Georgia, serif';

const TILE = 4;
const MAP = 104;            // world units across
const HALF = MAP / 2;

function mat(scene, rgb, opts = {}) {
    const m = new BABYLON.StandardMaterial("wm", scene);
    m.diffuseColor = new BABYLON.Color3(...rgb);
    m.specularColor = BABYLON.Color3.Black();
    if (opts.alpha !== undefined) m.alpha = opts.alpha;
    if (opts.emissive) m.emissiveColor = new BABYLON.Color3(...opts.emissive);
    return m;
}

// ────────────────── Painterly map texture ──────────────────
// Painted features are recorded so 3D props can be placed on top.
function paintMap(scene) {
    const S = 2048;
    const tex = new BABYLON.DynamicTexture("mapTex", S, scene, true);
    const ctx = tex.getContext();
    const px = (wx) => ((wx + HALF) / MAP) * S;   // world → texture px
    const feats = { mountains: [], forests: [], river: [] };

    // ── Base: temperate grassland with sandy regions ──
    ctx.fillStyle = "#7fae54";
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 700; i++) {
        const x = Math.random() * S, y = Math.random() * S, r = 10 + Math.random() * 60;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const pick = Math.random();
        const col = pick < 0.45 ? "rgba(150,190,95,0.30)" : pick < 0.8 ? "rgba(95,145,70,0.30)" : "rgba(205,185,130,0.28)";
        g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // ── Sandy desert band (south-east) ──
    ctx.save();
    const desert = ctx.createRadialGradient(S * 0.78, S * 0.8, 0, S * 0.78, S * 0.8, S * 0.32);
    desert.addColorStop(0, "rgba(214,190,135,0.95)");
    desert.addColorStop(0.7, "rgba(210,185,128,0.6)");
    desert.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = desert;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();

    // ── River: winding from north-east to south ──
    const riverPts = [];
    let rx = S * 0.72, ry = -50;
    while (ry < S + 50) {
        riverPts.push([rx, ry]);
        feats.river.push([((rx / S) * MAP) - HALF, ((ry / S) * MAP) - HALF]);
        ry += 90 + Math.random() * 60;
        rx += (Math.random() - 0.45) * 160;
        rx = Math.max(S * 0.55, Math.min(S * 0.9, rx));
    }
    // banks
    ctx.strokeStyle = "#c9bd8f"; ctx.lineWidth = 46; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); riverPts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    // water
    ctx.strokeStyle = "#3f7fb8"; ctx.lineWidth = 34;
    ctx.beginPath(); riverPts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    // shimmer
    ctx.strokeStyle = "rgba(160,210,240,0.5)"; ctx.lineWidth = 10;
    ctx.beginPath(); riverPts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();

    // ── Mountain ranges: north edge + west spur ──
    const ranges = [
        { cx: S * 0.30, cy: S * 0.06, spread: S * 0.30, n: 16 },
        { cx: S * 0.06, cy: S * 0.35, spread: S * 0.22, n: 10 },
    ];
    for (const rg of ranges) {
        for (let i = 0; i < rg.n; i++) {
            const mx = rg.cx + (Math.random() - 0.5) * rg.spread;
            const my = rg.cy + (Math.random() - 0.5) * rg.spread * 0.4;
            const mw = 40 + Math.random() * 60, mh = mw * (0.9 + Math.random() * 0.5);
            // shaded mountain body
            ctx.fillStyle = "#8a8d96";
            ctx.beginPath();
            ctx.moveTo(mx - mw / 2, my + mh / 2); ctx.lineTo(mx, my - mh / 2); ctx.lineTo(mx + mw / 2, my + mh / 2);
            ctx.closePath(); ctx.fill();
            // shadow side
            ctx.fillStyle = "#6e7078";
            ctx.beginPath();
            ctx.moveTo(mx, my - mh / 2); ctx.lineTo(mx + mw / 2, my + mh / 2); ctx.lineTo(mx, my + mh / 2);
            ctx.closePath(); ctx.fill();
            // snow cap
            ctx.fillStyle = "#eef2f6";
            ctx.beginPath();
            ctx.moveTo(mx - mw * 0.14, my - mh * 0.18); ctx.lineTo(mx, my - mh / 2); ctx.lineTo(mx + mw * 0.14, my - mh * 0.18);
            ctx.closePath(); ctx.fill();
            feats.mountains.push([((mx / S) * MAP) - HALF, ((my / S) * MAP) - HALF]);
        }
    }

    // ── Forest clusters ──
    const forestSpots = [
        [S * 0.25, S * 0.45], [S * 0.4, S * 0.7], [S * 0.15, S * 0.75],
        [S * 0.55, S * 0.35], [S * 0.85, S * 0.4], [S * 0.35, S * 0.9],
    ];
    for (const [fx, fy] of forestSpots) {
        for (let i = 0; i < 14; i++) {
            const tx = fx + (Math.random() - 0.5) * 130;
            const ty = fy + (Math.random() - 0.5) * 110;
            ctx.fillStyle = "#2f6b2f";
            ctx.beginPath(); ctx.arc(tx, ty, 9 + Math.random() * 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#4c8a3c";
            ctx.beginPath(); ctx.arc(tx - 3, ty - 3, 5 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
        }
        feats.forests.push([((fx / S) * MAP) - HALF, ((fy / S) * MAP) - HALF]);
    }

    // ── Roads: cross through the center ──
    ctx.strokeStyle = "rgba(190,165,115,0.85)"; ctx.lineWidth = 14;
    ctx.setLineDash([26, 16]);
    ctx.beginPath(); ctx.moveTo(S * 0.05, S * 0.55); ctx.quadraticCurveTo(S * 0.5, S * 0.45, S * 0.95, S * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(S * 0.45, S * 0.08); ctx.quadraticCurveTo(S * 0.52, S * 0.5, S * 0.5, S * 0.95); ctx.stroke();
    ctx.setLineDash([]);

    // subtle vignette
    const vg = ctx.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(40,30,10,0.25)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S);

    tex.update();
    tex.hasAlpha = false;
    return { tex, feats };
}

// ────────────────── Scene ──────────────────

export class WorldMapScene {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.scene = new BABYLON.Scene(engine);
        this.scene.clearColor = new BABYLON.Color4(0.45, 0.6, 0.85, 1);
        this._world = [];
        this._ui = null;
        this._infoUI = null;
        this._setupScene();
    }

    _setupScene() {
        const s = this.scene;

        // Mostly top-down camera, gentle tilt — like the reference
        this.camera = new BABYLON.ArcRotateCamera("wC", -Math.PI / 2, 0.75, 70, new BABYLON.Vector3(0, 0, 0), s);
        this.camera.lowerRadiusLimit = 25;
        this.camera.upperRadiusLimit = 120;
        this.camera.lowerBetaLimit = 0.35;
        this.camera.upperBetaLimit = 1.25;
        this.camera.panningSensibility = 50;
        this.camera.attachControl(true);

        const sun = new BABYLON.DirectionalLight("wSun", new BABYLON.Vector3(-0.3, -1, 0.2), s);
        sun.intensity = 0.85;
        sun.position = new BABYLON.Vector3(30, 80, -20);
        new BABYLON.HemisphericLight("wL", new BABYLON.Vector3(0, 1, 0), s).intensity = 0.6;

        // Painted map ground
        const { tex, feats } = paintMap(s);
        this._feats = feats;
        const ground = BABYLON.MeshBuilder.CreateGround("map", { width: MAP, height: MAP }, s);
        const gm = new BABYLON.StandardMaterial("mapM", s);
        gm.diffuseTexture = tex;
        gm.specularColor = BABYLON.Color3.Black();
        ground.material = gm;
        ground.isPickable = false;

        this._buildProps();
        this._buildGrid();
    }

    /** 3D props on top of painted features, for depth. */
    _buildProps() {
        const s = this.scene;

        // Mountains — gray cones with snow caps on painted range spots
        for (const [mx, mz] of this._feats.mountains) {
            if (Math.random() < 0.4) continue; // texture carries most; props accent
            const h = 3 + Math.random() * 2.5;
            const m = BABYLON.MeshBuilder.CreateCylinder("mt", { height: h, diameterTop: 0, diameterBottom: h * 1.4, tessellation: 5 }, s);
            m.position = new BABYLON.Vector3(mx, h / 2 - 0.1, mz);
            m.material = mat(s, [0.52, 0.53, 0.58]);
            const cap = BABYLON.MeshBuilder.CreateCylinder("mc", { height: h * 0.3, diameterTop: 0, diameterBottom: h * 0.45, tessellation: 5 }, s);
            cap.position = new BABYLON.Vector3(mx, h - h * 0.15, mz);
            cap.material = mat(s, [0.93, 0.95, 0.98]);
            this._world.push(m, cap);
        }

        // Forests — clusters of pines
        for (const [fx, fz] of this._feats.forests) {
            const n = 4 + Math.floor(Math.random() * 4);
            for (let i = 0; i < n; i++) {
                const x = fx + (Math.random() - 0.5) * 5;
                const z = fz + (Math.random() - 0.5) * 4;
                const sc = 0.9 + Math.random() * 0.6;
                const trunk = BABYLON.MeshBuilder.CreateCylinder("tr", { height: 0.8 * sc, diameter: 0.16 * sc }, s);
                trunk.position = new BABYLON.Vector3(x, 0.4 * sc, z);
                trunk.material = mat(s, [0.32, 0.2, 0.1]);
                const cone = BABYLON.MeshBuilder.CreateCylinder("tc", { height: 1.6 * sc, diameterTop: 0, diameterBottom: 1.3 * sc }, s);
                cone.position = new BABYLON.Vector3(x, 0.8 * sc + 0.8 * sc, z);
                cone.material = mat(s, [0.1, 0.35, 0.12]);
                this._world.push(trunk, cone);
            }
        }
    }

    /** Subtle grid lines across the map (tile coordinates). */
    _buildGrid() {
        const s = this.scene;
        const lines = [];
        for (let i = -HALF; i <= HALF; i += TILE) {
            lines.push([new BABYLON.Vector3(i, 0.06, -HALF), new BABYLON.Vector3(i, 0.06, HALF)]);
            lines.push([new BABYLON.Vector3(-HALF, 0.06, i), new BABYLON.Vector3(HALF, 0.06, i)]);
        }
        const grid = BABYLON.MeshBuilder.CreateLineSystem("grid", { lines }, s);
        grid.color = new BABYLON.Color3(1, 1, 1);
        grid.alpha = 0.08;
        this._world.push(grid);
    }

    /** Territory highlight tiles around the player's city (like the reference). */
    _highlightTiles(cx, cz) {
        const s = this.scene;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const t = BABYLON.MeshBuilder.CreateGround("hl", { width: TILE - 0.25, height: TILE - 0.25 }, s);
                t.position = new BABYLON.Vector3(cx + dx * TILE, 0.08, cz + dz * TILE);
                const own = dx === 0 && dz === 0;
                t.material = mat(s, own ? [0.9, 0.8, 0.2] : [0.55, 0.85, 0.3], { alpha: own ? 0.4 : 0.22 });
                this._dynamic.push(t);
            }
        }
    }

    /** Dashed marching route from your city to a spot (army movement flavor). */
    _marchingRoute(x1, z1, x2, z2) {
        const s = this.scene;
        const mid = new BABYLON.Vector3((x1 + x2) / 2, 0.3, (z1 + z2) / 2 - 3);
        const curve = BABYLON.Curve3.CreateQuadraticBezier(
            new BABYLON.Vector3(x1, 0.3, z1), mid, new BABYLON.Vector3(x2, 0.3, z2), 24);
        const dash = BABYLON.MeshBuilder.CreateDashedLines("route", { points: curve.getPoints(), dashSize: 0.5, gapSize: 0.4 }, s);
        dash.color = new BABYLON.Color3(0.3, 0.75, 1);
        dash.alpha = 0.9;
        this._dynamic.push(dash);

        // Little marching army marker (3 soldiers)
        for (let i = 0; i < 3; i++) {
            const p = curve.getPoints()[6 + i * 4];
            const body = BABYLON.MeshBuilder.CreateCylinder("sol", { height: 0.7, diameterTop: 0.18, diameterBottom: 0.26 }, s);
            body.position = new BABYLON.Vector3(p.x, 0.35, p.z);
            body.material = mat(s, [0.75, 0.15, 0.1]);
            const head = BABYLON.MeshBuilder.CreateSphere("sh", { diameter: 0.22 }, s);
            head.position = new BABYLON.Vector3(p.x, 0.8, p.z);
            head.material = mat(s, [0.85, 0.7, 0.55]);
            this._dynamic.push(body, head);
        }
    }

    // ── Cities ──

    _city(x, z, opts) {
        const s = this.scene;
        const { wall = [0.72, 0.68, 0.6], roof = [0.3, 0.26, 0.55], scale = 1 } = opts;
        const parts = [];

        // City wall square
        const w = 3.4 * scale;
        for (const [wx, wz, rw, rd] of [
            [0, -w / 2, w, 0.3], [0, w / 2, w, 0.3],
            [-w / 2, 0, 0.3, w], [w / 2, 0, 0.3, w]]) {
            const seg = BABYLON.MeshBuilder.CreateBox("cw", { width: rw, height: 0.7 * scale, depth: rd }, s);
            seg.position = new BABYLON.Vector3(x + wx, 0.35 * scale, z + wz);
            seg.material = mat(s, wall);
            parts.push(seg);
        }
        // Corner towers
        for (const [tx, tz] of [[-w / 2, -w / 2], [w / 2, -w / 2], [-w / 2, w / 2], [w / 2, w / 2]]) {
            const t = BABYLON.MeshBuilder.CreateCylinder("ct", { height: 1.2 * scale, diameter: 0.5 * scale }, s);
            t.position = new BABYLON.Vector3(x + tx, 0.6 * scale, z + tz);
            t.material = mat(s, wall);
            parts.push(t);
            const tr = BABYLON.MeshBuilder.CreateCylinder("ctr", { height: 0.5 * scale, diameterTop: 0, diameterBottom: 0.7 * scale }, s);
            tr.position = new BABYLON.Vector3(x + tx, 1.45 * scale, z + tz);
            tr.material = mat(s, roof);
            parts.push(tr);
        }
        // Inner keep + houses
        const keep = BABYLON.MeshBuilder.CreateBox("ck", { width: 1.2 * scale, height: 1.3 * scale, depth: 1.2 * scale }, s);
        keep.position = new BABYLON.Vector3(x, 0.65 * scale, z);
        keep.material = mat(s, [0.85, 0.8, 0.68]);
        parts.push(keep);
        const kr = BABYLON.MeshBuilder.CreateCylinder("ckr", { height: 0.7 * scale, diameterTop: 0, diameterBottom: 1.5 * scale, tessellation: 4 }, s);
        kr.rotation.y = Math.PI / 4;
        kr.position = new BABYLON.Vector3(x, 1.65 * scale, z);
        kr.material = mat(s, roof);
        parts.push(kr);
        for (const [hx, hz] of [[-1, 0.8], [1, -0.7], [0.9, 0.9]]) {
            const h = BABYLON.MeshBuilder.CreateBox("ch", { width: 0.7 * scale, height: 0.5 * scale, depth: 0.6 * scale }, s);
            h.position = new BABYLON.Vector3(x + hx * scale, 0.25 * scale, z + hz * scale);
            h.material = mat(s, [0.8, 0.74, 0.62]);
            parts.push(h);
        }
        return { parts, keep };
    }

    _namePlate(x, z, text, color = 'white', y = 3.2) {
        const s = this.scene;
        const p = BABYLON.MeshBuilder.CreatePlane("np", { width: 5, height: 1.1 }, s);
        p.position = new BABYLON.Vector3(x, y, z);
        p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        p.isPickable = false;
        const dt = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(p, 512, 112);
        const bg = new BABYLON.GUI.Rectangle();
        bg.width = "100%"; bg.height = "100%";
        bg.background = "#140e06d0";
        bg.cornerRadius = 24;
        bg.thickness = 3; bg.color = GOLD;
        dt.addControl(bg);
        const tb = new BABYLON.GUI.TextBlock();
        tb.text = text; tb.color = color;
        tb.fontSize = 42; tb.fontFamily = SERIF; tb.fontWeight = "bold";
        tb.outlineColor = "black"; tb.outlineWidth = 3;
        bg.addControl(tb);
        return p;
    }

    // ── Lifecycle ──

    async activate() {
        this._clearDynamic();
        try {
            const d = await this.game.api.getWorldPlayers();
            this._populate(d.players || []);
        } catch (e) { /* terrain only */ }
        this._buildUI();
    }

    _clearDynamic() {
        for (const m of this._dynamic || []) m.dispose();
        this._dynamic = [];
        this._ui?.dispose(); this._ui = null;
        this._infoUI?.dispose(); this._infoUI = null;
    }

    _populate(players) {
        this._dynamic = [];
        const me = this.game.player;
        const snap = (v) => Math.round(v / TILE) * TILE;
        const mx = snap(me.world_x || 0), mz = snap(me.world_z || 0);

        // Own city — gold roof, territory highlight, route to nearest rival
        this._highlightTiles(mx, mz);
        const myCity = this._city(mx, mz, { roof: [0.75, 0.55, 0.1], scale: 1.3 });
        this._dynamic.push(...myCity.parts);
        this._dynamic.push(this._namePlate(mx, mz, `👑 ${me.username || 'You'}`, GOLD_BRIGHT, 4.2));

        let nearest = null, nd = 1e9;
        const placed = [];
        for (const p of players) {
            const px = snap(p.world_x || 0), pz = snap(p.world_z || 0);
            if (px === mx && pz === mz) continue;
            if (placed.some(([ax, az]) => Math.hypot(ax - px, az - pz) < TILE)) continue;
            placed.push([px, pz]);
            const city = this._city(px, pz, { roof: [0.55, 0.14, 0.12], scale: 1 });
            this._dynamic.push(...city.parts);
            this._dynamic.push(this._namePlate(px, pz, p.username, '#e8b0a0'));
            const d2 = (px - mx) ** 2 + (pz - mz) ** 2;
            if (d2 < nd) { nd = d2; nearest = [px, pz]; }

            city.keep.isPickable = true;
            city.keep.actionManager = new BABYLON.ActionManager(this.scene);
            city.keep.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger, () => this._info(p)));
        }
        if (nearest && nd < 2500) this._marchingRoute(mx, mz, nearest[0], nearest[1]);
    }

    _buildUI() {
        const m = window.innerWidth < 768;
        const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("wUI", true, this.scene);
        this._ui = ui;

        // Top title bar
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

        // Back-to-kingdom medallion
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
        ring.background = "#2a1a08"; ring.thickness = 2; ring.color = GOLD;
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

        const hint = new BABYLON.GUI.TextBlock();
        hint.text = m ? "Tap a city to inspect · drag to explore" : "Click a city to inspect · Drag to pan · Scroll to zoom";
        hint.color = "#2a2010";
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
