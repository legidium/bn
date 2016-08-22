modules.define(
    'gallery',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._current = this.elem('current');
				this._items = this.elem('item');


				this.bindTo(this._items, 'click', this._previewClick, this);
				this.bindTo(this._current, 'click', this._nextClick, this);
			}
		}
	},


	_nextClick: function(e){

		var i = 0;
		var current;
		var next;

		this._items.map(function(){
			if($(this).hasClass('gallery__item_active')){
				current = i;
				return;
			}
			i++;
		});

		if(current == this._items.length - 1){
			next = 0;
		} else {
			next = current + 1;
		}

		var galleryItem = $(this._items[next]);
		
		this._items.map(function(){
			$(this).removeClass('gallery__item_active');
		});

		galleryItem.addClass('gallery__item_active');

		this._showImage(galleryItem);

	},


	_previewClick: function (e) {
		var galleryItem = $(e.currentTarget);
		
		this._items.map(function(){
			$(this).removeClass('gallery__item_active');
		});

		galleryItem.addClass('gallery__item_active');

		this._showImage(galleryItem);
	},

	_showImage: function (item) {
		var largeImageUrl = item.data('large-image-url');
		var temp = '<img src="'+largeImageUrl+'" class="image" role="img" width="600" height="450">'


		if (item.data('youtube-id')) {
			temp = this._defineTemplate(item.data('youtube-id'));
		}


		$(this._current).html(temp);

	},








	_defineTemplate: function (id) {
		return '<div class="youtube-player">\
							<iframe id="youtube-player" type="text/html" width="600" height="450"\
								src="https://www.youtube.com/embed/' + id + '?wmode=opaque&autoplay=1&fs=0&showinfo=0&html5=1"\
								frameborder="0" allowfullscreen>\
						</div>'
	},









}));












});