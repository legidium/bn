modules.define(
    'living_complex_filter_controller',
    ['BEMHTML', 'i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {

function wordend(num, words){
    return words[ ((num=Math.abs(num%100)) > 10 && num < 15 || (num%=10) > 4 || num === 0) ? 2 : num === 1 ? 0 : 1 ];
}

provide(BEMDOM.decl(this.name, {

    onSetMod: {
        'js' : {
            'inited' : function(){
                this._flats   = this.findBlockOutside('living_complex_flats');
                this._filter  = this.findBlockInside('living_complex_filter');
                this._results = this.findBlockInside('search_results');
                this._sort    = $('#search_filter_sorts').bem('select');
                
                this._resultsCount = 

                this._flats && this._flats.on('show-all', this._onFlatsShowAll, this);
                this._filter && this._filter.on('data_loaded', this._onDataLoaded, this);
                this._sort && this._sort.on('change', this._onSortChange, this);
            }
        }
    },


    _onDataLoaded: function(e) {
        // TODO Показывать кнопку 'Все предложения', если есть еще результаты

        var data = this._filter.getData() || {};
        var count = data.items && data.items.length;

        this._filter && this._filter.elem('count').text(' — ' + count + ' ' + wordend(count, ['предложение', 'предложения', 'предложений']));
        
        this._results.setContent(data.items, data.lists, data.user_auth);
    },

    _onSortChange: function(){
        this._filter.setSort(this._sort.getVal());
        this._filter.loadData();
    },

    _onFlatsShowAll: function() {
        this._filter && this._filter.setShowAll(true);
        this._filter && this._filter.loadData();
    }


}



));





});