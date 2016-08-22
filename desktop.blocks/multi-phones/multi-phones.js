modules.define(
	'multi-phones',
	['i-bem__dom', 'jquery'],
	function(provide, BEMDOM, $) {
		var item;

		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				js: {
					inited: function () {
						addButton = this.findElem('add');
						item = $(this.findElem('item'));

						addButton.on('click', this.addPhone);

						this.bindTo(this.findElem('add'), 'click', this.addPhone);
					}
				}
			},

			addPhone: function()
			{
				var block = $(this).parent('.multi-phones');
				var clone = item.clone();

				clone
					.find('.input__control')
					.removeAttr('placeholder')
					.inputmask('+9 (999) 999-99-99');

				clone.appendTo(block);
			}
		}));
	}
);