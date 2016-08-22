modules.define(
    'user_comments_in_search',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this._paramsBlockName = this.params.paramsBlockName ? this.params.paramsBlockName : 'search_results';
				this._itemBlockName = this.params._itemBlockName ? this.params._itemBlockName : 'search_results_item';

				this._popup = this.findBlockOutside('popup');
				this._form = this.findElem('form');
				this._cancel = this.findBlockInside(this.findElem('cancel'), 'button'); 
				this._textarea = this.findBlockInside('textarea');

				this._search_results = this.findBlockOutside(this._paramsBlockName);
				this._search_results_item = this.findBlockOutside(this._itemBlockName);

				var that = this;

				if(this._cancel){
					this._cancel.on('click', function(e){
						e.preventDefault();
						that._popup.delMod('visible');
					});
				}
				
				if(this._form){
					this.bindToDomElem(this._form, 'submit', function(e){
						e.preventDefault();
						var val = $(that._textarea.domElem).val();
						
						if(val == ''){
							$(that._textarea.domElem).focus();
						} else {

							var url = that._search_results.params.comment_url;

							if(url){
								// поменять на post и поменять адрес
								$.get(url, {comment: val, item_id: that.params.item_id}, function(data){
									that._popup.delMod('visible');

									// Проверка наличия у объекта метода setInComments
									if (that._search_results_item && typeof that._search_results_item.setInComments == 'function') {
										that._search_results_item.setInComments();
									}
								});
							}
						}
					});
				}

				

			}
		}
	},

	setParams: function(paramsBlockName, itemBlockName) {
		this._paramsBlockName = paramsBlockName;
		this._itemBlockName = itemBlockName;
	}


}




));



});