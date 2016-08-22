modules.define(
    'user_lists_in_search',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				console.log('user_lists_in_search:inited');

				this._data = [];

				this._paramsBlockName = this.params.paramsBlockName ? this.params.paramsBlockName : 'search_results';
				this._itemBlockName = this.params.itemBlockName ? this.params.itemBlockName : 'search_results_item';
				this._toolsBlockName = this.params.toolsBlockName ? this.params.toolsBlockName : 'tools';

				this._popup = this.findBlockOutside('popup');

				this._form = this.findElem('add_form');
				this._input = this._popup.findBlockInside('input');
				this._menu = this._popup.findBlockInside('menu');

				this._tools = this.findBlockOutside(this._toolsBlockName);
				this._search_results = this.findBlockOutside(this._paramsBlockName);
				this._search_results_item = this.findBlockOutside(this._itemBlockName);

				this.bindToDomElem(this._form, 'submit', this._onSubmitAddForm, this);

				var that = this;
				
				setTimeout(function(){
					that._setHandlers();
				}, 100);
				
			}
		}
	},

	_onSubmitAddForm : function(e){
		e.preventDefault();
		var that = this;
		var val = this._input.getVal();

		if(val == ''){
			$(this._input.elem('control')).focus();
			
		} else {
			var url = this._search_results ? this._search_results.params.new_list_url : '';

			if (this._tools){
				url = this._tools ? this._tools.params.new_list_url : '';
			}
			
			if(url){
				// поменять на post и поменять адрес
				$.get(url, {name: val, item_id: this.params.item_id}, function(data){
					
					//console.log(that.params.item_id);

					that._input.setVal('');


					BEMDOM.append(that._menu.domElem, 
						BEMHTML.apply({
				            block : 'menu-item',
				            mods : { theme : 'islands', size : 'm', checked: true, disabled: true},
				            js: { val: data.id, count: data.count },
				            val: data.id,
				            content : [
				            	{
				            		tag: 'span',
				            		block: 'plain_text',
				            		mods: { size: '11' },
				            		content: val + '&nbsp;'
				            	},
				            	{
				            		tag: 'span',
				            		block: 'help',
				            		content: data.count
				            	}
				            ]
				        }));

					var d = $(that.elem('lists_list'));
					d.scrollTop(d.prop("scrollHeight"));

					if(that._search_results){
						if (typeof that._search_results.pushToLists == 'function' && typeof that._search_results.updateLists == 'function') {
							that._search_results.pushToLists(data);
							that._search_results.updateLists();
						}

					}
					
					if(that._tools){
						$(that._tools.domElem).find('.icon.icon_action_plus').removeClass('icon_action_plus').addClass('icon_action_plus-blue');
					}


				});
			}
		}
	},

	_setHandlers: function(){
		var that = this;
		this.findBlockOutside('popup').findBlocksInside('menu-item').map(function(item){
			item.un('click', that._onItemClick, that);
			item.on('click', that._onItemClick, that);

			if(item.hasMod('checked')){
				item.setMod('disabled');
			}
		});
	},

	_onItemClick: function(e){
		var that = this;
		var item = $(e.target.domElem).bem('menu-item');
		var url = this._search_results ? this._search_results.params.add_to_list_url : '';

		if(this._tools){
			url = this._tools ? this._tools.params.add_to_list_url : '';
		}

		if(url){
			// поменять на post и поменять адрес
			$.get(url, {item_id: this.params.item_id, list_id: item.params.val}, function(data){
				var count = parseInt(item.params.count);
				var newval = count += 1;

				item.setMod('checked', true);
				item.setMod('disabled');

				$(item.domElem).find('.help').html(newval);
				$(item.domElem).addClass('menu-item_checked');

				if (that._search_results_item && typeof that._search_results_item.setInLists == 'function'){
					that._search_results_item.setInLists(item.params.val);
				}

				if(that._tools){
					$(that._tools.domElem).find('.icon.icon_action_plus').removeClass('icon_action_plus').addClass('icon_action_plus-blue');
				}

			});
		}
	}


}


));


});