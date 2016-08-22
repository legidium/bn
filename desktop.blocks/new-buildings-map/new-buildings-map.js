modules.define('new-buildings-map', ['i-bem__dom', 'jquery'], function(provide, BEMDOM, $) {
    provide(BEMDOM.decl(this.name, {
        onSetMod: {
            'js' : {
                'inited' : function() {
                    var self = this;
                    this._popup = $('#new-buildings-map-popup');
                    this._map = this.findBlockInside('map');

                    this._map.onGeoObjectClicked = function(e) {
                        var target = e.originalEvent.target;
                        var mouse = e.originalEvent.domEvent.originalEvent;
                        console.log(e);
                        console.log(mouse);

                        var position = {
                            x: mouse.pageX,
                            y: mouse.pageY
                        };

                        self._showPopup(position, {}, e);
                    };
                }
            }
        },

        _showPopup: function(position, data, e) {
            if (this._popup && this._popup.length) {
                var popup = this._popup.bem('popup');

                console.log(popup);
                popup.setPosition(position.x, position.y).setMod('visible', true);
            }
        }

    }));
});
