modules.define(
    'account-dashboard-list-controller',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'objects-list-item-tools'],
    function(provide, BEMHTML, BEMDOM, $, ItemTools) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('account-dashboard-list-controller:inited');
                    
                    this._params = {
                        userAuth:       false,
                        accountDashboardList: {
                            dataUrl:       '/desktop.blocks/account-dashboard-list/data.json',
                            copyUrl:       '/desktop.blocks/account-dashboard-list/copy.json',
                            deleteUrl:     '/desktop.blocks/account-dashboard-list/del.json',
                            titlePutUrl:   '/desktop.blocks/account-dashboard-list/title.put.json',
                            commentGetUrl: '/desktop.blocks/account-dashboard-list/comment.get.json',
                            commentPutUrl: '/desktop.blocks/account-dashboard-list/comment.put.json',
                        },

                        // List item tools url
                        favoriteGetUrl:    '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                        favoritePutUrl:    '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        listsGetUrl:       '/desktop.blocks/objects-list-item-lists/get.json',
                        listsPutUrl:       '/desktop.blocks/objects-list-item-lists/put.json',
                        listsDelUrl:       '/desktop.blocks/objects-list-item-lists/del.json',
                        listsAddUrl:       '/desktop.blocks/objects-list-item-lists/add.json',
                        userNoteGetUrl:    '/desktop.blocks/objects-list-item-note/get.json',
                        userNotePutUrl:    '/desktop.blocks/objects-list-item-note/put.json'
                    };

                    this._params = $.extend(this._params, this.params);

                    this._data     = {};
                    this._page     = 1;
                    this._prevPage = 1;
                    this._id       = this.params.id || 0;
                    this._isNew    = this.params.is_new ? true : false;
                    this._heading  = false;

                    this._dashboard    = this.findBlockOutside('account-dashboard');
                    this._main         = this.findBlockOn('account-dashboard-list');
                    this._pager        = this.findBlockInside('pager');
                    this._spin         = this.findBlockInside('spin');
                    this._tools        = this.findBlockInside('account-dashboard-list-tools');
                    this._titleEdit    = this.findBlockInside('account-dashboard-list-title-edit');
                    this._comment      = this.findBlockInside('account-dashboard-list-comment-edit');

                    this._main && this._main.setParams(this._params);

                    this._setEvents();
                    
                    this._isNew && this._main && this._main.setMod('new');
                    !this._isNew && this.loadData();
                }
            },
            'loading': {
                true: function() {
                    this._main && this._main.setMod('loading');
                    this._pager && this.setMod('loading');
                    this._spin && this._spin.setMod('visible');
                },
                '': function() {
                    this._main && this._main.delMod('loading');
                    this._pager && this.delMod('loading');
                    this._spin && this._spin.delMod('visible');
                }
            }
        },

        setState: function() {
            if (this._isNew) {
                this._tools && this._tools.domElem.hide();

                this._dashboard.setMod(this._title, 'hidden');
                this._titleEdit.setMod('edit');
                this._titleEdit.delMod('hidden');
            }
        },

        getData: function() {
            return this._data;
        },

        loadData: function() {
            var that = this;

            var params = [{ name: 'item_id', value: this._id }];
            var url = this._getUrl() + this._getUrlParams(params);

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

        _getUrl: function(type) {
            var url = '';
            var params = this._params.accountDashboardList || {};
            type = type || 'data';

            switch (type) {
                case 'data':        url = params.dataUrl; break;
                case 'delete':      url = params.deleteUrl; break;
                case 'copy':        url = params.copyUrl; break;
                case 'comment:get': url = params.commentGetUrl; break;
                case 'comment:put': url = params.commentPutUrl; break;
                case 'title:put':   url = params.titlePutUrl; break;
            }

            return url;
        },

        _abortRequest: function() {
             this._xhr && this._xhr.abort();
        },

        _getUrlParams: function(params) {
            var query;
            params = params || [];
            this._page > 1 && params.push({ name: 'page', value: this._page });
            query = $.param(params);

            return query ? '?' + query : '';
        },

        _setUrlQueryString: function(){
            window.history.pushState(null, null, window.location.pathname + this._getUrlParams());
        },

        _setEvents: function() {
            this.on('ajax_start', function() { this.setMod('loading'); }, this);
            this.on('ajax_end', function() { this.delMod('loading'); }, this);
            this.on('data_loaded', this._onDataLoaded, this);
            this.on('data_load_error', this._onDataLoadError, this);

            ItemTools.on(this.domElem, 'params', function(e) { e.target.setParams(this._params); }, this);

            this._pager && this._pager.on('change', this._onPageChange, this);
            this._comment && this._comment.on('save', this._onCommentSave, this);
            this._titleEdit && this._titleEdit.on('save', this._onTitleEditSave, this);
            this._tools && this._tools.on('action', this._onToolsAction, this);
        },

        _updateParams: function(data) {
            data = data || {};
            this._params.userAuth = data.user_auth;
        },

        _onDataLoaded: function() {
            var data = this._data;

            this._setUrlQueryString();
            
            // Sanitize input data
            data.user_auth = !!data.user_auth; // TODO нужно доработать проверку входа пользователя
            data.current_page = this._page;

            data.items = data.items || [];
            
            // Количество строк без учета заголовка
            data.items_count = 0;
            data.items.map(function(item) { if (!item.mods || !item.mods.heading) data.items_count++; });

            this._updateParams(data);

            if (this._main) {
                this._main.setParams(this._params);
                this._main.append(data.items);
            }

            this._pager && this._pager.update(data);
        },

        _onDataLoadError: function(e, data) {
            this._page = this._prevPage;
            console.log(data.error);
        },

        _onCommentSave: function(e, data) {
            var that = this;

            var params = [
                { name: 'item_id', value: this._id },
                { name: 'comment', value: data }
            ];

            var url = this._getUrl('comment:put') + this._getUrlParams(params);

            this._comment.setMod('disabled');
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                if (data.result == 'success') {
                    that._comment.update(data.data || '');
                    that._comment.setMod('saved');
                }

                that.emit('comment:saved');
                that.emit('ajax_end');
                that._comment.delMod('disabled');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
                that._comment.delMod('disabled');
            });
        },

        _onTitleEditSave: function(e, data) {
            var that = this;
            
            var params = [
                { name: 'item_id', value: this._id },
                { name: 'title', value: data }
            ];

            var url = this._getUrl('title:put') + this._getUrlParams(params);

            this._titleEdit.setMod('disabled');
            this.emit('ajax_start');

            this._xhr = $.ajax({
                method: 'GET',
                url: url,
                dataType: 'json',
                cache: false
            })
            .done(function(data) {
                if (data.result == 'success') {
                    that._main.elem('title-text').text(data.data);
                    that._main.delMod('title-edit');
                    that._titleEdit && that._titleEdit.setEmpty(true);
                }

                that.emit('title:saved');
                that.emit('ajax_end');
                that._titleEdit.delMod('disabled');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
                that._titleEdit.delMod('disabled');
            });
        },

        _onToolsAction: function(e, action) {
            switch (action) {
                case 'edit':
                    this._main && this._main.toggleMod('title-edit');
                    break;
            }
        },

        _onTitleEditAction: function() {
            var action = this._titleEdit.getAction();

            if (action == 'save' && this._title && this._titleText) {
                var that = this;
                var url = this._titleUrl + '?' + 'title=' + this._titleEdit.getText();

                this._abortRequest();
                this.emit('ajax_start');

                this._xhr = $.ajax({
                    method: 'GET',
                    url: url,
                    dataType: 'json',
                    cache: false
                })
                .done(function(data) {
                    var text = (data && data.result) || '';

                    if (text) {
                        that._titleText.text(text);
                        that.emit('title_updated');

                        that._titleEdit.delMod('edit');
                        that._titleEdit.setMod('hidden');
                        that._dashboard.delMod(that._title, 'hidden');
                    }

                    that.emit('ajax_end');
                })
                .fail(function(error) {
                    console.log(error);
                    that.emit('ajax_end');
                });
                
            }
        },

        _onPageChange: function(e, data) {
            data = data || {};
            this._prevPage = this._page;
            this._page = data.page || 1;

            this.loadData();
        }
    }
));


});