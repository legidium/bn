modules.define('living_complex_filter',
    ['i-bem__dom', 'jquery', 'living_complex_flats'],
    function(provide, BEMDOM, $, Flats) {

    provide(BEMDOM.decl(this.name, {
        onSetMod : {
            'js' : {
                'inited' : function() {
                    console.log('living_complex_filter:inited');

                    this._data    = null;
                    this._sort    = null;
                    this._showAll = false;

                    this._dropdown          = this.findBlockInside('dropdown');
                    this._dropdown_menu     = this._dropdown.findBlockInside('menu');
                    this._dropdown_switcher = this._dropdown.getSwitcher();
                    this._dropdown_btn      = this._dropdown.getPopup().findBlockInside('button');
                    this._spin              = this.findBlockInside('spin');

                    this.bindTo('submit', this._onSubmit, this);
                    this._dropdown_btn.on('click', this._submitProcess, this);

                    this._select           = this.findBlockInside('select');
                    this._checkboxes       = this.findBlocksInside('checkbox');
                    this._checkboxes_group = this.findBlockInside('checkbox-group');
                    this._radio_group      = this.findBlockInside('radio-group');
                    this._inputs           = this.findBlocksInside('input');

                    var that = this;

                    this._select.on('change', this._onFilterChanged, this);
                    this._checkboxes_group.on('change', this._onFilterChanged, this);
                    this._radio_group.on('change', this._onFilterChanged, this);

                    this._checkboxes.map(function(checkbox){
                        checkbox.on('change', that._onFilterChanged, that);
                    });

                    this._inputs.map(function(input){
                        input.on('change', that._onFilterChanged, that);
                    });

                    this.on('ajax_start', function() { that._spin.setMod('visible'); });
                    this.on('ajax_end', function() { that._spin.delMod('visible'); });

                    this.loadData();

                }
            }
        },

        getData: function(){
            return this._data;
        },

        getShowAll: function() {
            return this._showAll;
        },

        setShowAll: function(val) {
            this._showAll = val;
        },

        loadData: function(){
            this._pushRequest();
        },

        _onSubmit: function(e){
            this._submitProcess(e);
        },

        _submitProcess: function(e){
            e.preventDefault();
            
            this._showAll = false;
            this._setSwitcherText(e);
            this.loadData();
        },

        _pushRequest: function(){
            this.emit('ajax_start');

            var that = this;
            var url;

            // Удалить после проверки
            // НАЧАЛО
            if (this._showAll) {
                url = this.params.show_all_url + '?' + $.param(this._getFormData());
            }
            // КОНЕЦ

            if (!url) {
                url = this.params.url + '?' + $.param(this._getFormData());
            }

            $.ajax({
              method: "GET",
              url: url,
              cache: false,
              context: this,
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

        _getFormData: function(){
            var data = $(this.domElem).serializeArray();
            
            this._showAll && data.push({ name: 'show_all', value: '1' });
            this._sort && data.push({ name: 'sort_by', value: this._sort });

            var menu_val = this._dropdown_menu.getVal();

            if (menu_val.length) {
                for (var i = menu_val.length - 1; i >= 0; i--) {
                    data.push({ name: 'buyTypes[]', value: menu_val[i]});
                };
            }

            return data;
        },

        setSort: function(sort){
            this._sort = sort;
        },

        _setSwitcherText: function(e){
            if(e.type == 'click'){
                this._dropdown.getPopup().delMod('visible');
                var menu_val = this._dropdown_menu.getVal();
                var switcher_text = menu_val.length ? 'Способ покупки (' + menu_val.length + ')' : 'Способ покупки';
                this._dropdown_switcher.setText(switcher_text);
            }
        },

        _onFilterChanged: function(e) {
            this._showAll = false;
            this.loadData();
        }
        
    }));
});
