modules.define(
    'account-dashboard-list',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'checkbox'],
    function(provide, BEMHTML, BEMDOM, $, Checkbox) {

provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js': {
                'inited': function() {
                    console.log('account-dashboard-list:inited');

                    this._params = {};
                    this._data   = { heading: false, items: [] };

                    this._title        = this.elem('title');
                    this._titleText    = this.elem('title-text');
                    this._titleNote    = this.elem('title-note');
                    this._titleEdit    = this.findBlockInside('account-dashboard-list-title-edit');
                    this._commentEdit  = this.findBlockInside('account-dashboard-list-comment-edit');
                    this._toolbar      = this.findBlockInside('account-dashboard-list-toolbar');
                    this._list         = this.elem('list');
                    
                    this._checkAll = this.findBlockInside(this._list, 'checkbox', 'check-all', true);
                    this._checkAll && this._checkAll.on('change', this._onListCheckAllChange(e), this);

                    this.emit('params');
                }
            },
            'new': {
                'true': function() {
                    this.setMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.setMod('visible');
                    this._commentEdit && this._commentEdit.setMod('visible');
                },
                '': function() {
                    this.delMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.delMod('visible');
                    this._commentEdit && this._commentEdit.delMod('visible');
                }
            },
            'title-edit': {
                'true': function() {
                    this.setMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.isEmpty() && this._titleEdit.setText(this._titleText.text());
                    this._titleEdit && this._titleEdit.setMod('visible');
                },
                '': function() {
                    this.delMod(this._title, 'hidden');
                    this._titleEdit && this._titleEdit.delMod('visible');
                }
            }
        },

        setParams: function(params) {
            this._params = params || {};
        },

        setData: function(data) {
            this._data = data || {};
        },

        update: function(items) {
            console.log('Update: account-dashboard-list');
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

        appendItem: function(item) {
            item = item || {};

            BEMDOM.append(this._list, BEMHTML.apply({
                block: 'account-dashboard-list-item',
                js:   item.js   || undefined,
                mods: item.mods || undefined,
                link: item.link || undefined,
                content: item
            }));
        },

        clear: function(all) {
            all = all || false;
            items = this._getItems(all);

            for (var i = items.length - 1; i >= 0; i--) {
                $(items[i].domElem).remove();
            };
        },

        getItems: function(all) {
            if (all) {
                return this.findBlocksInside('account-dashboard-list-item');
            }
            return this.findBlocksInside({ block: 'account-dashboard-list-item'});
        },

        _updateEvents: function() {
            if (!this._checkAll && this._list) {
                this._checkAll = this.findBlockInside(this._list, 'checkbox', 'check-all', true);
                this._checkAll && this._checkAll.on({ modName: 'checked', modVal: '*' }, function(e) { this._onListCheckAllChange(e); }, this);
            }
        },

        _onListCheckAllChange: function(e) {
            if (this._list) {
                var checked = e.target.getMod('checked');
                var checkboxes = this.findBlocksInside(this._list, { block: 'checkbox', modName: 'check-item', modVal: true });

                checkboxes.forEach(function(item) { 
                    item.setMod('checked', checked);
                });
            }
        },

        _onToolButtonClicked: function(e) {
            var target = $(e.currentTarget);
            var mods = this.getMods(target);

            if (mods.first == true) {
                this._toggleFavorite(e);
                return;
            }

            if (mods.second == true) {
                this._toggleLists(e);
                return;
            }

            if (mods.third == true) {
                this._toggleComments(e);
                return;
            }
        },
        
    }, {
        live: function() {
            this.liveBindTo('tools-item', 'click', function(e) { this._onToolButtonClicked(e); });
        }
    }
));

});