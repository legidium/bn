modules.define(
    'account-dashboard-list-tools',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                console.log('account-dashboard-list-tools:inited');
            }
        }
    }

}, {
    live: function() {
        this.liveBindTo('button', 'click', function(e) {
            var action = this.getMod(e.currentTarget, 'action');
            this.emit('action', action);
        });
    }
}

))

});
