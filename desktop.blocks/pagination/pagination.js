modules.define(
    'pagination',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._group  = this.findBlockInside('control-group');
				this._btns   = this.findBlocksInside('button');
				this._status = this.elem('status');

				this._inited       = false;
				this._current_page = 1;
				this._total_pages  = 1;
				this._total_items  = 0;	
				this._items_per_page  = 0;	
				this._current_page_items_count  = 0;	
     			
     			this._setEvent();
     			this.setStatus();
			}
		}
	},


	_setEvent: function(){
		var that = this;

		that.findBlocksInside('button').map(function(btn){
			btn.bindTo('click', function(e){
				e.preventDefault();
				var btn = $(e.currentTarget).bem('button');
				that._current_page = btn.params.page || 1;
				that.setContent();
				that.emit('change', [that._current_page]);
			});
		});

	},

	getCurrentPage: function(){
		return this._current_page;
	},

	getButtons: function(){
		return this._btns || this.findBlocksInside('button');
	},

	_clear: function(){
		this.findBlocksInside('button').map(function(btn){
			$(btn.domElem).remove();
		});
	},

	setContent: function() {
		this._clear();

		var from = 1;
		var to = 5;

		if(this._current_page > 1 && this._current_page < 4){
			from = 2;
			to = 6;
		}

		if(this._current_page >= 4){
			from = this._current_page - 2;
			to = this._current_page + 2;
		}

		if(to > this._total_pages){
			to = this._total_pages;
		}

		if(this._current_page != 1){
			this.addItem(1, 'Первая');
		}
		
		for (var i = from; i <= to; i++) {
			this.addItem(i, i, this._current_page == i);
		};

		if(this._current_page != this._total_pages){
			this.addItem(this._current_page + 1, 'Следующая');
		}

		this._setEvent();
		this.setStatus();
		
	},

	update: function(data) {
		data = data || {};

		if (!this._inited) {
			this.setParams(
				data.total_pages,
				data.current_page,
				data.total_items,
				data.items_per_page,
				data.items ? data.items.length : 0
			);

			this._inited = true;
		}
	},

	setParams: function(total_pages, current_page, total_items, items_per_page, current_page_items_count){
		this._total_pages = total_pages;
		this._current_page = current_page;
		this._total_items = total_items;
		this._items_per_page = items_per_page;
		this._current_page_items_count = current_page_items_count || 0;

		this.setContent();
	}, 

	setStatus: function(){
		var showing = this._items_per_page * (this._current_page - 1) + this._current_page_items_count;
		var txt = !isNaN(showing) ? 'Показано ' + showing + ' из ' + this._total_items : '';

		$(this._status).html(txt);
	},

	addItem: function(page_num, text, toggle) {
		toggle = toggle || false;

		BEMDOM.append(
            this._group.domElem,
            BEMHTML.apply({
            	js: {page: page_num},
	            block : 'button',
	            tag: 'a',
	            mix: { block: 'pagination', elem: 'button' },
	            mods : { theme : 'islands', size : 'l', type: 'link', checked: toggle },
	            attrs: {href: '/'},
	            content: [
	            	{
	            		elem: 'text',
	            		content: text
	            	}
	            ]
	        })
        );
	}

}));

});