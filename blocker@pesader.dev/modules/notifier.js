'use strict';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

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
        const direction = status ? 'up' : 'down';
        /** @type {string} */
        const action = status ? 'enabled' : 'disabled';

        this._notify(`Shields ${direction}`, `Content blocking has been ${action}`, icon);
    }

    /**
     * Sends a notification that informs an exception.
     *
     * @param {string} title - the notification title.
     * @param {string} message - the notification message.
     * @returns {void}
     */
    notifyException(title, message) {
        this._notify(`Error: ${title}`, message, this._icons.failure);
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
