modules.define(
    'account-dashboard-list-comment-edit',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-list-comment-edit:inited');

                    this._toggle = this.elem('button', 'action', 'toggle');
                    this._save   = this.elem('button', 'action', 'save');
                    this._button = this._save && this.findBlockOn(this._save, 'button');
                    this._input  = this.findBlockInside('textarea');
                    this._icon   = this.findBlockInside(this._toggle, 'icon');

                    this._comment = this._input ? this._input.getVal() : '';

                    var that = this;

                    this._toggle && this.bindTo(this._toggle, 'click', this._onToggleClicked, this);
                    this._save && this.bindTo(this._save, 'click', this._onSaveClicked, this);
                    this._input && this._input.bindTo('keyup input', function(e) { that._onInputChanged(e); });

                    this._button && this._button.setMod('hidden');
                    this._updateState();
                }
            },
            'disabled': {
                'true': function() {
                    this._toggle && this.setMod(this._toggle, 'disabled');
                    this._save && this._save.bem('button').setMod('disabled');
                },
                '': function() {
                    this._toggle && this.delMod(this._toggle);
                    this._save && this._save.bem('button').delMod('disabled');
                }
            },
            'saved': {
                'true': function() {
                    this.delMod('modified');
                    this._button && this._button.setMod('saved').findElem('text').text('Сохранено');
                    this._button && this._button.delMod('hidden');
                },
                '': function() {
                    this._button && this._button.delMod('saved');
                }
            },
            'modified': {
                'true': function() {
                    this.delMod('saved');
                    this._button && this._button.delMod('saved').findElem('text').text('Сохранить');
                    this._button && this._button.delMod('hidden');
                },
                '': function() {
                    this._button && this._button.setMod('hidden');
                }
            }
        },

        getComment: function() {
            return this._input && this._input.getVal();
        },

        setComment: function(text) {
            this._comment = text;
            this._input && this._input.setVal(text);
            this._updateState();
        },

        update: function(text) {
            this.setComment(text);
        },

        _updateState: function() {
            var hasComment = this._comment && this._comment.length;
            this._icon && this._icon.setMod('action', hasComment ? 'comments-blue' : 'comments');
        },

        _onToggleClicked: function(e) {
            !this.hasMod('disabled') && this.toggleMod('visible');
        },

        _onSaveClicked: function(e) {
            !this.hasMod('disabled') && this._input && this.emit('save', this._input.getVal());
        },

        _onInputChanged: function(e) {
            var val = $(e.currentTarget).val();
            if (val != this._comment) {
                this.setMod('modified');
            } else {
                this.delMod('modified');
            }
        }
    }

))

});
