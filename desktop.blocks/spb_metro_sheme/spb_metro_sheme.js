modules.define(
    'spb_metro_sheme',
    ['i-bem__dom', 'jquery'],
    function(provide, BEMDOM, $) {





provide(BEMDOM.decl(this.name, {

	onSetMod: {
		'js' : {
			'inited' : function(){

				this._vals = [];

				this._svg = $(this.findElem('sheme_svg')).get(0);
				this.bindToDomElem($(this._svg), 'load', this._onSvgLoad);

			}
		}
	},


	getVals: function(){
		return this._vals;
	},


	getValsIds: function(){
		var ids = [];
		this._vals.map(function(i){
			ids.push(Number(i.id));
		});
		return ids;
	},


	clear: function(){
		var svg = this._svg.getSVGDocument();

		var wrapper   = svg.getElementById('transform-wrapper');

		this._vals = [];

		$(wrapper).find('.checkbox').each(function(){
			$(this).remove();
		});
	},


	removeItem: function(index){
		var svg = this._svg.getSVGDocument();
		var cur_check = svg.getElementById('checkbox' + index);
		$(cur_check).remove();
	},


	_onSvgLoad: function(e){
		var svg = this._svg.getSVGDocument();

		var wrapper   = svg.getElementById('transform-wrapper');
		var labels    = svg.getElementById('scheme-layer-labels');
		var stations  = svg.getElementById('scheme-layer-stations');
		var checkbox  = svg.getElementById('checkbox');

		var circles = $(stations).find('circle');
		var that = this;

		$(labels).find('g').each(function(index){

			$(this).hover(function(){

				$(this).css('cursor', 'pointer');
				$(this).find('text').attr('fill', '#999');

			}, function(){

				$(this).find('text').attr('fill', '');

			})

			.click(function(){
				var x = parseInt($(circles[index]).attr('cx'));
				var y = parseInt($(circles[index]).attr('cy'));

				var cur_check = svg.getElementById('checkbox' + index);
				var id = $(this).attr('data-id');
				var text = $(this).find('text').text();

				if(cur_check){
					$(cur_check).remove();
					that._setVals(false, id, index, text);
				} else {
					var clone = $(checkbox).clone()
								.attr('transform', 'translate('+ (x - 9) +','+ (y - 9) +'),scale(0.4 0.4)')
								.attr('opacity', '1')
								.attr('data-text', text)
								.attr('data-id', id)
								.attr('data-index', index)
								.attr('id', 'checkbox' + index);

					$(wrapper).append(clone);
					that._setVals(true, id, index, text);
				}

				
			});



		});

			

	},



	_setVals: function(is_adding, id, index, text){
		var svg = this._svg.getSVGDocument();

		var wrapper   = svg.getElementById('transform-wrapper');

		this._vals = [];

		var that = this;

		$(wrapper).find('.checkbox').each(function(){
			that._vals.push({
				id: $(this).attr('data-id'),
				index: $(this).attr('data-index'),
				text: $(this).attr('data-text')
			});
		});

		this.emit('change', {
			is_adding: is_adding, 
			id: id,
			index: index,
			text: text
		});
	}




}




));



});