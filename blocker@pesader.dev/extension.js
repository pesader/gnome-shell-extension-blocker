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
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

import BlockerIcons from './modules/icons.js';
import BlockerNotifier from './modules/notifier.js';
import BlockerRunner from './modules/runner.js';

const BlockerToggle = GObject.registerClass(
    class BlockerToggle extends QuickToggle {
        constructor(settings) {
            super({
                title: 'Blocker',
                toggleMode: false,
            });

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

            this._icons = icons;
            this._notifier = notifier;
            this._runner = runner;
            this._indicator = this._addIndicator();
            this._netman = Gio.network_monitor_get_default();

            this._netman.connect('network-changed', (_monitor, _networkAvailable) => this._onNetworkChanged());

            this._toggle = new BlockerToggle(settings);
            this._toggle.connect('clicked', () => this._onClicked());
            this._toggle.connect('notify::checked', () => this._onChecked());
            this._toggle.bind_property(
                'checked',
                this._indicator,
                'visible',
                GObject.BindingFlags.SYNC_CREATE
            );

            const icon = this._icons.select(this._toggle.checked);
            this._indicator.gicon = icon;
            this._toggle.gicon = icon;

            this._onNetworkChanged();

            this.quickSettingsItems.push(this._toggle);
        }

        _onNetworkChanged() {
            if (!this._toggle.checked && !this._netman.network_available) {
                this._toggle.set_reactive(false);
                this._toggle.subtitle = 'Network unavailable';
            } else {
                this._toggle.set_reactive(true);
                this._toggle.subtitle = null;
            }
        }

        _onChecked() {
            this._notifier.notifyStatus(this._toggle.checked);

            const icon = this._icons.select(this._toggle.checked);
            this._indicator.gicon = icon;
            this._toggle.gicon = icon;
        }

        async _onClicked() {
            // Save current icon to restore in case of failure
            const restoreIcon = this._toggle.gicon;

            // While commands are running, change the icons
            this._indicator.gicon = this._icons.acquiring;
            this._toggle.gicon = this._icons.acquiring;
            this._toggle.set_reactive(false);

            // Add an explanatory subtitle to the toggle
            const doing = this._toggle.checked ? 'Disabling' : 'Enabling';
            this._toggle.subtitle = `${doing} in progress`;

            // Toggle hblock
            const success = await this._hblockToggle();

            if (success) {
                this._toggle.checked = !this._toggle.checked;
            } else {
                this._indicator.gicon = restoreIcon;
                this._toggle.gicon = restoreIcon;
            }

            this._toggle.subtitle = null;
            this._toggle.set_reactive(true);
        }

        async _hblockToggle() {
            let success;
            if (this._toggle.checked)
                success = await this._runner.hblockDisable();
            else
                success = await this._runner.hblockEnable();
            return success;
        }

        destroy() {
            if (this._indicator) {
                this._indicator.quickSettingsItems.forEach(item => item.destroy());
                this._indicator.destroy();
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
    });

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._icons = new BlockerIcons(this.path);
        this._notifier = new BlockerNotifier(this._icons);
        this._runner = new BlockerRunner(this._notifier);

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
