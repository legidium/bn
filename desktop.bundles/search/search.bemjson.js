({
	block: 'page',
	title : 'Поисковая выдача',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_search.css' }
    ],
    scripts: [{ elem : 'js', url : '_search.js' }],
	content: {
		block: 'layout',
		content: [
			{ 
				block: 'header'
			},
			{
				block: 'search_filter',
				js: { url: '/desktop.blocks/search_filter/test_result.json' },
				mix: {block: 'search_filters_controller', js: {id: 1}},
			},
			{
				block: 'content_layout',
				content: [
					{
						elem: 'left',
						content: [
							{
								block: 'search_header',
								content: [
									{
										block: 'headgroup',
										attrs: { id: 'search_filter_headgroup' },
										content: [
											{
												elem: 'first',
												content: ''
											},
											{
												elem: 'second',
												content: ''
											}
										]
									},
									{
										block: 'controls_row',
										content: [
											{
												elem: 'col',
												content: {
													block: 'help',
													content: 'Чтобы сохранять свои поиски, войдите на БН'
												}
											},
											{
												elem: 'col',
												content: {
													block: 'button',
													mods : { theme : 'islands', size : 'm', gray: true},
													text: 'Войти'
												}
											},
											{
												elem: 'col',
												content: {
													block: 'button',
													mods : { theme : 'islands', size : 'm'},
													text: 'Зарегистрироваться'
												}
											},
											{
												elem: 'col',
												content: [
													{
													    block : 'dropdown',
													    mods : { switcher : 'button', theme : 'islands', size : 'm' },
													    switcher : {
													        block: 'button',
															mods : { theme : 'islands', size : 'm', wide: true, submit: true },
															text: 'Подписаться на новые обновления',
												            icon: {
														        block : 'icon',
														        mods : { action : 'mail' }
														    }
													    },
													    popup : {
													    	block: 'email_subscribe'
													    }
													},
												]
											}
										]
									},
									{
										block: 'controls_row',
										content: [
											{
												elem: 'col',
												content: {
													block: 'button',
													mods : { theme : 'islands', size : 'm'},
													text: 'Сохранить поиски'
												}
											},
											{
												elem: 'col',
												content: [
													{
													    block : 'dropdown',
													    mods : { switcher : 'button', theme : 'islands', size : 'm' },
													    switcher : {
													        block : 'button',
													        mods : { theme : 'islands', size : 'm', font: '11'},
													        content:[
													        	{
													        		elem: 'text',
													        		attrs: {style: 'margin-right: 0;'},
													        		content: [
													        			{
																			tag: 'span',
																			content: 'Мои сохраненные поиски'
																		},
															        	{
																			elem: 'tick',
																			attrs: { style: 'vertical-align: inherit' },
																			mix: { block: 'icon' }
																		}
													        		]
													        	}
													        ]
													    },
													    popup : {
													    	block: 'my_saved_searches'
													    }
													},
												]
											},
											{
												elem: 'col',
												content: [
													{
													    block : 'dropdown',
													    mods : { switcher : 'button', theme : 'islands', size : 'm' },
													    switcher : {
													        block: 'button',
															mods : { theme : 'islands', size : 'm', wide: true, submit: true },
															text: 'Подписаться на новые обновления',
												            icon: {
														        block : 'icon',
														        mods : { action : 'mail' }
														    }
													    },
													    popup : {
													    	block: 'email_subscribe'
													    }
													},
												]
											}
										]
									},
								]
							},
							{
								block: 'search_sorts',
								content: [
									{
										elem: 'pull_left',
										content: [
											{
												elem: 'label',
												content: 'Сортировать&nbsp;'
											},
											{
												block: 'select',
												attrs: { id: 'search_filter_sorts' },
												mods : { mode : 'radio', theme : 'islands', size : 'm', liketext: true },
												mix: {block: 'search_filters_controller', js: {id: 1}},
											    val : 'price_desc',
											    options : [
											        { val : 'price_asc', text : 'по цене от наименьшей' },
											        { val : 'price_desc', text : 'по цене от наибольшей' },
											        { val : 'address_asc', text : 'по адресу' },
											        { val : 'area_asc', text : 'по площади от наименьшей' },
											        { val : 'area_desc', text : 'по площади от наибольшей' },
											        { val : 'publish_desc', text : 'по дате добавления' },
											    ]
											}
										]
									},
									{
										elem: 'pull_right',
										content: [
											{
											    block : 'dropdown',
											    mods : { switcher : 'link', theme : 'islands', size : 'm' },
											    switcher : {
											        block : 'link',
											        mods : { theme : 'islands', size : 'm', font: '11'},
											        content:[
											        	{
															tag: 'span',
															content: 'Отправить'
														},
											        	{
															elem: 'tick',
															mix: {block: 'icon'}
														}
											        ]
											    },
											    popup : {
											    	block: 'send_search_results'
											    }
											},
											{
											    block : 'dropdown',
											    attrs: { style: 'margin-left: 20px;' },
											    mods : { switcher : 'button', theme : 'islands', size : 'm' },
											    switcher : {
											        block : 'link',
											        mods : { theme : 'islands', size : 'm', font: '11'},
											        content:[
											        	{
															tag: 'span',
															content: 'Распечатать'
														},
											        	{
															elem: 'tick',
															mix: {block: 'icon'}
														}
											        ]
											    },
											    popup : {
											    	block: 'menu',
											    	mods : { theme : 'islands', size : 'm' },
												    content : [
												        {
												            block : 'menu-item',
												            val : 1,
												            content : [
												            	{
												            		tag: 'span',
												            		content: 'объекты этой страницы&nbsp'
												            	},
												            	{
												            		block: 'help',
												            		tag: 'span',
												            		content: '27'
												            	}
												            ]
												        },
												        {
												            block : 'menu-item',
												            val : 2,
												            content : [
												            	{
												            		tag: 'span',
												            		content: 'результаты всего поиска&nbsp'
												            	},
												            	{
												            		block: 'help',
												            		tag: 'span',
												            		content: '1427'
												            	}
												            ]
												        }
												    ]
											    }
											}
										]
									}
								]

							},

							{
								block: 'search_results',
								js: { 
									favorite_url: '/desktop.blocks/user_lists_in_search/test.json',
									new_list_url: '/desktop.blocks/user_lists_in_search/add_test.json',
									add_to_list_url: '/desktop.blocks/user_lists_in_search/test.json',
									comment_url: '/desktop.blocks/user_lists_in_search/test.json',
								},
								mix: {block: 'search_filters_controller', js: {id: 1}},
								items: []
							},
							{
								block: 'search_footer'
							}
						]
					},
					{
						elem: 'right',
						content: {
                            block: 'new-buildings-sidebar'
                        }
					}
				]
			},
			{
				block: 'footer'
			}
		]
	}
})