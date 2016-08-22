modules.define(
    'i-metro_addr-ctrl',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){


				this._metro = this.findBlockInside('spb_metro_sheme');
				this._addrs = this.findBlockInside('address_list');

				this._metro.on('change', this._onMetroChange, this);
				
				var that = this;

				this.findBlocksInside('address_list_item').map(function(item){
					item.on('remove', that._onAddrsChange, that);
				});

			}
		}
	},

	_onMetroChange: function(e, data){
		if(data.is_adding){
			this._addrs.addItem(data.index, data.text);
		} else {
			this._addrs.removeItem(data.index);
		}

		var that = this;

		this.findBlocksInside('address_list_item').map(function(item){
			item.on('remove', that._onAddrsChange, that);
		});

	},

	_onAddrsChange: function(e, index){
		this._metro.removeItem(index);
	},


}));












});