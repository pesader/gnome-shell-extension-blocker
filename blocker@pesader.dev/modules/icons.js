import Gio from 'gi://Gio';

export default class BlockerIcons {
    constructor(path) {
        this.enabled = Gio.icon_new_for_string(
            `${path}/icons/blocker-enabled-symbolic.svg`
        );
        this.disabled = Gio.icon_new_for_string(
            `${path}/icons/blocker-disabled-symbolic.svg`
        );
        this.acquiring = Gio.icon_new_for_string(
            `${path}/icons/blocker-acquiring-symbolic.svg`
        );
        this.failure = Gio.icon_new_for_string(
            `${path}/icons/blocker-failure-symbolic.svg`
        );
    }

    get brand() {
        return this.enabled;
    }

    select(enabled) {
        if (enabled)
            return this.enabled;
        else
            return this.disabled;
    }

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
