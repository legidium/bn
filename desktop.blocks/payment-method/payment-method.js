modules.define(
    'payment-method',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {
		provide(BEMDOM.decl(this.name, {
		    onSetMod: {
		        js: {
		            inited: function()
		            {
		            	var checkbox = this.findBlockOutside('feed-ad').findBlockInside('checkbox').findElem('checkbox__control');

		            	checkbox.on('change', this._blockMethods);
		            }
		        }
		    },

		    _blockMethods: function()
		    {
		    	console.log(111);
		    }
		}));

	}
);