({
	block: 'page',
	title : 'Регистрация частника',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_registration_agency_step2.css' },
        { block: 'i-jquery', elem: 'core' }
    ],
    scripts: [{ elem : 'js', url : '_registration_agency_step2.js' }],
	content: {
		block: 'layout',
		content: [
			{ 
				block: 'header',
				mods: { 'not-authorized': true }
			},
			{
				block: 'auth',
				content: [
					{
						elem: 'ban',
						content: [
							{
								elem: 'text',
								tag: 'p',
								content: 'Фоновое промо-изображение с преимуществами регистрации'
							}
						]
					},
					{
						elem: 'body',
						content: [
							{
								elem: 'block',
								cls: 'middle-block',
								mods: { 'registration-stat': 'step2' },
								content: [
									{
										elem: 'title',
										tag: 'p',
										content: 'Благодарим за обращение!'
									},
									{
										tag: 'p',
										content: 'Будем рады сотрудничеству и свяжемся с вами в ближайшее рабочее время. Мы работаем с понедельника по пятницу с 09:00 до 19:00.'
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