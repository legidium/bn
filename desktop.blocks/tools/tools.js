modules.define(
	'tools',
	['i-bem__dom', 'jquery'],
	function(provide, BEMDOM, $) {

		var inputHeight = 0;
		var startScrollHeight = 0;

		provide(BEMDOM.decl(this.name, {

				onSetMod: {
					'js' : {
						'inited' : function(){

							this._buttonFavorite = this.findElem('tools_item', 'first', true);
							this._buttonInList   = this.findElem('tools_item', 'first', true);
							this._buttonNote     = this.findElem('tools_item', 'third', true);
							this._input          = this.findElem('input-for-note');
							this._saveButton     = this.findBlockInside('note-button', 'button');

							this._note = this._input.val();
							
							var that = this;
							this.bindTo(this._buttonFavorite, 'click', this._onToggleFavorite, this);
							this.bindTo(this._buttonNote, 'click', this._onToggleNote, this);

							this.bindTo(this.findElem('input-for-note'), 'keyup', this._setTextareaHeight, this);
							this._saveButton &&	this._saveButton.on('click', this._saveNote, this);
							
							if (this._input) {
								inputHeight = this._input.height();
								this._input.css({ height: 'auto' });
								startScrollHeight = $(this._input).find('textarea').scrollHeight;
							}

							this._input.hide();
							this._saveButton && this._saveButton.domElem.hide();

							this._updateState();
						}
					},
					'edit': {
						'true': function() {
							this._input.show();
							this._saveButton && this._saveButton.domElem.show();
						},
						'': function() {
							this._input.hide();
							this._saveButton && this._saveButton.domElem.hide();
						}
					}
				},

				_onToggleFavorite: function(e) {
					var toolsItem = $(e.currentTarget);

					e.stopPropagation();

					if (toolsItem.hasClass('tools__tools_item_accept')){
						toolsItem.removeClass('tools__tools_item_accept');
						toolsItem.find('.icon')
							.removeClass('icon_action_star')
							.addClass('icon_action_star-o');
					} else {
						toolsItem.addClass('tools__tools_item_accept');
						toolsItem.find('.icon')
							.addClass('icon_action_star')
							.removeClass('icon_action_star-o');
					}

					var that = this;
					var url = this.params.favorite_url;

					if (url) {
						$.get(url, {item_id: that.params.item_id}, function(data){
							console.log(that.params.item_id);
						});
					}
				},

				_onToggleNote: function(e) {
					this.toggleMod('edit')
				},

				_setTextareaHeight: function(e) {
					var textarea = $(e.currentTarget);
					var scrollHeight = null;

					textarea.css('height', 'auto');
					scrollHeight = textarea[0].scrollHeight;

					if (scrollHeight === startScrollHeight) {
						scrollHeight = inputHeight;
					}

					textarea.css('height', scrollHeight);

					this._newNotes();
				},

				_saveNote: function() {
					var url = this.params.comment_url;
					var val = $(this._input).val();
					var that = this;

					if(url){
						// поменять на post и поменять адрес
						$.get(url, {comment: val, item_id: this.params.item_id}, function(data){
							console.log(that.params.item_id);
							that._saveButton.setMod('saved', true).findElem('text').text('Сохранено');
							that._updateState();
						});
					}
				},

				_newNotes: function()
				{
					this._saveButton.delMod('saved').findElem('text').text('Сохранить');
				},

				_updateState: function() {
					var val = $(this._input).val();
					this._setNoteState(val && val.length);
				},

				_setNoteState: function(hasNote) {
					if (hasNote) {
						this._buttonNote.addClass('tools__tools_item_accept');
						this._buttonNote.find('.icon')
							.addClass('icon_action_comments-blue')
							.removeClass('icon_action_comments');
					} else {
						this._buttonNote.removeClass('tools__tools_item_accept');
						this._buttonNote.find('.icon')
							.addClass('icon_action_comments')
							.removeClass('icon_action_comments-blue');
					}
				}
			}

		));

	});