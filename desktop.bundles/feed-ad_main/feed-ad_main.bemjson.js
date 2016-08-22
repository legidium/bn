({
	block: 'page',
	title : 'Подача объявления',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_feed-ad_main.css' }
    ],
    scripts: [{ elem : 'js', url : '_feed-ad_main.js' }],
	content: {
		block: 'layout',
		content: [
			{ 
				block: 'header'
			},
			{
				block: 'content-wrapper',
				content: {
					block: 'feed-main',
					content: [
						{
							elem: 'top',
							cls: 'text-center',
							content: [
								{
									elem: 'title',
									tag: 'h1',
									content: 'Подать объявление в Бюллетень Недвижимости — это быстро и удобно'
								},
								{
									elem: 'text',
									content:'Заполните необходимые поля и ваше объявление появится в списке выдачи.<br>Обратите внимание, что если объявление будет нарушать правила публикации объявлений<br>на сайте bn.ru, оно может быть удалено.'
								},
								{
									elem: 'buttons',
									content: [
										{
											block: 'button',
								            mods : { theme : 'islands', size : 'm', gray: true },
								            text: 'От частного лица'
										},
										{
											block: 'button',
								            mods : { theme : 'islands', size : 'm', gray: true },
								            text: 'От агента или агентства'
										},
										{
											block: 'link',
								            content: 'Загрузить из XML'
										},
									]
								}
							]
						},
						{
							elem: 'middle',
							cls: 'clearfix',
							content: [
								{
									cls: 'col-4',
									content: [
										{
											elem: 'middle-title',
											content: 'Частным лицам'
										},
										{
											elem: 'middle-text',
											content: 'Частные лица имеют возможность подавать до 10 объявлений. Стоимость подачи объявлений определяется тарифами сайта bn.ru. Если вы сомневаетесь, по какой цене выставить объект, обратитесь в раздел Услуги, для оценки вашей недвижимости.'
										}
									]
								},
								{
									cls: 'col-4',
									content: [
										{
											elem: 'middle-title',
											content: 'Агентам и агентствам'
										},
										{
											elem: 'middle-text',
											content: 'Агенты и агентства могут подавать неограниченное число объявлений в рамках тарифов. Авторизованные агенты могут собирать произвольные списки объектов и отправлять их клиентам без некоторых полей в таблице.'
										}
									]
								},
								{
									cls: 'col-4',
									content: [
										{
											elem: 'middle-title',
											content: 'Застройщикам и брокерам'
										},
										{
											elem: 'middle-text',
											content: 'Если вы девелопер или представляете интересы застройщика относительно продаж объектов в строящемся или готовом доме, то вы можете подать объявление и привязать его к объекту новостройки.'
										}
									]
								}
							]
						},
						{
							elem: 'bottom',
							content: {
								block: 'image',
								url: '/img/descr-prices-and-rates.jpg',
								alt: ''
							}
						}
					]
				}
			},
			{
				block: 'footer'
			}
		]
	}
})