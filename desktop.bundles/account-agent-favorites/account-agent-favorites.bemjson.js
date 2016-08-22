({
    block: 'page',
    title : 'ЛК (агент) - Избранное',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-agent-favorites.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-agent-favorites.js' }],
    content: {
        block: 'account-dashboard',
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
                                            { text: 'Избранное', attrs: { href: '#'}, val: 20, mods: { active: true } },
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
                                        block: 'account-favorites',
                                        mix: {
                                            block: 'account-favorites-controller',
                                            js: {
                                                userAuth: false,
                                                
                                                dataUrl:        '/desktop.blocks/account-favorites/data.json',
                                                favoriteGetUrl: '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                                                favoritePutUrl: '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                        
                                                listsGetUrl:    '/desktop.blocks/objects-list-item-lists/get.json',
                                                listsPutUrl:    '/desktop.blocks/objects-list-item-lists/put.json',
                                                listsDelUrl:    '/desktop.blocks/objects-list-item-lists/del.json',
                                                listsAddUrl:    '/desktop.blocks/objects-list-item-lists/add.json',

                                                userNoteGetUrl: '/desktop.blocks/objects-list-item-note/get.json',
                                                userNotePutUrl: '/desktop.blocks/objects-list-item-note/put.json',

                                                loginUrl: 'login',
                                                registerUrl: 'register'
                                            }
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
