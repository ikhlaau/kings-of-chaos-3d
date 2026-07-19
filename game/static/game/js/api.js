/** API client for Django backend. */
export class API {
    constructor(gameData) {
        this.urls = gameData.urls;
        this.csrfToken = gameData.csrfToken;
    }

    async _post(url, body = {}) {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Request failed');
        }
        return res.json();
    }

    async _get(url) {
        const res = await fetch(url);
        return res.json();
    }

    refreshPlayer() { return this._get(this.urls.refreshPlayer); }
    attack(targetId) { return this._post(this.urls.attack, { target_id: targetId }); }
    train(unitType) { return this._post(this.urls.train, { unit_type: unitType }); }
    buyWeapon(weaponType) { return this._post(this.urls.buyWeapon, { weapon_type: weaponType }); }
    spy(targetId) { return this._post(this.urls.spy, { target_id: targetId }); }
    bank(action, amount) { return this._post(this.urls.bank, { action, amount }); }
    recruitCitizens(count) { return this._post(this.urls.recruitCitizens, { count }); }
    getWorldPlayers() { return this._get(this.urls.worldPlayers); }
    getBattleLog() { return this._get(this.urls.battleLog); }
    getRankings(page = 1) { return this._get(`${this.urls.rankings}?page=${page}`); }
    getAlliance() { return this._get(this.urls.alliance); }
    allianceAction(action, data = {}) {
        return this._post(this.urls.alliance, { action, ...data });
    }
}
