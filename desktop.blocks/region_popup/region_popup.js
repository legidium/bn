modules.define(
    'region_popup',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	regions: [
		'Санкт-Петербург',
		'Санкт-Петербург и пригороды',
		'Санкт-Петербург и Ленобласть',
		'Только Ленобласть',
	],

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._popup    = this.findBlockOutside('modal');
				this._switcher = $('#region_popup_switcher').bem('button');
				this._result   = $('#region_popup_result_text');
				this._radio    = this.findBlockInside('radio-group');
				this._tabs     = this.findBlockInside('tabs');

				this._setCurbox();

				this._radio.on('change', this._onChange, this);
			}
		}
	},

	_onChange: function(e){
		this._setCurbox();
	},


	clear: function(){
		var menus          = this.findBlocksInside(this._curbox, 'menu');
		var inputs         = this.findBlocksInside(this._curbox, 'input');
		var sheme          = this.findBlockInside(this._curbox, 'spb_metro_sheme');
		var address_lists  = this.findBlocksInside(this._curbox, 'address_list');

		inputs.map(function(input){
			input.setVal('');
		});

		menus.map(function(menu){
			menu.setVal([]);
			menu.getItems().map(function(item){
				item.delMod('checked');
			});
		});

		if(sheme){
			sheme.clear();
		}

		

		address_lists.map(function(list){
			list.clear();
		});

	},




	getVal: function(){
		var menus          = this.findBlocksInside(this._curbox, 'menu');
		var inputs         = this.findBlocksInside(this._curbox, 'input');
		var radios         = this.findBlocksInside(this._curbox, 'radio-group');
		var sheme          = this.findBlockInside(this._curbox, 'spb_metro_sheme');
		var address        = this.findBlockInside(this._curbox, 'addresses_control');

		var result = {
			district: [],
			locality: [],
			location: this._radio.getVal(),
			metro: [],
			streetBuilding: [],
			metroDistance: '',
			metroDistanceOnFoot: false,
		};

		if(address){
			address.getVal().map(function(i){
				result.streetBuilding.push(i.id + ":" + i.dom);
			});
		}

		if(sheme){
			result.metro = sheme.getValsIds();
		}


		menus.map(function(menu){
			if(menu.hasMod('spb_districts')){
				result.district = menu.getVal();
			}

			if(menu.hasMod('lenobl_districts')){
				result.locality = menu.getVal();
			}

			if(menu.hasMod('mode', 'groupcheck')){
				result.locality = result.locality.concat(menu.getVal());
			}
		});


		inputs.map(function(input){	
			if(input.getName() == 'metroDistance_input'){
				result.metroDistance = input.getVal();
			}
		});


		radios.map(function(radio){	
			if(radio.getName() == 'metroDistanceOnFoot_radio'){
				result.metroDistanceOnFoot = radio.getVal();
			}
		});


		return result;
	},




	_onClear: function(e){
		e.preventDefault();
		this.clear();
	},


	_onSave: function(e){
		e.preventDefault();
		this._popup.delMod('visible');
		this._switcher.setText(this.regions[this._radio.getVal()]);

		var result = this._formatAllValuesToString();

		if(result !== '' && result !== 'test'){
			$(this._result).html(result);
		} else {
			var vals = [
				'',
				'СПб и населенные пункты в 20-30 минутах езды от КАДа',
				'Районы Санкт-Петербурга и Ленобласти',
				'Районы Ленобласти',
			];
			$(this._result).html(vals[this._radio.getVal()]);
		}

		
		
		this._setHiddenInputs();

	},


	_setHiddenInputs: function(){
		var val = this.getVal();

		$('#search_filter_location').val(val.location);
		$('#search_filter_metroDistance').val(val.metroDistance);
		$('#search_filter_metroDistanceOnFoot').val(val.metroDistanceOnFoot);

		$('#search_filter_district').html('');
		for (var i = val.district.length - 1; i >= 0; i--) {
			$('#search_filter_district').append('<input type="hidden" name="district[]" value="' + val.district[i] + '">');
		};

		$('#search_filter_metro').html('');
		for (var i = val.metro.length - 1; i >= 0; i--) {
			$('#search_filter_metro').append('<input type="hidden" name="metro[]" value="' + val.metro[i] + '">');
		};

		$('#search_filter_locality').html('');
		for (var i = val.locality.length - 1; i >= 0; i--) {
			$('#search_filter_locality').append('<input type="hidden" name="locality[]" value="' + val.locality[i] + '">');
		};

		$('#search_filter_streetBuilding').html('');
		for (var i = val.streetBuilding.length - 1; i >= 0; i--) {
			$('#search_filter_streetBuilding').append('<input type="hidden" name="streetBuilding[]" value="' + val.streetBuilding[i] + '">');
		};


	},



	_formatAllValuesToString: function(){
		var result = '';
		var menuitems = [];
		var addritems = [];

		var menus          = this.findBlocksInside(this._curbox, 'menu');
		var inputs         = this.findBlocksInside(this._curbox, 'input');
		var address_lists  = this.findBlocksInside(this._curbox, 'address_list');

		inputs.map(function(input){
			// input.setVal('');
		});


		menus.map(function(menu){
			menu.getItems().map(function(item){
				if(item.hasMod('checked')){
					menuitems.push(item.getText());
				}
			});
		});

		address_lists.map(function(list){
			list.getItems().map(function(item){
				addritems.push(item.getText());
			});
		});


		result += menuitems.join(', ');
		result += menuitems.length && addritems.length ? ', ' : '';
		result += addritems.join(', ');

		return result;
	},




	_setCurbox: function(){
		this._curbox     = this._tabs.getBoxList()[this._radio.getVal()];
		this._savebtns   = this.findBlocksInside(this._curbox, 'button', 'action', 'save');
		this._clearbtns  = this.findBlocksInside(this._curbox, 'link', 'action', 'clear');

		var that = this;

		this._savebtns.map(function(btn){
			if($(btn.domElem).hasClass('button_action_save')){
				btn.on('click', that._onSave, that);
			}
		});

		this._clearbtns.map(function(btn){
			if($(btn.domElem).hasClass('link_action_clear')){
				btn.on('click', that._onClear, that);
			}
		});
	}



}, {


	live: function(){

		this.liveInitOnEvent('mouseover');

	}


}));












});