({
	block: 'page',
	title : 'Регистрация частника',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_registration_agent_step2.css' },
        { block: 'i-jquery', elem: 'core' }
    ],
    scripts: [{ elem : 'js', url : '_registration_agent_step2.js' }],
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
										content: 'Иван Иванов, благодарим за регистрацию!'
									},
									{
										tag: 'p',
										content: 'После получения подтверждения от агентства «Двадцать первый век» вы сможете пользоваться всеми преимуществами личного кабинета агента. Пока агентство не подтвердило, что вы работаете у них, вы можете публиковать объявления от физического лица.'
									},
									{
										block: 'button',
							            tag: 'a',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Перейти в Gmail'
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