modules.define(
    'account-my-subs-list',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('account-my-subs-list:intited');

                this._params = {};
                this._items  = [];

                this.emit('params');
            }
        }
    },

    setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
        
    },

    update: function(items) {
        console.log('Update: account-favorites-list');
    },

    append: function(items) {
        var that = this;

        items = items || [];
        this._items.concat(items);

        items.map(function(item) {
            that.appendItem(item);
        });
    },

    appendItem: function(item) {
        item = item || {};

        BEMDOM.append(this.elem('items'), BEMHTML.apply({
            block: 'account-my-subs-list-item',
            js:   item.js   || undefined,
            mods: item.mods || undefined,
            link: item.link || undefined,
            content: item
        }));
    },

    clear: function(all){
        all = all || false;
        items = this._getItems(all);

        for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
    },
    
    _getItems: function(all){
        all = all || false;
        if (!all) {
            return this.findBlocksInside({ block: 'account-my-subs-list-item'});
        }
        return this.findBlocksInside('account-my-subs-list-item');
    },

    _onParams: function(e) {
        e.target.setParams(this._params);
    },

    _onData: function(e) {
       
    }

}


));





});