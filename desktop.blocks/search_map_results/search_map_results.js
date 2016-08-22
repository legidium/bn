modules.define('search_map_results',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, loader, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js': {
                    inited: function () {

                    }
                }
            }
        }));
});
