({
	block: 'page',
	title : 'Регистрация частника',
	head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_registration.css' },
        { block: 'i-jquery', elem: 'core' }
    ],
    scripts: [{ elem : 'js', url : '_registration.js' }],
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
										content: 'Зарегистрируйтесь на БН'
									},
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
							                			block: 'auth-form',
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
																		tag: 'label',
																		content: 'Придумайте пароль'
																	},
																	{
																		elem: 'field',
																		content: {
											                                block : 'password-input'
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
																			block: 'multi-phones',
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
							                		},
													{
														cls: 'auth__footer',
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
							                	title: 'Агент',
							                	content: [
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
																		content: 'Имя Фамилия'
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
																		tag: 'label',
																		content: 'Придумайте пароль'
																	},
																	{
																		elem: 'field',
																		content: {
											                                block : 'password-input'
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
													},
													{
														cls: 'auth__footer',
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
							                	title: 'Агентство',
							                	content: [
							                		{
							                			tag: 'p',
							                			elem: 'reg-text',
							                			content: 'Для того, чтобы зарегистрировать агентство на сайте bn.ru, пожалуйста, подайте заявку, и наши менеджеры свяжутся с вами для уточнения деталей и завершения процесса регистрации агентства.'
							                		},
							                		{
							                			block: 'auth-form',
														content: [
															{
																elem: 'form-line',
																content: [
																	{
																		elem: 'label',
																		tag: 'label',
																		content: 'Название агентства'
																	},
																	{
																		elem: 'field',
																		content: {
										                                    block : 'input',
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
																		tag: 'label',
																		content: 'Контактное лицо'
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
																		content: [
																			{
																				elem: 'phone-line',
																				content: [
																					{
													                                    block : 'input',
													                                    js: true,
										                                    			cls: 'input_w170',
							                                    						mix: { block: 'maskedinput', js: true, mods: { pattern: 'phone' } },
													                                    mods : { theme : 'islands', size : 'l',  nocorners: true },
													                                    placeholder: 'обязательное поле',
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
							            text: 'Зарегистрироваться'
									},
									{
										block: 'button',
							            js: false,
							            tag: 'a',
							            attrs: { href: '#' },
							            cls: 'pull_right',
							            mods : { theme : 'islands', size : 'm' },
							           	text: 'Войти на БН',
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