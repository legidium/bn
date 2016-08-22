modules.define(
	'datepicker',
	['i-bem__dom', 'jquery', 'loader_type_js'],
	function(provide, BEMDOM, $, loader) {
		var input;

		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				js: {
					inited: function () {
						input = $('.datepicker__input');

						window.$ = $;
						window.jQuery = $;
						/*borschik:include:../../desktop.blocks/jquery/jquery.datepicker.min.js*/
						input.datepicker({dateFormat: 'd M yy', defaultDay: null});
					}
				}
			}
		}));
	}
);