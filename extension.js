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
        constructor(settings, path) {
            super();

            this._icons = new BlockerIcons(path)

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

        showNotification(title, body, gicon) {
            const source = new MessageTray.Source({
                title: 'Blocker',
                icon: this._icons.brand,
            });

            const notification = new MessageTray.Notification({
                source: source,
                title: title,
                body: body,
                gicon: gicon,
            });

            Main.messageTray.add(source);
            source.addNotification(notification);
        }

        _onChecked() {
            const icon = this._icons.select(this._toggle.checked)
            const direction = this._toggle.checked ? "up" : "down"
            const action = this._toggle.checked ? "enabled" : "disabled"
            this.showNotification(`Shields ${direction}`, `Content blocking has been ${action}`, icon)

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
            // Run command to toggle hblock
            const HBLOCK_ENABLE = 'pkexec hblock';
            const HBLOCK_DISABLE = 'pkexec hblock -S none -D none';
            const command = this._toggle.checked ? HBLOCK_DISABLE : HBLOCK_ENABLE;

            // Wait until command is done
            const success = await this._runCommand(command);

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
                    this.showNotification(`Failed to run "${command}"`, e.message, this._icons.failure)

            } catch (e) {
                this.showNotification(`Could not run "${command}"`, e.message, this._icons.failure)
                logError(e);
            }
            return success
        }
    });

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        // Check if hBlock is installed
        if (GLib.find_program_in_path("hblock") === null) {
            Main.notifyError('Blocker', 'Error: hBlock not installed');
        } else {
            this._indicator = new BlockerIndicator(this.getSettings(), this.path);
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        }
    }

    disable() {
        if (this._indicator) {
            this._indicator.quickSettingsItems.forEach(item => item.destroy());
            this._indicator.destroy();
        }
    }
}
