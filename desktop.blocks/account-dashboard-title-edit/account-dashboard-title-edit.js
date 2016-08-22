modules.define(
    'account-dashboard-title-edit',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-title-edit:inited');

                    this._empty = true;
                    this._input = this.findBlockInside('input');

                    this.bindTo(this.elem('button'), 'click', function(e) {
                        this.emit('save', this._input && this._input.getVal());
                    });
                }
            }
        },

        getText: function() {
            return this._input && this._input.getVal();
        },

        setText: function(text) {
            this._input && this._input.setVal(text);
            //this._empty = false;
        },

        isEmpty: function() {
            return this._empty;
        },

        setEmpty: function(empty) {
            this._empty = empty;
            this._empty && this.setText('');
        }
    }

))

});
