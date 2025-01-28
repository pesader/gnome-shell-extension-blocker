import Gio from 'gi://Gio';

/**
 * Blocker's icons.
 *
 * @class
 * @param {string} path - path to the extension's installation directory.
 */
export class BlockerIcons {
    constructor(path) {
        /** @type {Gio.Icon} */
        this.enabled = Gio.icon_new_for_string(
            `${path}/icons/blocker-enabled-symbolic.svg`
        );
        /** @type {Gio.Icon} */
        this.disabled = Gio.icon_new_for_string(
            `${path}/icons/blocker-disabled-symbolic.svg`
        );
        /** @type {Gio.Icon} */
        this.acquiring = Gio.icon_new_for_string(
            `${path}/icons/blocker-acquiring-symbolic.svg`
        );
        /** @type {Gio.Icon} */
        this.failure = Gio.icon_new_for_string(
            `${path}/icons/blocker-failure-symbolic.svg`
        );
    }

    /**
     * Gets Blocker's brand icon.
     *
     * @returns {Gio.Icon} Blocker's brand icon.
     */
    get brand() {
        return this.enabled;
    }

    /**
     * Selects an appropriate icon depending on Blocker's enablement status.
     *
     * @param {boolean} enabled - whether Blocker is enabled or not.
     * @returns {Gio.Icon} Blocker's enabled or disabled icon.
     */
    select(enabled) {
        if (enabled)
            return this.enabled;
        else
            return this.disabled;
    }

    /**
     * Destroys the object.
     *
     * @returns {void}
     */
    destroy() {
        if (this.enabled)
            this.enabled = null;

        if (this.disabled)
            this.disabled = null;

        if (this.acquiring)
            this.acquiring = null;

        if (this.failure)
            this.failure = null;
    }
}
