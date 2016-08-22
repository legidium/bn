modules.define(
    'account-favorites',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function(){
                    console.log('account-favorites:intited');
                    this._totalItems = 0;
                }
            }
        },

        update: function(data) {
            this._totalItems = (data.total_items || 0 ) + 0;
            this.elem('title-note').text(this._totalItems + ' объектов');
        }
    }
));

})