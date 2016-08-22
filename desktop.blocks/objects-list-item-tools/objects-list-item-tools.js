modules.define(
    'objects-list-item-tools',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'querystring', 'objects-list-item-lists', 'objects-list-item-note'],
    function(provide, BEMHTML, BEMDOM, $, Querystring, Lists, Note) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('objects-list-item-tools:inited');

                this._params = {
                    userAuth:       false,
                    favoriteGetUrl: '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                    favoritePutUrl: '/desktop.blocks/objects-list-item-tools/favorite.put.json',

                    loginUrl: '',
                    registerUrl: '',
                };

                this._data       = {};
                this._itemId     = this.params.itemId || '';
                this._itemType   = this.params.itemType || '';

                this._favorite   = this.elem('item', 'favorite');
                this._lists      = this.elem('item', 'lists');
                this._note       = this.elem('item', 'note');
                this._popupLists = null;
                this._popupNote  = null;

                this.emit('params');

                Lists.on(this.domElem, 'params', this._onParams, this);
                Note.on(this.domElem, 'params', this._onParams, this);
            }
        }
    },
    onElemSetMod: {
        'item': {
            'accept': {
                'true': function(elem, modName, modVal, curVal) {
                    if (this.hasMod(elem, 'favorite')) { this._onFavoriteSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'lists')) { this._onListsSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'note')) { this._onNoteSetMod(elem, modName, modVal, curVal); return; }
                },
                '': function(elem, modName, modVal, curVal) {
                    if (this.hasMod(elem, 'favorite')) { this._onFavoriteSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'lists')) { this._onListsSetMod(elem, modName, modVal, curVal); return; }
                    if (this.hasMod(elem, 'note')) { this._onNoteSetMod(elem, modName, modVal, curVal); return; }
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

    _onFavoriteSetMod: function(elem, modName, modVal, curVal) {
        if (modName == 'accept') {
            elem.find('.icon').bem('icon').setMod('action', modVal ? 'star' : 'star-o');
        }
    },

    _onListsSetMod: function(elem, modName, modVal, curVal) {
        if (modName == 'accept') {
            elem.find('.icon').bem('icon').setMod('action', modVal ? 'list' : 'plus');
        }
    },

    _onNoteSetMod: function(elem, modName, modVal, curVal) {
        if (modName == 'accept') {
            elem.find('.icon').bem('icon').setMod('action', modVal ? 'comments-blue' : 'comments');
        }
    },

    _onClickFavorite: function(e) {
        e.preventDefault();

        var that = this;
        var item = e.currentTarget;

        var query = Querystring.stringify({
            'item_id':     this._itemId   || '',
            'item_type':   this._itemType || '',
            'is_favorite': (!this.hasMod(item, 'accept') | 0)
        });

        var url = this._params.favoritePutUrl + '?' + query;

        that.emit('ajax_start');

        this._xhr = $.ajax({method: 'GET', url: url, dataType: 'json', cache: false })
            .done(function(data) {
                !!data.result && that.toggleMod(item, 'accept');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
            });
    },

    _onClickLists: function(e) {
        e.preventDefault();

        if (!this._popupLists) {
            this._popupLists = this._getPopupLists(e.currentTarget);

            if (this._popupLists) {
                var list = this._popupLists.findBlockInside('objects-list-item-lists');
                list && list
                    .on('add', this._onListsAdd, this)
                    .on('put', this._onListsPut, this);

                this._popupLists.setMod('visible');
            }

        } else {
            this._popupLists.setMod('visible');
        }
    },

    _onClickNote: function(e) {
        e.preventDefault();

        if (!this._popupNote) {
            this._popupNote = this._getPopupNote(e.currentTarget);

            if (this._popupNote) {
                var note = this._popupNote.findBlockInside('objects-list-item-note');
                note && note.on('put', this._onNotePut, this);

                this._popupNote.setMod('visible');
            }

        } else {
            this._popupNote.setMod('visible');
        }
    },

    _getPopupLists: function(item) {
        var userAuth = this._params.userAuth || false;

        BEMDOM.append(item, BEMHTML.apply({
            block: 'popup',
            mods: { theme : 'islands', target : 'anchor', autoclosable: true, closable: true },
            content: {
                block: 'objects-list-item-lists',
                js: {
                    itemId: this._itemId,
                    itemType: this._itemType
                },
                auth: userAuth,
                loginUrl: this._params.loginUrl,
                registerUrl: this._params.registerUrl
            }
        }));

        return this.findBlockInside(item, 'popup').setAnchor(item);
    },

    _getPopupNote: function(item) {
        var userAuth = this._params.userAuth || false;

        BEMDOM.append(item, BEMHTML.apply({
            block: 'popup',
            mods: { theme : 'islands', target : 'anchor', autoclosable: true, closable: userAuth },
            content: {
                block: 'objects-list-item-note',
                js: {
                    itemId: this._itemId,
                    itemType: this._itemType
                },
                auth: userAuth,
                loginUrl: this._params.loginUrl,
                registerUrl: this._params.registerUrl
            }
        }));

        return this.findBlockInside(item, 'popup').setAnchor(item);
    },

    _onParams: function(e) {
        e.target.setParams(this._params);
    },

    _onListsAdd: function(e, data) {
        this.setMod(this._lists, 'accept');
    },

    _onListsPut: function(e, data) {
        this.setMod(this._lists, 'accept');
    },

    _onNotePut: function(e, data) {
        this.setMod(this._note, 'accept');
    }

}, {
    'live': function() {
        this.liveBindTo('item', 'click', function(e) {
            var mods = this.getMods(e.currentTarget);

            if (mods.favorite) { this._onClickFavorite(e); return; }
            if (mods.lists) { this._onClickLists(e); return; }
            if (mods.note) { this._onClickNote(e); return; }
        });
    }
}

));

});
