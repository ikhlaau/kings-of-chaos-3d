/** Medieval-themed Babylon.js GUI utilities. */

const GOLD = '#c9a050';
const AMBER = '#d4881e';
const PARCHMENT = '#2a2218';
const DARK_STONE = '#1a1612';
const BLOOD = '#8b2020';
const ROYAL = '#2a1a4a';

export function isMobile() { return window.innerWidth < 768; }

export function medievalPanel(scene) {
    const r = isMobile();
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("mUI", true, scene);

    // Stone wall background
    const bg = new BABYLON.GUI.Rectangle();
    bg.width = "100%"; bg.height = "100%";
    bg.background = DARK_STONE;
    bg.alpha = 0.85;
    ui.addControl(bg);

    // Parchment scroll in center
    const scroll = new BABYLON.GUI.Rectangle();
    scroll.width = r ? `${Math.min(window.innerWidth-24, 340)}px` : '420px';
    scroll.height = r ? `${Math.min(window.innerHeight-100, 480)}px` : '460px';
    scroll.background = PARCHMENT;
    scroll.cornerRadius = 16;
    scroll.thickness = 3;
    scroll.color = GOLD;
    scroll.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    ui.addControl(scroll);

    // Gold trim top
    const topTrim = new BABYLON.GUI.Rectangle();
    topTrim.width = "100%"; topTrim.height = "4px";
    topTrim.background = GOLD;
    topTrim.top = "-48%"; topTrim.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    ui.addControl(topTrim);

    return { ui, scroll, r };
}

export function medievalTitle(ui, text, top) {
    const t = new BABYLON.GUI.TextBlock();
    t.text = text;
    t.color = GOLD;
    t.fontSize = isMobile() ? 22 : 28;
    t.fontFamily = "Georgia, serif";
    t.top = top || "-38%";
    t.textWrapping = true;
    ui.addControl(t);
    // Decorative line under title
    const line = new BABYLON.GUI.Rectangle();
    line.width = "60%"; line.height = "2px";
    line.background = GOLD;
    line.top = top ? `${parseInt(top)+4}%` : "-34%";
    line.alpha = 0.6;
    ui.addControl(line);
    return t;
}

export function medievalBtn(ui, name, label, onClick, top, bgColor) {
    const r = isMobile();
    const btn = BABYLON.GUI.Button.CreateSimpleButton(name, label);
    btn.width = r ? `${Math.min(window.innerWidth-60, 280)}px` : '340px';
    btn.height = r ? '46px' : '54px';
    btn.color = GOLD;
    btn.background = bgColor || '#2a1a0a';
    btn.cornerRadius = 8;
    btn.thickness = 2;
    btn.fontSize = r ? 14 : 17;
    btn.fontFamily = "Georgia, serif";
    btn.top = top;
    if (onClick) {
        btn.onPointerUpObservable.add(onClick);
        btn.onPointerEnterObservable.add(() => { btn.background = '#3a2a10'; btn.thickness = 3; });
        btn.onPointerOutObservable.add(() => { btn.background = bgColor || '#2a1a0a'; btn.thickness = 2; });
    } else {
        btn.background = '#1a1a1a';
        btn.color = '#666';
    }
    ui.addControl(btn);
    return btn;
}

export function medievalInput(ui, placeholder, top) {
    const r = isMobile();
    const inp = new BABYLON.GUI.InputText();
    inp.width = r ? `${Math.min(window.innerWidth-60, 280)}px` : '340px';
    inp.height = r ? '46px' : '48px';
    inp.placeholderText = placeholder;
    inp.color = GOLD;
    inp.background = '#1a1208';
    inp.focusedBackground = '#2a1a0a';
    inp.fontSize = r ? 14 : 16;
    inp.fontFamily = "Georgia, serif";
    inp.top = top;
    inp.thickness = 1;
    inp.color = GOLD;
    ui.addControl(inp);
    return inp;
}

export function medievalText(ui, text, top, color) {
    const t = new BABYLON.GUI.TextBlock();
    t.text = text;
    t.color = color || '#ccb890';
    t.fontSize = isMobile() ? 13 : 15;
    t.fontFamily = "Georgia, serif";
    t.top = top;
    t.textWrapping = true;
    t.resizeToFit = true;
    ui.addControl(t);
    return t;
}

export { GOLD, AMBER, PARCHMENT, BLOOD };
