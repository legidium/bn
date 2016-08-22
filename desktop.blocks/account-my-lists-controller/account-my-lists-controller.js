modules.define(
    'account-my-lists-controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-my-ads-controller:inited');

                    this._params = {
                        userAuth:       false,

                        accountMyLists: {
                            dataUrl:   '/desktop.blocks/account-dashboard-list/data.json',
                            createUrl: '/desktop.blocks/account-dashboard-list/create.json'
                        }
                    };

                    this._params = $.extend(this._params, this.params);

                    this._page = 1;
                    this._data = {};

                    this._main    = this.findBlockOn('account-my-lists-content');
                    this._list    = this.findBlockInside('account-my-lists-list');
                    this._filter  = this.findBlockInside('account-my-lists-filter');
                    this._toolbar = this.findBlockInside('account-my-lists-list-toolbar');
                    this._pager   = this.findBlockInside('pagination');
                    this._spin    = this._main && this._main.findBlockInside('spin');
                    this._sort    = this._toolbar && this._toolbar.elem('sort').bem('select');

                    this.on('data_loaded', this._onDataLoaded, this);
                    this._filter && this._filter.on('submit', this._onFilterSubmit, this);
                    this._pager && this._pager.on('change', this._onPageChange, this);
                    this._sort && this._sort.on('change', this._onSortChange, this);

                    var that = this;

                    this.on('ajax_start', function() {
                        that._list && that._list.setMod('loading');
                        that._spin && that._spin.setMod('visible');
                    });

                    this.on('ajax_start', function() {
                        // Задержка для демонстрации работы спиннера
                        setTimeout(function() { that._spin && that._spin.delMod('visible'); }, 200); 
                        //that._spin && that._spin.delMod('visible');

                        that._list && that._list.delMod('loading');
                    });

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
                console.log(error);
                that.emit('ajax_end');
            });

        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrl: function() {
            return this._params.accountMyLists.dataUrl || '';
        },

        _getUrlParams: function() {
            var params = this._filter ? this._filter.getData() : [];

            if (this._sort) {
                params.push({ name: 'sort', value: this._sort.getVal() });
            }

            if (this._page > 2) {
                params.push({ name: 'page', value: this._page });
            }

            return $.param(params);
        },

        _setUrlQueryString: function(){
            window.history.pushState(null, null, window.location.pathname + '?' + this._getUrlParams());
        },

        _onDataLoaded: function() {
            var data = this._data;

            data.user_auth = !!data.user_auth; // TODO нужно доработать проверку входа пользователя
            data.current_page = this._page;
            data.items = data.items || [];
            data.items_count = data.items.length;

            this._setUrlQueryString();

            this._list && this._list.update(data.items);
            this._pager && this._pager.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items_count);
        },

        _onFilterSubmit: function() {
            this.loadData();
        },

        _onSortChange: function() {
            console.log('sort');
            this.loadData();
        },

        _onPageChange: function() {
            this._page = this._pager && this._pager.getCurrentPage();
            this.loadData();
        }
    }
));


});