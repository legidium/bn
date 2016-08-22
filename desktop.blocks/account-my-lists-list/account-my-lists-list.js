modules.define(
    'account-my-lists-list',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-my-lists-list:inited');
                    this._items = this.findElem('items');
                }
            }
        },

        update: function(items) {
            var bemjson, html;
            var that = this;

            items = items || [];

            this._clear(true);

            if (this._items) {
                (items).map(function(item) {
                    BEMDOM.append(that._items, BEMHTML.apply({
                        block: 'account-my-lists-list-item',
                        mods: item.mods || undefined,
                        content: item
                    }));
                })
            }
        },

        getItems: function() {
            return this.findBlocksInside('account-my-lists-list-item');
        },

        _clear: function(all) {
            var items = this.getItems(all || false);

            for (var i = items.length - 1; i >= 0; i--) {
                $(items[i].domElem).remove();
            };
        }
    }
));

});