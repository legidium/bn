({
	block: 'page',
	title : 'Регистрация частника',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_registration_step3.css' },
        { block: 'i-jquery', elem: 'core' }
    ],
    scripts: [{ elem : 'js', url : '_registration_step3.js' }],
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
								mods: { 'registration-stat': 'step3' },
								content: [
									{
										tag: 'p',
										content: 'Поздравляем! Ваш адрес ivanivanov@gmail.com подтвержден. Теперь вы можете пользоваться всеми возможностями сайта.'
									}
								]	
							},
							{
								elem: 'bottom',
								content: [
									{
										block: 'button',
							            tag: 'a',
							            cls: 'pull_left',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm' },
							            text: 'На главную'
									},
									{
										block: 'button',
							            tag: 'a',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Перейти в личный кабинет'
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