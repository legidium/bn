({
    block: 'page',
    title : 'ЛК (агент) - Мои подписки на обновления',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-agent-subs.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-agent-subs.js' }],
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
                                            { text: 'Мой BN', attrs: { href: '#' } },
                                            { text: 'Мои объявления', val: 2057, attrs: { href: '#' } },
                                            { text: 'Избранное', val: 20, attrs: { href: '#' } },
                                            { text: 'Мои списки', val: 3, attrs: { href: '#' } },
                                            { text: 'Мои поиски', attrs: { href: '#'} },
                                            { text: 'Мои подписки', attrs: { href: '#'}, mods: { active: true } },
                                            { text: 'Личные данные', attrs: { href: '#' } },
                                            { text: 'Настройки', attrs: { href: '#' } },
                                            { text: 'Баланс', attrs: { href: '#' } }
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
                                        block: 'account-my-subs-content',
                                        mix: {
                                            block: 'account-my-subs-controller',
                                            js: {
                                                userAuth: false,
                                                dataUrl:  '/desktop.blocks/account-my-subs-content/data.json'
                                            },
                                            loginUrl: 'login',
                                            registerUrl: 'register'
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

