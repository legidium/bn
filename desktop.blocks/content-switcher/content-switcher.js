modules.define(
	'content-switcher',
	['i-bem__dom'],
	function(provide, BEMDOM) {
		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				'js' : {
					'inited' : function(){
						var buttons = this.elem('buttons-item');
						console.log(buttons)

						// buttons.on('click', this._switch);
					}
				}
			},

			_switch: function(){
				// this.setMod('current')
			}
		}));
	}
);