({
	block: 'page',
	title : 'Восстановление пароля: Email',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_password-recovery_step3.css' }
    ],
    scripts: [{ elem : 'js', url : '_password-recovery_step3.js' }],
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
								content: [
									{
										elem: 'form',
										content: [
											{
												elem: 'form-line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														mods: { 'password-recovery': true },
														content: 'Придумайте новый пароль'
													},
													{
														elem: 'field',
														content: {
							                                block : 'password-input'
							                            }
													}
												]
											}
										]
									},
									{
										cls: 'password-recovery_description',
										content: [
											'Если вы вспомнили свой прежний пароль и&nbsp;восстановление не&nbsp;требуется, то&nbsp;просто ',
											{
												block: 'link',
												attrs: { href: '#' },
												content: 'войдите на&nbsp;BN'
											},
											', и&nbsp;пароль не&nbsp;будет сброшен.'
										]
									}
								]	
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
							            text: 'Продолжить'
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