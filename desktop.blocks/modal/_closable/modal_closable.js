/**
 * @module modal
 */

modules.define(
    'modal',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

/**
 * @exports
 * @class modal
 * @bem
 */
provide(Popup.decl({ modName : 'closable', modVal : true }, /** @lends modal.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                // visiblePopupsStack.unshift(this);
                var that = this;
                this
                    .nextTick(function() {

                        that.bindTo(that.elem('close_button'), 'click', function(e) {
                            that.delMod('visible');
                        });
                    })

                    .__base.apply(this, arguments);
            },
        }
    },





}, /** @lends modal */{
    live : function() {
        // BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));


});
