modules.define('search_map', ['i-bem__dom', 'loader_type_js', 'jquery'], function(provide, BEMDOM, loader, $) {
    provide(BEMDOM.decl({ name: this.name, modName: 'api', modVal: 'ymaps' }, {
        onSetMod: {
            'js': {
                inited: function () {
                    this.loadMapsApi();
                }
            }
        },

        // Описываем модули, которые будем загружать.
        mapsPackages: [
            [
                'package.full'
            ]
        ],
        /**
         * Загрузчик API.
         */
        loadMapsApi: function () {
            if (!window.ymaps) {
                var apiScript = {},
                    apiCallback = 'ymapsloaded';

                window[apiCallback] = $.proxy(function () {
                    this.onAPILoaded();
                }, this);

                apiScript.src = [
                    'http://api-maps.yandex.ru/2.0.29/?',
                    '&load=' + this.mapsPackages[0].join(','),
                    '&lang=' + this.params.lang,
                    '&onload=' + apiCallback
                ].join('');
                loader(apiScript.src);

            } else {
                this.onAPILoaded();
            }
        },
        /**
         * Выполнится после загрузки API.
         */
        onAPILoaded: function () {
            // Запускаем инициализацию карты.
            this.initMap();
        },
        /**
         * Инициализация карты.
         */
        initMap: function () {
            var center = this.params.center || [55.76, 37.64],
                zoom = this.params.zoom;

            this._map = new ymaps.Map(this.domElem[0], {
                center: center,
                zoom: zoom,
                behaviors: ['drag', 'dblClickZoom', 'scrollZoom']
            });

            console.log(this.params);

            // Если есть метки, то добавляем их на карту.
            if (this.params.geoObjects && this.params.geoObjects.length > 0) {
                this.params.geoObjects.forEach(function (item) {
                    // Проверяем, является ли элемент коллекцией / группой.
                    var geoObject;
                    if (item.collection) {
                        geoObject = new ymaps.GeoObjectArray({
                            properties: item.properties
                        }, item.options);

                        // Теперь добавим элементы, описанные в bemjson, в коллекцию.
                        item.data.forEach(function (placemark) {
                            placemark.options = placemark.options || {};
                            geoObject.add(new ymaps.Placemark(placemark.coords, placemark.properties, placemark.options));
                        }, this);
                    } else {
                        item.options = item.options || {};
                        geoObject = new ymaps.Placemark(item.coords, item.properties, item.options);
                    }

                    this._map.geoObjects.add(geoObject);
                }, this);
            }

            // Установка bounds по добавленным геообъектам.
            if (this.params.setupBoundsByGeoObjects) {
                this._map.setBounds(this._map.geoObjects.getBounds());
            }

            // Установка слоя с тайлами OSM.
            if (this.params.setupOSMTiles) {
                var OSMLayer = function () {
                    var layer = new ymaps.Layer('http://tile.openstreetmap.org/%z/%x/%y.png', {
                        projection: ymaps.projection.sphericalMercator
                    });
                    layer.getZoomRange = function () {
                        var promise = new ymaps.util.Promise();
                        promise.resolve([0, 18]);
                        return promise;
                    };
                    return layer;
                };
                ymaps.layer.storage.add('osm#map', OSMLayer);
                var osmMapType = new ymaps.MapType('OSM', ['osm#map']);
                ymaps.mapType.storage.add('OSM', osmMapType);

                this._map.setType('OSM');
                this._map.copyrights.add('&copy; OpenStreetMap contributors, CC-BY-SA');
            }

            // Добавляем контролы на карту.
            this._map.controls
                .add('zoomControl')
                .add('scaleLine')
                .add('typeSelector')
                .add('mapTools');

            // Блок поделится информацией о том, что он инициализировал карту.
            // В данных передаём ссылку на экземпляр карты.
            this.emit('map-inited', {
                map: this._map
            });
        },

        /**
         * @return {Map | Null} Экземпляр карты, либо null, если карта не инстанцирована.
         */
        getMap: function () {
            return this._map || null;
        }

    }));
});
