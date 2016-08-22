({
	block: 'page',
	title : 'Вход',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_auth-enter.css' }
    ],
    scripts: [{ elem : 'js', url : '_auth-enter.js' }],
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
					            js: false,
					            tag: 'a',
					            attrs: { href: '#' },
					            cls: 'pull_left',
					            mods : { theme : 'islands', size : 'm' },
					            text: 'Вернуться'
							},
							{
								elem: 'title',
								content: 'Вход на БН'
							},
							{
								elem: 'title-desc',
								content: 'уже зарегистрированного пользователя'
							},
							{
								block: 'button',
					            js: false,
					            tag: 'a',
					            cls: 'pull_right',
					            attrs: { href: '#' },
					            mods : { theme : 'islands', grey: 'light', size : 'm' },
					            text: 'Регистрация',
					            icon: {
							        block : 'icon',
							        mods : { action : 'key' }
							    }
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
														content: 'E-Mail'
													},
													{
														elem: 'field',
														content: [
															{
							                                    block : 'input',
							                                    mods : { theme : 'islands', size : 'l',  nocorners: true }
							                                }
														]
													}
												]
											},
											{
												elem: 'form-line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Пароль'
													},
													{
														elem: 'field',
														content: [
															{
							                                    block : 'password-input'
							                                }
														]
													}
												]
											},
										]
									},
									{
										elem: 'footer',
										content: [
											{
												tag: 'p',
												cls: 'social-buttons-title',
												content: 'Или войдите с помощью аккаунта в социальной сети'
											},
											{ block: 'social-buttons' }
										]
									}
								]	
							},
							,
							{
								elem: 'bottom',
								content: [
									{
										elem: 'link',
										mods: {first: true},
                                        tag: 'a',
                                        attrs: { href: '#' },
							            cls: 'pull_left',
                                        content: 'Забыли пароль?'
									},
									{
										block: 'button',
							            js: false,
							            tag: 'a',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Войти на БН'
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