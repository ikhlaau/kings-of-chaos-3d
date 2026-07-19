/** 3D Heads-Up Display using Babylon.js GUI. */

export class HUD {
    constructor(scene, player, game) {
        this.game = game;
        this.scene = scene;
        this.player = player;

        this.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("HUD", true, scene);

        // ── Top bar: resources ──
        this.goldText = this._label("💰 0", "gold", "-42%", "-46%", 18);
        this.turnsText = this._label("⚡ 0/0", "cyan", "-28%", "-46%", 18);
        this.rankText = this._label("🏆 Rank #0", "white", "-14%", "-46%", 18);
        this.armyText = this._label("⚔️ 0 / 🛡️ 0", "#ddd", "0%", "-46%", 14);

        // ── Bottom left: quick stats ──
        this.citizensText = this._label("👥 0 citizens", "#aaa", "-42%", "44%", 14);
        this.spyText = this._label("🕵️ 0 spies", "#aaa", "-28%", "44%", 14);

        // ── Bottom bar: action buttons ──
        const btnY = "42%";
        const btnW = "100px";
        const btnH = "38px";
        const spacing = -34;

        let left = -45;
        this._button("🗺️ World", `${left}%`, btnY, btnW, btnH, () => game.switchScene('worldmap'));
        left += spacing;
        this._button("⚔️ Battle", `${left}%`, btnY, btnW, btnH, () => game.switchScene('battle'));
        left += spacing;
        this._button("🎯 Train", `${left}%`, btnY, btnW, btnH, () => game.switchScene('training'));
        left += spacing;
        this._button("🔧 Armory", `${left}%`, btnY, btnW, btnH, () => game.switchScene('armory'));
        left += spacing;
        this._button("🕵️ Spy", `${left}%`, btnY, btnW, btnH, () => game.switchScene('spyhq'));
        left += spacing;
        this._button("🏦 Bank", `${left}%`, btnY, btnW, btnH, () => this._handleBank());

        // ── Right: logout ──
        this._button("🚪 Leave", "42%", btnY, "80px", btnH, () => {
            window.location.href = '/logout/';
        });

        this.update(player);
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
        this.texture.addControl(t);
        return t;
    }

    _button(text, left, top, width, height, onClick) {
        const btn = BABYLON.GUI.Button.CreateSimpleButton(text, text);
        btn.width = width;
        btn.height = height;
        btn.color = "white";
        btn.background = "#2a2a3a";
        btn.left = left;
        btn.top = top;
        btn.cornerRadius = 6;
        btn.thickness = 1;
        btn.fontSize = 14;
        btn.onPointerUpObservable.add(onClick);
        btn.onPointerEnterObservable.add(() => { btn.background = "#3a3a5a"; });
        btn.onPointerOutObservable.add(() => { btn.background = "#2a2a3a"; });
        this.texture.addControl(btn);
        return btn;
    }

    update(player) {
        this.player = player;
        this.goldText.text = `💰 ${this._fmt(player.gold)}`;
        this.turnsText.text = `⚡ ${player.turns}/${player.max_turns}`;
        this.rankText.text = `🏆 Rank #${player.battle_rank}`;
        this.armyText.text = `⚔️ ${this._fmt(player.attack_soldiers)} / 🛡️ ${this._fmt(player.defense_soldiers)}`;
        this.citizensText.text = `👥 ${this._fmt(player.citizens)} citizens`;
        this.spyText.text = `🕵️ ${this._fmt(player.spies)} spies`;
    }

    async _handleBank() {
        const amount = prompt("Enter amount to deposit (positive) or withdraw (negative):");
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
