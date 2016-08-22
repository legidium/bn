modules.define('account-favorites-list-pager', ['i-bem__dom', 'jquery', 'BEMHTML', 'account-favorites-list-item'], function(provide, BEMDOM, $, BEMHTML, Item) {

provide(BEMDOM.decl(this.name, {
    onSetMod: {
        js: {
            inited: function() {
				var that = this;
				
				this.button = $('#load-more-favs-button').bem('button');
				
				this.on('ajax_start', function(){
					that.button.setMod('disabled');
				});

				this.on('ajax_end', function(){
					that.button.delMod('disabled');
				});
            }
        }
    },

    _sendRequest: function() {
		this.emit('ajax_start');
		
        $.ajax({
            type: 'GET',
            dataType: 'json',
            cache: false,
            url: this.params.url,
            data: '',
            success: this._onSuccess.bind(this),
            error: function(err){
                console.log(err);
            }
        });
    },

    _onSuccess: function(data) {
		this.emit('ajax_end');
        this._data = data;
		this.emit('data_loaded');
    },
	
	getData: function(){
		return this._data;
	}
}));

});