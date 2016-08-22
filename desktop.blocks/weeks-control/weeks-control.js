modules.define(
    'weeks-control',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._hidden = this.elem('hidden');
				this._minus = this.findBlocksInside('button')[0];
				this._plus = this.findBlocksInside('button')[1];

				this._val = new Number($(this._hidden).val());
				this._text = this.findBlockInside('control-group').elem('text');

				this._minus.on('click', this._onMinus, this);
				this._plus.on('click', this._onPlus, this);

				this._setDisabled();

			}
		}
	},

	_onMinus: function(){
		this._val -= 1;
		this._setContent(this._val);
		this._applyVal();
		this._setDisabled();
	},


	_onPlus: function(){
		this._val += 1;
		this._setContent(this._val);
		this._applyVal();
		this._setDisabled();
	},


	_applyVal: function(){
		$(this._hidden).val(this._val);
	},


	_setContent: function(val){
		$(this._text).html(val + ' ' + this.declOfNum(val, ['неделя', 'недели', 'недель']));
	},


	_setDisabled: function(){

		if(this._val < 2){
			this._minus.setMod('disabled');
		} else {
			this._minus.delMod('disabled');
		}

	},


	declOfNum: function(number, titles) {  
	    cases = [2, 0, 1, 1, 1, 2];  
	    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
	}

}




));



});