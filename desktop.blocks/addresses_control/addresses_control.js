
modules.define(
    'addresses_control',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {


provide(BEMDOM.decl({ block : this.name }, /** @lends address_autocomplete.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {

                this._address    = this.findBlockInside('address_autocomplete');
                this._dom_number = this.findBlockInside(this.elem('dom_number'), 'input');
                this._address_list = this.findBlockInside('address_list');

                this._vals = [];

                var that = this;


                function event(){
                    var s = that._address.getVal();
                    var d = that._dom_number.getVal();

                    if(s.text.length && d.length){

                        that._vals.push({
                            text: s.text, 
                            id: s.id,
                            dom: d
                        });

                        that._address_list.addItem(that._vals.length - 1, s.text + ', ' + d);

                        that._address.setVal('');
                        that._dom_number.setVal('');

                        that._setEvents();
                    }
                }




                this._dom_number.bindTo('keyup', function(e){
                    if(e.keyCode === 13){
                        event();
                    }
                });



                this._dom_number.bindTo(this._dom_number.elem('control'), 'blur', function(e){
                    event();
                });







            }
        },

    },


    _onRemove: function(e, index){
        if (index > -1) {
            this._vals.splice(index, 1);
        }
    },


    _setEvents: function(){
        var that = this;
        this.findBlocksInside('address_list_item').map(function(item){
            item.on('remove', that._onRemove, that);
        });
    },



    getVal: function(){
        return this._vals;
    },



}));

});
