modules.define(
    'account-profile-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-profile-controller:inited');

                    this._passwords = this.findBlocksInside({ block: 'input', modName: 'type', modVal: 'password'});

                    var that = this;
                    (this._passwords || []).map(function(item) {
                        var group = item.findBlockOutside({ block: 'form-group', modName: 'line' });
                        if (group) {
                            var button = group.findBlockInside('button');
                            button && button.on('click', that._onPasswordButtonClick, that);
                        }
                    });
                }
            }
        },

        _onPasswordButtonClick: function(e) {
            var target = e.target;
            var icon = target.findBlockInside('icon');
            var group = target.findBlockOutside({ block: 'form-group', modName: 'line' });

            if (group) {
                var input = group.findBlockInside({ block: 'input' });
                if (input) {
                    if (!target.hasMod('open')) {
                        target.setMod('open');
                        icon && icon.setMod('action', 'eye-open');
                        input.elem('control').prop('type', 'text');
                    } else {
                        target.delMod('open');
                        icon && icon.setMod('action', 'eye');
                        input.elem('control').prop('type', 'password');
                    }
                }
            }
        }

    }));

});