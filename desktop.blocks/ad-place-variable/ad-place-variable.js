modules.define(
    'ad-place-variable',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {
    	var blocks = $('.ad-place-variable__tr');
    	var radio_normal = $('.ad-place-variable__radio_type_normal');
    	var radio_colored = $('.ad-place-variable__radio_type_colored');
    	var checkbox_vip = $('.ad-place-variable__checkbox_type_vip');

		provide(BEMDOM.decl(this.name, {
		    onSetMod: {
		        'js' : {
		            'inited' : function() {
		            	blocks.on('click', this._change);
		            }
		        }
		    },

		    _change: function()
		    {
		    	if($(this).hasClass('normal')){
		    		radio_normal.prop('checked', true);;
		    	} else if($(this).hasClass('colored')){
					radio_colored.prop('checked', true);
		    	} else if($(this).hasClass('vip')){
					checkbox_vip.prop('checked', !checkbox_vip.prop('checked'));
		    	}
		    }
		}));

	}
);