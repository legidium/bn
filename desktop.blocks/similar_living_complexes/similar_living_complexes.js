modules.define(
    'similar_living_complexes',
    ['BEMHTML','i-bem__dom', 'jquery'],
    function(provide, BEMHTML, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._radio = this.findBlockInside('radio-group');
				this._spin = this.findBlockInside('spin');
				this._more = this.findBlockInside(this.elem('more'), 'button');

				

				var that = this;

				this.on('ajax_start', function(){
                    that._spin.setMod('visible');
                });

                this.on('ajax_end', function(){
                    that._spin.delMod('visible');
                });

                this._page = 1;




                this._radio.on('change', this._changeRadio, this);
                
                this._more.on('click', function(){
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


	clear: function(){

		var items = this.findBlocksInside('new-buildings-list-item');

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };

	},


	_changeRadio: function(){
		this.clear();
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
            this.setContent(data.items);

            console.log(data);

            this.emit('ajax_end');
        })
        .fail(function(error) {
            console.log(error);
            this.emit('ajax_end');
        });
	},




	setContent: function(items){
		var that = this;

		items.map(function(item){
			that.addItem(item);
		});
	},


	addItem: function(item){
		BEMDOM.append(
            this.elem('body'),
            BEMHTML.apply({
                block: 'new-buildings-list-item',
                mods: item.mods,
                content: item
            })
        );
	},













}



));





});