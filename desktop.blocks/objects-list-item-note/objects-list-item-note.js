modules.define(
    'objects-list-item-note',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('objects-list-item-note:inited');

                this._params = {
                    userAuth:    false,   
                    userNoteGetUrl: '/desktop.blocks/objects-list-item-note/get.json',
                    userNotePutUrl: '/desktop.blocks/objects-list-item-note/put.json'
                };

                this._data       = {};
                this._itemId     = this.params.itemId || '';
                this._itemType   = this.params.itemType || '';

                this._popup    = this.findBlockOutside('popup');
                this._form     = this.findElem('form');
                this._cancel   = this.findBlockInside(this.findElem('cancel'), 'button'); 
                this._textarea = this.findBlockInside('textarea');

                this.emit('params');

                var that = this;
                this._cancel && this._cancel.on('click', function(e) {
                    e.preventDefault();
                    that._popup.delMod('visible');
                });

                if (this._form) {
                    this.bindToDomElem(this._form, 'submit', function(e) {
                        e.preventDefault();
                        var val = $(that._textarea.domElem).val();
                        
                        if (val == '') { $(that._textarea.domElem).focus(); return ; }
                        
                        var url = that._params.userNotePutUrl;
                        var data = { item_id: this._itemId, item_type: this._itemType, note: val };

                        $.get(url, data, function(data) {
                            that._popup.delMod('visible');
                            that.emit('put', data);
                        });
                    });
                }

                this.on('data_loaded', this._onDataLoaded, this);

                if (this._params.userAuth) {
                    this._loadData()
                }
            }
        }
    },

    setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
        this._data = data || {};
    },

    update: function(data) {
        this.elem('text').text(data.user_note || '');
        this._popup && this._popup.setMod('visible').redraw();
    },

    _loadData: function() {
        var that = this;
        var url = this._params.userNoteGetUrl + this._getUrlParams();

        that.emit('ajax_start');

        this._xhr = $.ajax({
            method: 'GET',
            url: url,
            dataType: 'json',
            cache: false
        })
        .done(function(data) {
            that._data = data;
            that.emit('data_loaded');
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _onDataLoaded: function() {
        this.update(this._data);
    },

    _getUrlParams: function() {
        return '?' + ['item_id=' + (this._itemId || ''), 'item_type=' + (this._itemType || '')].join('&');
    }

}));


});