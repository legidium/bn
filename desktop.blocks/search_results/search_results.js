modules.define(
    'search_results',
    ['BEMHTML', 'i-bem__dom', 'jquery', 'search_results_item'],
    function(provide, BEMHTML, BEMDOM, $, Item) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._first = true;
				this._items = [];
				this._lists = [];
				this._user_auth = false;
				
			}
		}
	},


	getItems: function(all){
		all = all || false;
		if(!all){
			return this.findBlocksInside({ block: 'search_results_item', mods: { heading: all }} );
		}
		return this.findBlocksInside('search_results_item');
	},

	clear: function(all){
		all = all || false;

		items = this.getItems(all);

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };
	},

	appendContent: function(items, lists, user_auth) {
		this._items = items;
		this._lists = lists;
		this._user_auth = user_auth;

		var that = this;

		this._items.map(function(item){
			that.addItem(item, lists);
		});
	},

	update: function(data) {
		data = data || {};
		this.setContent(data.items, data.lists, data.user_auth);
	},

	setContent: function(items, lists, user_auth){

		this._items = items;
		this._lists = lists;
		this._user_auth = user_auth;

		this.clear(true);

		var heding = {
			mods: { heading: true },
			image: '',
			address_help: 'Адрес',
			object_help: 'Объект',
			s_help: 'S общ.',
			floor_help: 'Этаж',
			san_help: 'Сан.уз.',
			home_help: 'Дом',
			price_help: 'Цена, Р',
			seller_help: 'Продавец',
		};


		var that = this;

		that.addItem(heding, lists);

		this._items.map(function(item){
			that.addItem(item, lists);
		});

	},


	addItem: function(item, lists){

		var embed = item.hasOwnProperty('embed') ? item.embed : false;
		
		if (embed) {
			this.addEmbededItem(item);
	        return;
		}

		lists = lists || [];

		var id        = item.hasOwnProperty('js') && item.js.hasOwnProperty('id') ? item.js.id : 0; 
		var id       = item.hasOwnProperty('js') && item.js.hasOwnProperty('id') ? item.js.id : 0; 
		var link     = item.hasOwnProperty('js') && item.js.hasOwnProperty('link') ? item.js.link : ''; 
		var in_lists = item.hasOwnProperty('js') ? $.inArray(item.js.id, item.in_lists) > -1 : false;

		item.id = id;
		item.link = link;
		item.lists = lists;
		item.user_auth = this._user_auth;

		BEMDOM.append(this.domElem, BEMHTML.apply({ 
        	js: { id: id, in_lists: item.in_lists, link: link },
        	attrs: { href: link },
        	block: 'search_results_item', 
        	mods: item.mods, 
        	content: item
        }));
	},

	addEmbededItem: function(item) {
		item = item || {};

		BEMDOM.append(this.domElem, BEMHTML.apply({ 
        	block:  'search_results_item', 
        	mods:    {'embed': true }, 
        	js:      false,
        	content: item
        }));
	},

	updateListsData: function(list_item){
		for (var i = this._lists.length - 1; i >= 0; i--) {
			if(this._lists[i].id == list_item.id){
				this._lists[i].count = list_item.count;
			}
		};
	},


	pushToLists: function(list_item){
		this._lists.push(list_item);
	},


	updateLists: function(){
		var that = this;
		var items = this.getItems();

		(items || []).map(function(item) {

			var dropdown = item.findBlockInside(item.findElem('tools_item', 'second', true), 'dropdown')
			if (dropdown) {
				var ulis = dropdown.getPopup().findBlockInside('user_lists_in_search');
				
				if (ulis) {
					BEMDOM.update(
						ulis.findBlockInside('menu').domElem, 
						BEMHTML.apply(that.listsMenuContent(item.params.in_lists || item.in_lists || [], that._lists))
					);
					setTimeout(function(){
						ulis._setHandlers();
					}, 100);
				}
			}
			
		});

	},


	listsMenuContent: function(in_lists, lists){
		var isInList;

		return lists.map(function(i){
			var isInList = in_lists.indexOf(i.id) > -1;

	    	return {
	            block: 'menu-item',
	            mods: { theme : 'islands', size : 'm', checked: isInList, disabled: isInList },
	            js: { val : i.id, count: i.count },
	            val: i.id,
	            content : [
	            	{
	            		tag: 'span',
	            		block: 'plain_text',
	            		mods: {size: '11'},
	            		content: i.name + '&nbsp;'
	            	},
	            	{
	            		tag: 'span',
	            		block: 'help',
	            		content: i.count
	            	}
	            ]
	        };
	    });
	},





	


}



));





});