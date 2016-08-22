({
	block: 'page',
	title : 'Подача объявления',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_feed-ad_options.css' }
    ],
    scripts: [{ elem : 'js', url : '_feed-ad_options.js' }],
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
						mods: {first: true, options: true },
						content: [
							{
								block: 'button',
								cls: 'pull_left',
					            mods : { theme : 'islands', size : 'm' },
					            text: 'Вернуться'
							},
							{
								elem: 'title',
								content: 'Укажите тип объекта и адрес'
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										block: 'weeks-control',
										val: 1,
										name: 'weeks'
									},
									{
									    block : 'radio-group',
									    mods : { theme : 'islands', size : 'l' },
									    name : 'radio-line',
									    val : 2,
									    options : [
									        { val : 1, text : 'Опубликовать сразу после поступления оплаты' },
									        {
									        	val : 2,
									        	text : [
													'Опубликовать в конкретную дату',
													{
														block: 'datepicker'
													}
									        	]
									        }
									    ]
									},
									{
										block: 'ad-place-variable'
									}
								]
							}
						]
					},
					{
						block: 'feed-ad',
						mods: { options: true },
						content: [
							{
								elem: 'title',
								content: 'Выберите способ оплаты'
							},
							{
								elem: 'content',
								cls: 'middle-block',
								content: [
									{
										block : 'checkbox',
									    mods : { theme : 'islands', size : 'm' },
									    name: 'name1',
									    val : 'val_1',
									    text : 'Списать с моего баланса (120 ₽)'
									},
									{
									    block: 'payment-method',
									    options: [
									    	{
									    		icon: 'card',
									    		text: 'Банковской картой',
									    		desc: '0-1 день, 2% комиссии'
									    	},
									    	{
									    		icon: 'sms',
									    		text: 'СМС-платеж',
									    		desc: '0-1 день, без комиссии'
									    	},
									    	{
									    		icon: 'sber-online',
									    		text: 'Сбербанк-онлайн',
									    		desc: '0-1 день, 4% комиссии'
									    	},
									    	{
									    		icon: 'qiwi',
									    		text: 'Терминал Qiwi',
									    		desc: '0-1 день, 2% комиссии'
									    	},
									    	{
									    		icon: 'con-office',
									    		text: 'В отделениях Связного',
									    		desc: '0-1 день, 2% комиссии'
									    	},
									    	{
									    		icon: 'sber',
									    		text: 'В отделениях Сбербанка',
									    		desc: '2-5 дней, 4% комиссии'
									    	}
									    ]
									},
									{
									    block : 'dropdown',
									    mods : { switcher : 'link', theme : 'islands', size : 'm', 'another-methods': true },
									    switcher : {
									        block : 'link',
									        mods : { theme : 'islands', size : 'm', font: '11'},
									        content:[
									        	{
													tag: 'span',
													content: 'Другие способы оплаты'
												},
									        	{
													elem: 'tick',
													mix: {block: 'icon'}
												}
									        ]
									    },
									    popup : {
									    	
									    }
									},
									{
										elem: 'total-price',
										content: 'Итого, к оплате 250 ₽'
									},
									{
										elem: 'total-price-desc',
										content: 'с учетом комиссии'
									}
								]
							}
						]
					},
					{
						block: 'feed-ad',
						mods: { last: true },
						content: {
							block: 'button',
				            mods : { theme : 'islands', size : 'xl', gray: true },
				            text: 'Оплатить'
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