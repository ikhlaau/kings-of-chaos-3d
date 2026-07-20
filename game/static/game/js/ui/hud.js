/** MMORTS-style Heads-Up Display using Babylon.js GUI.
 *  Layout (inspired by classic medieval strategy games):
 *  - Top: ornate dark bar with gold trim holding resource "pills"
 *  - Bottom: navigation bar with round gold-ringed buttons
 *  - Right edge: circular utility buttons (bank, logout)
 */

const GOLD = '#c9a050';
const GOLD_BRIGHT = '#e8c060';
const DARK_WOOD = '#1a1208';
const PANEL_BG = '#140e06ee';
const PILL_BG = '#241808';
const IVORY = '#e8dcc0';
const SERIF = 'Georgia, serif';

function isMobile() { return window.innerWidth < 768; }

export class HUD {
    constructor(scene, player, game) {
        this.game = game;
        this.scene = scene;
        this.player = player;

        this.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("HUD", true, scene);
        this._isMobile = isMobile();
        this._build(player);
        window.addEventListener('resize', () => {
            const was = this._isMobile;
            this._isMobile = isMobile();
            if (was !== this._isMobile) {
                this.texture.clearControls();
                this._build(this.player || player);
            }
        });
    }

    // ───────────────────────── layout ─────────────────────────

    _build(player) {
        const m = this._isMobile;
        this._stats = {};
        this._buildTopBar(m);
        this._buildBottomNav(m);
        this._buildSideButtons(m);
        this.update(this.player || player);
    }

    /** Top resource bar: ornate bar + segmented pills. */
    _buildTopBar(m) {
        const barH = m ? 40 : 52;
        const barW = m ? 0.98 : 0.72;

        // Main bar
        const bar = new BABYLON.GUI.Rectangle("topBar");
        bar.width = `${barW * 100}%`;
        bar.height = `${barH}px`;
        bar.background = PANEL_BG;
        bar.thickness = 2;
        bar.color = GOLD;
        bar.cornerRadius = 10;
        bar.top = "8px";
        bar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.texture.addControl(bar);

        // Inner gold highlight line (top edge ornament)
        const trim = new BABYLON.GUI.Rectangle();
        trim.width = "96%"; trim.height = "2px";
        trim.background = GOLD_BRIGHT; trim.alpha = 0.5;
        trim.top = "4px"; trim.thickness = 0;
        trim.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        bar.addControl(trim);

        // Resource pills inside the bar (StackPanel for even spacing)
        const stack = new BABYLON.GUI.StackPanel("resStack");
        stack.isVertical = false;
        stack.width = "100%";
        stack.height = "100%";
        stack.spacing = m ? 2 : 8;
        bar.addControl(stack);

        const defs = m
            ? [ ["gold", "💰", GOLD_BRIGHT], ["turns", "⚡", "#7ec8ff"], ["rank", "🏆", "#ffffff"], ["army", "⚔️", "#e0a0a0"] ]
            : [ ["gold", "💰", GOLD_BRIGHT], ["turns", "⚡", "#7ec8ff"], ["rank", "🏆", "#ffffff"],
                ["army", "⚔️", "#e0a0a0"], ["citizens", "👥", "#b0d0b0"], ["spies", "🕵️", "#c0b0e0"] ];

        for (const [key, icon, color] of defs) {
            this._stats[key] = this._pill(stack, key, icon, color, m, barH);
        }
    }

    /** A single resource pill: rounded rect with icon + value. */
    _pill(parent, key, icon, color, m, barH) {
        const w = m ? 76 : 118;
        const pill = new BABYLON.GUI.Rectangle(`pill_${key}`);
        pill.width = `${w}px`;
        pill.height = `${barH - 12}px`;
        pill.background = PILL_BG;
        pill.thickness = 1;
        pill.color = "#6a5228";
        pill.cornerRadius = (barH - 12) / 2;
        pill.paddingLeft = "2px";
        pill.paddingRight = "2px";
        parent.addControl(pill);

        const grid = new BABYLON.GUI.Grid();
        grid.addColumnDefinition(m ? 0.42 : 0.36);
        grid.addColumnDefinition(m ? 0.58 : 0.64);
        pill.addControl(grid);

        const ic = new BABYLON.GUI.TextBlock();
        ic.text = icon;
        ic.fontSize = m ? 13 : 19;
        grid.addControl(ic, 0, 0);

        const val = new BABYLON.GUI.TextBlock(`val_${key}`);
        val.text = "0";
        val.color = color;
        val.fontSize = m ? 11 : 16;
        val.fontFamily = SERIF;
        val.fontWeight = "bold";
        val.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        grid.addControl(val, 0, 1);

        return val;
    }

