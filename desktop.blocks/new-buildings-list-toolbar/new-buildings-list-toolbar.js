modules.define(
    'new-buildings-list-toolbar',
    ['BEMHTML','i-bem__dom', 'jquery', 'popup'],
    function(provide, BEMHTML, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js' : {
            'inited' : function() {
                this._val = '';

                this._searchForm = this.elem('search');
                this._searchInput = $('#new-buildings-list-toolbar-search').bem('input');                

                this._searchInput.on('change', this._onSearchInputKeyPress, this);
                this._clear = this._searchInput.elem('clear');

                this._searchPopup = this.findBlockInside('popup');
                this._searchMenu = this._searchPopup.findBlockInside('menu');
                this._searchPopup.setAnchor(this._searchInput);
                this._searchPopup.domElem.width(this._searchInput.domElem.width());

                this.bindTo(this._searchForm, 'submit', this._onSearchFormSubmit);
                

                var that = this;
                this.bindTo(this._clear, 'click', function(){
                    that._val = '';
                    that.emit('location_change', { clear: true });
                })
            }
        }
    },

    _onSearchFormSubmit: function(e) {
        e.preventDefault();
        var val = this._searchInput.getVal();

        if (val.length) {
            this._val = val;
            this._searchPopup.delMod('visible');
            this.emit('search');
        }
    },

    _onSearchInputKeyPress: function(e) {
        var val = this._searchInput.getVal();
        var that = this;
        
        if (val.length >= 2) {

            that._searchPopup.setMod('visible');
            
            $.get(that.params.url + '?needle=' + val, function(data){
                that._highlight(data, val);
                that.setContent(data);
            });
        }

        if (val.length == 0) {
            this._searchPopup.delMod('visible');
        }
    },

    setContent: function(data){
        var that = this;

        var lc = data.living_complexes.map(function(item){
            return that._getLCItem(item);
        });

        var locs = data.locations.map(function(item){
            return that._getLocItem(item);
        });

        this._searchMenu.setContent(BEMHTML.apply([this._getFirstContent(lc), this._getSecondContent(locs)]));

        setTimeout(function(){
            that._setEventHandler();
        }, 0);
    },

    _setEventHandler: function(){
        var items = this._searchMenu.findBlocksInside('menu-item');
        var that = this;
        items.map(function(item){
            if(!item.hasMod('type')){
                item.un('click', that._menuClick, that);
                item.on('click', that._menuClick, that);
            }
        });
    },

    getVal: function(search){
        if (search) {
            return this._searchInput && this._searchInput.getVal();
        }
        return this._val;
    },

    _menuClick: function(e){
        var item = $(e.target.domElem).bem('menu-item');
        var text = item.getText();
        var val = item.getVal();

        this._searchInput.setVal(text);
        this._val = item.getVal(val);
        this._searchPopup.delMod('visible');
        
        this.emit('location_change', { type: 'location', text: text, value: val });
    },

    _highlight: function(data, text){
        var reg = new RegExp('('+text+')', 'gi');
        var rep = "<b>$1</b>";

        for (var i = data.living_complexes.length - 1; i >= 0; i--) {
            data.living_complexes[i].name = data.living_complexes[i].name.replace(reg, rep);
        };

        for (var i = data.locations.length - 1; i >= 0; i--) {
            data.locations[i].text = data.locations[i].text.replace(reg, rep);
        };
    },

    _getFirstContent: function(content){
        return {
            elem : 'group',
            block: 'menu',
            attrs: { style: 'padding: 10px 0;' },
            content : content
        };
    },

    _getSecondContent: function(content){
        return {
            elem : 'group',
            block: 'menu',
            attrs: { style: 'padding: 5px 0;' },
            content : content
        };
    },

    _getLCItem: function(item){
        return {
            block : 'menu-item',
            mods: {theme: 'islands', type: 'link', size: 'm'},
            val: item.id,
            cls: 'new-buildings-list-toolbar-search-icon',
            content: {
                block: 'link',
                tag: 'a',
                attrs: {href: item.link},
                content : [
                    {
                        tag: 'span',
                        content: item.name
                    },
                    {
                        block: 'help',
                        tag: 'span',
                        mods: { font_13: true },
                        content:  ', ' + item.city + ', ' + item.street + ', ' + item.house + '.'
                    }
                ]
            }
            
        };
    },

    _getLocItem: function(item){
        return {
            block : 'menu-item',
            mods: {theme: 'islands', size: 'm'},
            js: {val: item.id},
            content : [
                {
                    tag: 'span',
                    content: item.text
                },
                {
                    block: 'help',
                    tag: 'span',
                    mods: { font_13: true },
                    content:  ' ' + item.count + ' ЖК'
                }
            ]
        };
    }

}));


});
