({
	block: 'page',
	title: 'Страница объекта',
	head : [
		{ elem : 'meta', attrs : { name : 'description', content : '' } },
		{ elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
		{ elem : 'css', url : '_realty_page.css' }
	],
	scripts: [{ elem : 'js', url : '_realty_page.js' }],
	content: {
		block: 'layout',
		content: [
			{
				block: 'header'
			},
			{
				block: 'return_to_search',
				buttons: [ 'Результаты поиска', 'Новый поиск' ]
			},
			{
				block: 'content_layout',
				content: [
					{
						elem: 'left',
						content: [
							{
								block: 'titles',
								type: '2-комнатная квартира',
								address: 'ул. Егорова д. 16',
								area: '63',
								note: 'ЖК «Ласточкино гнездо», м. Ломоносовская, 27 мин. на транспорте',
								tradeType: 'Продажа'
							},
							{
								block: 'tools',
								js: { 
									favorite_url:    '/desktop.blocks/user_lists_in_search/test.json',
									new_list_url:    '/desktop.blocks/user_lists_in_search/add_test.json',
									add_to_list_url: '/desktop.blocks/user_lists_in_search/test.json',
									comment_url:     '/desktop.blocks/user_lists_in_search/test.json',
									item_id: 1, 
									lists: [
										{"id": 100, "name": "Cписок 1", "count": 1},
										{"id": 10, "name": "Cписок 2", "count": 1},
										{"id": 1, "name": "Cписок 3", "count": 1},
									],
									in_lists: [1]
								},
								isAuthorized:     true,
								addedToFavorites: false,
								addedToLists:     false,
								addedNote:        true,
								note: 'тут заметка'
							},
							{
								block: 'retail-data',
								vot: 'ojoj',
								objects: [
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img1.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large1.jpg'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img2.jpg',
										largeImageUrl: '',
										youtubeID: 'XZmGGAbHqa0'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img3.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large3.jpg'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img4.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large4.jpg'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img5.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large5.jpg'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img6.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large6.jpg'
									}
								],
								plans: [
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img7.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large7.jpg'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img8.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large8.jpg'
									},
									{
										imageUrl: '/desktop.bundles/realty_page/temp-images/img9.jpg',
										largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large9.jpg'
									}
								],
								items: [
									{
										address_text: 'Шпалерная 51',
										address_help: 'Бизнесцентр Таврический',
										object_text: 'офис',
										object_help: '',
										s_text: '56,7',
										s_help: '',
										floor_text: '5/7',
										floor_help: '',
										san_text: 'P',
										san_help: '',
										home_text: 'CФЛ',
										home_help: '',
										price_text: '19 000',
										price_help: '',
										seller_text: 'Айдем',
										seller_help: '1 июня',
										phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
										comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
									},
									{
										address_text: 'Шпалерная 51',
										address_help: 'Бизнесцентр Таврический',
										object_text: 'офис',
										object_help: '',
										s_text: '56,7',
										s_help: '',
										floor_text: '5/7',
										floor_help: '',
										san_text: 'P',
										san_help: '',
										home_text: 'CФЛ',
										home_help: '',
										price_text: '19 000',
										price_help: '',
										seller_text: 'Айдем',
										seller_help: '1 июня',
										phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
										comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
									},
									{
										address_text: 'Шпалерная 51',
										address_help: 'Бизнесцентр Таврический',
										object_text: 'офис',
										object_help: '',
										s_text: '56,7',
										s_help: '',
										floor_text: '5/7',
										floor_help: '',
										san_text: 'P',
										san_help: '',
										home_text: 'CФЛ',
										home_help: '',
										price_text: '19 000',
										price_help: '',
										seller_text: 'Айдем',
										seller_help: '1 июня',
										phones: ['8 (123) 987-78-12', '8 (123) 987-78-12'],
										comment: 'вход со двора, окна во двор, ремонт произведен, телефон есть, гор.вода теплоцентр, заст.лоджия'
									}
								],
								parameters: [
									{ title: 'Количество комнат', value: 2 },
									{ title: 'S, общая', value: '63 м²' },
									{ title: 'S, жилая', value: '42 м²' },
									{ title: 'S, комнат', value: '23 + 19 м²' },
									{ title: 'S, кухни', value: '9 м²' },
									{ title: 'S, комнат', value: '42 м²' },
									{ title: 'Этаж', value: '4 из 5' },
									{ title: 'Тип дома', value: 'старый фонд' },
									{ title: 'Санузел', value: 'раздельный' },
									{ title: 'Балкон', value: 'есть' },
									{ title: 'Пол', value: 'линолеум' },
									{ title: 'Ремонт', value: 'обычный' },
									{ title: 'Вид из окон', value: 'во двор и на улицу' },
									{ separator: true },
									{ title: 'Высота потолков', value: '2,65м' },
									{ title: 'Лифт', value: 'нет' },
									{ title: 'Мусоропровод', value: 'нет' },
									{ title: 'Парковка', value: 'есть' },
									{ title: 'Закрытая территория', value: '' },
									{ separator: true },
									{ title: 'Мебель в квартире', value: '' },
									{ title: 'Мебель на кухне', value: 'есть' },
									{ title: 'Интернет', value: 'есть' },
									{ title: 'Телефон', value: 'нет' },
									{ title: 'Кондиционер', value: '' }
								],
								description: 'Квартира в новостройке. Квартира в жилом комплексе "Ласточкино гнездо", который расположен в 15 минутах езды от четырех станций метро : Ломоносовская, Пролетарская, Елизаровская, Улица Дыбенко. На территории комплекса паркинг, несколько школ и детских садов, спортивный комплекс, места для прогулок с детьми. Из окон верхних этажей открывается вид на Неву. Большой выбор планировок. Действуют программы рассрочки и ипотека. Звоните!',
								address: 'Октябрьская набережная, 118 (63 м²) м. Ломоносовская, 27 мин. на транспорте'
							},
							{
								block: 'page-interaction'
							},
							{
								block: 'adv',
								width: 730,
								height: 90,
								margin: '30px auto 20px'
							},
							{
								block: 'similar_realties',
								js: { cur_id: 1, url: '/desktop.blocks/similar_realties/test_result.json' }
							}
						]
					},
					{
						elem: 'right',
						content: [
							{
								block: 'seller-info',
								content: [
									{
										block: 'nod-right',
										content: [
											{
												elem: 'price',
												content: '3 740 000 ₽'
											},
											{
												elem: 'desc',
												content: '72 621 ₽ за м²'
											},
											{
												elem: 'text',
												content: 'Ипотека возможна, торг возможен'
											}
										]
									},
									{
										block: 'nod-right',
										content: [
											{
												block: 'link',
												mix: { block: 'nod-right', elem: 'title' },
												url: 'http://bn.ru/1',
												content: 'Матрикс Недвижимость'
											},
											{
												elem: 'desc',
												content: 'Агентство'
											},
											{
												elem: 'phone',
												content: [
													{
														elem: 'phone-item',
														content: [
															'+7 812 385-20-77',
															{
														        block : 'icon',
														        mods : { action : 'viber' }
														    }
														]
													},
													{
														elem: 'phone-item',
														content: [
															'+7 921 313-09-74',
															{
																block : 'icon',
														        mods : { action : 'whats-app' }
															},
															{
														        block : 'icon',
														        mods : { action : 'viber' }
														    }
														]
													}
												]
											},
											{
												elem: 'text',
												content: [
													'Можно связаться с помощью',
													{
												        block : 'icon',
												        mods : { action : 'skype' }
												    }
												]
											},
											{
												block: 'dropdown',
												mods: {
													switcher: 'button',
													theme: 'islands',
													size: 'm'
												},
												switcher: {
													block: 'button',
													mix: {
														block: 'seller_contacts',
														elem: 'subscribe'
													},
													mods : { theme : 'islands', size : 'm'},
													text: 'Написать продавцу'
												},
												popup: {
													block: 'feedback_popup',
													tag: 'form',
													apartment: '2-комнатная квартира: ул. Егорова д. 16 (63 м2)',
													mods: {
														theme: 'islands',
														target: 'anchor'
													},
													mainOffset: 100
												}
											}
										]
									},
									{
										block: 'nod-right',
										content: [
											{
												block: 'nod-table',
												mods: { size: 'm' },
												options: [
													{ name: 'Опубликовано', text: '15 июня' },
													{ name: 'Просмотрено',  text: '716 раз' }
												]
											},
											{
												elem: 'housing-complex',
												content: [
													{
														block: 'link',
														mix: { block: 'nod-right', elem: 'title' },
														url: 'http://bn.ru/1',
														content: 'ЖК «Ласточкино гнездо»'
													},
													{
														elem: 'desc',
														content: 'ЛенСпецСМУ'
													},
													{
														block: 'link',
														attrs: { href: '#' },
														content: {
															block: 'image',
															url: '../../img/housing-complex.jpg'
														}
													}
												]
											},
											{
												block: 'nod-table',
												mods: { size: 'm' },
												options: [
													{ name: 'Класс', text: 'Эконом' },
													{ name: 'Корпусов',  text: 5 },
													{ name: 'Квартиры',  text: 'студии, 1 – 4 к.кв. от 36 м² до 124 м²' },
													{ name: 'В продаже',  text: '372 предложения' }
												]
											}
										]
									}
								]
							},
							{
								block: 'nod-right',
								content: {
									block: 'bmedia',
									href: '#',
									url: '../../img/b_250x250.jpg'
								}
							},
							{
								block: 'right-news',
								mods: { view: 'line' },
								items: [
									{
										url: '../../img/image-1.png',
										href: '#',
										text: 'Плюсы и минусы домов СФК. На что обращать внимание при покупке.'
									},
									{
										url: '../../img/image-2.png',
										href: '#',
										text: 'Экологическая ситуация на Васильевском острове.'
									},
									{
										url: '../../img/image-3.png',
										href: '#',
										text: 'Что такое встречка. Успешные истории.'
									}
								]
							},
							{
								block: 'right-news',
								mods: { view: 'half' },
								items: [
									{
										url: '../../img/image-4.png',
										href: '#',
										text: 'Осмотр старого фонда центра Васильевского острова (май 2015)',
										mods: { video: true }
									},
									{
										url: '../../img/image-4.png',
										href: '#',
										text: 'Диалог с властью о застройке Васильевского',
										mods: { video: true }
									}
								]
							},
							{
								block: 'bmedia',
								mods: { 'right': true },
								href: '#',
								url: '../../img/b_250x250.jpg'
							},
							{
								block: 'right-news',
								mods: { view: 'full' },
								items: [
									{
										url: '../../img/image-5.png',
										href: '#',
										text: 'Квартиры с балконом до 3 млн. рублей на Васильевском острове',
										desc: '2 291 объявление'
									},
									{
										url: '../../img/image-5.png',
										href: '#',
										text: '2-комнатные квартиры в центре Васильевского в новостройках',
										desc: '1 147 объявлений'
									}
								]
							},
							{
								block: 'right-news',
								mods: { view: 'half' },
								items: [
									{
										url: '../../img/image-6.png',
										href: '#',
										text: 'Квартира с видом на Неву! 7-я линия, 51 м2, высокие потолки, с мебелью, 7 500 000 ₽'
									},
									{
										url: '../../img/image-6.png',
										href: '#',
										text: 'Видовая квартира на Среднем проспекте! Окна в пол, новый ремонт, 12 млн. ₽'
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
