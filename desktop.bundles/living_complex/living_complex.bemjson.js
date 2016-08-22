({
    block : 'page',
    title : 'Страница жилого комплекса',
    favicon : '/favicon.ico',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_living_complex.css' }
    ],
    scripts: [{ elem : 'js', url : '_living_complex.js' }],
    content : [
    {
        block: 'adv',
        width: 'max',
        height: 30
    },
    {
        block: 'adv',
        width: 'max',
        height: 'max',
        mods: {full: true, not_first: true}
    },
    {
        block: 'layout',
        mods: { has_full_adv: true },
            content: [
            {
                block : 'header',
            },
            {
                block: 'content_layout',
                content: [
                    {
                        elem: 'left',
                        content: [
                            {
                                block: 'headgroup',
                                mods: { living_complex: true },
                                content: [
                                    {
                                        elem: 'first',
                                        content: 'ЖК «Ласточкино гнездо, Октябрьская наб., 118'
                                    }, 
                                    {
                                        elem: 'second',
                                        content: 'м. Ломоносовская, 40 мин. на транспорте'
                                    }
                                ]
                            },
                            {
                                block: 'living_complex_tools_bar',
                                js: {
                                    favorite_url: '/desktop.blocks/user_lists_in_search/test.json',
                                    item_id: 1
                                },
                                isAuthorized:     true,
                                addedToFavorites: false
                            },
                            {
                                block: 'living_complex_data',
                                content: [
                                    {
                                        elem: 'left',
                                        content: [
                                            {
                                                elem: 'data_group',
                                                tag: 'dl',
                                                content: [
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Класс'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'эконом'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Этажей'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: '16 &mdash; 23'
                                                    },
                                                    //////////////////////////
                                                     {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Площадь квартир'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: '16 м<sup>2</sup> &mdash; 23 м<sup>2</sup>'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Количество квартир'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: '3453'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Тип дома'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'монолитно-каркасный'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Отделка'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'черновая и чистовая'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Вид из окон'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'во двор и на парк'
                                                    },
                                                    //////////////////////////
                                                ]
                                            },
                                            {
                                                elem: 'data_group',
                                                tag: 'dl',
                                                content: [
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Организованный паркинг'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'наземный и подземный'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Закрытая территория'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'да'
                                                    },
                                                    //////////////////////////
                                                     {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Охранаб консьерж'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'консьерж'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Детский сад рядом'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'есть'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Школа рядом'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: '&nbsp;'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Фитнесс-центр рядом'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: '&nbsp;'
                                                    },
                                                    //////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Водоем рядом'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'есть'
                                                    },
                                                    //////////////////////////
                                                ]
                                            },
                                            {
                                                elem: 'data_group',
                                                tag: 'dl',
                                                content: [
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: 'Схема работы'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'ДСУ (23, 456) ЕНГ'
                                                    },
                                                ]
                                            },
                                            {
                                                elem: 'data_group',
                                                tag: 'dl',
                                                content: [
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: '1 очередь'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'сдана'
                                                    },
                                                    ////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: '2 очередь'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'XY 2045'
                                                    },
                                                    ////////////////////////
                                                    ////////////////////////
                                                    {
                                                        elem: 'data_item_dt',
                                                        tag: 'dt',
                                                        content: '3 очередь'
                                                    },
                                                    {
                                                        elem: 'data_item_dd',
                                                        tag: 'dd',
                                                        content: 'XY 2545'
                                                    },
                                                    ////////////////////////
                                                ]
                                            },
                                            {
                                                elem: 'data_desc',
                                                content: [
                                                    {
                                                        tag: 'p',
                                                        content: 'Главным достоинством местоположения будущего комплекса является развитая транспортная инфраструктура: на автомобиле до центра города можно добраться за 30 минут, до ближайших станций метро - «Ломоносовская» и «Пролетарская» за 15 минут на общественном транспорте. Остановки автобусов и маршрутных такси расположены рядом с комплексом.'
                                                    },
                                                    {
                                                        tag: 'p',
                                                        content: 'Жилой комплекс «Шуваловский» будет построен в популярном у покупателей Приморском районе. Комплекс состоит из 24 жилых домов, рассчитанных на 8627 квартир. В них предусмотрено достаточное количество небольших эргономичных квартир, идеально подходящих для молодых людей, начинающих самостоятельную жизнь.'
                                                    },

                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        elem: 'right',
                                        content: [
                                            {
                                                block: 'gallery',
                                                objects: [
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img1.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large1.jpg'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img2.jpg',
                                                        largeImageUrl: '',
                                                        youtubeID: 'XZmGGAbHqa0'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img3.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large3.jpg'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img4.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large4.jpg'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img5.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large5.jpg'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img6.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large6.jpg'
                                                    }
                                                ],
                                                plans: [
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img7.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large7.jpg'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img8.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large8.jpg'
                                                    },
                                                    {
                                                        imageUrl: '/desktop.bundles/realty_page/temp-images/img9.jpg',
                                                        largeImageUrl: '/desktop.bundles/realty_page/temp-images-large/large9.jpg'
                                                    }
                                                ],
                                            },
                                            {
                                                block : 'map',
                                                attrs: { style: 'height: 220px;' },
                                                mods : { provider : 'yandex' },
                                                center : [59.938596, 30.312232],
                                                zoom : 17,
                                                disableScroll: true,
                                                clustering: true,
                                                changeSize: true,
                                                controls : [
                                                    'fullscreenControl'
                                                ],
                                                geoObjects : [
                                                    {
                                                        type : 'placemark',
                                                        coordinates : [59.938596, 30.312232],
                                                        hintContent : 'Шпалерная 51',
                                                        // objectData : items[0]
                                                    },
                                                    {
                                                        type : 'placemark',
                                                        coordinates : [59.938096, 30.312239],
                                                        hintContent : 'Плотников 51',
                                                        // objectData : items[1]
                                                    },
                                                    {
                                                        type : 'placemark',
                                                        coordinates : [59.938096, 30.312231],
                                                        hintContent : 'Кузнечная 51',
                                                        // objectData : items[2]
                                                    }
                                                ]
                                            },
                                            {
                                                elem: 'address',
                                                content: [
                                                    {
                                                        tag: 'span',
                                                        content: 'Октябрьская наб., 118'
                                                    },
                                                    {
                                                        tag: 'span',
                                                        content: 'м. Ломоносовская, 40 мин. на транспорте'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }, // data
                            {
                                block: 'search_sorts',
                                content: [
                                    {
                                        block: 'controls_row',
                                        content: [
                                            {
                                                elem: 'col',
                                                content: [
                                                    {
                                                        block: 'link',
                                                        mods : { theme : 'islands', size : 'm', font: '11'},
                                                        content: 'Сохранить как PDF'
                                                    }
                                                ]
                                            },
                                            {
                                                elem: 'col',
                                                content: [
                                                    {
                                                        block : 'dropdown',
                                                        mods : { switcher : 'link', theme : 'islands', size : 'm' },
                                                        switcher : {
                                                            block : 'link',
                                                            mods : { theme : 'islands', size : 'm', font: '11'},
                                                            content:[
                                                                {
                                                                    tag: 'span',
                                                                    content: 'Отправить'
                                                                },
                                                                {
                                                                    elem: 'tick',
                                                                    mix: {block: 'icon'}
                                                                }
                                                            ]
                                                        },
                                                        popup : {
                                                            block: 'send_search_results'
                                                        }
                                                    }
                                                ]
                                            },
                                            {
                                                elem: 'col',
                                                content: [
                                                    {
                                                        block : 'link',
                                                        mods : { theme : 'islands', size : 'm', font: '11'},
                                                        content: 'Распечатать'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }, // search sorts
                            {
                                block: 'adv',
                                width: 730,
                                height: 90,
                                margin: '0 auto 25px'
                            },
                            {
                                block: 'living_complex_filter',
                                js: {
                                    url: '/desktop.blocks/living_complex_filter/test.json',
                                    show_all_url: '/desktop.blocks/living_complex_filter/test.show-all.json' // Удалить после проверки!
                                },
                                mix: { block: 'living_complex_filter_controller', js: { id: 1 } },
                            },
                            {
                                block: 'search_sorts',
                                content: [
                                    {
                                        elem: 'pull_left',
                                        content: [
                                            {
                                                elem: 'label',
                                                content: 'Сортировать&nbsp;'
                                            },
                                            {
                                                block: 'select',
                                                attrs: { id: 'search_filter_sorts' },
                                                mix: { block: 'living_complex_filter_controller', js: { id: 1 } },
                                                mods : { mode : 'radio', theme : 'islands', size : 'm', liketext: true },
                                                val : 'price_desc',
                                                options : [
                                                    { val : 'price_asc', text : 'по цене от наименьшей' },
                                                    { val : 'price_desc', text : 'по цене от наибольшей' },
                                                    { val : 'address_asc', text : 'по адресу' },
                                                    { val : 'area_asc', text : 'по площади от наименьшей' },
                                                    { val : 'area_desc', text : 'по площади от наибольшей' },
                                                    { val : 'publish_desc', text : 'по дате добавления' },
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        elem: 'pull_right',
                                        content: [
                                            {
                                                block : 'dropdown',
                                                mods : { switcher : 'link', theme : 'islands', size : 'm' },
                                                switcher : {
                                                    block : 'link',
                                                    mods : { theme : 'islands', size : 'm', font: '11'},
                                                    content:[
                                                        {
                                                            tag: 'span',
                                                            content: 'Отправить'
                                                        },
                                                        {
                                                            elem: 'tick',
                                                            mix: {block: 'icon'}
                                                        }
                                                    ]
                                                },
                                                popup : {
                                                    block: 'send_search_results',
                                                }
                                            },
                                            {
                                                block : 'dropdown',
                                                attrs: { style: 'margin-left: 20px;' },
                                                mods : { switcher : 'button', theme : 'islands', size : 'm' },
                                                switcher : {
                                                    block : 'link',
                                                    mods : { theme : 'islands', size : 'm', font: '11'},
                                                    content:[
                                                        {
                                                            tag: 'span',
                                                            content: 'Распечатать'
                                                        },
                                                        {
                                                            elem: 'tick',
                                                            mix: {block: 'icon'}
                                                        }
                                                    ]
                                                },
                                                popup : {
                                                    block: 'menu',
                                                    mods : { theme : 'islands', size : 'm' },
                                                    content : [
                                                        {
                                                            block : 'menu-item',
                                                            val : 1,
                                                            content : [
                                                                {
                                                                    tag: 'span',
                                                                    content: 'объекты этой страницы&nbsp'
                                                                },
                                                                {
                                                                    block: 'help',
                                                                    tag: 'span',
                                                                    content: '27'
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            block : 'menu-item',
                                                            val : 2,
                                                            content : [
                                                                {
                                                                    tag: 'span',
                                                                    content: 'результаты всего поиска&nbsp'
                                                                },
                                                                {
                                                                    block: 'help',
                                                                    tag: 'span',
                                                                    content: '1427'
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                ]

                            }, // sorts
                            {
                                block: 'living_complex_flats',
                                content: [
                                    {
                                        block: 'search_results',
                                        js: { 
                                            favorite_url: '/desktop.blocks/user_lists_in_search/test.json',
                                            new_list_url: '/desktop.blocks/user_lists_in_search/add_test.json',
                                            add_to_list_url: '/desktop.blocks/user_lists_in_search/test.json',
                                            comment_url: '/desktop.blocks/user_lists_in_search/test.json',
                                        },
                                        mix: { block: 'living_complex_filter_controller', js: { id: 1 } },
                                        mods: { without: 'map', short_border_bottom: true },
                                        items: []
                                    },
                                    {
                                        elem: 'more',
                                        content: [  
                                            {
                                                block: 'controls_row',
                                                content: [

                                                    {
                                                        elem: 'col',
                                                        mods: {right: true},
                                                        content: {
                                                            block : 'dropdown',
                                                            mods : { switcher : 'button', theme : 'islands', size : 'm' },
                                                            switcher : {
                                                                block: 'button',
                                                                mods : { theme : 'islands', size : 'm', wide: true, submit: true },
                                                                text: 'Подписаться на новые обновления',
                                                                icon: {
                                                                    block : 'icon',
                                                                    mods : { action : 'mail' }
                                                                }
                                                            },
                                                            popup : {
                                                                block: 'email_subscribe'
                                                            }
                                                        },
                                                    },
                                                    {
                                                        elem: 'col',
                                                        mods: {right: true},
                                                        attrs: {style: 'margin-right: 150px;'},
                                                        content: [
                                                            {
                                                                block: 'button',
                                                                mix: { block: 'living_complex_flats', elem: 'show-all' },
                                                                mods: {theme: 'islands', size: 'l', type: 'button'},
                                                                text: 'Все предложения'
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    
                                ]
                            },
                            {
                                block: 'similar_living_complexes',
                                js: { url: '/desktop.blocks/similar_living_complexes/test.json', cur_id: 1 },
                                content: [
                                    {
                                        elem: 'header',
                                        content: [
                                            {
                                                elem: 'header-text',
                                                tag: 'span',
                                                content: 'Похожие новостройки по'
                                            }, 
                                            {
                                                block: 'radio-group',
                                                mods: { theme: 'islands', size: 'm', type: 'button' },
                                                val: 3,
                                                options: [
                                                    { val: 1, text: 'распололжению' },
                                                    { val: 2, text: 'параметрам' },
                                                    { val: 3, text: 'цене' }
                                                ]
                                            },
                                            {
                                                tag: 'span',
                                                attrs: { style: 'display: inline-block; margin-left: 20px; position: relative; top: 4px;' },
                                                content: {
                                                    block : 'spin',
                                                    mods : { theme : 'islands', size : 'm' }
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        elem: 'body'
                                    },  
                                    {
                                        elem: 'more',
                                        content: {
                                            block: 'button',
                                            mods: {theme: 'islands', size: 'l', type: 'button'},
                                            text: 'Ещё похожие новостройки'
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        elem: 'right',
                        content: [
                            {
                                block: 'living_complex_sidebar_info'
                            },
                            {
                                block: 'new-buildings-sidebar'
                            }
                        ]
                    }
                ]
            },
            {
                block : 'footer',
            }
        ]
    }]
})
