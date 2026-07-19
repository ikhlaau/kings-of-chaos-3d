/** Responsive sizing utilities for Babylon.js GUI. */

const MOBILE_BREAKPOINT = 768;

export function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

export function responsive() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = w < MOBILE_BREAKPOINT;

    return {
        mobile,
        w, h,
        // Panel sizing
        panelW: mobile ? `${Math.min(w - 32, 340)}px` : '400px',
        panelH: mobile ? `${Math.min(h - 120, 450)}px` : '400px',
        // Button sizing
        btnW: mobile ? `${Math.min(w - 64, 280)}px` : '340px',
        btnH: mobile ? '44px' : '50px',
        // Font sizes
        titleFS: mobile ? 20 : 24,
        bodyFS: mobile ? 13 : 15,
        smallFS: mobile ? 11 : 14,
        // Spacing
        gap: mobile ? 10 : 14,
        // Use percentage of screen for top offsets
        topTitle: mobile ? '-38%' : '-35%',
    };
}

/** Create a standard panel background */
export function createPanel(ui, r) {
    const bg = new BABYLON.GUI.Rectangle();
    bg.width = r.panelW;
    bg.height = r.panelH;
    bg.background = "#1a1a2ecc";
    bg.cornerRadius = 12;
    bg.thickness = 2;
    bg.color = "#c9a050";
    bg.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    ui.addControl(bg);
    return bg;
}

/** Create a title text */
export function createTitle(ui, text, color, r) {
    const t = new BABYLON.GUI.TextBlock();
    t.text = text;
    t.color = color || "#c9a050";
    t.fontSize = r.titleFS;
    t.top = r.topTitle;
    t.resizeToFit = true;
    ui.addControl(t);
    return t;
}

/** Create an action button */
export function createBtn(ui, name, label, r, onClick) {
    const btn = BABYLON.GUI.Button.CreateSimpleButton(name, label);
    btn.width = r.btnW;
    btn.height = r.btnH;
    btn.color = "white";
    btn.background = "#2a4a2a";
    btn.cornerRadius = 8;
    btn.fontSize = r.bodyFS;
    btn.onPointerUpObservable.add(onClick);
    btn.onPointerEnterObservable.add(() => { btn.background = "#3a6a3a"; });
    btn.onPointerOutObservable.add(() => { btn.background = "#2a4a2a"; });
    ui.addControl(btn);
    return btn;
}

/** Create info text */
export function createText(ui, text, r) {
    const t = new BABYLON.GUI.TextBlock();
    t.text = text;
    t.color = "white";
    t.fontSize = r.bodyFS;
    t.textWrapping = true;
    t.resizeToFit = true;
    ui.addControl(t);
    return t;
}
