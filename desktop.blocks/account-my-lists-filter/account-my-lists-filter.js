modules.define(
    'account-my-lists-filter',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        'js': {
            'inited': function() {
                console.log('account-my-lists-filter:inited');

                this._parent = null;
                this._submitted = false;
                this._action = this.findBlockOn(this.elem('action'), 'radio-group');
                this._target = this.findBlockOn(this.elem('target'), 'radio-group');
                this._search = this.findBlockOn(this.elem('search-input'), 'input');
                this._searchSubmit = this.findBlockOn(this.elem('search-submit'), 'button');

                this.bindTo('submit', this._onFormSubmit);
                this._action && this._action.on('change', this._onActionChange, this);
                this._target && this._target.on('change', this._onTargetChange, this);

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

    _onActionChange: function() {
        console.log('action changed');
        this.update();
        this._submit();
    },

    _onTargetChange: function() {
        this.update();
        this._submit();
    },

    _onSearchKeypress: function(e) {
        if (e.type == 'keypress' && e.keyCode  == 13) {
            e.preventDefault();
            this._submit();
        }
    },

    _onSearchSubmitEvents: function(e) {
        e.preventDefault();
        this._submit();
    },

    _updateFilters: function() {
        var action = this._action && this._action.getVal();
        var target = this._target && this._target.getVal();

        action == 'any'
            ? this._disableTarget()
            : this._enableTarget();
    },

    _enableTarget: function() {
        this._target && this._target.delMod('disabled');
    },

    _disableTarget: function() {
        this._target && this._target.setMod('disabled');
    }
}

));

});