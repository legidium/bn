modules.define(
    'new-buildings-list',
    ['BEMHTML','i-bem__dom', 'jquery', 'new-buildings-list-item'],
    function(provide, BEMHTML, BEMDOM, $, Items) {



provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._selectClass = this.findBlockInside('new-buildings-select-class');
                this._showBtn = this._selectClass.findBlockInside('button');
                this._dropdown = this._selectClass.findBlockInside('dropdown');
                this._select = this.findBlockInside('select');
                this._menu = null;

                var that = this;

                this._dropdown.findBlockInside('link').bindTo('click', function(){
                    setTimeout(function(){
                        
                        that._menu = that._dropdown.getPopup().findBlockInside('menu');
                        var items = that._menu.getItems();

                        items[0].on('click', function(){
                            if(!items[0].hasMod('checked')){
                                items.map(function(item){
                                  if(item.getVal() != 0){
                                    item.delMod('checked');
                                  }
                               }); 
                            }
                        });

                        items.map(function(item){
                          if(item.getVal() != 0){
                            item.on('click', function(){
                                if(!item.hasMod('checked')){
                                    items[0].delMod('checked');
                                }
                            });
                          }
                        }); 

                    }, 0);
                });



                this._showBtn.on('click', function(){

                    var popup = this._selectClass.findBlockInside('dropdown').getPopup();
                    var switcher = this._selectClass.findBlockInside('dropdown').getSwitcher();
                   
                    popup.delMod('visible');

                    var items = this._menu.getItems();
                    var texts = [];

                    for (var i = 0; i < items.length; i++) {
                        if(items[i].hasMod('checked')){
                            texts.push(items[i].getText());
                        }
                    };

                    var text = texts.join(', ');

                    if(text.length > 33){
                        text = text.substr(0, 33) + '...';
                    }

                    $(switcher.domElem).find('span:first').html(text);




                    this.emit('class_change');

                }, this);


                this._select.on('change', function(){
                    this.emit('sort_change');
                }, this);

			}
		}
	},


    getSort: function(){
        return this._select.getVal();
    },


    getClass: function(){
        return this._menu.getVal();
    },


	clear: function(){

		var items = this.findBlocksInside('new-buildings-list-item');

		for (var i = items.length - 1; i >= 0; i--) {
            $(items[i].domElem).remove();
        };

	},


	setContent: function(items){
        if(!items.length){
            this.setMod('empty', true);
        } else{
            this.delMod('empty');
            this.clear();

            var that = this;

            items.map(function(item){
                that.addItem(item);
            });
        }
	},




    setEmpty: function(){

        // var overlay = this.findElem('overlay').bem('new-buildings-list__overlay');
        // overlay.setMod('visible', true);
        
        
    },

	addItem: function(item){
		BEMDOM.append(
            this.elem('body'),
            BEMHTML.apply({
                block: 'new-buildings-list-item',
                mods: item.mods,
                content: item
            })
        );
	}
}


));





});