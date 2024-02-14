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
import Gio from 'gi://Gio';

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

    /**
     * Launch a subprocess for the device. If the device becomes unpaired, it is
     * assumed the device is no longer trusted and all subprocesses will be
     * killed.
     *
     * @param {string[]} args - process arguments
     * @param {Gio.Cancellable} [cancellable] - optional cancellable
     * @return {Gio.Subprocess} The subprocess
     */
    _launchProcess(args, cancellable = null) {
        let launcher = new Gio.SubprocessLauncher();

        // Create and track the process
        const proc = launcher.spawnv(args);
        proc.wait_check_async(cancellable, this._processExit.bind(this._procs));
        this._procs.add(proc);

        return proc;
    }

    _onChecked() {
        if (this._toggle.checked) {
            let command = 'pkexec hblock'
            this._launchProcess(['/bin/sh', '-c', command]);
            Main.notify('hBlock', 'hBlock has been enabled');
        }
        else {
            let command = 'pkexec hblock -S none -D none'
            this._launchProcess(['/bin/sh', '-c', command]);
            Main.notify('hBlock', 'hBlock has been disabled');
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
