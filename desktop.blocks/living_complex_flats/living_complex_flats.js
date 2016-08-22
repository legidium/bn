modules.define(
    'living_complex_flats',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('living_complex_flats:inited');

                    this._showAll = this.findBlockOn(this.elem('show-all'), 'button');
                    this._showAll && this._showAll.on('click', function() { this.emit('show-all'); }, this);
                }
            }
        }
    }));
})