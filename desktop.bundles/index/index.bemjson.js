({
    block : 'page',
    title : 'Главная страница',
    favicon : '/favicon.ico',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_index.css' }
    ],
    scripts: [{ elem : 'js', url : '_index.js' }],
    content : {
        block: 'layout',
        content: [
        {
            block : 'header',
        },
        {
            block: 'search_filter',
            js: { url: '/desktop.bundles/search/search.html' },
            mods: {main_page: true},
            h1: 'Полная база недвижимости Санкт-Петербурга'
        },
        {
            block: 'content_layout',
            content: [
                 {
                    block: 'main_scope',
                    content: [
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'image',
                                    url: '/img/main/1.png',
                                    width: 300,
                                    height: 150
                                },
                                {
                                    elem: 'item_text',
                                    content: 'Все жилые комплексы Петербурга<br>и Ленинградской области'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'image',
                                    url: '/img/main/2.png',
                                    width: 300,
                                    height: 150
                                },
                                {
                                    elem: 'item_text',
                                    content: 'Поиск на карте<br>квартир и жилых комплексов'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'image',
                                    url: '/img/main/3.png',
                                    width: 300,
                                    height: 150
                                },
                                {
                                    elem: 'item_text',
                                    content: 'Тысячи статей и советов<br>о покупке и продаже'
                                }
                            ]
                        },
                        {
                            elem: 'with',
                            content: [
                                {
                                    elem: 'h',
                                    content: 'а также'
                                },
                                {
                                    elem: 'li',
                                    content: '– заметки к объявлениям и персональные списки'
                                },
                                {
                                    elem: 'li',
                                    content: '– гибкое управление своими объявлениями'
                                },
                                {
                                    elem: 'li',
                                    content: '– множество возможностей выделения'
                                },
                                {
                                    elem: 'li',
                                    content: '– статистика просмотров'
                                },
                                {
                                    elem: 'li',
                                    content: '– сохраненные поиски'
                                },
                                {
                                    elem: 'li',
                                    content: '– подписки на новые объявления'
                                },
                                {
                                    elem: 'li',
                                    content: '– специальный кабинет для агентов и агентств'
                                },
                            ]
                        }
                    ]
                },
                {
                    block: 'main_buy_and_more',
                    content: [
                        {
                            elem: 'row',
                            content: [
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            elem: 'h',
                                            content: 'Купить'
                                        },
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Комнаты'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Однокомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Двухкомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Трехкомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '113'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Многокомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '1 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            elem: 'h',
                                            content: 'В новостройках'
                                        },
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Однокомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Двухкомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Трехкомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '113'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Многокомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '1 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Со свободной планировкой'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '456'
                                                            }
                                                        ]
                                                    }
                                                },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            elem: 'h',
                                            content: 'Снять'
                                        },
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Комнаты'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Двухкомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Трехкомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '113'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Многокомнатные квартиры'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '1 543'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Со свободной планировкой'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '456'
                                                            }
                                                        ]
                                                    }
                                                },
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            elem: 'buttons',
                                            content: [
                                                {
                                                    block: 'button',
                                                    mods: { theme: 'islands', size: 'm', action: 'subprimary' },
                                                    text: 'Продать'
                                                },
                                                {
                                                    block: 'button',
                                                    mods: { theme: 'islands', size: 'm', action: 'subprimary'  },
                                                    text: 'Сдать'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'help',
                                            mods: { font: '13' },
                                            content: 'Квартиру, комнату, дом, участок, коммерческую недвижимость'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            elem: 'row',
                            content: [
                                {
                                    elem: 'item',
                                    content: [
                                        {
                                            block: 'adv',
                                            width: 240,
                                            height: 80,
                                            margin: '0 0 10px 0',
                                            image: '/img/main/lc1.png'
                                        },
                                        {
                                            block: 'plain_text',
                                            content: 'Квартиры с балконом до 3 млн. рублей в Приморском районе'
                                        },
                                        {
                                            block: 'help',
                                            mods: { font: '13' },
                                            content: '2 291 объявление'
                                        }
                                    ]
                                },
                                {
                                    elem: 'item',
                                    content: [
                                        {
                                            block: 'adv',
                                            width: 240,
                                            height: 80,
                                            margin: '0 0 10px 0',
                                            image: '/img/main/lc2.png'
                                        },
                                        {
                                            block: 'plain_text',
                                            content: 'Однокмнатные квартиры с панорамными окнами на Петроградке'
                                        },
                                        {
                                            block: 'help',
                                            mods: { font: '13' },
                                            content: '691 объявление'
                                        }
                                    ]
                                },
                                {
                                    elem: 'item',
                                    content: [
                                        {
                                            block: 'adv',
                                            width: 240,
                                            height: 80,
                                            margin: '0 0 10px 0',
                                            image: '/img/main/lc3.png'
                                        },
                                        {
                                            block: 'plain_text',
                                            content: 'Многокомнатные квартиры класса люкс в Коломягах от 12 млн'
                                        },
                                        {
                                            block: 'help',
                                            mods: { font: '13' },
                                            content: '441 объявление'
                                        }
                                    ]
                                },
                                {
                                    elem: 'item',
                                    content: [
                                        {
                                            block: 'adv',
                                            width: 240,
                                            height: 80,
                                            margin: '0 0 10px 0',
                                            image: '/img/main/lc4.png'
                                        },
                                        {
                                            block: 'plain_text',
                                            content: 'Бюджетные квартиры класса люкс в пределах КАДа от 12 млн'
                                        },
                                        {
                                            block: 'help',
                                            mods: { font: '13' },
                                            content: '441 объявление'
                                        }
                                    ]
                                },
                                {
                                    elem: 'item',
                                    content: [
                                        {
                                            block: 'adv',
                                            width: 240,
                                            height: 80,
                                            margin: '0 0 10px 0',
                                            image: '/img/main/lc5.png'
                                        },
                                        {
                                            block: 'plain_text',
                                            content: 'Таунхаусы в пределах КАДа от 12 млн'
                                        },
                                        {
                                            block: 'help',
                                            mods: { font: '13' },
                                            content: '441 объявление'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    block: 'main_news_and_more',
                    content: [
                        {
                            elem: 'video_wrapper',
                            content: [
                                {
                                    elem: 'h',
                                    content: 'Полезные видео'
                                },
                                {
                                    elem: 'video_item',
                                    content: [
                                        {
                                            elem: 'video',
                                            content: [
                                                {
                                                    elem: 'icon'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'plain_text',
                                            mods: { size: '11' },
                                            content: 'Юг Фрунзенского района: экологическая обстановка'
                                        }
                                    ]
                                },
                                {
                                    elem: 'video_item',
                                    content: [
                                        {
                                            elem: 'video',
                                            content: [
                                                {
                                                    elem: 'icon'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'plain_text',
                                            mods: { size: '11' },
                                            content: 'Юг Фрунзенского района: экологическая обстановка'
                                        }
                                    ]
                                },
                                {
                                    elem: 'video_item',
                                    content: [
                                        {
                                            elem: 'video',
                                            content: [
                                                {
                                                    elem: 'icon'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'plain_text',
                                            mods: { size: '11' },
                                            content: 'Юг Фрунзенского района: экологическая обстановка'
                                        }
                                    ]
                                },
                                {
                                    elem: 'video_item',
                                    content: [
                                        {
                                            elem: 'video',
                                            content: [
                                                {
                                                    elem: 'icon'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'plain_text',
                                            mods: { size: '11' },
                                            content: 'Юг Фрунзенского района: экологическая обстановка'
                                        }
                                    ]
                                },
                                {
                                    elem: 'video_item',
                                    content: [
                                        {
                                            elem: 'video',
                                            content: [
                                                {
                                                    elem: 'icon'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'plain_text',
                                            mods: { size: '11' },
                                            content: 'Юг Фрунзенского района: экологическая обстановка'
                                        }
                                    ]
                                },
                                {
                                    elem: 'video_item',
                                    content: [
                                        {
                                            elem: 'video',
                                            content: [
                                                {
                                                    elem: 'icon'
                                                }
                                            ]
                                        },
                                        {
                                            block: 'plain_text',
                                            mods: { size: '11' },
                                            content: 'Юг Фрунзенского района: экологическая обстановка'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            elem: 'districts_wrapper',
                            content: [
                                {
                                    elem: 'h',
                                    content: 'ВСЕ ПРО РАЙОНЫ'
                                },
                                {
                                    block: 'links_list',
                                    mods: { forn: '13' },
                                    tag: 'ul',
                                    content: [
                                        {
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Адмиралтейский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Васильевский остров'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Гражданка'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Калининский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Колпино'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Красносельский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Кноштадт'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Курортный'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Купчино'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Московский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Невский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Петроградский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Петродворец'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Приморский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Пушкин'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Фрунзенский'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Центральный'
                                            }
                                        },
                                    ]
                                }
                            ]
                        },
                        {
                            elem: 'districts_wrapper',
                            mods: { houses: true },
                            content: [
                                {
                                    elem: 'h',
                                    content: 'ТИПЫ ДОМОВ'
                                },
                                {
                                    block: 'links_list',
                                    mods: { forn: '13' },
                                    tag: 'ul',
                                    content: [
                                        {
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Новый дом'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Хрущевка'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Сталинка'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Монолит'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Кирпич'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Панельный'
                                            }
                                        },
                                    ]
                                }
                            ]
                        },
                        {
                            elem: 'news_wrapper',
                            content: [
                                {
                                    elem: 'h',
                                    content: 'Статьи'
                                },
                                {
                                    block: 'links_list',
                                    mods: { forn: '13', marbot: true },
                                    tag: 'ul',
                                    content: [
                                        {
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Рынок жилья Петербурга. Цены 5 – 11 июня'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Обновленный Генплан: каким инвестпроектам повезло'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Динамика активности спроса на первичном рынке жилья СПб'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Чем сложнее рынок, тем выше спрос на профессионалов'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Первичка в августе: застройщики притормозили'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'На рынке недвижимости останутся быстрые и умные'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Жилье для молодежи: по новым правилам'
                                            }
                                        },
                                    ]
                                }
                            ]
                        },
                        {
                            elem: 'news_wrapper',
                            mods: {last: true},
                            content: [
                                {
                                    elem: 'h',
                                    content: [
                                        {
                                            tag: 'span',
                                            content: 'Новости'
                                        }, 
                                        {
                                            elem: 'help',
                                            tag: 'span',
                                            content: '4 сентября'
                                        }
                                    ]
                                },
                                {
                                    block: 'links_list',
                                    mods: { forn: '13', marbot: true },
                                    tag: 'ul',
                                    content: [
                                        {
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'На строительство двух крупных инфраструктурных проектов в Петербурге подана 21 заявка'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Мнение: Льготная ипотека не влияет на рост доли госбанков на ипотечном рынке'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: '«Метрострой» подписал госконтракт на строительство Лахтинско-Правобережной линии метро'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Для достройки объектов ГК «Город» продадут 20 тыс. кв. м недвижимости'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Долевое строительство в России отменять не будут'
                                            }
                                        },{
                                            elem: 'item',
                                            tag: 'li',
                                            content: {
                                                elem: 'link',
                                                tag: 'a',
                                                attrs: { href: '/' },
                                                content: 'Комитет по строительству Петербурга обновил реестр обманутых дольщиков'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            block: 'clearfix'
                        },
                        {
                            elem: 'market',
                            content: [
                                {
                                    elem: 'market_item',
                                    content: [
                                        {
                                            elem: 'market_item_img',
                                            content: {
                                                block: 'icon',
                                                mods: { action: 'white_bricks' }
                                            }
                                        },
                                        {
                                            elem: 'market_item_text',
                                            content: 'Типы домов: в каком доме покупать квартиру. Какие тонкости нужно знать.'
                                        }
                                    ]
                                },
                                {
                                    elem: 'market_item',
                                    content: [
                                        {
                                            elem: 'market_item_img',
                                            content: {
                                                block: 'icon',
                                                mods: { action: 'white_valik' }
                                            }
                                        },
                                        {
                                            elem: 'market_item_text',
                                            content: 'Какой делать ремонт перед продажей квартиры. И делать ли.'
                                        }
                                    ]
                                },
                                {
                                    elem: 'market_item',
                                    content: [
                                        {
                                            elem: 'market_item_img',
                                            content: {
                                                block: 'icon',
                                                mods: { action: 'white_user_plus' }
                                            }
                                        },
                                        {
                                            elem: 'market_item_text',
                                            content: 'Как продать квартиру с прописанным несовершеннолетним'
                                        }
                                    ]
                                },
                                {
                                    elem: 'market_item',
                                    content: [
                                        {
                                            elem: 'market_item_img',
                                            content: {
                                                block: 'icon',
                                                mods: { action: 'white_bricks' }
                                            }
                                        },
                                        {
                                            elem: 'market_item_text',
                                            content: 'Прием-передача квартиры: пять советов'
                                        }
                                    ]
                                },
                                {
                                    elem: 'market_item_link',
                                    tag: 'a',
                                    attrs: { href: '/' },
                                    content: 'Все советы'
                                }
                            ]
                        },
                        {
                            elem: 'more',
                            content: [
                                {
                                    elem: 'h',
                                    attrs: { style: 'margin: 0 20px 0 0; display: inline-block;' },
                                    content: 'Новости БН'
                                },
                                {
                                    block: 'plain_text',
                                    attrs: { style: 'display: inline-block; margin-right: 10px;' },
                                    content: 'Бюллетень Недвижимости запускает мобильное приложение для iOS и Android'
                                },
                                {
                                    block: 'help',
                                    attrs: { style: 'display: inline-block;' },
                                    mods: { font: '13' },
                                    content: '1 декабря'
                                }
                            ]
                        }
                    ]
                },
                {
                    block: 'main_adv_list',
                    content: [
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b1.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'ЖК Новогорелово от застройщика'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b2.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'Квартира в Токсово с камином и гаражом  '
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b3.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'Новый ЖК у ст. м. «Парнас». Дешево'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b4.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'ЖК Новогорелово от застройщика'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b5.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'Лучшее предложение для молодой семьи. Ипотека'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b6.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'Открыты продажи в III очереди! от 58000р/м2'
                                }
                            ]
                        },
                        {
                            elem: 'item',
                            content: [
                                {
                                    block: 'adv',
                                    width: 150,
                                    height: 100,
                                    image: '/img/main/b7.png'
                                },
                                {
                                    elem: 'text',
                                    content: 'ЖК «Оранжерейка» в 15 минутах от метро. Скидка! '
                                }
                            ]
                        }
                    ]
                },
                {
                    block: 'main_enter',
                    content: [
                        {
                            elem: 'heart',
                            content: {
                                block: 'icon',
                                mods: { action: 'heart' }
                            }
                        },
                        {
                            elem: 'text',
                            content: {
                                block: 'plain_text',
                                content: 'Личные заметки к объявлениям, персональные списки и многое другое доступно пользователям БН'
                            }
                        },
                        {
                            elem: 'buttons',
                            content: [
                                {
                                    block: 'button',
                                    mods: { theme: 'islands', size: 'm', type: 'link', action: 'primary' },
                                    text: 'Войти'
                                },
                                {
                                    block: 'button',
                                    mods: { theme: 'islands', size: 'm', type: 'link' },
                                    text: 'Зарегистрироваться'
                                }
                            ]
                        }
                    ]
                },
                {
                    block: 'main_regions',
                    content: [
                        {
                            elem: 'h',
                            content: 'БН в регионах'
                        },
                        {
                            elem: 'row',
                            content: [
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Москва'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Московская область'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Сочи'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Краснодар'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Екатеринбург'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Калининград'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Воронеж'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Самара'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: [
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Ростов-на-Дону'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Мурманск'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    mods: {
                                        before_last: true
                                    },
                                    content: [
                                        {
                                            block: 'links_list',
                                            mods: { forn: '13' },
                                            tag: 'ul',
                                            content: [
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Новосибирск'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '23 345'
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    elem: 'item',
                                                    tag: 'li',
                                                    content: {
                                                        elem: 'link',
                                                        tag: 'a',
                                                        attrs: { href: '/' },
                                                        content: [
                                                            {
                                                                tag: 'span',
                                                                elem: 'label',
                                                                content: 'Иркутск'
                                                            },
                                                            {
                                                                tag: 'span',
                                                                block: 'help',
                                                                mods: {font: '13'},
                                                                content: '11 543'
                                                            }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    elem: 'col',
                                    content: {
                                        tag: 'a',
                                        elem: 'all',
                                        attrs: { href: '/' },
                                        content: 'Все регионы'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            block : 'footer'
        }
    ]
    }
})
