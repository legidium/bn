modules.define(
    'objects-list',
    ['BEMHTML', 'i-bem__dom', 'jquery', ],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited': function() {
                    console.log('objects-list:inited');
                    
                    this._params = { userAuth : false };
                    this._data   = { heading: false, items: [] };
                    
                    this._items  = this.findElem('items');
                }
            }
        },

        setParams: function(params) {
            this._params = params || {};
        },

        append: function(items) {
            var that = this;

            (items || []).map(function(item) {
                var isHeading = item.mods && item.mods.heading;
                if (isHeading && that._params.heading) { return; }
                if (isHeading && !that._params.heading) { that._params.heading = true; }

                that._data.items.push(item);
                that.appendItem(item);
            });

            this._updateEvents();
        },

        update: function(items) {
            var that = this;

            this.clear(false);

            (items || []).map(function(item) {
                var isHeading = item.mods && item.mods.heading;
                if (isHeading && that._params.heading) { return; }
                if (isHeading && !that._params.heading) { that._params.heading = true; }

                that._data.items.push(item);
                that.appendItem(item);
            });

            this._updateEvents();
        },

        appendItem: function(item) {
            item = item || {};

            BEMDOM.append(this.elem('items'), BEMHTML.apply({
                block: 'objects-list-item',
                js:   item.js   || undefined,
                mods: item.mods || undefined,
                link: item.link || undefined,
                content: item
            }));
        },

        clear: function(all) {
            all = all || false;
            items = this.getItems(all);

            for (var i = items.length - 1; i >= 0; i--) {
                $(items[i].domElem).remove();
            };
        },

        getItems: function(all) {
            all = all ? true : false;

            var rows = all
                ? this.elem('items').find('.objects-list-item')
                : this.elem('items').find('.objects-list-item').not('.objects-list-item_heading');
            
            var items = [];
            rows.each(function(i) { items.push($(this).bem('objects-list-item')); });

            return items;
        },

        _updateEvents: function() {
            if (!this._checkAll && this._list) {
                this._checkAll = this.findBlockInside(this._list, 'checkbox', 'check-all', true);
                this._checkAll && this._checkAll.on({ modName: 'checked', modVal: '*' }, function(e) { this._onListCheckAllChange(e); }, this);
            }
        },
    }
));

});