({
    block: 'page',
    title : 'ЛК (агент) - Мои объявления',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-agent-ads.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-agent-ads.js' }],
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
                                            { text: 'Мои объявления', attrs: { href: '#'}, mods: { active: true }, val: 2057 },
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
                                        elem: 'item',
                                        content: [
                                            {
                                                block: 'account-my-ads-content',
                                                mix: {
                                                    block: 'account-my-ads-controller',
                                                    js: {
                                                        userAuth: false,

                                                        accountMyAds: {
                                                            dataUrl:       '/desktop.blocks/account-my-ads-content/data.json',
                                                        },

                                                        // List item tools url
                                                        favoriteGetUrl:    '/desktop.blocks/objects-list-item-tools/favorite.get.json',
                                                        favoritePutUrl:    '/desktop.blocks/objects-list-item-tools/favorite.put.json',
                                                        listsGetUrl:       '/desktop.blocks/objects-list-item-lists/get.json',
                                                        listsPutUrl:       '/desktop.blocks/objects-list-item-lists/put.json',
                                                        listsDelUrl:       '/desktop.blocks/objects-list-item-lists/del.json',
                                                        listsAddUrl:       '/desktop.blocks/objects-list-item-lists/add.json',
                                                        userNoteGetUrl:    '/desktop.blocks/objects-list-item-note/get.json',
                                                        userNotePutUrl:    '/desktop.blocks/objects-list-item-note/put.json'
                                                    }
                                                }
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
