const {GObject} = imports.gi;

// Define the Enum
export const State = {
    DISABLED: 0,
    ENABLING: 1,
    ENABLED: 2,
    DISABLING: 3,
};


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

    get state() {
        if (this._state === undefined)
            this._state = null;

        return this._state;
    }

    set state(value) {
        if (this.example_property === value)
            return;

        this._state = value;
        this.notify('state');
    }

    toString() {
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

    nextState() {
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

    isIntermediary() {
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

    destroy() {
        if (this._state)
            this._state = null;
    }
});
