modules.define(
    'account-my-ads-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                console.log('account-my-ads-filter:inited');

                this._parent = null;
                this._status = this.findBlockOn(this.elem('status'), 'checkbox-group');
                this._action = this.findBlockOn(this.elem('action'), 'radio-group');
                this._target = this.findBlockOn(this.elem('target'), 'radio-group');
                this._flatTypes = this.findBlockOn(this.elem('flat-types'), 'checkbox-group');

                this._search = this.findBlockOn(this.elem('search-input'), 'input');
                this._searchSubmit = this.findBlockOn(this.elem('search-submit'), 'button');

                this.bindTo('submit', this._onFormSubmit);
                this._status && this._status.on('change', this._onStatusChange, this);
                this._action && this._action.on('change', this._onActionChange, this);
                this._target && this._target.on('change', this._onTargetChange, this);
                this._flatTypes && this._flatTypes.on('change', this._onFlatTypesChange, this);

                this._search && this.bindToDomElem(this._search.domElem, 'keypress', this._onSearchKeypress);
                this._searchSubmit && this.bindToDomElem(this._searchSubmit.domElem, 'click', this._onSearchSubmitEvents);

                this.update();
            }
        }
    },

    update: function() {
        this._updateFilters();
    },

    getData: function() {
        var data = [];

        (this._getFormData() || []).map(function(item) {
            item.value && data.push(item);
        });

        return data;
    },

    setData: function(data) {
        // TODO Реализовать возможность установки состояния фильтра
    },

    getParent: function() {
        return this._parent;
    },

    setParent: function(parent) {
        this._parent = parent;
    },

    _getFormData: function() {
        return $(this.domElem).serializeArray();
    },

    _submit: function() {
        $(this.domElem).submit();
    },

    _onFormSubmit: function(e) {
        e.preventDefault();
        this.emit('submit');
    },

    _onStatusChange: function() {
        console.log('status changed');
        this.update();
        this._submit();
    },

    _onActionChange: function() {
        console.log('action changed');
        this.update();
        this._submit();
    },

    _onTargetChange: function() {
        console.log('target changed');
        this.update();
        this._submit();
    },

    _onFlatTypesChange: function() {
        console.log('flatTypes changed');
        this.update();
        this._submit();
    },

    _onSearchKeypress: function(e) {
        if (e.type == 'keypress' && e.keyCode  == 13) {
            console.log('search submit: ');
            e.preventDefault();
            this._submit();
        }
    },

    _onSearchSubmitEvents: function(e) {
        console.log('search submit');
        e.preventDefault();
        this._submit();
    },

    _updateFilters: function() {
       
    }
}

));

});