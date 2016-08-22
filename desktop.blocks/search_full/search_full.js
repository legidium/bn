modules.define(
    'search_full',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){


				this._search_full_ploschad   = $('#search_full_ploschad');
				this._search_full_etaji      = $('#search_full_etaji');
				this._search_full_dop_big    = $('#search_full_dop_big');
				this._search_full_dop_small  = $('#search_full_dop_small');
				this._search_full_deadline   = $('#search_full_deadline');
				this._search_full_etaji      = $('#search_full_etaji');
				this._search_full_uslovia_sdelki   = $('#search_full_uslovia_sdelki');
				this._search_full_kommissia_zalog  = $('#search_full_kommissia_zalog');
				

			} 
		}
	},



	disableKommissia: function(){
		$(this._search_full_kommissia_zalog).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
		$(this._search_full_kommissia_zalog).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableKommissia: function(){
		$(this._search_full_kommissia_zalog).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
		$(this._search_full_kommissia_zalog).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disableUslovia: function(){
		$(this._search_full_uslovia_sdelki).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
		$(this._search_full_uslovia_sdelki).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableUslovia: function(){
		$(this._search_full_uslovia_sdelki).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
		$(this._search_full_uslovia_sdelki).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disableDeadline: function(){
		$(this._search_full_deadline).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableDeadline: function(){
		$(this._search_full_deadline).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disableDopBig: function(){
		$(this._search_full_dop_big).hide().find('.checkbox').each(function(){
			$(this).bem('checkbox').setMod('disabled');
		});
		$(this._search_full_dop_big).hide().find('.select').each(function(){
			$(this).bem('select').setMod('disabled');
		});
	},



	enableDopBig: function(){
		$(this._search_full_dop_big).show().find('.checkbox').each(function(){
			$(this).bem('checkbox').delMod('disabled');
		});
		$(this._search_full_dop_big).show().find('.select').each(function(){
			$(this).bem('select').delMod('disabled');
		});
	},



	disableDopSmall: function(){
		$(this._search_full_dop_small).hide().find('.checkbox').each(function(){
			$(this).hide().bem('checkbox').setMod('disabled');
		});
		$(this._search_full_dop_small).hide().find('.select').each(function(){
			$(this).hide().bem('select').setMod('disabled');
		});
	},



	enableDopSmall: function(){
		$(this._search_full_dop_small).show().find('.checkbox').each(function(){
			$(this).show().bem('checkbox').delMod('disabled');
		});
		$(this._search_full_dop_small).show().find('.select').each(function(){
			$(this).show().bem('select').delMod('disabled');
		});
	},



	disablePloschad: function(){
		$(this._search_full_etaji).addClass('is_first');
		$(this._search_full_ploschad).hide().find('.input').each(function(){
			$(this).hide().bem('input').setMod('disabled');
		});
	},


	enablePloschad: function(){
		$(this._search_full_etaji).removeClass('is_first');
		$(this._search_full_ploschad).show().find('.input').each(function(){
			$(this).show().bem('input').delMod('disabled');
		});
	},






}



));





});