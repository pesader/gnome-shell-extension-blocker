/**
 * @file Defines BlockerNotifier.
 * @author Pedro Sader Azevedo <email@pesader.dev>
 * @copyright Pedro Sader Azevedo 2025
 * @license GPL-3.0
 */

'use strict';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import {BlockerIcons as BlockerIcons_} from './icons.js';

/**
 * Blocker's notification sender.
 *
 * @class
 * @param {BlockerIcons_} icons - the icons for the notifications.
 */
export class BlockerNotifier {
    constructor(icons) {
        /** @type {BlockerIcons_} */
        this._icons = icons;

        this._notificationSource = new MessageTray.Source({
            title: 'Blocker',
            icon: this._icons.brand,
        });
        Main.messageTray.add(this._notificationSource);
    }

    /**
     * Sends a notification.
     *
     * @param {string} title - the notification title.
     * @param {string} body - the notification body text.
     * @param {Gio.Icon} gicon - the notification icon.
     * @returns {void}
     * @access protected
     */
    _notify(title, body, gicon) {
        /** @type {MessageTray.Notification} */
        const notification = new MessageTray.Notification({
            source: this._notificationSource,
            title,
            body,
            gicon,
        });
        this._notificationSource.addNotification(notification);
    }

    /**
     * Sends a notification that informs Blocker's status.
     *
     * @param {boolean} status - whether Blocker is enabled or not.
     */
    notifyStatus(status) {
        /** @type {Gio.Icon} */
        const icon = this._icons.select(status);
        /** @type {string} */
        const title = status ? _('Shields up') : _('Shields down');
        /** @type {string} */
        const body = status ? _('Content blocking has been enabled') : _('Content blocking has been disabled');

        this._notify(title, body, icon);
    }

    /**
     * Sends a notification that informs an exception.
     *
     * @param {string} title - the notification title.
     * @param {string} message - the notification message.
     * @returns {void}
     */
    notifyException(title, message) {
        /* eslint-disable prefer-template */
        // NOTE: It is necessary to disable the "prefer-template" eslint rule
        //       on the next line, because the string concatenation is needed
        //       for the "Error" string to be translated separately.

        // TRANSLATORS: 'Error' is followed by an error message, for example
        // 'Error: Child process exited with non-zero code'
        this._notify(_('Error') + `: ${title}`, message, this._icons.failure);
        /* eslint-enable prefer-template */
    }

    /**
     * Destroys the object.
     *
     * @returns {void}
     */
    destroy() {
        if (this._icons) {
            this._icons.destroy();
            this._icons = null;
        }
        if (this._notificationSource) {
            this._notificationSource.destroy();
            this._notificationSource = null;
        }
    }
}
