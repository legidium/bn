({
    block: 'page',
    title : 'Мой БН (частник)',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_account-person.css' }
    ],
    scripts: [{ elem : 'js', url : '_account-person.js' }],
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
                                                                elemMods: { 'padding-vh': 'm-l' },
                                                                content: [
                                                                    {
                                                                        block: 'account-dashboard-ads',
                                                                        items: [
                                                                            { title: 'Истекает срок', val: '16', mods: { selected: true } },
                                                                            { title: 'Активные', val: '1045' },
                                                                            { title: 'Не опубликованные', val: '2163' },
                                                                            { title: 'На модерации', val: '21' },
                                                                            { title: 'Архивные', val: '10 000+' }
                                                                        ],
                                                                        banner: {
                                                                            link: '#',
                                                                            image: '../../img/account-dasboard-my-ads-b.png'
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                elem: 'item',
                                                                elemMods: { 'padding-vh': 'm-l' },
                                                                content: [
                                                                    {
                                                                        block: 'account-dashboard-lists',
                                                                        items: []
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        elem: 'col',
                                                        mix: { block: 'account-dashboard', elem: 'sidebar', elemMods: { width: 's' } },
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
                                                                            tariff_help: 'Условия размещения предусматривают оплату публикации каждого объявляения на срок, кратный неделе.',
                                                                        }
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
                                        elem: 'items',
                                        elemMods: { border: 't' },
                                        content: [
                                            {
                                                elem: 'item',
                                                elemMods: { padding: 'l'},
                                                content: [
                                                    {
                                                        block: 'account-dashboard-searches',
                                                        items: [
                                                            {
                                                                js: { id: 1 },
                                                                title: 'Купить однокомнатную, двухкомнатную, многокомнатную квартиру в Санкт-Петербурге',
                                                                description: 'От 2 500 000 до 23 000 000 Р, вторичка, новостройка, Адмиралтейский, Калининский, жилая площадь от 32, не первый, не последний этаж, в доме до 9 этажей, за 2 недели.',
                                                                date_text: '29 июня, 17:02'
                                                            },
                                                            {
                                                                js: { id: 2 },
                                                                title: 'Купить комнату от 18 до 25 метров в Санкт-Петербурге',
                                                                description: 'От 1 500 000 до 2 500 000 Р, вторичка, жилая площадь от 18 до 25 метров, не первый, не последний этаж, санузел раздельный, с ремонтом, только частные оъявления, за все время, только с фото.',
                                                                date_text: '28 июня, 15:09'
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
