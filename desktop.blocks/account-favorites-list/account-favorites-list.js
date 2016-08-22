modules.define(
	'account-favorites-list',
	['BEMHTML', 'i-bem__dom', 'jquery', 'account-favorites-list-item'],
	function(provide, BEMHTML, BEMDOM, $, Items) {

provide(BEMDOM.decl(this.name, {
	onSetMod: {
		'js': {
			'inited': function(){
                console.log('account-favorites-list:intited');

                this._params = {};
                this._items  = [];

                this.emit('params');

                Items.on(this.domElem, 'params', this._onParams, this);
                Items.on(this.domElem, 'data',  this._onData, this);
			}
		}
	},

	setParams: function(params) {
        this._params = params || {};
    },

    setData: function(data) {
    	
    },

    update: function(items) {
    	console.log('Update: account-favorites-list');
    },

    append: function(items) {
    	var that = this;

    	items = items || [];
    	this._items.concat(items);

    	items.map(function(item) {
    		that.appendItem(item);
    	});
    },

    appendItem: function(item) {
    	item = item || {};

		BEMDOM.append(this.domElem, BEMHTML.apply({
        	block: 'account-favorites-list-item',
			js:   item.js   || undefined,
        	mods: item.mods || undefined,
        	link: item.link || undefined,
        	content: item
        }));
    },

	clear: function(all){
		all = all || false;
		items = this._getItems(all);

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
	},
	
	_getItems: function(all){
		all = all || false;
		if (!all) {
			return this.findBlocksInside({ block: 'account-favorites-list-item'});
		}
		return this.findBlocksInside('account-favorites-list-item');
	},

	_onParams: function(e) {
        e.target.setParams(this._params);
    },

	_onData: function(e) {
		var item = e.target;
		var id = item.params && item.params.id;
		var data;

		if (id) {
			for (var i = 0, l = this._items.length; i < l; i++) {
				if (this._items[i].js && this._items[i].js.id == id) {
					data = this._items[i];
					break;
				}
			}

        	data && e.target.setData(data);
		}

    }

}


));





});