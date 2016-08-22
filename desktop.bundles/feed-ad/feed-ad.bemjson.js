({
	block: 'page',
	title : 'Подача объявления',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_feed-ad.css' }
    ],
    scripts: [{ elem : 'js', url : '_feed-ad.js' }],
	content: {
		block: 'layout',
		content: [
			{ 
				block: 'header'
			},
			{
				block: 'content-wrapper',
				mods: { dark: true },
				content: [
					{
						block: 'feed-ad',
						mods: {first: true},
						content: [
							{
								block: 'global-hint',
								attrs: {style: 'top: 200px'},
								content: [
									{
										elem: 'title',
										content: 'Подсказка или совет по ходу заполнения'
									},
									{
										elem: 'text',
										content: 'В этом блоке, например, можно разместить подсказку относительно заполнения адреса'
									},
									{
										block: 'button',
							            tag: 'a',
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Кнопка действия'
									}
								]
							},
							{
								elem: 'title',
								content: 'Укажите тип объекта и адрес'
							},
							{
								elem: 'title-desc',
								content: 'шаг 1 из 4'
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										elem: 'layout'
									},
									{
										elem: 'ad-type-switcher',
										content: [
											{
												block : 'radio-group',
					                            mods : { theme : 'islands', size : 'xl', type : 'button' },
					                            name : 'ad-variable',
					                            val: 0,
					                            options : [
					                                { val : 0, text : 'Продать'},
					                                { val : 1, text : 'Сдать' }
					                            ]
											},
											{
												block : 'radio-group',
					                            mods : { theme : 'islands', size : 'xl', type : 'button' },
					                            name : 'ad-type',
					                            val: 0,
					                            options : [
					                                { val : 0, text : 'Квартиру'},
					                                { val : 1, text : 'Комнату' }
					                            ]
											}
										]
									},
									{
										elem: 'vertical-form',
										content: [
											{
												elem: 'vertical-form__label',
												content: {
													elem: 'label',
													tag: 'label',
													content: 'Адрес'
												}
											},
											{
												elem: 'field',
												content: {
				                                    block : 'input',
													cls: 'input_full-size',
													val: 'Инженерная ул., д. 45а, г. Санкт-Петербург, Ленинградская обл.',
													placeholder: 'Город, улица, дом',
				                                    mods : { theme : 'islands', size : 'l', 'has-clear': true,  nocorners: true }
					                            }
											},
											{
												elem: 'desc',
												content: 'Если нет точного адреса, вы можете ввести «Пересечение Блюхера и Кондратьевского»'
											},
											{
												block: 'search_map',
												mods: { 'search-line-hidden': true }
											}
										]
									}
								]
							}
						]
					},
					{
						block: 'feed-ad',
						mods: { 'inactive': true },
						content: [
							{
								elem: 'title',
								content: 'Укажите параметры квартиры'
							},
							{
								elem: 'title-desc',
								content: 'шаг 2 из 4'
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										elem: 'layout'
									},
									{
										block: 'horizontal-form',
										content: [
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Комнат'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { 'with-select': true, theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-rooms',
									                            val: 0,
									                            options : [
									                                { val : 1, text : '1'},
									                                { val : 2, text : '2' },
									                                { val : 3, text : '3' }
									                            ],
															},
															{
															    block : 'select',
															    mods : { mode : 'radio', rooms: true, theme : 'islands', size : 'm' },
															    name : 'filter-rooms',
															    text: '4',
															    options : [
															        { val : 4, text : '4' },
															        { val : 5, text : '5' },
															        { val : 6, text : '6' },
															        { val : 7, text : '7' },
															        { val : 8, text : '8' },
															        { val : 9, text : '9' },
															        { val : 10, text : '10' },
															        { val : 11, text : '11' }
															    ]
															},
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-type-of-room',
									                            val: 0,
									                            options : [
									                                { val : 0, text : 'Студия'},
									                                { val : 1, text : 'Свободная планировка' }
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'vertical-top',
														content: 'Площадь'
													},
													{
														elem: 'field',
														content: [
															{
																elem: 'living-space__label',

																content: [
																	{
																		tag: 'span',
																		content: 'Общая'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															},
															{
																elem: 'living-space__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Жилая'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															},
															{
																elem: 'living-space__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Кухня'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														content: '&nbsp;'
													},
													{
														elem: 'field',
														content: [
															{
																elem: 'living-space__label',

																content: [
																	{
																		tag: 'span',
																		content: '1 комн.'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Этажность'
													},
													{
														elem: 'field',
														content: [
															{
																elem: 'floors__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Этаж'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        }
																]
															},
															{
																elem: 'floors__label',
																content: [
																	{
																		tag: 'span',
																		content: 'в доме'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        }
																]
															},
															{
																elem: 'floors__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Лифт'
																	},
																	{
																		block: 'select',
																		cls: 'width_l',
																		mods: { mode : 'radio-check', theme : 'islands', size : 'm' },
																	    name: 'select1',
																	    text: 'Лифт',
																	    options : [
																	        { val : 0, text : 'Лифт' }
																	    ]
											                        }
																]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Санузел'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-wc',
									                            options : [
									                                { val : 0, text : 'Совмещенный'},
									                                { val : 1, text : 'Раздельный' }
									                            ]
															},
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Два и более'}
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Балкон'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-wc',
									                            options : [
									                                { val : 0, text : 'Балкон'},
									                                { val : 1, text : 'Лоджия' }
									                            ]
															},
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Два или более'}
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Отделка'
													},
													{
														elem: 'field',
														content: [
															{
																block: 'select',
																cls: 'width_l',
																mods: { mode : 'radio-check', theme : 'islands', size : 'm' },
															    name: 'select1',
															    text: 'Выберите из списка',
															    options : [
															        { val : 0, text : 'Чистовая' },
															        { val : 1, text : 'Черновая' },
															        { val : 2, text : '«Под ключ»' },
															    ]
															},
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Можно заезжать сразу и жить'}
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: 'Высота потолков'
													},
													{
														elem: 'field',
														cls: 'label_ceiling-height',
														content: [
															{
																block : 'input',
						                                    	mods : { theme : 'islands', size : 'l',  nocorners: true }
															},
															{
																tag: 'span',
																content: 'м'
															}
							                            ]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Вид из окон'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-balcony',
									                            options : [
									                                { val : 0, text : 'Двор'},
									                                { val : 1, text : 'Улица'},
									                                { val : 2, text : 'Парк'},
									                                { val : 3, text : 'Вода' }
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'В квартире'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Мебель'},
									                                { val : 2, text : 'Интернет'},
									                                { val : 3, text : 'Кондиционер'},
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: [
															{
																elem: 'text',
																tag: 'p',
																content: 'Описание'
															},
															{
																elem: 'desc',
																tag: 'p',
																content: 'Не более 1000 символов'
															}
														]
													},
													{
														elem: 'field',
														content: {
															block: 'textarea',
															cls: 'textarea_xl',
															content: ''
														}
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: [
															{
																elem: 'text',
																tag: 'p',
																content: 'Краткий комментарий'
															},
															{
																elem: 'desc',
																tag: 'p',
																content: '100 символов'
															}
														]
													},
													{
														elem: 'field',
														content: {
															block: 'textarea',
															cls: 'textarea_l',
															content: ''
														}
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: [
															{
																elem: 'text',
																tag: 'p',
																content: 'Комментарий для печатной версии'
															},
															{
																elem: 'desc',
																tag: 'p',
																content: '40 символов'
															}
														]
													},
													{
														elem: 'field',
														content: {
						                                    block : 'input',
															cls: 'input_full-size',
						                                    mods : { theme : 'islands', size : 'l',  nocorners: true }
							                            }
													}
												]
											},
										]
									},
									{
										block: 'photo-upload',
										content: [
											{
			                                    elem: 'icon'
											},
											{
												elem: 'title',
												content: 'Загрузите до 9 фотографий и планировку'
											},
											{
												elem: 'buttons',
												content: [
													{
														block: 'button',
											            type: 'file',
											            mods : { theme : 'islands', size : 'm', gray: true },
											            text: 'Добавить фото'
													},
													{
														block: 'button',
											            mods : { theme : 'islands', size : 'm', gray: true },
											            text: 'Добавить планировку'
													}

												]
											}
										]
									}
								]
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										elem: 'layout'
									},
									{
										block: 'horizontal-form',
										content: [
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Комнат'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { 'with-select': true, theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-rooms',
									                            val: 0,
									                            options : [
									                                { val : 1, text : '1'},
									                                { val : 2, text : '2' },
									                                { val : 3, text : '3' }
									                            ],
															},
															{
															    block : 'select',
															    mods : { mode : 'radio', rooms: true, theme : 'islands', size : 'm' },
															    name : 'filter-rooms',
															    text: '4',
															    options : [
															        { val : 4, text : '4' },
															        { val : 5, text : '5' },
															        { val : 6, text : '6' },
															        { val : 7, text : '7' },
															        { val : 8, text : '8' },
															        { val : 9, text : '9' },
															        { val : 10, text : '10' },
															        { val : 11, text : '11' }
															    ]
															},
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-type-of-room',
									                            val: 0,
									                            options : [
									                                { val : 0, text : 'Студия'},
									                                { val : 1, text : 'Свободная планировка' }
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'vertical-top',
														content: 'Площадь'
													},
													{
														elem: 'field',
														content: [
															{
																elem: 'living-space__label',

																content: [
																	{
																		tag: 'span',
																		content: 'Общая'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															},
															{
																elem: 'living-space__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Жилая'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															},
															{
																elem: 'living-space__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Кухня'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														content: '&nbsp;'
													},
													{
														elem: 'field',
														content: [
															{
																elem: 'living-space__label',

																content: [
																	{
																		tag: 'span',
																		content: '1 комн.'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        },
											                        {
											                        	tag: 'span',
											                        	content: 'м'
											                        },
											                        {
											                        	tag: 'sup',
											                        	content: 2
											                        }
																]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Этажность'
													},
													{
														elem: 'field',
														content: [
															{
																elem: 'floors__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Этаж'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        }
																]
															},
															{
																elem: 'floors__label',
																content: [
																	{
																		tag: 'span',
																		content: 'в доме'
																	},
																	{
																		block : 'input',
										                                mods : { theme : 'islands', size : 'l',  nocorners: true }
											                        }
																]
															},
															{
																elem: 'floors__label',
																content: [
																	{
																		tag: 'span',
																		content: 'Лифт'
																	},
																	{
																		block: 'select',
																		cls: 'width_l',
																		mods: { mode : 'radio-check', theme : 'islands', size : 'm' },
																	    name: 'select1',
																	    val: 0,
																	    options : [
																	        { val : 0, text : 'Лифт' }
																	    ]
											                        }
																]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Санузел'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-wc',
									                            options : [
									                                { val : 0, text : 'Совмещенный'},
									                                { val : 1, text : 'Раздельный' }
									                            ]
															},
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Два и более'}
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Балкон'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-wc',
									                            options : [
									                                { val : 0, text : 'Балкон'},
									                                { val : 1, text : 'Лоджия' }
									                            ]
															},
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Два или более'}
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Отделка'
													},
													{
														elem: 'field',
														content: [
															{
																block: 'select',
																cls: 'width_l',
																mods: { mode : 'radio-check', theme : 'islands', size : 'm' },
															    name: 'select1',
															    text: 'Выберите из списка',
															    options : [
															        { val : 0, text : 'Чистовая' },
															        { val : 1, text : 'Черновая' },
															        { val : 2, text : '«Под ключ»' },
															    ]
															},
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Можно заезжать сразу и жить'}
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: 'Высота потолков'
													},
													{
														elem: 'field',
														cls: 'label_ceiling-height',
														content: [
															{
																block : 'input',
						                                    	mods : { theme : 'islands', size : 'l',  nocorners: true }
															},
															{
																tag: 'span',
																content: 'м'
															}
							                            ]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Вид из окон'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-balcony',
									                            options : [
									                                { val : 0, text : 'Двор'},
									                                { val : 1, text : 'Улица'},
									                                { val : 2, text : 'Парк'},
									                                { val : 3, text : 'Вода' }
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'В квартире'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Мебель'},
									                                { val : 1, text : 'Мебель на кухне'},
									                                { val : 2, text : 'Интернет'},
									                                { val : 3, text : 'Кондиционер'},
									                            ]
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: [
															{
																elem: 'text',
																tag: 'p',
																content: 'Описание'
															},
															{
																elem: 'desc',
																tag: 'p',
																content: 'Не более 1000 символов'
															}
														]
													},
													{
														elem: 'field',
														content: {
															block: 'textarea',
															cls: 'textarea_xl',
															content: ''
														}
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: [
															{
																elem: 'text',
																tag: 'p',
																content: 'Краткий комментарий'
															},
															{
																elem: 'desc',
																tag: 'p',
																content: '100 символов'
															}
														]
													},
													{
														elem: 'field',
														content: {
															block: 'textarea',
															cls: 'textarea_l',
															content: ''
														}
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'textarea-label',
														tag: 'label',
														content: [
															{
																elem: 'text',
																tag: 'p',
																content: 'Комментарий для печатной версии'
															},
															{
																elem: 'desc',
																tag: 'p',
																content: '40 символов'
															}
														]
													},
													{
														elem: 'field',
														content: {
						                                    block : 'input',
															cls: 'input_full-size',
						                                    mods : { theme : 'islands', size : 'l',  nocorners: true }
							                            }
													}
												]
											},
										]
									},
									{
										block: 'photo-upload',
										content: [
											{
			                                    elem: 'icon'
											},
											{
												elem: 'title',
												content: 'Загружено 4 из 9 фото и планировка'
											},
											{
												elem: 'layer',
												content: [
													{
														elem: 'item',
														content: [
															{
																elem: 'controls',
																content: [
																	{
																		block : 'checkbox',
											                            mods : { theme : 'islands', size : 'm', type : 'line' },
											                            name : 'checkbox',
											                            text: 'Главная'
																	},
																	{
																		block: 'button',
									                                    icon: {
									                                        block : 'icon',
									                                        mods : { action : 'close' }
									                                    }
																	}
																]
															},
															{
																elem: 'image-place'
															}
														]
													},
													{
														elem: 'item',
														content: [
															{
																elem: 'controls',
																content: [
																	{
																		block : 'checkbox',
											                            mods : { theme : 'islands', size : 'm', type : 'line' },
											                            name : 'checkbox',
											                            text: 'Главная'
																	},
																	{
																		block: 'button',
									                                    icon: {
									                                        block : 'icon',
									                                        mods : { action : 'close' }
									                                    }
																	}
																]
															},
															{
																elem: 'image-place'
															}
														]
													},
													{
														elem: 'item',
														content: [
															{
																elem: 'controls',
																content: [
																	{
																		block : 'checkbox',
											                            mods : { theme : 'islands', size : 'm', type : 'line' },
											                            name : 'checkbox',
											                            text: 'Главная'
																	},
																	{
																		block: 'button',
									                                    icon: {
									                                        block : 'icon',
									                                        mods : { action : 'close' }
									                                    }
																	}
																]
															},
															{
																elem: 'image-place'
															}
														]
													},
													{
														elem: 'item',
														content: [
															{
																elem: 'controls',
																content: [
																	{
																		block : 'checkbox',
											                            mods : { theme : 'islands', size : 'm', type : 'line' },
											                            name : 'checkbox',
											                            text: 'Главная'
																	},
																	{
																		block: 'button',
									                                    icon: {
									                                        block : 'icon',
									                                        mods : { action : 'close' }
									                                    }
																	}
																]
															},
															{
																elem: 'image-place'
															}
														]
													}
												]
											},
											{
												elem: 'layer',
												content: [
													{
														elem: 'layer__title',
														content: 'планировка'
													},
													{
														elem: 'item',
														content: [
															{
																elem: 'controls',
																content: [
																	{
																		block : 'checkbox',
											                            mods : { theme : 'islands', size : 'm', type : 'line' },
											                            name : 'checkbox',
											                            text: 'Главная'
																	},
																	{
																		block: 'button',
									                                    icon: {
									                                        block : 'icon',
									                                        mods : { action : 'close' }
									                                    }
																	}
																]
															},
															{
																elem: 'image-place'
															}
														]
													},
													{
														elem: 'item',
														content: [
															{
																elem: 'controls',
																content: [
																	{
																		block : 'checkbox',
											                            mods : { theme : 'islands', size : 'm', type : 'line' },
											                            name : 'checkbox',
											                            text: 'Главная'
																	},
																	{
																		block: 'button',
									                                    icon: {
									                                        block : 'icon',
									                                        mods : { action : 'close' }
									                                    }
																	}
																]
															},
															{
																elem: 'image-place'
															}
														]
													}
												]
											},
											{
												elem: 'buttons',
												content: [
													{
														block: 'button',
											            type: 'file',
											            mods : { theme : 'islands', size : 'm', gray: true },
											            text: 'Добавить фото'
													},
													{
														block: 'button',
											            mods : { theme : 'islands', size : 'm', gray: true },
											            text: 'Добавить планировку'
													}

												]
											}
										]
									}
								]
							}
						]
					},
					{
						block: 'feed-ad',
						//mods: { 'inactive' : true},
						content: [
							{
								block: 'button',
								cls: 'pull_left',
					            mods : { theme : 'islands', size : 'm' },
					            text: 'Изменить выбор'
							},
							{
								elem: 'title',
								content: 'Расскажите о доме'
							},
							{
								elem: 'title-desc',
								content: 'шаг 3 из 4'
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										elem: 'layout'
									},
									{
										elem: 'text',
										tag: 'p',
										content: 'Согласно введенному адресу, квартира расположена в ЖК Олимпийский резерв'
									},
									{
										elem: 'text',
										cls: 'cl_grey',
										tag: 'p',
										content: 'Зная это, мы заполним часть информации о доме из имеющейся у нас базы'
									},
									{
										elem: 'buttons',
										content: [
											{
												block: 'button',
									            mods : { theme : 'islands', size : 'm', gray: true },
									            text: 'Да, верно'
											},
											{
												block: 'link',
					                            attrs: {href: '#'},
					                            content: 'Нет, это другой дом'
											}
										]
									}
								]
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										elem: 'layout'
									},
									{
										block: 'horizontal-form',
										content: [
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Название'
													},
													{
														elem: 'field',
														content: {
						                                    block : 'input',
						                          			cls: 'input_full-size',
						                                    mods : { theme : 'islands', size : 'l', 'has-clear': true,  nocorners: true , 'disable': true},
						                                    placeholder: 'Если есть, например, Жилой дом Народный'
							                            }
													},
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Год постройки'
													},
													{
														elem: 'field',
														cls: 'field__year-of-construction',
														content: [
															{
							                                    block : 'input',
																cls: 'width_m',
							                                    mods : { theme : 'islands', size : 'l',  nocorners: true }
							                                },
						                                    {
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line', disabled : true },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Дом не сдан'}
									                            ]
															},
															{
																block: 'select',
																cls: 'width_l',
																mods: { mode : 'radio-check', theme : 'islands', size : 'm' , disable: true},
															    name: 'select1',
															    val: 0,
															    options : [
															        { val : 0, text : 'Очередь' }
															    ]
															}
							                            ]
													},
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Тип дома'
													},
													{
														elem: 'field',
														content: [
															{
																block: 'select',
																cls: 'width_l',
																mods: { mode : 'radio-check', theme : 'islands', size : 'm' },
															    name: 'select1',
															    options : [
															        { val : 0, text : 'Кирпич' },
															        { val : 1, text : 'Монолит' },
															        { val : 2, text : 'Панель' },
															    ]
															},
						                                    {
																elem : 'right-hint',
									                            content: 'Подсказки про тип дома, выводится в случае выбора того или иного пункта'
															}
							                            ]
													},
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														cls: 'vertical-top',
														tag: 'label',
														content: 'В доме'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'checkbox-group',
																cls: 'cols-2',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Организованный паркинг'},
									                                { val : 1, text : 'Закрытая территория'},
									                                { val : 2, text : 'Охрана, консьерж'},
									                                { val : 3, text : 'Детский сад в шаговой доступности'},
									                                { val : 4, text : 'Школа в шаговой доступности'},
									                                { val : 5, text : 'Фитнес-центр в шаговой доступности'}
									                            ]
															}
							                            ]
													},
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Рядом'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Парк'},
									                                { val : 1, text : 'Водоем'}
									                            ]
															}
														]
													}
												]
											}
										]
									}
								]
							}
						]
					},
					{
						block: 'feed-ad',
						mods: { 'inactive': true },
						content: [
							{
								elem: 'title',
								content: 'Стоимость и условия продажи'
							},
							{
								elem: 'title-desc',
								content: 'шаг 4 из 4'
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										elem: 'layout'
									},
									{
										block: 'horizontal-form',
										content: [
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Стоимость'
													},
													{
														elem: 'field',
					                                    content: [
					                                    	{
					                                    		block : 'control-group',
									                            content : [
									                                {
									                                    block : 'input',
									                                    val: '2 350',
									                                    mods : { theme : 'islands', size : 'l', width: 's', font: 'bold',  nocorners: true }
									                                },
									                                {
									                                    block : 'select',
									                                    mods : { mode : 'radio', theme : 'islands', size : 'l' },
									                                    val: 'usd',
									                                    options : [
									                                        { 
									                                            val : 'rub', 
									                                            text : 'тыс. <span class="currency">Р</span>'
									                                        },
									                                        { 
									                                            val : 'usd', 
									                                            text : 'тыс. $' 
									                                        },
									                                        { 
									                                            val : 'euro', 
									                                            text : 'тыс. €' 
									                                        }
									                                    ]
									                                }
									                            ]
					                                    	},
					                                    	{
					                                    		elem: 'right-hint',
					                                    		mods: { vertical: 'middle' },
					                                    		content: 'или 43 000 за м²'
					                                    	}
					                                    ]
													},
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Тип сделки'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'radio-group',
									                            mods : { theme : 'islands', size : 'l', type : 'button' },
									                            name : 'filter-balcony',
									                            options : [
									                                { val : 0, text : 'Прямая продажа'},
									                                { val : 1, text : 'Встречная продажа'}
									                            ]
															},
															{
																elem : 'right-hint',
									                            content: 'Подсказки про тип дома, выводится в случае выбора того или иного пункта'
															}
														]
													}
												]
											},
											{
												elem: 'line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Доп. условия'
													},
													{
														elem: 'field',
														content: [
															{
																block : 'checkbox-group',
									                            mods : { theme : 'islands', size : 'm', type : 'line' },
									                            name : 'checkbox',
									                            options : [
									                                { val : 0, text : 'Ипотека'},
									                                { val : 1, text : 'Рассрочка'},
									                                { val : 2, text : 'Материнский капитал'},
									                                { val : 3, text : 'Госсубсидии'},
									                            ]
															}
														]
													}
												]
											}

										]
									}
								]
							}
						]
					},
					{
						block: 'feed-ad',
						mods: { last: true, 'inactive' : true },
						content: [
							{
								block: 'button',
					            mods : { theme : 'islands', size : 'm', gray: true },
					            text: 'Сохранить и продолжить'
							},
							{
								elem: 'text',
								cls: 'cl_grey',
								content: [
									{
										content: ''
										+	'Ваше объявление будет доступно для поиска сразу после поступления оплаты.<br>'
										+	'Стоимость размещения объявления варьируется от 10 ₽ до 350 ₽<br>'
										+	'в зависимости от типа размещения. Выбрать тот или иной тип вы сможете дальше.'
									}
								]
							}
						]
					}
				]
			},
			{
				block: 'footer'
			}
		]
	}
})