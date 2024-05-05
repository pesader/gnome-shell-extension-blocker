'use strict';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

export default class BlockerNotifier {
    constructor(icons) {
        this._icons = icons;
        this._notificationSource = new MessageTray.Source({
            title: 'Blocker',
            icon: this._icons.brand,
        });
        Main.messageTray.add(this._notificationSource);
    }

    _notify(title, body, gicon) {
        const notification = new MessageTray.Notification({
            source: this._notificationSource,
            title,
            body,
            gicon,
        });
        this._notificationSource.addNotification(notification);
    }

    notifyStatus(status) {
        const icon = this._icons.select(status);
        const direction = status ? 'up' : 'down';
        const action = status ? 'enabled' : 'disabled';
        this._notify(`Shields ${direction}`, `Content blocking has been ${action}`, icon);
    }

    notifyException(title, message) {
        this._notify(`Error: ${title}`, message, this._icons.failure);
    }

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
