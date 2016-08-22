/**
 * @module map_provider_yandex
 * @description map block.
 */

modules.define('map',
    ['i-bem__dom', 'ymaps'],
    function(provide, BEMDOM, ymaps) {

    provide(BEMDOM.decl(this.name, {
        onSetMod : {
            'js' : {
                'inited' : function() {
                    this._drawMap();
                }
            }
        },

        /**
         * Draw map unit
         */
        _drawMap : function() {
	        var self = this;
            var params = this.params;

            ymaps.ready(function() {
                this._map = new ymaps.Map(this.domElem[0], params, {
                    searchControlProvider: 'yandex#search'
                });

	            if (params.disableScroll) {
		            this._map.behaviors.disable('scrollZoom');
	            }

	            if (params.clustering) {
		            self.createCluster(this._map);
	            } else {
		            this._drawGeoObjects();
	            }

	            if (params.changeSize) {
		            self.changeSize(this._map);
	            }

                //this._map.controls.add('smallZoomControl', { top: 70, right: 5 });
            }.bind(this));
        },

	    createCluster: function (map) {
		    clusterer = new ymaps.Clusterer({
			    /**
			     * Через кластеризатор можно указать только стили кластеров,
			     * стили для меток нужно назначать каждой метке отдельно.
			     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/option.presetStorage.xml
			     */
			    preset: 'islands#blueClusterIcons',
			    /**
			     * Ставим true, если хотим кластеризовать только точки с одинаковыми координатами.
			     */
			    groupByCoordinates: false
		    });

		    var collection = [];
			var geoObjects = this.params.geoObjects;

		    geoObjects.forEach(function (geoObject, index) {
			    var coords = geoObject.coordinates,
				    properties = geoObject.properties,
				    objectData = geoObject.objectData;

			    geoObjects[index] = new ymaps.Placemark(coords, { hintContent: '' + properties.hintContent + '' });
		    });

		    clusterer.options.set({
			    clusterDisableClickZoom: true,
			    hasBalloon: false
		    });

		    clusterer.add(geoObjects);

		    clusterer.events.add('click', function (event) {
			    this.onGeoObjectClicked(event);
		    }.bind(this));

		    map.geoObjects.add(clusterer);



		    //var objectState = clusterer.getObjectState(geoObjects[1]);
		    //console.log(objectState.isClustered);
		    //
		    //if (objectState.isClustered) {
			 //   // Если метка находится в кластере
			 //   objectState.cluster.state.set('activeObject', geoObjects[2]);
			 //   clusterer.balloon.open(objectState.cluster);
		    //} else if (objectState.isShown) {
			 //   // Если метка не попала в кластер и видна на карте, откроем ее балун.
				//return false
		    //}
	    },

	    changeSize: function (map) {


		    // console.log(map);
	    },

        /**
         * Draws geoObjects derived from bemjson
         */
        _drawGeoObjects : function() {
            // console.log(this.params);

            this.params.geoObjects.forEach(function(geoObject) {
                var coords = geoObject.coordinates,
                    properties = geoObject.properties,
                    options = geoObject.options,
                    geoType;

                switch(geoObject.type) {
                    case 'placemark':
                        geoType = 'Point';

                        break;
                    case 'polyline':
                        geoType = 'LineString';

                        break;
                    case 'rectangle':
                        geoType = 'Rectangle';
                }

                this.addGeoObject({
                    type : geoType,
                    coordinates : coords
                }, properties, options);

            }, this);
        },

        /**
         * Add geoObject to map
         * @param {Object} geometry
         * @param {Object} properties
         * @param {Object} options
         */
        addGeoObject : function(geometry, properties, options) {
            var self = this;
            ymaps.ready(function() {
                var geoObject = new ymaps.GeoObject(
                    {
                        geometry : geometry,
                        properties : properties
                    },
                    options
                );

                geoObject.events.add('click', function(e) {
                   self.onGeoObjectClicked(e);
                });

                this._map.geoObjects.add(geoObject);

            }.bind(this));
        },

        /**
         * @return {Map | Null}
         */
        getMap : function() {
            return this._map || null;
        },

        onGeoObjectClicked: function(e) {
            console.log('GeoObject Clicked');
        }
    }));
});
