modules.define(
	'retail-data',
	['i-bem__dom', 'jquery', 'popup'],
	function(provide, BEMDOM, $) {

		provide(BEMDOM.decl(this.name, {

				onSetMod: {
					'js' : {
						'inited' : function(){
							this._setFlags();
							this._cacheNodes();
							this._ready();
							this.bindTo(this.image, 'click', this._imageClick);
							this.bindTo(this.galleryItems, 'click', this._previewClick);

							var self = this;

							this._map = this.findBlockInside('map');
							this._map.onGeoObjectClicked = function(e) {
								//var target = e.sourceEvent.originalEvent.target;
								var mouse = e._sourceEvent.originalEvent.domEvent.originalEvent;

								var position = {
									x: mouse.pageX,
									y: mouse.pageY
								};

								self._showPopup(position, {}, e);
							};


							this._popup = this.findBlockInside('popup');
							this._popup.on({ modName : 'visible', modVal : 'true' }, this._onPopupVisibile, this);

							this._button = this.findBlockInside('button')
								.on('click', this._showResultsPopup, this);
						}
					}
				},

				_setFlags: function () {
					this.showedImage = {
						index: 0,
						galleryIndex: 0
					}
				},

				_ready: function () {
					galleryItem = this.gallery.eq(this.showedImage.galleryIndex).children()
						.eq(this.showedImage.index);

					this._showImage(galleryItem);
					this._setActivePreview();
				},

				_cacheNodes: function () {
					this.gallery = $(this.findElem('gallery'));
					this.galleryItems = $(this.findElem('gallery-item'));
					this.image = $(this.findElem('image'));
				},

				_defineTemplate: function () {
					this.template = '<div class="youtube-player">\
										<iframe id="youtube-player" type="text/html" width="600" height="450"\
											src="https://www.youtube.com/embed/' + this.playerID + '?wmode=opaque&autoplay=1&fs=0&showinfo=0&html5=1"\
											frameborder="0" allowfullscreen>\
									</div>'
				},

				_setActivePreview: function () {
					this.gallery.eq(this.showedImage.galleryIndex).children()
						.eq(this.showedImage.index).addClass('retail-data__gallery-item_active');
				},

				_imageClick: function (e) {
					var galleryItem = null;
					var newShowedImageIndex = this.showedImage.index + 1;
					var galleryItemsCount = this.gallery.eq(this.showedImage.galleryIndex).children().length;


					if (newShowedImageIndex + 1 > galleryItemsCount) {
						newShowedImageIndex = 0;
					}

					if (newShowedImageIndex >= this.gallery.eq(this.showedImage.galleryIndex).children().length) {
						return;
					}

					this.showedImage.index = newShowedImageIndex;

					galleryItem = this.gallery.eq(this.showedImage.galleryIndex).children()
						.eq(this.showedImage.index);

					this._showImage(galleryItem);
				},

				_previewClick: function (e) {
					var galleryItem = $(e.currentTarget);
					var galleryIndex = galleryItem.parent().index();
					var index = galleryItem.index();

					this.showedImage.index = index;
					this.showedImage.galleryIndex = galleryIndex;

					if (index < this.gallery.eq(this.showedImage.galleryIndex).children().length) {
						this.image.removeClass('retail-data__image_no-active');
					}

					if (index + 1 === this.gallery.eq(this.showedImage.galleryIndex).children().length) {
						//this.image.addClass('retail-data__image_no-active');
					}

					this._showImage(galleryItem);
				},

				_showImage: function (item) {
					var largeImageUrl = item.data('large-image-url');

					if (item.data('youtube-id')) {
						this.playerID = item.data('youtube-id');
						this._defineTemplate();

						this.image.hide();
						this.image.siblings().remove();
						this.image.parent().prepend(this.template);
					} else {
						this.image.show().siblings().remove();
						this.image[0].setAttribute('src', largeImageUrl);
					}

					this.gallery.children().removeClass('retail-data__gallery-item_active');
					this._setActivePreview();
				},

				_showResultsPopup: function(e) {
					e.preventDefault();


				},

				_showPopup: function(position, data, e) {
					//var map = this._map.getMap();
					//console.log(map.geoObjects.getBounds());
					//map.setBounds(map.geoObjects.getBounds());

					console.log(position);

					this._popup.setPosition(position.x, position.y).setMod('visible', true);
					//this._popup.setPosition(0, 0).setMod('visible', true);
				},

				_onPopupVisibile: function(e) {
					console.log('Popup visible');
				}
			}
		));
	});