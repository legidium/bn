({
    block: 'page',
    title : 'Реклама',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_promotion.css' }
    ],
    scripts: [{ elem : 'js', url : '_promotion.js' }],
    content: {
        block: 'layout',
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
                        block: 'panels',
                        content: [
                            {
                                elem: 'left',
                                mix: { block: 'promotion', elem: 'left' },
                                content: [
                                    {
                                        block: 'sidebar-menu',
                                        mix: { block: 'pd', mods: { vh: 'l-m' } },
                                        items: [
                                            { title: 'О Компании', link: '#'},
                                            { title: 'Правила перепечатки', link: '#' },
                                            { title: 'Реклама', link: '#', active: true },
                                            { title: 'Контакты', link: '#'}
                                        ]
                                    }
                                ]
                            },
                            {
                                elem: 'right',
                                mix: { block: 'promotion', elem: 'right' },
                                content: [
                                    {
                                        block: 'grid',
                                        mix: { block: 'pd', mods: { 'l': true } },
                                        content: [
                                            {
                                                elem: 'row',
                                                content: [
                                                    {
                                                        elem: 'col',
                                                        elemMods: { span: '18' },
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { size: 'l', height: 'l' },
                                                                content: [
                                                                    {
                                                                        tag: 'h1',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Реклама'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'BN.RU — это масштабная рекламная площадка для рекламодателей в сфере недвижимости,<br> а также в смежных с ней сферах.'
                                                                    },
                                                                    {
                                                                        block: 'promotion-scores',
                                                                        help: 'Источник: результаты исследований «2К Аудит – Деловые консультации/Морисон<br> Интернешнл», февраль 2014.',
                                                                        items: [
                                                                            { title: '1', help: 'место', text: 'в тематическом<br> рейтинге сайтов' },
                                                                            { title: '12 000', text: 'тематический индекс<br> цитирования Яндекс' },
                                                                            { title: '75%', text: 'участников рынка<br> знают наш портал' },
                                                                            { title: '57%', text: 'ваших клиентов ищут<br> недвижимость,<br> используя нас' },
                                                                            { title: '84%', text: 'пользователей доверяют<br> информации и отмечают её<br> актуальность' },
                                                                            { title: '89%', text: 'петербуржцев отмечают<br> полноту информации и<br> популярность' },
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                elem: 'row',
                                                content: [
                                                    {
                                                        elem: 'col',
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { size: 'l', height: 'l' },
                                                                content: [
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'Портал «Бюллетень Недвижимости»'
                                                                    },
                                                                    {
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: [
                                                                            {
                                                                                elem: 'links',
                                                                                mix: { block: 'promotion', elem: 'links' },
                                                                                content: [
                                                                                    '<a href="#">Медиа-кит</a>',
                                                                                    '<a href="#">Прайс-лист</a>'
                                                                                ]
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            },
                                                            {
                                                                block: 'post',
                                                                mods: { size: 'l', height: 'l' },
                                                                content: [
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'Закрытая база «Квартирный Вопрос»'
                                                                    },
                                                                    {
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: [
                                                                            {
                                                                                elem: 'links',
                                                                                mix: { block: 'promotion', elem: 'links' },
                                                                                content: ['<a href="#">Прайс-лист</a>']
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'Издание «Бюллетень Недвижимости»'
                                                                    },
                                                                    {
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: [
                                                                            {
                                                                                elem: 'links',
                                                                                mix: { block: 'promotion', elem: 'links' },
                                                                                content: ['<a href="#">Прайс-лист</a>']
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'Журнал «Сдам. Сниму»'
                                                                    },
                                                                    {
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: [
                                                                            {
                                                                                elem: 'links',
                                                                                mix: { block: 'promotion', elem: 'links' },
                                                                                content: ['<a href="#">Прайс-лист</a>']
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'Контакты для рекламодателей'
                                                                    },
                                                                    {
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Контактный центр: +7 (812) 700 90 90<br>E-mail: ad@bn.ru<br>Отдел продаж: +7 (812) 346-86-51'
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
