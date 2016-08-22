modules.define('feedback_popup', [ 'i-bem__dom', 'jquery', 'loader_type_js' ], function (provide, BEMDOM, $, loader) {
	

	var validateEmail = function (email) {
		var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;;
		return re.test(email);
	};

	var address;

	provide(BEMDOM.decl(this.name, {
		onSetMod: {
			js: {
				inited: function () {

					grecaptcha.render('js-captcha', {
						sitekey: '6Lfv6QsTAAAAAOw9HVBq0rwxvT4_i7ybrqtHAXzi'
					});


					var nodes = {
						popup: this.findBlockOutside('popup'),
						dropdown: this.findBlockOutside('dropdown'),
						radio: this.findBlocksInside('radio'),
						input: this.findBlockInside('input'),
						text: this.findBlockInside('textarea')
					};

					window.$ = $;
					window.jQuery = $;
					this.loadInputMask($);

					address = nodes.input.findElem('control');

					var textarea = nodes.text.findElem('control');
					var contactText = nodes.input.findElem('control');
					var oldText = textarea.text();
					var isEmailValid = false;
					var isToEmail = false;

					contactText.on('change', function () {
						isEmailValid = validateEmail(contactText.val());

						if (!isToEmail) {
							return;
						}

						if (isEmailValid) {
							nodes.input.domElem.css({ background: 'rgb(229, 229, 229)' });
						} else {
							nodes.input.domElem.css({ background: 'rgb(208, 2, 27)' });
						}
					});

					$(window).on('keydown', function (event) {
						nodes.popup.delMod('visible');
					});

					this.bindTo('submit', 'click', function () {
						if (!isEmailValid && isToEmail) {
							return;
						}

						var values = this.domElem.serializeArray();
						var isRobot = false;
						var isEmptyField = false;

						values.forEach(function (item) {
							if (item.value === '') {
								isEmptyField = true;
							}

							if (item.name === 'g-recaptcha-response' && item.value === '') {
								isRobot = true;
							}
						});

						if (isRobot) {
							return;
						}

						if (isEmptyField) {
							return;
						}

						nodes.popup.delMod('visible');
						nodes.dropdown.domElem.remove();
					});

					this.bindTo('cancel', 'click', function () {
						nodes.popup.delMod('visible');
					});

					nodes.radio.forEach(function (item) {
						item.domElem.on('click', function (event) {
							var text = $(event.target).text();
							isToEmail = text === 'на почту';

							if (isToEmail) {
								address.inputmask('remove');
								address.val('');
								address.attr('placeholder', 'Ваш email для связи');
								oldText = textarea.text();
								textarea.text('Пожалуйста, расскажите об объекте подробнее');
							} else {
								address.attr('placeholder', 'Ваш телефон для связи');
								textarea.text(oldText);
								address.val('');
								address.inputmask('9-(999)-999-99-99');
							}
						}.bind(this));
					}.bind(this));
				}
			}
		},
		loadInputMask: function ($) {
			var apiScript = {};
			var apiCallback = 'inputmaskloaded';

			window[apiCallback] = $.proxy(function () {
				this.onApiLoaded();
			}, this);

			apiScript.src = '/desktop.blocks/jquery/jquery.inputmask.bundle.min.js';
			loader(apiScript.src, this.onApiLoaded);
		},
		onApiLoaded: function () {
			address.inputmask('9-(999)-999-99-99');
		}
	}));
});