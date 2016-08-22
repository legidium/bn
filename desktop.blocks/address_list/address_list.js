
modules.define(
    'address_list',
    ['BEMHTML', 'i-bem__dom', 'address_list_item', 'jquery'],
    function(provide, BEMHTML, BEMDOM, Item, $) {


provide(BEMDOM.decl({ block : this.name }, /** @lends address_list.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {

                this._items = null;

            }
        },

    },

    /**
     * Returns items
     * @returns {address_list_item[]}
     */
    getItems : function() {
        // return this._items || (this._items = this.findBlocksInside('address_list_item'));
        return this.findBlocksInside('address_list_item');
    },


    clear: function(){
        var items = this.findBlocksInside('address_list_item');
        for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
    },

    

    addItem : function(index, text){
        BEMDOM.append(
            this.domElem,
            BEMHTML.apply({
                js: true,
                attrs: {
                    'data-index': index
                },
                block : 'address_list_item',
                text: text
            })
        );
    },


    removeItem: function(index){
        var items = this.findBlocksInside('address_list_item');
        for (var i = items.length - 1; i >= 0; i--) {
            if($(items[i].domElem).attr('data-index') == index){
                $(items[i].domElem).remove();
            }
        };
    }

   
    
}));

});
