modules.define(
    'search_filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $, Filter) {





provide(Filter.decl({ modName : 'main_page' }, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				// основные контролы
				this._action = $('#search_filter_action').bem('radio-group');
				this._target = $('#search_filter_target').bem('radio-group');


				// блоки формы кторые будут скрываться и показываться

				// количество комнат массив flatTypes
				this._search_filter_flat_types = $('#search_filter_flat_types');

				// свободная планировка
				this._search_filter_flat_types_free_plan = $('#search_filter_flat_types_free_plan');

				// посуточно или длительный срок
				this._search_filter_rent_type = $('#search_filter_rent_type');

				// количество комнат
				this._search_filter_room_count = $('#search_filter_room_count');

				// вторичка.новостройка
				this._search_filter_resale_new 		= $('#search_filter_resale_new');
				// this._search_filter_resale_new_bem  = $(this._search_filter_resale_new).find('.checkbox-group').bem('checkbox-group');
				this._search_filter_is_new_checkbox  = $('#search_filter_is_new_checkbox').bem('checkbox');


				// сдан.строится
				this._search_filter_built_build = $('#search_filter_built_build');

				// количество комнат от до
				this._search_filter_room_count_label   = $('#search_filter_room_count_label');
				this._search_filter_room_count_from_to = $('#search_filter_room_count_from_to');

				// полный поиск
				this._search_full = this.findBlockInside('search_full');
				

				this._modal_switcher = $('#region_popup_switcher').bem('button');
				this._modal          = $('#search_full_modal').bem('modal');
			
				this._search_filter_submit_button   = $('#search_filter_submit_button').bem('button');



				this._data = {};
				this._server_params = [];
				this._spin = this.findBlockInside('spin');


				this._page = 1;
				this._sort = '';



				// Обработка событий
				var that = this;

				// переключение между полным и кратким поиском
				this.bindToDomElem($('#toggle_full_search_link'), 'click', this._toggleFullSearch);

				// обработка собития отправки формы
				this.bindTo('submit', this._onSubmitSearchForm);

				// переключение кнопок Купить/Снять
				this._action.on('change', this._onActionChange, this);

				// переключение кнопок Квартиру/Комнату/Дом. участок/Коммерческую недвижимость
				this._target.on('change', this._onTargetChange, this);

				// чек или не чек чекбокса Новостройка
				// this._search_filter_resale_new_bem.on('change', this._onIsNewChange, this);
				this._search_filter_is_new_checkbox.on('change', this._onIsNewChange, this);
				

				this._modal_switcher.on('click', function(){
					that._modal.setMod('visible');
				});

			}
		}
	},


	getData: function(){
		return this._data;
	},





	_onSubmitSearchForm: function(e){
		e.preventDefault(); 
		this._setParamsForServer();
		this._setUrlQueryString();
	},



	_getFormData : function(){
		return $(this.domElem).serializeArray();
	},


	_onActionChange: function(e){
		this._changeFilters();
	},


	_onTargetChange: function(e){
		this._changeFilters();
	},


	_changeFilters: function(){
		var action = this._action.getVal();
		var target = this._target.getVal();
		

		// Купить
		if(action == 'buy'){

			// Квартиру
			if(target == 'flat'){
				
				// включаем то что надо 
				this._enableFlatTypes();
				this._enableFreePlan();
				this._enableResaleNew();
				// включать выключать .. дом сдан.не сдан
				this._onIsNewChange();

				// выключаем то что не надо
				this._disableRentType();
				this._disableRoomCount();
				this._disableRoomCountFromTo();

				// полный поиск
				this._search_full.enablePloschad();
				this._search_full.enableDopSmall();
				this._search_full.enableUslovia();

				this._search_full.disableKommissia();
				this._search_full.disableDopBig();
				
			}

			// Комнату
			if(target == 'room'){
				// вкл то что надо
				this._enableRoomCount();
				this._enableRoomCountFromTo();

				// выкл то что не надо
				this._disableRentType();
				this._disableResaleNew();
				this._disableBuiltBuild();
				this._disableFlatTypes();		


				// полный поиск
				this._search_full.enablePloschad();
				this._search_full.enableDopSmall();
				this._search_full.enableUslovia();

				this._search_full.disableKommissia();
				this._search_full.disableDopBig();
				this._search_full.disableDeadline();

			} 

			// Дом участок
			if(target == 'village'){
				
				
			} 

			// Коммерческая недвижимость
			if(target == 'business'){
				
				
			} 

		} 


		// Снять
		if(action == 'rent'){


			// Квартиру
			if(target == 'flat'){
				// вкл то что надо
				this._enableFlatTypes();
				this._enableRentType();

				// включать выключать .. дом сдан.не сдан
				this._onIsNewChange();


				// выкл то что не надо
				this._disableFreePlan();
				this._disableRoomCount();
				this._disableRoomCountFromTo();
				this._disableResaleNew();
				this._disableBuiltBuild();


				// полный поиск
				this._search_full.enableKommissia();
				this._search_full.enableDopBig();

				this._search_full.disablePloschad();
				this._search_full.disableDopSmall();
				this._search_full.disableUslovia();
				this._search_full.disableDeadline();
			}

			// Комнату
			if(target == 'room'){
				// вкл то что надо
				this._enableRoomCount();
				this._enableRoomCountFromTo();
				this._enableRentType();


				// выкл то что не надо
				this._disableFlatTypes();
				this._disableFreePlan();
				this._disableResaleNew();
				this._disableBuiltBuild();

				// полный поиск
				this._search_full.enableKommissia();
				this._search_full.enableDopBig();

				this._search_full.disablePloschad();
				this._search_full.disableDopSmall();
				this._search_full.disableUslovia();
				this._search_full.disableDeadline();
			}
				

			// Дом участок
			if(target == 'village'){
				
				
			} 

			// Коммерческая недвижимость
			if(target == 'business'){
				
				
			} 

		}




	},



	_disableFlatTypes: function(){
		$(this._search_filter_flat_types).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
	},

	_enableFlatTypes: function(){
		$(this._search_filter_flat_types).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
	},


	_disableRentType: function(){
		$(this._search_filter_rent_type).hide().find('.radio-group').bem('radio-group').setMod('disabled');
	},

	_enableRentType: function(){
		$(this._search_filter_rent_type).show().find('.radio-group').bem('radio-group').delMod('disabled');
	},


	_disableRoomCount: function(){
		$(this._search_filter_room_count).hide().find('.checkbox-group').bem('checkbox-group').setMod('disabled');
	},

	_enableRoomCount: function(){
		$(this._search_filter_room_count).show().find('.checkbox-group').bem('checkbox-group').delMod('disabled');
	},


	_disableFreePlan: function(){
		$(this._search_filter_flat_types_free_plan).hide().bem('checkbox').setMod('disabled');
		$(this._search_filter_flat_types).find('.checkbox:visible:last').addClass('last-visible');
	},

	_enableFreePlan: function(){
		$(this._search_filter_flat_types).find('.checkbox').removeClass('last-visible');
		$(this._search_filter_flat_types_free_plan).show().bem('checkbox').delMod('disabled');
	},



	_disableResaleNew: function(){
		$(this._search_filter_resale_new).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
	},

	_enableResaleNew: function(){
		$(this._search_filter_resale_new).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
	},

	_disableBuiltBuild: function(){
		$(this._search_filter_built_build).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
	},

	_enableBuiltBuild: function(){
		$(this._search_filter_built_build).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
	},

	_disableRoomCountFromTo: function(){
		$(this._search_filter_room_count_label).hide();

		$(this._search_filter_room_count_from_to).hide().find('.input').each(function(){
			$(this).bem('input').setMod('disabled');
		});
	},

	_enableRoomCountFromTo: function(){
		$(this._search_filter_room_count_label).show();
		
		$(this._search_filter_room_count_from_to).show().find('.input').each(function(){
			$(this).bem('input').delMod('disabled');
		});
	},



	_setParamsForServer: function(){
		var action = this._action.getVal();
		var target = this._target.getVal();

		var fields = [
			'action', 
			'target', 
			'priceFrom', 
			'priceTo', 
			'currency', 
			'district[]', 
			'locality[]', 
			'streetBuilding[]',
			'metro[]', 
			'metroDistance', 
			'metroDistanceOnFoot', 
			'priceMode',
			'typeBuilding[]'
		];

		// Купить
		if(action == 'buy'){
			// Квартиру
			if(target == 'flat'){
				fields = fields.concat([
					'flatTypes[]', 
					'isNew', 
					'isResale', 
					'isBuild', 
					'isBuilt', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'coveredParking', 
					'coveredSpace', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'readyQuarter', 
					'readyYear'
				]);

				if(!this._hasIsNew()){
					fields.splice(fields.indexOf('isBuilt'), 1);
					fields.splice(fields.indexOf('isBuild'), 1);
				}

			}

			// Комнату
			if(target == 'room'){
				fields = fields.concat([
					'roomOfferedCount[]', 
					'roomCountFrom', 
					'roomCountTo', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto'
				]);
			}
		}

		// Снять
		if(action == 'rent'){
			// Квартиру
			if(target == 'flat'){
				fields = fields.concat([
					'flatTypes[]', 
					'isDailyRent', 
					'isLongRent', 
					'areaTo', 
					'areaFrom', 
					'livingAreaFrom', 
					'livingAreaTo', 
					'kitchenAreaFrom', 
					'kitchenAreaTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'canBeSettledAtOnce', 
					'finishing', 
					'balcony', 
					'bathroom', 
					'coveredParking', 
					'coveredSpace', 
					'typeBuilding', 
					'conditionTrade', 
					'isMortgage', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'readyYear', 
					'withChildren', 
					'withPets', 
					'isPhone', 
					'isFridge', 
					'isWasher', 
					'isStove', 
					'isKitchenFurniture', 
					'isFurniture'
				]);
			}

			// Комнату
			if(target == 'room'){
				fields = fields.concat([
					'roomOfferedCount[]', 
					'isDailyRent', 
					'isLongRent', 
					'roomCountFrom', 
					'roomCountTo', 
					'floorFrom', 
					'floorTo', 
					'floorCountFrom', 
					'floorCountTo', 
					'notLastFloor', 
					'notFirstFloor', 
					'lastFloor', 
					'isLift', 
					'typeBuilding', 
					'conditionTrade', 
					'hasRentPledge', 
					'author', 
					'isPrivate', 
					'publishDate', 
					'hasPhoto', 
					'withChildren', 
					'withPets', 
					'isPhone', 
					'isFridge', 
					'isWasher', 
					'isStove', 
					'isKitchenFurniture', 
					'isFurniture', 
					'coveredParking', 
					'coveredSpace', 
					'bathroom'
				]);
			}
		}


		this._server_params = [];

		var that = this;

		this._getFormData().map(function(item){
			if($.inArray(item.name, fields) > -1 && item.value !== ''){
				that._server_params.push({
					name: item.name,
					value: item.value
				});
			}
		});


		if(this._page > 1){
			this._server_params.push({
				name: 'page',
				value: this._page
			});
		}



		if(this._sort.length){
			this._server_params.push({
				name: 'sortBy',
				value: this._sort
			});
		}

		console.clear();
		console.table(this._server_params);
	},




	setPage: function(page){
		this._page = page;
	},


	setSort: function(sort){
		this.setPage(1);
		this._sort = sort;
	},





	_setUrlQueryString: function(){
		// window.history.pushState(null, null, window.location.pathname + '?' + $.param(this._server_params));
		window.location.href = this.params.url + '?' + $.param(this._server_params);
	},



	_hasIsNew: function(){
		return this._search_filter_is_new_checkbox.hasMod('checked');
		// return $.inArray('isNew', this._search_filter_resale_new_bem.getVal()) > -1;
	},



	_onIsNewChange: function(){

		if(this._hasIsNew()){
			this._search_full.enableDeadline();
			this._enableBuiltBuild();
		} else {
			this._search_full.disableDeadline();
			this._disableBuiltBuild();
		}

	},




	_toggleFullSearch: function(e){
		e.preventDefault();

		this._search_full.toggleMod('show', true);

		var text  = $('#toggle_full_search_link').text();
		var togg1 = $('#toggle_full_search_link').data('text');
		var togg2 = $('#toggle_full_search_link').data('toggle-text');

		$('#toggle_full_search_link').text(text == togg1 ? togg2 : togg1);
	}

}



));





});