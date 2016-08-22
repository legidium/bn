modules.define(
    'search_map_popup',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js': {
                    'inited': function () {
                        this._close = this.elem('close');
                        this._popup = this.findBlockInside('popup');
                        this.bindTo(this._close, 'click', function(){
                            this._popup.delMod('visible');
                        }, this)
                    }
                }
            }
        }));
});
