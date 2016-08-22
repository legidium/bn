modules.define(
    'new-buildings-search-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js' : {
            'inited': function() {
                console.log('new-buildings-search-filter:inited');

                this._data = null;
                this._sort = null;
                this._page = null;

                this._main   = this.findBlockOutside('new-buildings-content');
                this._list   = this._main && this._main.findBlockInside('search_results');
                this._submit = $('#search_filter_submit_button').bem('button');
                this._spin   = this.findBlockInside('spin');

                this._modal          = $('#search_full_modal').bem('modal');
                this._modal_switcher = $('#region_popup_switcher').bem('button');

                this.setFilters();
                this._setEvents();
                //this.loadData();
            }
        }
    },

    getData: function() {
        return this._data;
    },

    setFilters: function() {
        console.log('SET FILTERS');
        console.table(this.getParamsForServer());
    },

    getParamsForServer: function() {
        return this._getFormData();
    },

    loadData: function() {
        var that = this;
        var params = $.param(this._getFormData());
        var url = this.params.url + (params ? '?' + params : '');

        this.emit('ajax_start');

        $.ajax({
          method: "GET",
          url: url,
          cache: false,
        })
        .done(function(data) {
            that._data = data;
            history && that._setUrlQueryString();

            that.emit('data_loaded');
            that.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            that.emit('ajax_end');
        });
    },

    _setUrlQueryString: function() {
        var params = $.param(this._getFormData());
        window.history.pushState(null, null, window.location.pathname + (params ? '?' + params : ''));
    },

    _getFormData: function(){
        var params = [];
        var filter = $(this.domElem).serializeArray();

        //params.push({ name: 'filter', value: 'appartments' });

        filter.map(function(item) {
            var okName = item.name !== 'metroDistanceOnFoot_radio' && item.name !== 'tabs';
            if (okName && item.value !== '') {
                params.push({ name: item.name, value: item.value });
            }
        });

        return params;
    },

    setClass: function(val) {
        this._class = val;
    },

    setSort: function(val) {
        this._sort = val;
    },

    setPage: function(val) {
        this._page = val;
    },

    _setEvents: function() {
        var that = this;

        this._modal_switcher.on('click', function() { that._modal.setMod('visible'); });
        this.bindToDomElem($('#toggle-filter-ext-link'), 'click', this._toggleFilterExt);

        // По умолчанию сабмитим форму в режиме поиска ЖК по тексту
        this.bindTo('submit', this._onFormSubmit);

        // Перехват события клика на кнопку 'Найти',
        // Генерирует событие 'submit', { type: 'appartments' }, для редиректа на страницу поиска с текущими параметрами фильтра
        this._submit.bindTo('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            that.emit('submit');
        });
        
        this.on('ajax_start', function(){
            that._submit.setMod('disabled');
            that._list && that._list.setMod('loading');
            that._spin.setMod('visible');
        });

        this.on('ajax_end', function(){
            that._submit.delMod('disabled');
            that._list && that._list.delMod('loading');
            that._spin && that._spin.delMod('visible');
        });
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        console.log('form submitted');
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