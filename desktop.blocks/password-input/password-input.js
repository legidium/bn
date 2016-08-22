modules.define(
    'password-input',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {
    	var fields;

		provide(BEMDOM.decl(this.name, {
		    onSetMod: {
		        js: {
		            inited: function()
		            {
		            	fields = $('.password-input').find('.input__control');

				    	fields.on('keyup', this._copyText);

		            	this.findBlockInside('button').on('click', this._switch, this);
		            }
		        }
		    },

		    _copyText: function()
		    {
		    	fields.val($(this).val());
		    },

		    _switch: function()
		    {
		    	this.toggleMod('show-pass', true);
		    }
		}));

	}
);