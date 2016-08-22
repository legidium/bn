modules.define(
    'account-my-lists-content',
    ['i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited' : function(){
                    var button = this.findElem('button-new-list');
                    var popup = this.findBlockOn('popup-new-list', 'popup')
                        .setAnchor(button);

                    this.bindTo(button, 'click', function() {
                        popup.setMod('visible', true);
                    });
                }
            }
        }
    }
));

});

