modules.define(
    'search_filters_controller',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._filter     = this.findBlockInside('search_filter');
				this._results    = this.findBlockInside('search_results');
				this._pagination = this.findBlockInside('pagination');
				this._sort       = $('#search_filter_sorts').bem('select');
				this._headgroup  = $('#search_filter_headgroup').bem('headgroup'); 

				this._filter.on('data_loaded_first', this._onDataLoadedFirst, this);
				this._filter.on('data_loaded', this._onDataLoaded, this);
				this._pagination.on('change', this._onPageChange, this);
				this._sort.on('change', this._onSortChange, this);

			}
		}
	},



	_onDataLoadedFirst: function(){
		
		this._onDataLoadedProcess();
		
		var data = this._filter.getData();
		this._pagination.setParams(data.total_pages, data.current_page, data.total_items, data.items_per_page, data.items.length);
		this._pagination.setContent();

		console.log('data_loaded_first');
	},


	_onDataLoaded: function(){
		this._onDataLoadedProcess();
		console.log('data_loaded');
	},




	_onDataLoadedProcess: function(){
		var data = this._filter.getData();

		$(this._headgroup.domElem).find('.headgroup__first').html(data.title);
		$(this._headgroup.domElem).find('.headgroup__second').html(data.descr);

		this._results.setContent(data.items, data.lists, data.user_auth);

	},




	_onPageChange: function(){
		this._filter.setPage(this._pagination.getCurrentPage());
		this._filter.loadData();
		window.scrollTo(0, 0);
	},

	_onSortChange: function(){
		this._filter.setSort(this._sort.getVal());
		this._filter.loadData(true);
	}


}



));





});