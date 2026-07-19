/** Responsive 3D Heads-Up Display using Babylon.js GUI. */

export class HUD {
    constructor(scene, player, game) {
        this.game = game;
        this.scene = scene;
        this.player = player;

        this.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("HUD", true, scene);
        this._isMobile = window.innerWidth < 768;
        this._build(player);
        window.addEventListener('resize', () => {
            const was = this._isMobile;
            this._isMobile = window.innerWidth < 768;
            if (was !== this._isMobile) {
                this.texture.clearControls();
                this._build(player);
            }
        });
    }

    _build(player) {
        const m = this._isMobile;
        const fs = m ? 12 : 18;
        const fsSmall = m ? 10 : 14;
        const fsLarge = m ? 14 : 20;
        const topY = m ? "-47%" : "-46%";

        // ── Top bar: resources ──
        this.goldText = this._label("💰 0", "gold", m ? "-40%" : "-42%", topY, fs);
        this.turnsText = this._label("⚡ 0/0", "cyan", m ? "-22%" : "-28%", topY, fs);
        this.rankText = this._label("🏆 #0", "white", m ? "-5%" : "-14%", topY, fs);
        if (!m) {
            this.armyText = this._label("⚔️ 0 / 🛡️ 0", "#ddd", "0%", topY, fsSmall);
            this.citizensText = this._label("👥 0", "#aaa", "-42%", "44%", fsSmall);
            this.spyText = this._label("🕵️ 0 spies", "#aaa", "-28%", "44%", fsSmall);
        }

        // ── Bottom bar: action buttons ──
        const btnY = m ? "44%" : "42%";
        const btnW = m ? "55px" : "100px";
        const btnH = m ? "28px" : "38px";
        const btnFS = m ? 9 : 14;
        const spacing = m ? -20 : -34;

        let left = m ? -43 : -45;
        this._button("🗺️", m ? "🗺️" : "🗺️ World", left, btnY, btnW, btnH, btnFS, () => game.switchScene('worldmap'));
        left += spacing;
        this._button("⚔️", m ? "⚔️" : "⚔️ Battle", left, btnY, btnW, btnH, btnFS, () => game.switchScene('battle'));
        left += spacing;
        this._button("🎯", m ? "🎯" : "🎯 Train", left, btnY, btnW, btnH, btnFS, () => game.switchScene('training'));
        left += spacing;
        this._button("🔧", m ? "🔧" : "🔧 Armory", left, btnY, btnW, btnH, btnFS, () => game.switchScene('armory'));
        left += spacing;
        this._button("🕵️", m ? "🕵️" : "🕵️ Spy", left, btnY, btnW, btnH, btnFS, () => game.switchScene('spyhq'));
        left += spacing;
        this._button(m ? "🏦" : "🏦 Bank", m ? "🏦" : "🏦 Bank", left, btnY, btnW, btnH, btnFS, () => this._handleBank());

        // Logout
        this._button("🚪", m ? "🚪" : "🚪 Leave", m ? "43%" : "42%", btnY, m ? "38px" : "80px", btnH, btnFS, () => {
            window.location.href = '/logout/';
        });

        this.update(this.player || player);
    }

    _label(text, color, left, top, fontSize) {
        const t = new BABYLON.GUI.TextBlock();
        t.text = text;
        t.color = color;
        t.fontSize = fontSize;
        t.left = left;
        t.top = top;
        t.fontFamily = "monospace";
        t.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        t.resizeToFit = true;
        this.texture.addControl(t);
        return t;
    }

    _button(icon, text, left, top, width, height, fontSize, onClick) {
        const btn = BABYLON.GUI.Button.CreateSimpleButton(text, text);
        btn.width = width;
        btn.height = height;
        btn.color = "white";
        btn.background = "#2a2a3a";
        btn.left = `${left}%`;
        btn.top = top;
        btn.cornerRadius = 6;
        btn.thickness = 1;
        btn.fontSize = fontSize;
        btn.onPointerUpObservable.add(onClick);
        btn.onPointerEnterObservable.add(() => { btn.background = "#3a3a5a"; });
        btn.onPointerOutObservable.add(() => { btn.background = "#2a2a3a"; });
        this.texture.addControl(btn);
        return btn;
    }

    update(player) {
        this.player = player;
        const m = this._isMobile;
        this.goldText.text = `💰 ${this._fmt(player.gold)}`;
        this.turnsText.text = m ? `⚡${player.turns}` : `⚡ ${player.turns}/${player.max_turns}`;
        this.rankText.text = m ? `🏆#${player.battle_rank}` : `🏆 Rank #${player.battle_rank}`;
        if (this.armyText) this.armyText.text = `⚔️ ${this._fmt(player.attack_soldiers)} / 🛡️ ${this._fmt(player.defense_soldiers)}`;
        if (this.citizensText) this.citizensText.text = `👥 ${this._fmt(player.citizens)}`;
        if (this.spyText) this.spyText.text = `🕵️ ${this._fmt(player.spies)} spies`;
    }

    async _handleBank() {
        const amount = prompt("Enter amount (+ deposit, - withdraw):");
        if (!amount) return;
        const val = parseInt(amount);
        try {
            if (val > 0) {
                const res = await this.game.api.bank('deposit', val);
                this.update(res.player);
                this.game.player = res.player;
                this.game.currentScene?.onPlayerUpdated?.(res.player);
            } else if (val < 0) {
                const res = await this.game.api.bank('withdraw', Math.abs(val));
                this.update(res.player);
                this.game.player = res.player;
                this.game.currentScene?.onPlayerUpdated?.(res.player);
            }
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
