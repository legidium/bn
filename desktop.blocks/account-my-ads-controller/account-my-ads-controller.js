modules.define(
    'account-my-ads-controller',
    ['i-bem__dom', 'jquery', 'objects-list-item-tools'],
    function(provide, BEMDOM, $, ItemTools) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-my-ads-controller:inited');

                    this._params   = {
                        userAuth: false,

                        accountMyAds: {
                             dataUrl:       '/desktop.blocks/account-my-ads-content/data.json',
                        },

                        // List item tools url
                        favoriteGetUrl:    '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                        favoritePutUrl:    '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        listsGetUrl:       '/desktop.blocks/objects-list-item-lists/get.json',
                        listsPutUrl:       '/desktop.blocks/objects-list-item-lists/put.json',
                        listsDelUrl:       '/desktop.blocks/objects-list-item-lists/del.json',
                        listsAddUrl:       '/desktop.blocks/objects-list-item-lists/add.json',
                        userNoteGetUrl:    '/desktop.blocks/objects-list-item-note/get.json',
                        userNotePutUrl:    '/desktop.blocks/objects-list-item-note/put.json',

                        loginUrl: 'login',
                        registerUrl: 'register'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;

                    this._main    = this.findBlockOn('account-my-ads-content');
                    this._list    = this.findBlockInside('objects-list');
                    this._filter  = this.findBlockInside('account-my-ads-filter');
                    this._pager   = this.findBlockInside('pagination');
                    this._spin    = this.findBlockInside('spin');

                    this._list && this._list.setParams(this._params);

                    this._setEvents();
                    this.loadData();
                }
            }
        },

        loadData: function() {
            var that = this;
            var params = this._getUrlParams();
            var url = this._getUrl() + (params ? '?' + params : '');

            this._abortRequest();
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

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrl: function() {
            var urls = this._params.accountMyAds;
            return urls && (urls.dataUrl || '');
        },

        _getUrlParams: function() {
            var params = this._filter ? this._filter.getData() : [];

            if (this._sort) {
                params.push({ name: 'sort', value: this._sort.getVal() });
            }

            if (this._page > 1) {
                params.push({ name: 'page', value: this._page });
            }

            return $.param(params);
        },

        _setUrlQueryString: function(){
            window.history.pushState(null, null, window.location.pathname + '?' + this._getUrlParams());
        },

        _setEvents: function() {
            var that = this;

            ItemTools.on(this.domElem, 'params', function(e) {
                e.target.setParams(that._params);
            }, this);

            this.on('data_loaded', this._onDataLoaded, this);
            this.on('data_load_error', this._onDataLoadError, this);
            this._filter && this._filter.on('submit', this._onFilterSubmit, this);
            this._pager.on('change', this._onPageChange, this);

            this.on('ajax_start', function() {
                that._list && that._list.setMod('loading');
                that._spin && that._spin.setMod('visible');
            });

            this.on('ajax_start', function() {
                that._spin && that._spin.delMod('visible');
                that._list && that._list.delMod('loading');
            });
        },

        _onDataLoaded: function() {
            var data = this._data;

            data.user_auth = !!data.user_auth; // TODO нужно доработать проверку входа пользователя
            data.current_page = this._page;
            data.items = data.items || [];
            
            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            this._setUrlQueryString();
            this._params.userAuth = data.user_auth;

            if (this._list) {
                this._list.setParams(this._params);
                this._list.update(data.items, data.lists || [], data.user_auth);
            }

            this._pager && this._pager.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items_count);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onFilterSubmit: function() {
            this.loadData();
        },

        _onPageChange: function(e, data) {
            data = data || [];

            this._prevPage = this._page;
            this._page = data.length ? data[0] : 1;
            this.loadData();
        }
    }
));


});