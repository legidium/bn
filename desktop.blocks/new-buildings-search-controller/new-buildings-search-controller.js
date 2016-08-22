modules.define(
    'new-buildings-search-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('new-buildings-search-controller:inited');

                    this._params   = { userAuth: false, dataUrl: '' };
                    this._params   = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._sorting  = null;

                    this._filter  = this.findBlockOn('new-buildings-search-filter');
                    this._spin    = this.findBlockInside('spin');
                    this._main    = this.findBlockOutside('new-buildings-content');
                    this._list    = this._main && this._main.findBlockInside('search_results');
                    this._pager   = this._main && this._main.findBlockInside('pagination');

                    this._sort         = $('#search_filter_sorts').bem('select');
                    this._returnButton = $('#search_filter_return_button').bem('button');

                    this._setEvents();
                    this.loadData();
                }
            }
        },

        loadData: function() {
            var that = this;
            var params = $.param(this._getUrlParams());
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
                that._setUrlQueryString(params);

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
            return this._params.dataUrl;
        },

        _getUrlParams: function() {
            var params = this._filter ? this._filter.getParamsForServer() : [];

            if (this._sorting) {
                params.push({ name: 'sortBy', value: this._sort.getVal() });
            }

            if (this._page > 1) {
                params.push({ name: 'page', value: this._page });
            }

            return params;
        },

        _setUrlQueryString: function(params) {
            params = typeof params != "undefined" ? params : $.param(this._getUrlParams());
            window.history.pushState(null, null, window.location.pathname + (params ? '?' + params : ''));
        },

        _setEvents: function() {
            var that = this;
            
            this.on('data_loaded', this._onDataLoaded, this);
            this.on('data_load_error', this._onDataLoadError, this);

            this._filter && this._filter.on('submit', this._onFilterSubmit, this);
            this._pager && this._pager.on('change', this._onPageChange, this);

            // On Sort
            this._sort.on('change', function() {
                this._sorting = this._sort.getVal();
                this.loadData();
            }, this);

            // On Return
            this._returnButton && this._returnButton.bindTo('click', function(e) {
                if (that._params.returnUrl) {
                    window.location.href = that._params.returnUrl;
                }
            });

            this.on('ajax_start', function() {
                that._list && that._list.setMod('loading');
                that._spin && that._spin.setMod('visible');
            });

            this.on('ajax_end', function() {
                that._list && that._list.delMod('loading');
                that._spin && that._spin.delMod('visible');
            });
        },

        _onDataLoaded: function() {
            var data = this._data;

            data.user_auth = !!data.user_auth; // TODO Доработать проверку входа пользователя
            data.current_page = this._page;
            data.items = data.items || [];
            
            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            this._setUrlQueryString();
            this._params.userAuth = data.user_auth;

            if (this._list) {
                //this._list.setParams(this._params);
                this._list.update(data);
            }

            this._pager && this._pager.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items_count);
            this._pager && this._pager.delMod('hidden');
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
    }));
});