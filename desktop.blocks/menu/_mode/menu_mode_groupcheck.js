/**
 * @module menu
 */

modules.define('menu', ['jquery'], function(provide, $, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'groupcheck' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        return this.getItems()
            .filter(function(item) { return item.hasMod('checked'); })
            .map(function(item) { return item.getVal(); });
    },

    /**
     * @override
     * @param {Array} vals
     */
    _setVal : function(vals) {
        var wasChanged = false,
            notFoundValsCnt = vals.length,
            itemsCheckedVals = this.getItems().map(function(item) {
                var isChecked = item.hasMod('checked'),
                    hasEqVal = vals.some(function(val) {
                        return item.isValEq(val);
                    });
                if(hasEqVal) {
                    --notFoundValsCnt;
                    isChecked || (wasChanged = true);
                } else {
                    isChecked && (wasChanged = true);
                }
                return hasEqVal;
            });

        if(!wasChanged || notFoundValsCnt)
            return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        this.getItems().forEach(function(item) {
            item === clickedItem && item.toggleMod('checked');
        });

        if(clickedItem.hasMod('group_title')){
            this._getGroupItems(clickedItem).map(function(item){
                if(item !== clickedItem){
                    if(clickedItem.hasMod('checked')){
                        item.setMod('checked');
                    } else {
                        item.delMod('checked');
                    }
                }
            });
        }

        this._isValValid = false;
        this.emit('change');

    },





    _getGroupItems : function(groupTitle){
        return this.findBlocksInside(this.elem('group').filter($(groupTitle.domElem).parent()), 'menu-item');
    }









}));

});
