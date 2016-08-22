modules.define(
    'account-favorites-list-item',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js' : {
                    'inited' : function(){
                        console.log('account-favorites-list-item:inted');
                    }
                }
            },

            setParams: function(params) {
            
            },

            setData: function(data) {

            }        

    }));

});
