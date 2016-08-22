modules.define(
	'maskedinput',
	['i-bem__dom', 'jquery', 'loader_type_js'],
	function(provide, BEMDOM, $, loader) {
		provide(BEMDOM.decl(this.name, {
			onSetMod: {
				js: {
					inited: function () {
						var input = $('.maskedinput .input__control');

						window.$ = $;
						window.jQuery = $;
						/*borschik:include:../..//desktop.blocks/jquery/jquery.inputmask.bundle.min.js*/
						input.inputmask('+9 (999) 999-99-99');
					}
				}
			}
		}));
	}
);