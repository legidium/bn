modules.define(
    'pager',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._currentPage  = 1;
				this._totalPages   = 1;
				this._currentItems = 0;
				this._totalItems   = 0;	
				
				this._next   = this.elem('next');
				this._status = this.elem('status');

     			var that = this;

				this.bindTo(this._next, 'click', function(e) {
					e.preventDefault();
					that.emit('change', { page: this._currentPage + 1 });
				});
			}
		}
	},

	getCurrentPage: function() {
		return this._currentPage;
	},

	update: function(data) {
		this._currentPage  = (data.current_page || 1) + 0;
		this._totalPages   = (data.total_pages  || 1) + 0;
		this._totalItems   = (data.total_items  || 0) + 0;

		if (data.items_count) {
			this._currentItems = this._currentItems + data.items_count;	
		} else {
			this._currentItems = this._currentItems + (data.items ? data.items.length : 0);		
		}


		var status = 'Показано ' + this._currentItems + ' из ' + this._totalItems;
		this._status && this._status.text(status);
	}

}));


});