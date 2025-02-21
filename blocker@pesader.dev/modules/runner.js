/**
 * @file Defines BlockerRunner.
 * @author Pedro Sader Azevedo <email@pesader.dev>
 * @copyright Pedro Sader Azevedo 2025
 * @license GPL-3.0
 */

'use strict';

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import {State} from './state.js';

import {BlockerNotifier as BlockerNotifier_} from './notifier.js';
import {BlockerState as BlockerState_} from './state.js';

/**
 * Blocker's command runner.
 *
 * @class
 * @param {BlockerNotifier_} notifier - notification sender.
 */
export class BlockerRunner {
    constructor(notifier) {
        /** @type {BlockerNotifier_} */
        this._notifier = notifier;
    }

    /**
     * Checks whether the hBlock executable is available or not.
     * Notifies the user with a helpful message if it isn't.
     *
     * @returns {boolean} true if hBlock is available, false otherwise.
     */
    hblockAvailable() {
        /** @type {boolean} */
        let available;

        /** @type {string} */
        const BLOCKER_TROUBLESHOOTING_URL = 'https://github.com/pesader/gnome-shell-extension-blocker/wiki/Troubleshooting';

        if (GLib.find_program_in_path('hblock') === null) {
            /* eslint-disable prefer-template */
            // NOTE: It is necessary to disable the "prefer-template" eslint
            //       rule on the next line, because the string concatenation is
            //       needed for the "Click here to get help" string to be
            //       translated separately.

            // TRANSLATORS: 'Click here to get help' is followed by the link to
            // Blocker's troubleshooting wiki page, like so 'Click here to get help:
            // https://github.com/pesader/gnome-shell-extension-blocker/wiki/Troubleshooting'
            this._notifier.notifyException(_('hBlock not installed'), _('Click here to get help') + `: ${BLOCKER_TROUBLESHOOTING_URL}`);
            /* eslint-enable prefer-template */
            available = false;
        } else {
            available = true;
        }

        return available;
    }

    /**
     * Helper for notifying exceptions that may occur while running hBlock.
     *
     * @param {BlockerState_} state - either State.ENABLING or State.DISABLING.
     * @param {Error} e - exception to notify.
     * @returns {boolean} true if hBlock is available, false otherwise.
     * @access protected
     */
    _hblockNotifyException(state, e) {
        /** @type {string} */
        let title;
        if (state === State.ENABLING)

            // TRANSLATORS: do not translate "Blocker"
            title = _('could not enable Blocker');
        if (state === State.DISABLING)
            // TRANSLATORS: do not translate "Blocker"
            title = _('could not disable Blocker');

        // HACK: it seems we cannot use "proc.get_exit_status()", because
        //       the command is running with privilege. As workaround,
        //       parse the exit code from the exception message.

        // Show custom message for common errors
        if (e.message.endsWith('12'))
            this._notifier.notifyException(title, _('Network connection lost'));
        else if (e.message.endsWith('126'))
            this._notifier.notifyException(title, _('Permission request dismissed'));

        // Show default message for all other errors
        else
            this._notifier.notifyException(title, e.message);
    }

    /**
     * Enables hBlock.
     *
     * @returns {boolean} true if hBlock was enabled successfully, false otherwise.
     */
    async hblockEnable() {
        /** @type {string} */
        const HBLOCK_ENABLE = 'pkexec hblock';

        /** @type {boolean} */
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

    /**
     * Disables hBlock.
     *
     * @returns {boolean} true if hBlock was disabled successfully, false otherwise.
     */
    async hblockDisable() {
        /** @type {string} */
        const HBLOCK_DISABLE = 'pkexec hblock -S none -D none';

        /** @type {boolean} */
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

    /**
     * Helper for running shell commands
     *
     * @param {string} command - shell command to run.
     * @returns {boolean} true if command ran successfully, false otherwise.
     * @access protected
     */
    async _runCommand(command) {
        /** @type {string} */
        /* eslint-disable prefer-template */
        // NOTE: It is necessary to disable the "prefer-template" eslint rule
        //       on the next line, because the string concatenation is needed
        //       for the "could not run the command" string to be translated
        //       separately.

        // TRANSLATORS: 'could not run the command' is followed by a shell
        // command, for example 'could not run command: "pkexec hblock"'
        const title = _('could not run the command') + `: "${command}"`;
        /* eslint-enable prefer-template */

        /** @type {boolean} */
        let success = false;

        try {
            /** @type {Gio.Subprocess} */
            const proc = Gio.Subprocess.new(
                ['/bin/sh', '-c', command],
                Gio.SubprocessFlags.NONE
            );

            success = await proc.wait_check_async(null);

            if (!success)
                // TRANSLATORS: only translate "exit code" if your language
                // has a well-established technical term for this
                this._notifier.notifyException(title, _('Process exited with non-zero exit code'));
        } catch (e) {
            // Log exception
            console.debug(e);

            // Re-throw exception
            throw e;
        }
        return success;
    }

    /**
     * Destroys the object.
     *
     * @returns {void}
     */
    destroy() {
        if (this._notifier) {
            this._notifier.destroy();
            this._notifier = null;
        }
    }
}
