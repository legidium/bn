modules.define(
    'objects-list-item-lists',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function(){
                console.log('objects-list-item-lists:inited');

                this._params = {
                    userAuth:    false,   
                    listsGetUrl: '/desktop.blocks/objects-list-item-lists/get.json',
                    listsPutUrl: '/desktop.blocks/objects-list-item-tools/put.json',
                    listsDelUrl: '/desktop.blocks/objects-list-item-tools/del.json',
                    listsAddUrl: '/desktop.blocks/objects-list-item-tools/add.json'
                };

                this._data       = {};
                this._itemId     = this.params.itemId || '';
                this._itemType   = this.params.itemType || '';

                this._popup      = this.findBlockOutside('popup');
                this._form       = this.findElem('add-form');
                this._input      = this._popup.findBlockInside('input');
                this._menu       = this._popup.findBlockInside('menu');

                this.emit('params');

                this.on('data_loaded', this._onDataLoaded, this);
                this.bindToDomElem(this._form, 'submit', this._onSubmitAddForm, this);

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
        if (this._menu) {
            var val = data.in_lists || [];
            
            BEMDOM.replace(this._menu.domElem, BEMHTML.apply({
                block: 'menu',
                mods: { theme: 'islands', size: 'm', mode: 'check' },
                val: val,
                content: (data.lists || []).map(function(item) {
                    return {
                        block: 'menu-item',
                        js: { val: item.id, count: item.count },
                        val : item.id,
                        content: [
                            { tag: 'span', block: 'plain_text', mods: { size: '11'}, content: item.name + '&nbsp;' },
                            { tag: 'span', block: 'help', content: item.count }
                        ]
                    }
                })
            }));

            this._menu = this._popup.findBlockInside('menu');
            this._popup && this._popup.setMod('visible').redraw();

            this._setHandlers();
        }
    },

    _loadData: function() {
        var that = this;
        var url = this._params.listsGetUrl + this._getUrlParams();

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

    _setHandlers: function() {
        var that = this;
        this._menu.findBlocksInside('menu-item').map(function(item) {
            item.un('click', that._onItemClick, that);
            item.on('click', that._onItemClick, that);

            if(item.hasMod('checked')){
                item.setMod('disabled');
            }
        });
    },

    _onSubmitAddForm: function(e) {
        e.preventDefault();

        if (!this._input) { return; }

        var that = this;
        var val = this._input.getVal();

        if (val == '') {
            $(this._input.elem('control')).focus();
            return;
        }

        var url = this._params.listsAddUrl;
        var data = { name: val, item_id: this._itemId, item_type: this._itemType };

        $.get(url, data, function(data) {
            that._input.setVal('');

            val = data.name || '';

            BEMDOM.append(that._menu.domElem, BEMHTML.apply({
                block : 'menu-item',
                mods : { theme : 'islands', size : 'm', checked: true, disabled: true },
                js: { count: 1 },
                content : [
                    {
                        tag: 'span',
                        block: 'plain_text',
                        mods: { size: '11'},
                        content: val + '&nbsp;'
                    },
                    {
                        tag: 'span',
                        block: 'help',
                        content: 1
                    }
                ]
            }));

            var d = $(that.elem('list'));
            d.scrollTop(d.prop("scrollHeight"));

            that.emit('add', data);
        });
    },

    _onItemClick: function(e){
        var that = this;
        var item = $(e.target.domElem).bem('menu-item');

        item.setMod('checked', true);
        item.setMod('disabled');

        var url = this._params.listsPutUrl;
        var data = { item_id: this._itemId, item_type: this._itemType, list_id: item.params.val };

        $.get(url, data, function(data) {
            var count = parseInt(item.params.count);
            var newval = count += 1;
            $(item.domElem).find('.help').html(newval);
            $(item.domElem).addClass('menu-item_checked');

            that.emit('put', data);

        });
    },
    _getUrlParams: function() {
        return '?' + ['item_id=' + (this._itemId || ''), 'item_type=' + (this._itemType || '')].join('&');
    }
}));


});