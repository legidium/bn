({
    block: 'page',
    title : 'Мой БН (агент)',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-agent.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-agent.js' }],
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
                                            { text: 'Мой BN', attrs: { href: '#'}, mods: { active: true } },
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
                                        elem: 'items',
                                        content: [
                                            {
                                                elem: 'line',
                                                content: [
                                                    {
                                                        elem: 'col',
                                                        content: [
                                                            {
                                                                elem: 'item',
                                                                content: [
                                                                    {
                                                                        block: 'account-dashboard-messages',
                                                                        items: [
                                                                            'Область системных уведомлений'
                                                                        ]
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                elem: 'item',
                                                                elemMods: { padding: 'm-l' },
                                                                content: [
                                                                    {
                                                                        block: 'account-dashboard-ads',
                                                                        items: [
                                                                            { title: 'Истекает срок',     val: '16',      link: '1', mods: { selected: true } },
                                                                            { title: 'Активные',          val: '1045',    link: '2' },
                                                                            { title: 'Не опубликованные', val: '2163',    link: '3' },
                                                                            { title: 'На модерации',      val: '21',      link: '4' },
                                                                            { title: 'Архивные',          val: '10 000+', link: '5' }
                                                                        ]
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                elem: 'item',
                                                                elemMods: { padding: 'l' },
                                                                content: [
                                                                    {
                                                                        block: 'account-dashboard-lists',
                                                                        items: [
                                                                            {
                                                                                js: { id: 1 },
                                                                                title: 'Василий аренда комнтата в центре',
                                                                                info_text: '54 объявлений',
                                                                                status_text: 'изменен 19 июля 2015',
                                                                                link: '#',
                                                                            },
                                                                            {
                                                                                js: { id: 2 },
                                                                                title: 'Наталья однокомнатная до 3 млн только новый дом',
                                                                                info_text: '13 объявлений',
                                                                                status_text: 'создан 23 июля 2015',
                                                                                link: '#',
                                                                            },
                                                                            {
                                                                                js: { id: 3 },
                                                                                title: 'Однушка только вторичка приморский',
                                                                                info_text: '54 объявлений',
                                                                                status_text: 'изменен 19 июля 2015',
                                                                                link: '#',
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
                                elem: 'right',
                                mix: { block: 'account-dashboard', elem: 'sidebar' },
                                content: [
                                    {
                                        elem: 'item',
                                        elemMods: { 'padding-vh': 'm-l' },
                                        content: [
                                            {
                                                block: 'account-dashboard-balance',
                                                mods: { person: true },
                                                items: {
                                                    balance: '0 <span class="currency">Р</span>',
                                                    tariff_help: 'Условия размещения предусматривают оплату публикации каждого объявляения на срок, кратный неделе',
                                                },
                                                items_bak: {
                                                    tariff_text: '«БН Стандарт»',
                                                    tariff_text_help: 'Ваш тарифный план предусматривает<br>оплату публикации каждого объявления<br>на строк, кратный неделе.',
                                                    expires_days: '16',
                                                    expires_days_help: 'до 18.09.2015',
                                                    positions_by_tariff: '200',
                                                    positions_extended: '50',
                                                    positions_available: '0',
                                                    positions_owned: '50',
                                                    positions_featured: '290',
                                                    positions_special: '48',
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
