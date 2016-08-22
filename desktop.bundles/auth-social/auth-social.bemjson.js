({
	block: 'page',
	title : 'Регистрация частника',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_auth-social.css' },
        { block: 'i-jquery', elem: 'core' }
    ],
    scripts: [{ elem : 'js', url : '_auth-social.js' }],
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
								content: 'Вход через Вконтакте'
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
										block : 'tabs',
										cls: 'registration-block',
							            mods : { theme : 'islands', type : 'button', size : 'm' },
							            val: 1,
							            tabs : [
							                {
							                	title: 'Частное лицо',
							                	content: [
							                		{
							                			block: 'social-info',
							                			social_icon: 'vk',
							                			name: 'Константин Константинопольский',
							                			email: 'konstantinopolsky@gmail.com'
							                		},
							                		{
							                			cls: 'auth-socail__small-title',
							                			content: 'Пожалуйста, заполните недостающие данные'
							                		},
							                		{
														block: 'auth-form',
														content: [
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
							                	title: 'Агент',
							                	content: [
							                		{
							                			block: 'social-info',
							                			social_icon: 'vk',
							                			name: 'Константин Константинопольский',
							                			email: 'konstantinopolsky@gmail.com'
							                		},
							                		{
							                			cls: 'auth-socail__small-title',
							                			content: 'Пожалуйста, заполните недостающие данные'
							                		},
							                		{
														block: 'auth-form',
														content: [
															{
																elem: 'form-line',
																content: [
																	{
																		elem: 'label',
																		cls: 'vertical-top',
																		tag: 'label',
																		content: 'Выберите агентство'
																	},
																	{
																		elem: 'field',
																		content: [
																			{
																				block: 'select',
																				mods: { mode : 'radio-check', theme : 'islands', size : 'm' },
																			    name: 'select1',
																			    text: 'Укажите агентство, в котором вы работаете',
																			    options : [
																			        { val : 1, text : 'Агентство 1' },
																			        { val : 2, text : 'Агентство 2' },
																			        { val : 3, text : 'Агентство 3' }
																			    ]
																			},
																			{
																				elem: 'field-desc',
																				content: 'Риэлтор без привязки к агентству может подавать объявления только как частное лицо и по тарифам для частных лиц'
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
																		content: 'Email'
																	},
																	{
																		elem: 'field',
																		content: {
										                                    block : 'input',
										                                    placeholder : 'обязательное поле',
										                                    mods : { theme : 'islands', size : 'l',  nocorners: true }
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
							                }
							           	]
						            }
								]	
							},
							{
								elem: 'bottom',
								content: [
									{
										block: 'checkbox',
										mods : { theme : 'islands', size : 'm' },
							            cls: 'pull_left checkbox_terms-of-use',
                                        text: [
                                        	'Подтверждаю согласие<br>с',
                                        	{
                                        		block: 'link',
                                        		attrs: { href: '#'},
                                        		content: 'условиями использования'
                                        	}
                                        ]
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