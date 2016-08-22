modules.define('multi-value', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

    onSetMod: {
        'js' : {
            inited: function() {
                this._items = this.findElem('items');
                this.bindTo('button-add', 'click', this.add, this);
                //this.bindTo('button-del', 'click', this.del, this);
            }
        }
    },

    add: function() {
        // TODO: Необходимо клонировать скрытый елемент с пустыми значениями
        this.findElem('item').eq(0).clone().appendTo(this._items);
    },

    del: function() {
        // TODO
    }

}));

});