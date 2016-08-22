({
    block: 'page',
    title : 'ЛК (частник) - Cодержимое списка',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-person-list.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-person-list.js' }],
    content: {
        block: 'account-dashboard',
        mods: { 'new': false },  // Поставить в true для режима редактирования
        content: [
            {
                elem: 'header',
                content: [
                    {
                        block: 'header'
                    }
                ]
            },
            {
                elem: 'main',
                content: [
                    {
                        elem: 'panels',
                        content: [
                            {
                                elem: 'left',
                                content: [
                                    {
                                        block: 'account-navigation',
                                        mix: { block: 'account-dashboard', elem: 'item', elemMods: { 'padding-vh': 'l-m' } },
                                        items: [
                                            { text: 'Мой BN', attrs: { href: '#'} },
                                            { text: 'Мои объявления', attrs: { href: '#'}, val: 2057 },
                                            { text: 'Избранное', attrs: { href: '#'}, val: 20 },
                                            { text: 'Мои списки', attrs: { href: '#'}, val: 3 },
                                            { text: 'Мои поиски', attrs: { href: '#'} },
                                            { text: 'Мои подписки', attrs: { href: '#'} },
                                            { text: 'Личные данные', attrs: { href: '#'} },
                                            { text: 'Настройки', attrs: { href: '#'} },
                                            { text: 'Баланс', attrs: { href: '#'} }
                                        ]
                                    },
                                    {
                                        block: 'account-dashboard-offer',
                                        mix: { block: 'account-dashboard', elem: 'item', elemMods: { padding: 'm' } },
                                    }
                                ]
                            },
                            {
                                elem: 'middle',
                                content: [
                                    {
                                        block: 'account-dashboard-list',
                                        mix: {
                                            block: 'account-dashboard-list-controller',
                                            js: {
                                                id: 1, /* list Id */
                                                /*is_new: true,*/

                                                accountDashboardList: {
                                                    dataUrl:       '/desktop.blocks/account-dashboard-list/data.json',
                                                    copyUrl:       '/desktop.blocks/account-dashboard-list/copy.json',
                                                    deleteUrl:     '/desktop.blocks/account-dashboard-list/del.json',
                                                    titlePutUrl:   '/desktop.blocks/account-dashboard-list/title.put.json',
                                                    commentGetUrl: '/desktop.blocks/account-dashboard-list/comment.get.json',
                                                    commentPutUrl: '/desktop.blocks/account-dashboard-list/comment.put.json',
                                                },

                                                // List item tools url
                                                favoriteGetUrl:    '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                                                favoritePutUrl:    '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                                                listsGetUrl:       '/desktop.blocks/objects-list-item-lists/get.json',
                                                listsPutUrl:       '/desktop.blocks/objects-list-item-lists/put.json',
                                                listsDelUrl:       '/desktop.blocks/objects-list-item-lists/del.json',
                                                listsAddUrl:       '/desktop.blocks/objects-list-item-lists/add.json',
                                                userNoteGetUrl:    '/desktop.blocks/objects-list-item-note/get.json',
                                                userNotePutUrl:    '/desktop.blocks/objects-list-item-note/put.json',

                                                loginUrl: 'login',
                                                registerUrl: 'register'
                                            },
                                        },
                                        data: {
                                            typeText: 'продажа квартиры',
                                            title:    'Покупка однушки в Московском только новый дом без мебели, с животными и детьми',
                                            comment:  'Документы ОК, встреча после 15.07, адекватная, не срочно, для Карасевой +7 921 614-21-09 (муж), хочет 5%, Итака), договориться после 10.07. 16.07 - встреча. не понравилась, - 50 тысяч через 2 недели, без хозяина. +7 921 814-0992 второй телефон этой Марины (по понедельникам не бывает в городе) Если ещё раз не приедет - больше не работаю',
                                        }
                                    }
                                    
                                    
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                elem: 'footer',
                content: [
                    {
                        block: 'footer'
                    }
                ]
            }
        ]
    }
})
