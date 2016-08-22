modules.define(
    'search_results_item',
    ['i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this.bindTo(this.findElem('tools_item', 'first', true), 'click', this._toggleFavorite, this);
				this.bindTo(this.findElem('tools_item', 'second', true), 'click', this._toggleLists, this);
				this.bindTo(this.findElem('tools_item', 'third', true), 'click', this._toggleComments, this);
				
				this.bindTo($(this.domElem).find('.voprosique'), 'click', function(e){ 
					e.preventDefault();
				});

				this.in_lists = this.params.in_lists || [];
				
			}
		}
	},





	setInLists: function(id){
		if(this.in_lists.indexOf(id) == -1){
			this.in_lists.push(id);
		}
		$(this.findElem('tools_item', 'second', true)).addClass('search_results_item__tools_item_accept');
		$(this.findBlockInside(this.findElem('tools_item', 'second', true), 'icon').domElem).removeClass('icon_action_plus').addClass('icon_action_plus-blue');
	},



	setInComments: function(){
		$(this.findElem('tools_item', 'third', true)).addClass('search_results_item__tools_item_accept');
		$(this.findBlockInside(this.findElem('tools_item', 'third', true), 'icon').domElem).removeClass('icon_action_comments').addClass('icon_action_comments-blue');
	},


	_toggleLists : function(e){
		e.preventDefault();
	},

	_toggleComments : function(e){
		e.preventDefault();
	},




	_toggleFavorite: function(e){
		e.preventDefault();

		var that = this;

		if($(e.currentTarget).hasClass('search_results_item__tools_item_accept')){
			$(e.currentTarget).removeClass('search_results_item__tools_item_accept');
			$(e.currentTarget).find('.icon')
							  .removeClass('icon_action_star')
							  .addClass('icon_action_star-o');
		} else {
			$(e.currentTarget).addClass('search_results_item__tools_item_accept');
			$(e.currentTarget).find('.icon')
							  .addClass('icon_action_star')
							  .removeClass('icon_action_star-o');
		}

		var url = this.findBlockOutside('search_results').params.favorite_url;

		if(url){
			$.get(url, {item_id: that.params.id}, function(data){
				//////////
				console.log(that.params.id);
			});
		}

	},



	






}



));





});