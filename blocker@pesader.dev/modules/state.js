const { GObject } = imports.gi;

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
            State.DISABLED,  // default
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
        switch (this.state) {
            case State.DISABLED:
                return 'Disabled'
            case State.ENABLED:
                return 'Enabled'
            case State.DISABLING:
                return 'Disabling'
            case State.ENABLING:
                return 'Enabling'
        }
    }

    nextState() {
        switch (this.state) {
            case State.DISABLED:
                return State.ENABLING;
            case State.ENABLED:
                return State.DISABLING;
            case State.DISABLING:
                return State.DISABLED;
            case State.ENABLING:
                return State.ENABLED;
        }
    }

    isIntermediary() {
        switch (this.state) {
            case State.DISABLED:
                return false;
            case State.ENABLED:
                return false;
            case State.DISABLING:
                return true;
            case State.ENABLING:
                return true;
        }
    }

    destroy() {
        if (this._state)
            this._state = null
    }
})
