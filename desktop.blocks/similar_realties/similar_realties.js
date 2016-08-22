modules.define(
    'similar_realties',
    ['BEMHTML','i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {


provide(BEMDOM.decl(this.name, {

    onSetMod: {
        'js' : {
            'inited' : function(){
                console.log('similar_realties:inited');

                this._first = true;
                this._page = 1;
                this._radio = this.findBlockInside('radio-group');
                this._spin = this.findBlockInside('spin');
                this._more = this.findBlockInside(this.elem('more'), 'button');

                this._results = this.findBlockInside('search_results');

                var that = this;

                this.on('ajax_start', function() { that._spin.setMod('visible'); });
                this.on('ajax_end', function() { that._spin.delMod('visible'); });
                this._radio.on('change', this._changeRadio, this);
                
                this._more.on('click', function(){
                     console.log('similar_realties:click');
                    this._page += 1;
                    this._loadData();
                }, this);

                this._loadData();
            }
        }
    },

    _getFormData: function(){
        var data = [];

        data.push({
            name: 'similar_by',
            value: this._radio.getVal()
        });

        data.push({
            name: 'id',
            value: this.params.cur_id
        });


        data.push({
            name: 'page',
            value: this._page
        });

        return data;
    },

    clear: function() {
        this._results && this._results.clear(false);
    },

    _changeRadio: function(){
        this.clear();
        this._first = true;
        this._page = 1;
        this._loadData();
    },

    _loadData: function(){
        this.emit('ajax_start');

        var url = this.params.url + '?' + $.param(this._getFormData());

        $.ajax({
          method: "GET",
          url: url,
          cache: false,
          context: this,
        })
        .done(function(data) {
            if (this._first) {
                this._results && this._results.setContent(data.items);
                this._first = false;
            } else {
                this._results && this._results.appendContent(data.items);
            }

            this.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            this.emit('ajax_end');
        });
    }

}


));





});