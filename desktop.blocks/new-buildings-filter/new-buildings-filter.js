modules.define(
    'new-buildings-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js' : {
            'inited': function() {
                this._appartmentsParams = {
                    page: null
                };

                this._buildingsParams = {
                    sort:   null,
                    class:  null,
                    loc:    null,
                    search: null,
                    page:   null
                },

                this._filterName;
                this._searchMode = 'text';

                this._data = null;
                this._sort = null;
                this._page = null;
                this._class = null;
                this._loc = null;

                this._modal          = $('#search_full_modal').bem('modal');
                this._modal_switcher = $('#region_popup_switcher').bem('button');

                this._spin = this.findBlockInside('spin');
                this._main = this.findBlockOutside('new-buildings-content');
                this._list = this._main && this._main.findBlockInside('new-buildings-list');
                this._search_filter_submit_button = $('#search_filter_submit_button').bem('button');

                this._setEvents();
                this.loadData('buildings', false);
            }
        }
    },

    setSearchMode: function(mode) {
        this._searchMode = mode;
    },

    setLocationId: function(loc){
        this._loc = loc;
        this._buildingsParams.loc = loc;
    },

    setLocationSearchText: function(text) {
        this._loc_search = text;
        this._buildingsParams.search = text;
    },

    getData: function(){
        return this._data;
    },

    getParamsForServer: function(type) {
        type = type || 'buildings';
        return this._getFormData(type);
    },

    loadData: function(type, history){
        var that = this;
        
        type = type || this._filterName;
        history = history === false ? false : true;

        var params = $.param(this._getFormData(type));
        var url = this.params.url + (params ? '?' + params : '');

        this.emit('ajax_start');

        $.ajax({
          method: "GET",
          url: url,
          cache: false,
        })
        .done(function(data) {
            that._data = data;
            history && that._setUrlQueryString(type);
            that.emit('data_loaded', { type: type });
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _setUrlQueryString: function(type) {
        var params = $.param(this._getFormData(type));
        window.history.pushState(null, null, window.location.pathname + (params ? '?' + params : ''));
    },

    _getFormData: function(type){
        var params = [];

        type = type || 'buildings';

        if (type == 'buildings') {
            var filter = this._buildingsParams;

            switch (this._searchMode) {
                case 'text': filter.search && params.push({ name: 'search', value: filter.search }); break;
                case 'location': filter.loc && params.push({ name: 'location_id', value: filter.loc }); break;
            }

            filter.sort   && params.push({ name: 'sortBy',     value: filter.sort });
            filter.page   && params.push({ name: 'page',        value: filter.page });
            filter.class  && filter.class.map(function(v) { params.push({ name: 'class[]', value: v }); });

            return params;
        }

        if (type == 'appartments') {
            var filter = $(this.domElem).serializeArray();

            params.push({ name: 'filter', value: 'appartments' });

            filter.map(function(item) {
                var okName = item.name !== 'metroDistanceOnFoot_radio' && item.name !== 'tabs';

                if (okName && item.value !== '') {
                    params.push({ name: item.name, value: item.value });
                }
            });

            return params;
        }

        return params;
    },

    setClass: function(val) {
        this._class = val;
        this._buildingsParams.class = val;
    },

    setSort: function(val) {
        this._sort = val;
        this._buildingsParams.sort = val;
    },

    setPage: function(val) {
        this._page = val;
        this._buildingsParams.page = val;
    },

    _setEvents: function() {
        var that = this;
                
        this.on('ajax_start', function(){
            that._search_filter_submit_button.setMod('disabled');
            that._list && that._list.setMod('loading');
            that._spin.setMod('visible');
        });

        this.on('ajax_end', function(){
            that._search_filter_submit_button.delMod('disabled');
            that._list && that._list.delMod('loading');
            that._spin.delMod('visible');
        });

        this._modal_switcher.on('click', function() { that._modal.setMod('visible'); });
        this.bindToDomElem($('#toggle-filter-ext-link'), 'click', this._toggleFilterExt);

        // Перехват события клика на кнопку 'Найти',
        // Генерирует событие 'submit', { type: 'appartments' }, для редиректа на страницу поиска с текущими параметрами фильтра
        this._search_filter_submit_button.bindTo('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            that._filterName = 'appartments';
            that.emit('submit', { type: that._filterName });
        });

        // По умолчанию сабмитим форму в режиме поиска ЖК по тексту
        this.bindTo('submit', this._onFormSubmit);
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        this.setSearchMode('text');
        this.loadData('buildings');
    },

    _toggleFilterExt: function(e) {
        e.preventDefault();
        this.findBlockInside('new-buildings-filter-ext').toggleMod('show', true);

        var text  = $('#toggle-filter-ext-link').text();
        var toggle1 = $('#toggle-filter-ext-link').data('text');
        var toggle2 = $('#toggle-filter-ext-link').data('toggle-text');

        $('#toggle-filter-ext-link').text(text == toggle1 ? toggle2 : toggle1);
    }
}));

});