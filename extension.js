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
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

const ExampleToggle = GObject.registerClass(
class ExampleToggle extends QuickToggle {
    constructor() {
        super({
            title: _('hBlock'),
            iconName: 'face-smile-symbolic',
            toggleMode: true,
        });
    }
});

const ExampleIndicator = GObject.registerClass(
class ExampleIndicator extends SystemIndicator {
    constructor() {
        super();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'face-smile-symbolic';

        this._toggle = new ExampleToggle();
        this._toggle.connect ('notify::checked', () => this._onChecked ());
        // this._onChecked();

        // Sync the indicator and the toggle
        this._toggle.bind_property(
            'checked',
            this._indicator,
            'visible',
            GObject.BindingFlags.SYNC_CREATE
        );

        this.quickSettingsItems.push(this._toggle);
    }

    _onChecked() {
        if (this._toggle.checked) {
            let command = 'pkexec hblock'
            let [success, , stderr] = GLib.spawn_command_line_sync(command);

            if (success)
                Main.notify('hBlock', 'hBlock has been enabled');
            else
                Main.notify('hBlock', 'hBlock could not be enabled');
        }
        else {
            let command = 'pkexec hblock -S none -D none'
            let [success, , stderr] = GLib.spawn_command_line_sync(command);

            if (success)
                Main.notify('hBlock', 'hBlock has been disabled');
            else
                Main.notify('hBlock', 'hBlock could not be disabled');
        }
    }
});

export default class QuickSettingsExampleExtension extends Extension {
    enable() {
        this._indicator = new ExampleIndicator();
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
    }
}
