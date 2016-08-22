modules.define(
    'address_list_item',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {




provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){
				this.bindTo(this.elem('del'), 'click', this._onRemove);
			}
		}
	},


	getText: function(){
		return this.domElem.text();
	},

	_onRemove : function(e){
		e.stopPropagation();
		var index = $(this.domElem).attr('data-index') || 0;
		$(this.domElem).remove();
		this.emit('remove', index);
	}

}));












});