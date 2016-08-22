({
	block: 'page',
	title : 'Восстановление пароля: Email',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_password-recovery_step4.css' }
    ],
    scripts: [{ elem : 'js', url : '_password-recovery_step4.js' }],
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
										'Новый пароль для пользователя с e-mail ',
										{
											tag: 'span',
											cls: 'text-italic',
											content: 'konstantinopolsky@gmail.com'
										},
										' установлен.'
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
                                        content: 'На главную BN'
									},
									{
										block: 'button',
							            js: false,
							            tag: 'a',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Перейти в личный кабинет'
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