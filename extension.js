/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0
 */
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

class BlockerIcons {
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
        return this.enabled
    }

    select(enabled) {
        if (enabled)
            return this.enabled;
        else
            return this.disabled;
    }

    destroy() {
        if (this.enabled)
            this.enabled = null

        if (this.disabled)
            this.disabled = null

        if (this.acquiring)
            this.acquiring = null

        if (this.failure)
            this.failure = null
    }
}

class BlockerNotifier {
    constructor(icons) {
        this._icons = icons
        this._notificationSource = new MessageTray.Source({
            title: 'Blocker',
            icon: this._icons.brand,
        });
        Main.messageTray.add(this._notificationSource);
    }

    _notify(title, body, gicon) {
        const notification = new MessageTray.Notification({
            source: this._notificationSource,
            title: title,
            body: body,
            gicon: gicon,
        });
        this._notificationSource.addNotification(notification);
    }

    notifyStatus(status) {
        const icon = this._icons.select(status)
        const direction = status ? "up" : "down"
        const action = status ? "enabled" : "disabled"
        this._notify(`Shields ${direction}`, `Content blocking has been ${action}`, icon)
    }

    notifyException(title, message) {
        this._notify(`Error: ${title}`, message, this._icons.failure)
    }

    destroy() {
        if (this._icons) {
            this._icons.destroy()
            this._icons = null
        }
        if (this._notificationSource) {
            this._notificationSource.destroy()
            this._notificationSource = null
        }
    }
}

class BlockerRunner {
    constructor(notifier) {
        this._notifier = notifier
    }

    hblockAvailable() {
        let available;

        if (GLib.find_program_in_path("hblock") === null) {
            this._notifier.notifyException("Missing dependency", `Executable "hblock" was not found in $PATH`)
            available = false;
        } else
            available = true;

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
                this._notifier.notifyException(`Failed to run "${command}"`, "Process existed with non-zero code")

        } catch (e) {
            this._notifier.notifyException(`Could not run "${command}"`, e.message)
            logError(e);
        }
        return success
    }

    destroy() {
        if (this._notifier) {
            this._notifier.destroy()
            this._notifier = null
        }
    }
}

const BlockerToggle = GObject.registerClass(
    class BlockerToggle extends QuickToggle {
        constructor(settings) {
            super({
                title: 'Blocker',
                toggleMode: false,
            });

            // Bind the toggle to a GSettings key
            this._settings = settings;
            this._settings.bind(
                'blocker-enabled',
                this,
                'checked',
                Gio.SettingsBindFlags.DEFAULT
            );
        }
    });

const BlockerIndicator = GObject.registerClass(
    class BlockerIndicator extends SystemIndicator {
        constructor(settings, icons, notifier, runner) {
            super();

            // Icons
            this._icons = icons

            // Notifier
            this._notifier = notifier

            // Runner
            this._runner = runner

            // Indicator
            this._indicator = this._addIndicator();

            // Toggle
            this._toggle = new BlockerToggle(settings);
            this._toggle.connect('clicked', () => this._onClicked());
            this._toggle.connect('notify::checked', () => this._onChecked());
            this._toggle.bind_property(
                'checked',
                this._indicator,
                'visible',
                GObject.BindingFlags.SYNC_CREATE
            );

            const icon = this._icons.select(this._toggle.checked)
            this._indicator.gicon = icon
            this._toggle.gicon = icon

            this.quickSettingsItems.push(this._toggle);
        }

        _onChecked() {
            this._notifier.notifyStatus(this._toggle.checked)

            const icon = this._icons.select(this._toggle.checked)
            this._indicator.gicon = icon
            this._toggle.gicon = icon
        }

        async _onClicked() {
            // Save current icon to restore in case of failure
            const restoreIcon = this._toggle.gicon

            // While commands are running, change the icons
            this._indicator.gicon = this._icons.acquiring;
            this._toggle.gicon = this._icons.acquiring;
            this._toggle.set_reactive(false)

            // Toggle hblock
            const success = await this._hblockToggle()

            if (success) {
                this._toggle.checked = !this._toggle.checked
            } else {
                this._indicator.gicon = restoreIcon;
                this._toggle.gicon = restoreIcon;
            }
            this._toggle.set_reactive(true)
        }

        async _hblockToggle() {
            let success;
            if (this._toggle.checked)
                success = await this._runner.hblockDisable()
            else
                success = await this._runner.hblockEnable()
            return success;
        }

        destroy() {
            if (this._indicator) {
                this._indicator.quickSettingsItems.forEach(item => item.destroy());
                this._indicator.destroy();
            }
            if (this._runner) {
                this._runner.destroy()
                this._runner = null
            }
            if (this._notifier) {
                this._notifier.destroy()
                this._notifier = null
            }
            if (this._icons) {
                this._icons.destroy()
                this._icons = null
            }
        }
    });

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._icons = new BlockerIcons(this.path)
        this._notifier = new BlockerNotifier(this._icons)
        this._runner = new BlockerRunner(this._notifier)

        // Check if hBlock is installed
        if (this._runner.hblockAvailable()) {
            this._indicator = new BlockerIndicator(this.getSettings(), this._icons, this._notifier, this._runner);
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        }
    }

    destroy() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        if (this._runner) {
            this._runner.destroy();
            this._runner = null;
        }

        if (this._notifier) {
            this._notifier.destroy();
            this._notifier = null;
        }

        if (this._icons) {
            this._icons.destroy();
            this._icons = null;
        }
    }

    disable() {
        this.destroy();
    }
}
