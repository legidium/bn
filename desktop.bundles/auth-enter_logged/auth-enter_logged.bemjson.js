({
	block: 'page',
	title : 'Вход выполнен',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_auth-enter_logged.css' }
    ],
    scripts: [{ elem : 'js', url : '_auth-enter_logged.js' }],
	content: {
		block: 'layout',
		content: [
			{ 
				block: 'header'
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
								content: 'Контактная информация'
							},
							{
								elem: 'title-desc',
								content: 'автора объявления'
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
														content: 'Имя Фамилия'
													},
													{
														elem: 'field',
														content: {
						                                    block : 'input',
						                                    mods : { theme : 'islands', size : 'l',  nocorners: true },
						                                    val: 'Григорий Менделеев',
						                                    placeholder : 'обязательное поле'
							                            }
													}
												]
											},
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
														content: {
						                                    block : 'input',
						                                    mods : { theme : 'islands', size : 'l',  nocorners: true },
						                                    placeholder : 'grigory@mendeleev.o2'
						                                }
													}
												]
											},
											{
												elem: 'form-line',
												content: [
													{
														elem: 'label',
														cls: 'vertical-top',
														tag: 'label',
														content: 'Телефон'
													},
													{
														elem: 'field',
														content: {
															block: 'multi-phones'
														}
													}
												]
											},
											{
												elem: 'form-line',
												content: [
													{
														elem: 'label',
														tag: 'label',
														content: 'Skype'
													},
													{
														elem: 'field',
														content: {
						                                    block : 'input',
						                                    mods : { theme : 'islands', size : 'l',  nocorners: true }
						                                }
													}
												]
											}
										]
									}
								]	
							},
							{
								elem: 'bottom',
								content: [
									{
										block: 'button',
							            js: false,
							            tag: 'a',
							            attrs: { href: '#' },
							            mods : { theme : 'islands', size : 'm', gray: true },
							            text: 'Продолжить'
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