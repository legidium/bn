({
	block: 'page',
	title : 'Восстановление пароля: Email',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_password-recovery_step2.css' }
    ],
    scripts: [{ elem : 'js', url : '_password-recovery_step2.js' }],
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
						elem: 'top',
						content: [
							{
								block: 'button',
					            tag: 'a',
					            attrs: { href: '#' },
					            cls: 'pull_left',
					            mods : { theme : 'islands', size : 'm' },
					            text: 'Вернуться'
							},
							{
								elem: 'title',
								content: 'Восстановления пароля'
							},
							{
								elem: 'title-desc',
								content: '&nbsp;'
							}
						]
					},
					{
						elem: 'body',
						content: [
							{
								elem: 'block',
								cls: 'middle-block',
								content: {
									tag: 'p',
									content: [
										'На ваш e-mail ',
										{
											tag: 'span',
											cls: 'text-italic',
											content: 'konstantinopolsky@gmail.com'
										},
										' мы отправили электронное письмо с&nbsp;инструкциями по восстановлению пароля.'
									]
								}	
							},
							{
								elem: 'bottom',
								content: [
									{
										elem: 'link',
										mods: {first: true},
                                        tag: 'a',
                                        attrs: { href: '#' },
							            cls: 'pull_left',
                                        content: 'Войти на БН'
									},
									{
										block: 'button',
							            js: false,
							            tag: 'a',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Перейти в Gmail'
									},
									{
										block: 'button',
							            js: false,
							            tag: 'a',
							            attrs: { href: '#' },
							            cls: 'pull_right',
							            mods : { theme : 'islands', size : 'm' },
							            text: 'Регистрация',
							            icon: {
									        block : 'icon',
									        mods : { action : 'key' }
									    }
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