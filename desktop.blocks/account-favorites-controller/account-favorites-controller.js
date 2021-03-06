modules.define(
    'account-favorites-controller',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'account-favorites-list', 'objects-list-item-tools'],
    function(provide, BEMHTML, BEMDOM, $, List, Tools) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-favorites-controller:intited');

                    this._params = {
                        userAuth:       false,

                        dataUrl:        '/desktop.blocks/account-favorites/data.json',

                        favoriteGetUrl: '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                        favoritePutUrl: '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        
                        listsGetUrl:    '/desktop.blocks/objects-list-item-lists/get.json',
                        listsPutUrl:    '/desktop.blocks/objects-list-item-lists/put.json',
                        listsDelUrl:    '/desktop.blocks/objects-list-item-lists/del.json',
                        listsAddUrl:    '/desktop.blocks/objects-list-item-lists/add.json',

                        userNoteGetUrl: '/desktop.blocks/objects-list-item-note/get.json',
                        userNotePutUrl: '/desktop.blocks/objects-list-item-note/put.json'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._main     = this.findBlockOn('account-favorites');
                    this._menu     = this.findBlockOutside('account-menu');
                    this._list     = this.findBlockInside('account-favorites-list');
                    this._pager    = this.findBlockInside('pager');
                    this._spin     = this.findBlockInside('spin');
                    this._toolbar  = this._main && this._main.elem('toolbar');

                    List.on(this.domElem, 'params', this._onParams, this);
                    Tools.on(this.domElem, 'params', this._onParams, this);

                    this.on('ajax_start', function() { this.setMod('loading'); });
                    this.on('ajax_end', function() { this.delMod('loading'); });
                    this.on('data_loaded', this._onDataLoaded, this);
                    this.on('data_load_error', this._onDataLoadError, this);

                    this._pager && this._pager.on('change', this._onPageChange, this);

                    this.loadData();
                }
            },
            'loading': {
                true: function() {
                    this._list && this._list.setMod('loading');
                    this._pager && this.setMod('loading');
                    this._spin && this._spin.setMod('visible');
                },
                '': function() {
                    this._list && this._list.delMod('loading');
                    this._pager && this.delMod('loading');
                    this._spin && this._spin.delMod('visible');
                }
            }
        },

        getData: function() {
            return this._data;
        },

        loadData: function() {
            this._abortRequest();

            var that = this;
            var query = this._getUrlParams();
            var url = (this._params.dataUrl || '') + (query ? '?' + query : '');

            this.emit('ajax_start');

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
                that.emit('data_load_error', { error: error });
                that.emit('ajax_end');
            });
        },

        _setUrlQueryString: function() {
            var query = this._getUrlParams();
            window.history.pushState(null, null, window.location.pathname +  (query ? '?' + query : ''));
        },

        _onDataLoaded: function() {
            var data = this._data;

            this._setUrlQueryString();
            
            // Sanitize data
            var userAuth = data.user_auth;
            switch (typeof userAuth) {
                case 'string': userAuth = userAuth == 'true' ? true : false; break;
                case 'boolean': userAuth = Boolean(userAuth); break;
                default: userAuth = false;
            }

            data.user_auth = userAuth;
            data.current_page = this._page;
            data.lists = data.lists || [];
            data.items = data.items || [];

            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            // Update user auth
            this._params.userAuth = data.user_auth;

            // Update list
            if (this._list) {
                this._list.setParams(this._params);
                this._list.append(data.items);
            }

            this._main && this._main.update(data);
            this._pager && this._pager.update(data);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onPageChange: function(e, data) {
            data = data || {};
            this._prevPage = this._page;
            this._page = data.page || 1;

            this.loadData();
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrlParams: function() {
            // TODO Save prev value if ajax error
            return (this._page > 1 ? 'page=' + this._page : '');
        },

        _onParams: function(e) {
            e.target.setParams(this._params);
        }

    }
));


});