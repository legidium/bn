({
	block: 'page',
	title : 'Войти на BN',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_auth-reg.css' }
    ],
    scripts: [{ elem : 'js', url : '_auth-reg.js' }],
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
								content: [
									{
										elem: 'title',
										tag: 'p',
										content: 'Войдите на БН'
									},
									{
										elem: 'form',
										content: [
											{
												elem: 'form-line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Email'
													},
													{
														elem: 'field',
														content: [
															{
							                                    block : 'input',
							                                    val: 'konstantinopolsky@gmail.com',
							                                    mods : { theme : 'islands', size : 'l',  nocorners: true, wrong: true }
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
														content: {
							                                block : 'password-input'
							                            }
													}
												]
											}
										]
									},
									{
		                                elem: 'error-message',
		                                content: 'Такой комбинации «email - пароль» не найдено. Пожалуйста, проверьте правильность написания или введите другие данные.'
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