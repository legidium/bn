modules.define(
    'living_complex_tools_bar',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited' : function(){
                    this._buttonFavorite = this.findElem('item', 'first', true);
                    this.bindTo(this._buttonFavorite, 'click', this._onToggleFavorite, this);
                }
            },
        },

        _onToggleFavorite: function(e) {
            var toolsItem = $(e.currentTarget);

            e.stopPropagation();

            if (toolsItem.hasClass('living_complex_tools_bar__item_accept')){
                toolsItem.removeClass('living_complex_tools_bar__item_accept');
                toolsItem.find('.icon')
                    .removeClass('icon_action_star')
                    .addClass('icon_action_star-o');
            } else {
                toolsItem.addClass('living_complex_tools_bar__item_accept');
                toolsItem.find('.icon')
                    .addClass('icon_action_star')
                    .removeClass('icon_action_star-o');
            }

            var that = this;
            var url = this.params.favorite_url;

            if (url) {
                $.get(url, {item_id: that.params.item_id}, function(data){
                    console.log(that.params.item_id);
                });
            }
        }

    }));


});