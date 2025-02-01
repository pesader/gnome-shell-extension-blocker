/**
 * @file Defines BlockerToggle, BlockerIndicator, and BlockerIndicator.
 * @author Pedro Sader Azevedo <email@pesader.dev>
 * @copyright Pedro Sader Azevedo 2025
 * @license GPL-3.0
 */

'use strict';

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

import {BlockerIcons} from './modules/icons.js';
import {BlockerNotifier} from './modules/notifier.js';
import {BlockerRunner} from './modules/runner.js';
import {BlockerState, State} from './modules/state.js';

/**
 * Blocker's toggle.
 *
 * @class
 * @param {Gio.Settings} settings - The extension's settings.
 */
const BlockerToggle = GObject.registerClass(
    class BlockerToggle extends QuickToggle {
        constructor(settings) {
            super({
                title: 'Blocker',
                toggleMode: false,
            });

            /** @type {Gio.Settings} */
            this._settings = settings;
            this._settings.bind(
                'blocker-enabled',
                this,
                'checked',
                Gio.SettingsBindFlags.DEFAULT
            );
        }
    });

/**
 * Blocker's indicator.
 *
 * @class
 * @param {Gio.Settings} settings - The extension's settings.
 * @param {BlockerState} state - Blocker's state.
 * @param {BlockerIcons} icons - Blocker's icons.
 * @param {BlockerNotifier} notifier - notification sender.
 * @param {BlockerRunner} runner - command runner.
 */
const BlockerIndicator = GObject.registerClass(
    class BlockerIndicator extends SystemIndicator {
        constructor(settings, state, icons, notifier, runner) {
            super();

            /** @type {BlockerIcons} */
            this._icons = icons;

            /** @type {BlockerNotifier} */
            this._notifier = notifier;

            /** @type {BlockerRunner} */
            this._runner = runner;

            /** @type {BlockerIndicator} */
            this._indicator = this._addIndicator();

            /** @type {BlockerToggle} */
            this._toggle = new BlockerToggle(settings);
            this._toggle.connect('clicked', () => this._onClicked());
            this._toggle.connect('notify::checked', () => this._onChecked());

            // Set initial Blocker state
            /** @type {BlockerState} */
            this._state = state;
            this._state.connect('notify::state', () => this._onStateChanged());
            this._state.state = this._toggle.checked ? State.ENABLED : State.DISABLED;

            /** @type {Gio.NetworkMonitor} */
            this._netman = Gio.network_monitor_get_default();
            this._netman.connect('network-changed', (_monitor, _networkAvailable) => this._onNetworkChanged());
            this._onNetworkChanged(); // Check initial network state

            /** @type {Gio.Icon} */
            const icon = this._icons.select(this._toggle.checked);
            this._indicator.gicon = icon;
            this._toggle.gicon = icon;


            this.quickSettingsItems.push(this._toggle);
        }

        /**
         * Responds to network changes.
         *
         * @returns {void}
         * @access protected
         */
        _onNetworkChanged() {
            if (!this._netman.network_available) {
                this._toggle.set_reactive(false);
                this._toggle.subtitle = _('Network unavailable');

            // NOTE: It is possible that a network drop doesn't make
            //       Blocker's enablement fail, so it doesn't go back to
            //       its DISABLED state. Because of that, we need to check
            //       its state at this point.
            //
            } else if (this._state.state === State.ENABLING) {
                this._toggle.subtitle = _('Enabling in progress');
                this._indicator.gicon = this._icons.acquiring;
                this._toggle.gicon = this._icons.acquiring;
            } else {
                this._toggle.set_reactive(true);
                this._toggle.subtitle = null;
            }
        }

        /**
         * Responds to checking/unchecking the extension toggle.
         *
         * @returns {void}
         * @access protected
         */
        _onChecked() {
            this._notifier.notifyStatus(this._toggle.checked);

            /** @type {Gio.Icon} */
            const icon = this._icons.select(this._toggle.checked);
            this._indicator.gicon = icon;
            this._toggle.gicon = icon;
        }

        /**
         * Responds to clicks in the extension toggle.
         *
         * @returns {void}
         * @access protected
         */
        async _onClicked() {
            // Save initial state
            /** @type {State} */
            const initialState = this._state.state;

            // Set an intermediary state while commands are running
            this._state.state = this._state.nextState();

            // Toggle hblock
            /** @type {boolean} */
            const success = await this._hblockToggle();

            if (success)
                // Proceed to next state
                this._state.state = this._state.nextState();
            else
                // Restore initial state
                this._state.state = initialState;
        }

        /**
         * Responds to changes in Blocker's state.
         *
         * @returns {void}
         * @access protected
         */
        _onStateChanged() {
            if (this._state.isIntermediary()) {
                // While commands are running, change the icons
                this._indicator.visible = true;
                this._indicator.gicon = this._icons.acquiring;
                this._toggle.gicon = this._icons.acquiring;
                this._toggle.set_reactive(false);

                // Add an explanatory subtitle to the toggle
                switch (this._state.state) {
                case State.ENABLING:
                    this._toggle.subtitle = _('Enabling in progress');
                    break;
                case State.DISABLING:
                    this._toggle.subtitle = _('Disabling in progress');
                    break;
                }
            } else {
                switch (this._state.state) {
                case State.DISABLED:
                    this._indicator.visible = false;
                    this._toggle.checked = false;
                    this._indicator.gicon = this._icons.disabled;
                    this._toggle.gicon = this._icons.disabled;
                    break;
                case State.ENABLED:
                    this._indicator.visible = true;
                    this._toggle.checked = true;
                    this._indicator.gicon = this._icons.enabled;
                    this._toggle.gicon = this._icons.enabled;
                    break;
                }

                // Remove subtitles and make toggle reactive again
                this._toggle.subtitle = null;
                this._toggle.set_reactive(true);
            }
        }

        /**
         * Toggles hBlock.
         *
         * @returns {boolean} true if hBlock was toggled successfully, false otherwise.
         * @access protected
         */
        async _hblockToggle() {
            /** @type {boolean} */
            let success;
            if (this._toggle.checked)
                success = await this._runner.hblockDisable();
            else
                success = await this._runner.hblockEnable();
            return success;
        }

        /**
         * Destroys the object.
         *
         * @returns {void}
         */
        destroy() {
            if (this._indicator) {
                this.quickSettingsItems.forEach(item => item.destroy());
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

/**
 * Blocker's extension.
 *
 * @class
 */
export default class BlockerExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.initTranslations('blocker@pesader.dev');
    }

    /**
     * Enable the extension.
     *
     * @returns {void}
     */
    enable() {
        this._icons = new BlockerIcons(this.path);
        this._notifier = new BlockerNotifier(this._icons);
        this._runner = new BlockerRunner(this._notifier);

        // Check if hBlock is installed
        if (this._runner.hblockAvailable()) {
            this._state = new BlockerState();
            this._indicator = new BlockerIndicator(this.getSettings(), this._state, this._icons, this._notifier, this._runner);
            Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        }
    }

    /**
     * Disable the extension.
     *
     * @returns {void}
     */
    disable() {
        this.destroy();
    }

    /**
     * Destroys the object.
     *
     * @returns {void}
     */
    destroy() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        if (this._state) {
            this._state.destroy();
            this._state = null;
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
}
