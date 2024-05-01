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

const BlockerToggle = GObject.registerClass(
    class BlockerToggle extends QuickToggle {
        constructor(settings) {
            super({
                title: 'Blocker',
                toggleMode: true,
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

            // Icons
            this._icon = Gio.icon_new_for_string(
                `${path}/icons/blocker-symbolic.svg`
            );
            this._iconAcquiring = Gio.icon_new_for_string(
                `${path}/icons/blocker-acquiring-symbolic.svg`
            );

            // Indicator
            this._indicator = this._addIndicator();
            this._indicator.gicon = this._icon;

            // Toggle
            this._toggle = new BlockerToggle(settings);
            this._toggle.gicon = this._icon;
            this._toggle.connect('notify::checked', () => this._onChecked());
            this._toggle.bind_property(
                'checked',
                this._indicator,
                'visible',
                GObject.BindingFlags.SYNC_CREATE
            );
            this.quickSettingsItems.push(this._toggle);
        }

        showNotification(title, body) {
            const source = new MessageTray.Source({
                title: 'Blocker',
                icon: this._icon,
            });

            const notification = new MessageTray.Notification({
                source: source,
                title: title,
                body: body,
                gicon: this._icon,
            });

            Main.messageTray.add(source);
            source.addNotification(notification);
        }

        async _onChecked() {
            // While commands are running, change the icons
            this._indicator.gicon = this._iconAcquiring;
            this._toggle.gicon = this._iconAcquiring;
            this._toggle.set_reactive(false)

            // Toggle hblock
            await this._hblockToggle()

            // Change the icon back to normal
            this._indicator.gicon = this._icon;
            this._toggle.gicon = this._icon;
            this._toggle.set_reactive(true)

            // Notify the user
            if (this._toggle.checked) {
                this.showNotification("Shields up", "Content blocking has been enabled")
            } else {
                this.showNotification("Shields down", "Content blocking has been disabled")
            }
        }

        async _hblockToggle() {
            // Run command to toggle hblock
            const HBLOCK_ENABLE = 'pkexec hblock';
            const HBLOCK_DISABLE = 'pkexec hblock -S none -D none';
            const command = this._toggle.checked ? HBLOCK_ENABLE : HBLOCK_DISABLE;

            // Wait until command is done
            await this._runCommand(command);
        }

        async _runCommand(command) {
            try {
                const proc = Gio.Subprocess.new(
                    ['/bin/sh', '-c', command],
                    Gio.SubprocessFlags.NONE
                );
                await proc.wait_check_async(null);
            } catch (e) {
                this.showNotification(`Failed to run "${command}"`, e.message)
                logError(e);
            }
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
