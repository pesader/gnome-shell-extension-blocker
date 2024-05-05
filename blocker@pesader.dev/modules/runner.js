import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export default class BlockerRunner {
    constructor(notifier) {
        this._notifier = notifier;
    }

    hblockAvailable() {
        let available;

        if (GLib.find_program_in_path('hblock') === null) {
            this._notifier.notifyException('hBlock not installed', 'Click here to get help: https://github.com/pesader/gnome-shell-extension-blocker/wiki/Troubleshooting');
            available = false;
        } else {
            available = true;
        }

        return available;
    }

    async hblockEnable() {
        const HBLOCK_ENABLE = 'pkexec hblock';

        let success = false;
        if (this.hblockAvailable()) {
            const command = HBLOCK_ENABLE;
            success = await this._runCommand(command);
        }
        return success;
    }

    async hblockDisable() {
        const HBLOCK_DISABLE = 'pkexec hblock -S none -D none';

        let success = false;
        if (this.hblockAvailable()) {
            const command = HBLOCK_DISABLE;
            success = await this._runCommand(command);
        }
        return success;
    }

    async _runCommand(command) {
        let success = false;
        try {
            const proc = Gio.Subprocess.new(
                ['/bin/sh', '-c', command],
                Gio.SubprocessFlags.NONE
            );

            success = await proc.wait_check_async(null);

            if (!success)
                this._notifier.notifyException(`Failed to run "${command}"`, 'Process existed with non-zero code');
        } catch (e) {
            this._notifier.notifyException(`Could not run "${command}"`, e.message);
            console.debug(e);
        }
        return success;
    }

    destroy() {
        if (this._notifier) {
            this._notifier.destroy();
            this._notifier = null;
        }
    }
}