    /** Bottom navigation bar with round ornate buttons. */
    _buildBottomNav(m) {
        const barH = m ? 64 : 84;

        const bar = new BABYLON.GUI.Rectangle("navBar");
        bar.width = m ? "98%" : "56%";
        bar.height = `${barH}px`;
        bar.background = PANEL_BG;
        bar.thickness = 2;
        bar.color = GOLD;
        bar.cornerRadius = 12;
        bar.top = "-8px";
        bar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.texture.addControl(bar);

        const trim = new BABYLON.GUI.Rectangle();
        trim.width = "96%"; trim.height = "2px";
        trim.background = GOLD_BRIGHT; trim.alpha = 0.5;
        trim.top = "4px"; trim.thickness = 0;
        trim.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        bar.addControl(trim);

        const stack = new BABYLON.GUI.StackPanel("navStack");
        stack.isVertical = false;
        stack.width = "100%";
        stack.height = "100%";
        stack.spacing = m ? 2 : 6;
        bar.addControl(stack);

        const items = [
            ["worldmap", "🗺️", "World"],
            ["battle",   "⚔️", "Battle"],
            ["training", "🎯", "Train"],
            ["armory",   "🔧", "Armory"],
            ["spyhq",    "🕵️", "Spy"],
        ];

        for (const [sceneName, icon, label] of items) {
            this._navButton(stack, icon, label, m, barH,
                () => this.game.switchScene(sceneName));
        }
        // Bank lives in the nav bar too (like ref games put "City" last)
        this._navButton(stack, "🏦", "Bank", m, barH, () => this._handleBank());
    }

    /** Round gold-ringed nav button with label beneath the icon. */
    _navButton(parent, icon, label, m, barH, onClick) {
        const d = m ? 52 : 66; // button cell width
        const btn = BABYLON.GUI.Button.CreateSimpleButton(`nav_${label}`, "");
        btn.width = `${d}px`;
        btn.height = `${barH - 8}px`;
        btn.background = "#00000000";
        btn.thickness = 0;
        parent.addControl(btn);

        // Circular medallion
        const ring = new BABYLON.GUI.Ellipse();
        const ringD = m ? 34 : 44;
        ring.width = `${ringD}px`;
        ring.height = `${ringD}px`;
        ring.background = "#2a1a08";
        ring.thickness = 2;
        ring.color = GOLD;
        ring.top = m ? "-16%" : "-14%";
        btn.addControl(ring);

        const ic = new BABYLON.GUI.TextBlock();
        ic.text = icon;
        ic.fontSize = m ? 15 : 21;
        ring.addControl(ic);

        const lb = new BABYLON.GUI.TextBlock();
        lb.text = label;
        lb.color = IVORY;
        lb.fontSize = m ? 8 : 11;
        lb.fontFamily = SERIF;
        lb.top = m ? "26%" : "24%";
        lb.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        lb.paddingBottom = "4px";
        btn.addControl(lb);

        btn.onPointerUpObservable.add(onClick);
        btn.onPointerEnterObservable.add(() => {
            ring.background = "#4a3010"; ring.thickness = 3; ring.color = GOLD_BRIGHT;
        });
        btn.onPointerOutObservable.add(() => {
            ring.background = "#2a1a08"; ring.thickness = 2; ring.color = GOLD;
        });
        return btn;
    }

    /** Circular utility buttons on the right edge (like ref 1). */
    _buildSideButtons(m) {
        const d = m ? 38 : 48;
        const mk = (icon, topPct, tint, onClick) => {
            const btn = BABYLON.GUI.Button.CreateSimpleButton(`side_${icon}`, "");
            btn.width = `${d}px`; btn.height = `${d}px`;
            btn.background = "#00000000"; btn.thickness = 0;
            btn.left = "-12px";
            btn.top = topPct;
            btn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            btn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.texture.addControl(btn);

            const ring = new BABYLON.GUI.Ellipse();
            ring.width = "100%"; ring.height = "100%";
            ring.background = PANEL_BG;
            ring.thickness = 2; ring.color = tint;
            btn.addControl(ring);

            const ic = new BABYLON.GUI.TextBlock();
            ic.text = icon; ic.fontSize = m ? 15 : 19;
            ring.addControl(ic);

            btn.onPointerUpObservable.add(onClick);
            btn.onPointerEnterObservable.add(() => { ring.thickness = 3; });
            btn.onPointerOutObservable.add(() => { ring.thickness = 2; });
            return btn;
        };

        // Messages / help placeholder (top) and logout (below)
        mk("💬", m ? "60px" : "72px", GOLD, () => {
            // Reserved for messages/notifications
        });
        mk("🚪", m ? `${60 + d + 8}px` : `${72 + d + 10}px`, "#a05040",
            () => { window.location.href = '/logout/'; });
    }

    // ───────────────────────── data ─────────────────────────

    update(player) {
        this.player = player;
        const s = this._stats;
        if (!s) return;
        const m = this._isMobile;
        if (s.gold) s.gold.text = this._fmt(player.gold);
        if (s.turns) s.turns.text = m ? `${player.turns}` : `${player.turns}/${player.max_turns}`;
        if (s.rank) s.rank.text = `#${player.battle_rank}`;
        if (s.army) s.army.text = m
            ? this._fmt(player.attack_soldiers)
            : `${this._fmt(player.attack_soldiers)}/${this._fmt(player.defense_soldiers)}`;
        if (s.citizens) s.citizens.text = this._fmt(player.citizens);
        if (s.spies) s.spies.text = this._fmt(player.spies);
    }

    async _handleBank() {
        const amount = prompt("Enter amount (+ deposit, - withdraw):");
        if (!amount) return;
        const val = parseInt(amount);
        try {
            const res = val > 0
                ? await this.game.api.bank('deposit', val)
                : await this.game.api.bank('withdraw', Math.abs(val));
            this.update(res.player);
            this.game.player = res.player;
            this.game.currentScene?.onPlayerUpdated?.(res.player);
        } catch (e) {
            alert(e.message);
        }
    }

    _fmt(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    }

    dispose() {
        this.texture.dispose();
    }
}
