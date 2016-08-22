({
    block: 'page',
    title : 'Мой БН (агент) - Личные данные',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-agent-profile.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-agent-profile.js' }],
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
                                            { text: 'Избранное', attrs: { href: '#'}, val: 20 },
                                            { text: 'Мои списки', attrs: { href: '#'}, val: 3 },
                                            { text: 'Мои поиски', attrs: { href: '#'} },
                                            { text: 'Мои подписки', attrs: { href: '#'} },
                                            { text: 'Личные данные', attrs: { href: '#'}, mods: { active: true } },
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
                                        block: 'account-profile',
                                        mix: { block: 'account-profile-controller', js: true },
                                        mods: { view: 'agent' },
                                        data: {
                                            name: 'Иван Петрович',
                                            email: 'ivanpetrovich@gmail.ru',
                                            skype: '',
                                            phones: [
                                                { phone: '+7 (909) 123-45-67', messengers: [1] },
                                                { phone: '+7 (909) 123-45-68', messengers: [2] }
                                            ],
                                            agency: {
                                                title: 'ООО Креативное агенство недвижимости',
                                                moderator_name: 'Елена Иванова',
                                                moderator_email: 'elenainvanova@mail.ru',
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
