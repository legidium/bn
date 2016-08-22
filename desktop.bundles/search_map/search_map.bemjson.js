//noinspection BadExpressionStatementJS
({
	block: 'page',
	title : 'Поисковая выдача на карте',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_search_map.css' }
    ],
    scripts: [{ elem : 'js', url : '_search_map.js' }],
	content: {
		block: 'layout',
		content: [
			{
				block: 'header'
			},
			{
				block: 'content_layout',
				content: [
					{
						block: 'search_header',
						content: [
							{
								block: 'headgroup',
								content: [
									{
										elem: 'first',
										content: 'Купить однокомнатную, двухкомнатную, многокомнатную квартиру в Санкт-Петербурге'
									},
									{
										elem: 'second',
										content: 'От 2 500 000 до 23 000 000 Р, вторичка, новостройка, Адмиралтейский, Калининский, жилай площадь от 32, не первый, не последний этаж, в доме до 9 этажей, за 2 недели.'
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
											text: 'Изменить параметры поиска'
										}
									},
									{
										elem: 'col',
										content: {
											block: 'button',
											mods : { theme : 'islands', size : 'm'},
											text: 'Сохранить поиск'
										}
									},
									{
										elem: 'col',
										content: {
											block: 'dropdown',
											mods : { theme : 'islands', size : 'm'},
											switcher : {
								            	block: 'button',
								            	mods : { theme : 'islands', size : 'm'},
								            	text: 'Мои сохраненные поиски'
								            },
											popup: {
										    	block: 'menu',
										    	mods : { theme : 'islands', size : 'm' },
										    	content : [
											        {
											            block : 'menu-item',
											            content : {
											            	block: 'link',
											            	tag: 'a',
											            	attrs: {href: '/'},
											            	content: 'Мои объявление'
											            }
											        },
											        {
											            block : 'menu-item',
											            content : {
											            	block: 'link',
											            	tag: 'a',
											            	attrs: {href: '/'},
											            	content: 'Мои поиски'
											            }
											        },
											        {
											            block : 'menu-item',
											            content : {
											            	block: 'link',
											            	tag: 'a',
											            	attrs: {href: '/'},
											            	content: 'Мои подписки'
											            }
											        },
											        {
											            block : 'menu-item',
											            content : {
											            	block: 'link',
											            	tag: 'a',
											            	attrs: {href: '/'},
											            	content: 'Профиль'
											            }
											        },
											        {
											            block : 'menu-item',
											            content : {
											            	block: 'link',
											            	tag: 'a',
											            	attrs: {href: '/'},
											            	content: 'Настройки'
											            }
											        },
											        {
											        	 elem : 'group',
											        	 mods: {gray: true},
											        	 content:  {
											            	block : 'menu-item',
												            content : {
												            	block: 'link',
												            	tag: 'a',
												            	attrs: {href: '/'},
												            	content: 'Выход'
												            }
											            }
											        }
											    ]
										    }
										}
									},
									{
										elem: 'col',
										content: {
											block: 'button',
											mods : { theme : 'islands', size : 'm'},
											text: 'Подписаться на новые обновления',
								            icon: {
										        block : 'icon',
										        mods : { action : 'mail' }
										    }
										}
									},
									{
										elem: 'col',
										mods: {right: true},
										content: {
											block: 'button',
											mods : { theme : 'islands', size : 'm'},
											text: 'Показать таблицей'
										}
									}
								]
							}
						]
					},
					{
						block: 'search_map',
                        js: {url: '/desktop.blocks/search_map/test.json'}
                        // items: [
                            // {
                            //     address_text: 'Шпалерная 51',
                            //     address_help: 'Бизнесцентр Таврический',
                            //     object_text: 'офис',
                            //     object_help: '',
                            //     s_text: '56,7',
                            //     s_help: '',
                            //     floor_text: '5/7',
                            //     floor_help: '',
                            //     san_text: 'P',
                            //     san_help: '',
                            //     home_text: 'CФЛ',
                            //     home_help: '',
                            //     price_text: '19 000',
                            //     price_help: '',
                            //     seller_text: 'Айдем',
                            //     seller_help: '1 июня',
                            //     phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                            //     comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                            // },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_voprosique: '?',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия',
                        //         tools_star_accept: true
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_voprosique: '?',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия',
                        //         tools_comments_accept: true
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_voprosique: '?',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_voprosique: '?',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_voprosique: '?',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     },
                        //     {
                        //         address_text: 'Шпалерная 51',
                        //         address_help: 'Бизнесцентр Таврический',
                        //         object_text: 'офис',
                        //         object_help: '',
                        //         s_text: '56,7',
                        //         s_help: '',
                        //         floor_text: '5/7',
                        //         floor_help: '',
                        //         san_text: 'P',
                        //         san_help: '',
                        //         home_text: 'CФЛ',
                        //         home_voprosique: '?',
                        //         home_help: '',
                        //         price_text: '19 000',
                        //         price_help: '',
                        //         seller_text: 'Айдем',
                        //         seller_help: '1 июня',
                        //         phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
                        //         comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
                        //     }
                        // ]
					}
				]
			},
			{
				block: 'footer'
			}
		]
	}
})
