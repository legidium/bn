({
    block: 'page',
    title : 'Новостройки - поиск квартир',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_new-buildings-search.css' }
    ],
    scripts: [{ elem : 'js', url : '_new-buildings-search.js' }],
    content: {
        block: 'layout',
        content: [
            {
                block: 'header'
            },
            {
                block: 'new-buildings-content',
                content: [
                    {
                        elem: 'top',
                        content: [
                            {
                                elem: 'title',
                                content: 'Полная база новостроек Санкт-Петербурга',
                            },
                            {
                                elem: 'filter',
                                content: [
                                    {
                                        block: 'new-buildings-search-filter',
                                        js : true,
                                        mix: {
                                            block: 'new-buildings-search-controller',
                                            js: {
                                                dataUrl: '/desktop.blocks/new-buildings-search-filter/data.json',
                                                returnUrl: '/desktop.bundles/new-buildings/new-buildings.html'
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        elem: 'body',
                        content: [
                            {
                                elem: 'list',
                                content: [
                                    {
                                        block: 'content_layout',
                                        content: [
                                            {
                                                elem: 'left',
                                                content: [
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
                                                                            block: 'send_search_results'
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
                                                    },
                                                    {
                                                        block: 'search_results',
                                                        js: { 
                                                            favorite_url:    '/desktop.blocks/user_lists_in_search/test.json',
                                                            new_list_url:    '/desktop.blocks/user_lists_in_search/add_test.json',
                                                            add_to_list_url: '/desktop.blocks/user_lists_in_search/test.json',
                                                            comment_url:     '/desktop.blocks/user_lists_in_search/test.json',
                                                        },
                                                        just_results: true,
                                                        items: []
                                                    },
                                                    {
                                                        block: 'search_footer',
                                                        pagerMix: {},
                                                        pagerMods: { hidden: true },
                                                        buttons: false
                                                    }
                                                ]
                                            },
                                            {
                                                elem: 'right',
                                                content: [
                                                    {
                                                        block: 'new-buildings-sidebar',
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                elem: 'empty',
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
