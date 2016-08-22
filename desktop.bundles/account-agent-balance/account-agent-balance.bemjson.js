({
    block: 'page',
    title : 'Мой БН (агент) - Баланс',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-agent-balance.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-agent-balance.js' }],
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
                                            { text: 'Личные данные', attrs: { href: '#'} },
                                            { text: 'Настройки', attrs: { href: '#'} },
                                            { text: 'Баланс', attrs: { href: '#'}, mods: { active: true } }
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
                                        elemMods: { 'padding-vh': 'm-l' },
                                        content: [
                                            {
                                                elem: 'title',
                                                mods: { inline: true, margin: 'm' },
                                                content: { block: 'text', mods: { height: 'xl' }, content: 'Баланс' }
                                            },
                                            {
                                                block: 'account-dashboard-balance-control',
                                                mods: { inline: true },
                                                content: '127 <span class="currency">Р</span>'
                                            },
                                            {
                                                elem: 'title-help',
                                                content: 'Вы можете самостоятельно публиковать объявления от своего имени.',
                                            }
                                        ]
                                    },
                                    {
                                        elem: 'item',
                                        elemMods: { 'padding-vh': 'm-l' },
                                        content: [
                                            {
                                                block: 'account-dashboard-balance-history',
                                                mods: { type: 'agent' },
                                                title: 'История платежей и операций',
                                                items: [
                                                    {
                                                        date: '23.09.2015',
                                                        sum: '250 <span class="currency">Р</span>',
                                                        method: 'Баланс агентства',
                                                        status: 'Ожидает подтвреждения',
                                                        attachments: 'Скачать счет',
                                                        allow_cancel: true,
                                                    },
                                                    {
                                                        date: '23.08.2015',
                                                        sum: '150 <span class="currency">Р</span>',
                                                        method: 'Банковская карта',
                                                        status: 'Зачислен',
                                                        attachments: 'Скачать счет'
                                                    },
                                                    {
                                                        date: '23.09.2015',
                                                        sum: '150 <span class="currency">Р</span>',
                                                        method: 'Терминал',
                                                        status: 'Зачислен',
                                                        attachments: 'Скачать счет'
                                                    },
                                                    {
                                                        date: '23.09.2015',
                                                        sum: '150 <span class="currency">Р</span>',
                                                        method: 'Банковская карта',
                                                        status: 'Зачислен',
                                                        attachments: 'Скачать счет'
                                                    },
                                                    {
                                                        date: '23.09.2015',
                                                        sum: '150 <span class="currency">Р</span>',
                                                        method: 'Терминал',
                                                        status: 'Зачислен',
                                                        attachments: 'Скачать счет'
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
