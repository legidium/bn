
modules.define(
    'address_autocomplete',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {


provide(BEMDOM.decl({ block : this.name }, /** @lends address_autocomplete.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {

                this._input = this.findBlockInside('input');
                this._popup = this.findBlockInside('popup').setAnchor(this._input);
                this._menu  = this.findBlockInside('menu');

                // устанавливает базовый город
                this._base = this.params.base ? this.params.base + ' ' : '';

                this._input.on('change', this._onInputChange, this);

            }
        },

    },

    getVal: function(){
        return this._input.getVal();
    },

    setVal: function(val){
        return this._input.setVal(val);
    },

    _onInputChange: function(){
        var search_result = [];
        var that = this;

        var input_val = this._input.getVal();

        var val = input_val ? this._base  + ' ' + input_val : '';

        $.getJSON('http://geocode-maps.yandex.ru/1.x/?format=json&callback=?&geocode=' + val, function(data) {
            
            if(data.response){
                for(var i = 0; i < data.response.GeoObjectCollection.featureMember.length; i++) {
                    search_result.push({
                        label: data.response.GeoObjectCollection.featureMember[i].GeoObject.description + ' - ' + data.response.GeoObjectCollection.featureMember[i].GeoObject.name,
                        value: data.response.GeoObjectCollection.featureMember[i].GeoObject.name,
                        longlat: data.response.GeoObjectCollection.featureMember[i].GeoObject.Point.pos
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
    },



    _setMenuContent: function(search_result){
            
        var that = this;
        var menu_content = [];
        var label;
        
        for (var i = 0; i < search_result.length; i++) {
            menu_content.push(this._createMenuItem(search_result[i].value));
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
        
        this._popup.delMod('visible');

        this._input.on('change', this._onInputChange, this);
    },



    _createMenuItem: function(text){
        return BEMHTML.apply({
            js: true,
            block : 'menu-item',
            mods: {theme: 'islands'},
            content: text
        });
    }

   
    
}));

});
