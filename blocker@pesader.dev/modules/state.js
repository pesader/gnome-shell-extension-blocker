/**
 * @file Defines State and BlockerState.
 * @author Pedro Sader Azevedo <email@pesader.dev>
 * @copyright Pedro Sader Azevedo 2025
 * @license GPL-3.0
 */

'use strict';

const {GObject} = imports.gi;

/**
 * Enum of all possible Blocker states.
 *
 * @enum {number}
 */
export const State = {
    DISABLED: 0,
    ENABLING: 1,
    ENABLED: 2,
    DISABLING: 3,
};


/**
 * Blocker's state.
 *
 * @class
 */
export const BlockerState = GObject.registerClass({
    Properties: {
        'state': GObject.ParamSpec.int(
            'state',
            'State',
            'The state of Blocker',
            GObject.ParamFlags.READWRITE,
            State.DISABLED,  // min
            State.DISABLING, // max
            State.DISABLED   // default
        ),
    },
}, class BlockerState extends GObject.Object {
    constructor(constructProperties = {}) {
        super(constructProperties);
    }

    /**
     * Gets state.
     *
     * @returns {State} The state of the object.
     */
    get state() {
        if (this._state === undefined)
            /** @type {State} */
            this._state = null;

        return this._state;
    }

    /**
     * Sets state.
     *
     * @param {State} value - value to be set as the state of the object.
     * @returns {void}
     */
    set state(value) {
        if (this.example_property === value)
            return;

        /** @type {State} */
        this._state = value;
        this.notify('state');
    }

    /**
     * Converts the state of the object to a string.
     *
     * @returns {string} A string that represents the state of the object.
     */
    toString() {
        /** @type {string} */
        let string;
        switch (this.state) {
        case State.DISABLED:
            string = 'Disabled';
            break;
        case State.ENABLED:
            string = 'Enabled';
            break;
        case State.DISABLING:
            string = 'Disabling';
            break;
        case State.ENABLING:
            string = 'Enabling';
            break;
        }
        return string;
    }

    /**
     * Returns the state that would naturally follow the object's current state.
     *
     * @returns {State} the state that follows the object's current state.
     */
    nextState() {
        /** @type {State} */
        let next;
        switch (this.state) {
        case State.DISABLED:
            next = State.ENABLING;
            break;
        case State.ENABLED:
            next = State.DISABLING;
            break;
        case State.DISABLING:
            next = State.DISABLED;
            break;
        case State.ENABLING:
            next = State.ENABLED;
            break;
        }
        return next;
    }

    /**
     * Checks whether the state of the object is temporary.
     *
     * @returns {boolean} true if the state of the object is temporary, false otherwise.
     */
    isIntermediary() {
        /** @type {boolean} */
        let result;
        switch (this.state) {
        case State.DISABLED:
            result = false;
            break;
        case State.ENABLED:
            result = false;
            break;
        case State.DISABLING:
            result = true;
            break;
        case State.ENABLING:
            result = true;
            break;
        }
        return result;
    }

    /**
     * Destroys the object.
     *
     * @returns {void}
     */
    destroy() {
        if (this._state)
            this._state = null;
    }
});
