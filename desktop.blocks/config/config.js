modules.define('config', ['i-bem__dom', 'jquery', 'events'], function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('config:inited');

                this._params = {
                    favorite_url: '/desktop.blocks/user_lists_in_search/test.json',
                    new_list_url: '/desktop.blocks/user_lists_in_search/add_test.json',
                    add_to_list_url: '/desktop.blocks/user_lists_in_search/test.json',
                    comment_url: '/desktop.blocks/user_lists_in_search/test.json'
                }

                var that = this;

                modules.require(['events__channels'], function(channels) {
                    var channel = channels('config');

                    channel.on('get', function(e, data) {
                        var target = data.target || undefined;
                        if (target && typeof target.setParams == 'function') {
                            target.setParams(that._params);
                        }
                    });
                    
                });
            }
        }
    },

    getParams: function() {
        return this._params;
    }
}

));


});