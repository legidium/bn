modules.define(
    'new_buildings_filter_controller',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
                console.log('new_buildings_filter_controller:inited');
				this._params = {
					userAuth: false,
					dataUrl:       '/desktop.blocks/new-buildings-filter/test.json',
					searchPageUrl: '/desktop.bundles/search/search.html',
				};

				this._params = $.extend(this._params, this.params);

				this._filter     = this.findBlockInside('new-buildings-filter');
				this._results    = this.findBlockInside('new-buildings-list');
				this._pagination = this._results && this._results.findBlockInside('pagination');
				this._tools      = this._results && this._results.findBlockInside('new-buildings-list-toolbar');

                this._results && this._results.on('sort_change', this._onSortChange, this);
                this._results && this._results.on('class_change', this._onClassChange, this);
                this._tools && this._tools.on('location_change', this._onLocationChange, this);
                this._tools && this._tools.on('search', this._onLocationSearch, this);

                // обработка события отправки формы
                this._filter && this._filter.on('submit', this._onSubmitSearchForm, this);

                // Обновление списка и пагинатора
                this._filter && this._filter.on('data_loaded', this._onDataLoaded, this);
                this._pagination && this._pagination.on('change', this._onPageChange, this);
			}
		}
	},

	_onClassChange: function(){
		this._filter.setClass(this._results.getClass());
		this._filter.setLocationSearchText(this._tools.getVal(true));
		this._filter.loadData('buildings');
	},

	_onSortChange: function(){
		this._filter.setSort(this._results.getSort());
		this._filter.setLocationSearchText(this._tools.getVal(true));
		this._filter.loadData('buildings');
	},

	_onDataLoaded: function(){
		var data = this._filter.getData();
		this._results && this._results.setContent(data.items);
		this._pagination && this._pagination.update(data);
	},

	_onPageChange: function(){
		this._filter.setPage(this._pagination.getCurrentPage());
		this._filter.loadData('buildings');
	},

    // Поиск ЖК по id или тексту
	_onLocationChange: function(e, data) {
		data = data || {};

        if (data.type == 'location') {
            this._filter.setSearchMode('location');
            this._filter.setLocationId(data.value);
            this._filter.setLocationSearchText(null);
        } else {
            this._filter.setSearchMode('text');
            this._filter.setLocationSearchText(!data.clear ? this._tools.getVal(true) : '');
            this._filter.setLocationId(null);
        }

		this._filter.loadData('buildings');
	},

    // Поиск ЖК по тексту
	_onLocationSearch: function() {
        this._filter.setSearchMode('text');
		this._filter.setLocationSearchText(this._tools.getVal(true));
		this._filter.loadData('buildings');
	},

    // Редирект на страницу поиска с текущими параметрами фильтра
	_onSubmitSearchForm: function(e, data) {
		e.preventDefault();
		data = data || {};

		var params = this._filter.getParamsForServer(data.type);
		var url = this._params.searchPageUrl || '';

		// Редирект
		window.location.href = url + '?' + $.param(params);
	}
}

));

});