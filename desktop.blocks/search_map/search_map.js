modules.define('search_map',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited' : function() {
                    var self = this;

                    this._data = [];

                    this._map = this.findBlockInside('map');
                    
                    this._map.onGeoObjectClicked = function(e) {
	                    var target = e.originalEvent.target;
                        var mouse = e.originalEvent.domEvent.originalEvent;
                        
                        var position = {
                            x: mouse.pageX,
                            y: mouse.pageY
                        };

                        self._showPopup(position, {}, e);
                    };

                    this._popup = this.findBlockInside('popup');
                    this._popup.on({ modName : 'visible', modVal : 'true' }, this._onPopupVisibile, this);

                    this._button = this.findBlockInside('button').on('click', this._showResultsPopup, this);



                    if(this.params.url){
                        this._loadData();

                        this.on('data_loaded', this._onDataLoaded, this);
                    }
                    





                }
            }
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
        },


        _onPopupVisibile: function(e) {
            console.log('Popup visible');
        },


        _loadData: function(){
            var that = this;
            var url = this.params.url;

            $.ajax({
              method: "GET",
              url: url,
              cache: false,
            })
            .done(function(data) {
                that._data = data;

                that.emit('data_loaded');
                that.emit('ajax_end');
            })
            .fail(function(error) {
                console.log(error);
                that.emit('ajax_end');
            });
        },





        _onDataLoaded: function(){
            // вариант 1
            // отправить данные в карту
            // узнать у карты сколько получилось кластеров
            // заполнять все попапы по значениям из кластеров

            // вариант 2 
            // переопределить шаблон для попапов кластеров (пока не понятно как)

            // вариант 3 
            // 

            for (var i = this._data.items.length - 1; i >= 0; i--) {
                console.log(this._data.items[i].map_data);
                this._map.addGeoObject(this._data.items[i].map_data);
            };
        }




























    }));
});
