/**
 * @module address_autocomplete
 */

modules.define(
    'address_autocomplete',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $, Address) {

/**
 * @exports
 * @class address_autocomplete
 * @bem
 */
provide(Address.decl({ modName : 'type', modVal : 'bn' }, /** @lends address_autocomplete.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._input = this.findBlockInside('input');
                this._popup = this.findBlockInside('popup').setAnchor(this._input);
                this._menu  = this.findBlockInside('menu');

                this._url = this.params.url ? this.params.url + '?': '/?';

                this._input.on('change', this._onInputChange, this);

                this._val;
            }
        }
    },


    getVal: function(){
        return {
            text: this._input.getVal(),
            id: this._val
        };
    },

    setVal: function(val){
        return this._input.setVal(val);
    },

    _onInputChange: function(){
        var search_result = [];
        var that = this;

        var input_val = this._input.getVal();


        if(input_val.length > 2){
            $.getJSON(this._url + 'needle=' + input_val, function(data) {
            
                if(data){
                    for(var i = 0; i < data.length; i++) {
                        search_result.push({
                            label: data[i].street,
                            value: data[i].id,
                            longlat: ''
                        });
                    }
                }

                that._setMenuContent(search_result);
                
                if(search_result.length){
                    that._popup.setMod('visible');
                } else {
                    that._popup.delMod('visible');
                }
                
            });
        }
    },



    _setMenuContent: function(search_result){
            
        var that = this;
        var menu_content = [];
        var label;
        
        for (var i = 0; i < search_result.length; i++) {
            menu_content.push(this._createMenuItem(search_result[i].label, search_result[i].value));
        };

        this._menu.setContent(menu_content.join(''));

        this._menu.getItems().map(function(item){
            item.on('click', that._onMenuChange, that);
        });
    },



    _onMenuChange: function(e){
        this._input.un('change', this._onInputChange, this);
        
        var item = $(e.target.domElem).bem('menu-item');
        
        this._input.setVal(item.getText());

        this._val = item.getVal();

        
        this._popup.delMod('visible');

        this._input.on('change', this._onInputChange, this);
    },



    _createMenuItem: function(text, value){
        return BEMHTML.apply({
            js: { val: value },
            block : 'menu-item',
            mods: {theme: 'islands'},
            content: text
        });
    }




}));

});
