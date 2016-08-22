({
    block: 'page',
    title : 'О Компании',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_about.css' }
    ],
    scripts: [{ elem : 'js', url : '_about.js' }],
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
                                mix: { block: 'about', elem: 'left' },
                                content: [
                                    {
                                        block: 'sidebar-menu',
                                        mix: { block: 'pd', mods: { vh: 'l-m' } },
                                        items: [
                                            { title: 'О Компании', link: '#', active: true },
                                            { title: 'Правила перепечатки', link: '#' },
                                            { title: 'Реклама', link: '#' },
                                            { title: 'Контакты', link: '#'}
                                        ]
                                    }
                                ]
                            },
                            {
                                elem: 'right',
                                mix: { block: 'about', elem: 'right' },
                                content: [
                                    {
                                        block: 'grid',
                                        mix: [
                                            { block: 'about', elem: 'content' },
                                            { block: 'pd', mods: { 'l': true } },
                                        ],
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
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'О компании'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Сегодня ГК «Бюллетень Недвижимости» — крупнейший в Петербурге медиахолдинг, в котором успешно работают более 300 сотрудников, ежедневно обеспечивая информационные потребности рынка недвижимости.'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Информационное поле ГК «Бюллетень Недвижимости» охватывает максимально возможную аудиторию: заинтересованных в сделках с недвижимостью граждан, читателей прессы, пользователей сети интернет, посетителей выставок и семинаров, профессионалов рынка недвижимости.'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'xxl' } },
                                                                        content: ' С 1995 года мы стремимся, чтобы наша деятельность включала в себя все аспекты рынка недвижимости:'
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
                                                        elemMods: { span: '12' },
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { height: 's' },
                                                                content: [
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        content: 'Крупнейшие каталоги объектов недвижимости'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: '<a href="#">Издание</a> и портал «Бюллетень Недвижимости», журнал <a href="#">«Сдам. Сниму»</a>, портал по зарубежной недвижимости <a href="#">PRIAN.ru</a>'
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        elem: 'col',
                                                        elemMods: { span: '12' },
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { height: 's' },
                                                                content: [
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        content: 'Информация о рынке недвижимости'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Информируем население о тенденциях, изменениях, событиях и услугах рынка по всей России и за рубежом: собственная редакция, видеостудия'
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
                                                        elemMods: { span: '12' },
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { height: 's' },
                                                                content: [
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        content: 'Исследования рынка недвижимости'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Исследуем рынок недвижимости и предоставляем аналитические материалы по всем сегментам рынка недвижимости всех регионов России и зарубежья: Центр исследований и аналитики ГК «Бюллетень Недвижимости»'
                                                                    }   
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        elem: 'col',
                                                        elemMods: { span: '12' },
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { height: 's' },
                                                                content: [
                                                                    {
                                                                        tag: 'h3',
                                                                        elem: 'title',
                                                                        content: 'Организация мероприятий'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'text',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Организуем и проводим конгрессно-выставочные мероприятия для профессионалов и частных лиц: выставку-семинар «Жилищный проект», Гражданский Жилищный Форум'
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
