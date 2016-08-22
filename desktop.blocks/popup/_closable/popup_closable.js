/**
 * @module popup
 */

modules.define(
    'popup',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'closable', modVal : true }, /** @lends popup.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                // visiblePopupsStack.unshift(this);
                this
                    .nextTick(function() {

                        this.bindTo(this.elem('close_button'), 'click',  this._onCloseButtonClick, this);
                    })

                    .__base.apply(this, arguments);
            },
        }
    },

    _onCloseButtonClick : function(e) {
        this.delMod('visible');
    }





}, /** @lends popup */{
    live : function() {
        // BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));


});
