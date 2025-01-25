import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {State} from './state.js';

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

    _hblockNotifyException(state, e) {
        let action;
        if (state === State.ENABLING)
            action = 'enable';
        if (state === State.DISABLING)
            action = 'disable';

        const title = `could not ${action} Blocker`;


        // HACK: it seems we cannot use "proc.get_exit_status()", because
        //       the command is running with privilege. As workaround,
        //       parse the exit code from the exception message.

        // Show custom message for common errors
        if (e.message.endsWith('12'))
            this._notifier.notifyException(title, 'Network connection lost');
        else if (e.message.endsWith('126'))
            this._notifier.notifyException(title, 'Permission request dismissed');

        // Show default message for all other errors
        else
            this._notifier.notifyException(title, e.message);
    }

    async hblockEnable() {
        const HBLOCK_ENABLE = 'pkexec hblock';

        let success = false;
        if (this.hblockAvailable()) {
            try {
                success = await this._runCommand(HBLOCK_ENABLE);
            } catch (e) {
                this._hblockNotifyException(State.ENABLING, e);
            }
        }
        return success;
    }

    async hblockDisable() {
        const HBLOCK_DISABLE = 'pkexec hblock -S none -D none';

        let success = false;
        if (this.hblockAvailable()) {
            try {
                success = await this._runCommand(HBLOCK_DISABLE);
            } catch (e) {
                this._hblockNotifyException(State.DISABLING, e);
            }
        }
        return success;
    }

    async _runCommand(command) {
        let success = false;
        const title = `could not run "${command}"`;

        try {
            const proc = Gio.Subprocess.new(
                ['/bin/sh', '-c', command],
                Gio.SubprocessFlags.NONE
            );

            success = await proc.wait_check_async(null);

            if (!success)
                this._notifier.notifyException(title, 'Process exited with non-zero exit code');
        } catch (e) {
            // Log exception
            console.debug(e);

            // Re-throw exception
            throw e;
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
