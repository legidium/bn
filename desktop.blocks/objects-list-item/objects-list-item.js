modules.define(
    'objects-list-item',
    ['i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMDOM, $) {

        provide(BEMDOM.decl(this.name, {
            onSetMod: {
                'js' : {
                    'inited' : function(){
                        this.in_lists = this.params.in_lists || [];
                        this._tools = this.findBlockInside('objects-list-item-tools');

                        this.bindTo(this.findElem('tools-item', 'first', true), 'click', this._toggleFavorite, this);
                        this.bindTo(this.findElem('tools-item', 'second', true), 'click', this._toggleLists, this);
                        this.bindTo(this.findElem('tools-item', 'third', true), 'click', this._toggleListseComments, this);

                        this.bindTo($(this.domElem).find('.voprosique'), 'click', function(e){ 
                            e.preventDefault();
                        });

                    }
                }
            },
            
            setInLists: function(id){
                if(this.in_lists.indexOf(id) == -1){
                    this.in_lists.push(id);
                }

                var elem = this._tools.findElem('tools-item', 'second', true);

                $(elem).addClass('objects-list-item-tools__tools-item_accept');
                $(this._tools.findBlockInside(elem, 'icon').domElem).removeClass('icon_action_plus').addClass('icon_action_plus-blue');
            },

            setInComments: function(){
                $(this._tools.findElem('tools-item', 'third', true)).addClass('objects-list-item-tools__tools-item_accept"');
                $(this._tools.findBlockInside(this.findElem('tools-item', 'third', true), 'icon').domElem).removeClass('icon_action_comments').addClass('icon_action_comments-blue');
            },

            _toggleLists : function(e){
                // e.stopPropagation();
            },

            _toggleComments : function(e){
                // e.stopPropagation();
            },

            _toggleFavorite: function(e){
                e.stopPropagation();
                var target = $(e.currentTarget);

                if (target.hasClass('objects-list-item__tools-item_accept')) {
                    $(e.currentTarget).removeClass('objects-list-item__tools-item_accept');
                    $(e.currentTarget)
                        .find('.icon')
                        .removeClass('icon_action_star')
                        .addClass('icon_action_star-o');
                } else {
                    $(e.currentTarget).addClass('objects-list-item__tools-item_accept');
                    $(e.currentTarget)
                        .find('.icon')
                        .addClass('icon_action_star')
                        .removeClass('icon_action_star-o');
                }
            }
        }

    ));

});
