({
    block: 'page',
    title : 'Контакты',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_contacts.css' }
    ],
    scripts: [{ elem : 'js', url : '_contacts.js' }],
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
                                mix: { block: 'contacts', elem: 'left' },
                                content: [
                                    {
                                        block: 'sidebar-menu',
                                        mix: { block: 'pd', mods: { vh: 'l-m' } },
                                        items: [
                                            { title: 'О Компании', link: '#' },
                                            { title: 'Правила перепечатки', link: '#' },
                                            { title: 'Реклама', link: '#' },
                                            { title: 'Контакты', link: '#', active: true }
                                        ]
                                    }
                                ]
                            },
                            {
                                elem: 'right',
                                mix: { block: 'contacts', elem: 'right' },
                                content: [
                                    {
                                        block: 'contacts',
                                        mix: { block: 'pd', mods: { l: true } },
                                        content: [
                                            {
                                                elem: 'header',
                                                content: { tag: 'h1', elem: 'title', content: 'Контакты' }
                                            },
                                            {
                                                elem: 'content',
                                                mix: { block: 'grid', elem: 'row' },
                                                content: [
                                                    {
                                                        elem: 'items',
                                                        mix: { block: 'grid', elem: 'col', elemMods: { span: '9' } },
                                                        content: [
                                                            {
                                                                elem: 'item',
                                                                elemMods: { type: 'contact' },
                                                                content: [
                                                                    {
                                                                        block: 'post',
                                                                        elemMods: { size: 'l', height: 'xl' },
                                                                        content: [
                                                                            {
                                                                                elem: 'line',
                                                                                mix: { block: 'mr', mods: { b: 'xxl' } },
                                                                                content: [
                                                                                    {
                                                                                        tag: 'h3',
                                                                                        elem: 'title',
                                                                                        mix: { block: 'mr', mods: { clear: true, b: 'm' } },
                                                                                        content: 'Контактный центр'
                                                                                    },
                                                                                    {
                                                                                        tag: 'p',
                                                                                        elem: 'title',
                                                                                        elemMods: { h3: true },
                                                                                        mix: { block: 'mr', elemMods: { b: 'xs' } },
                                                                                        content: '8 (800) 3333-450'
                                                                                    },
                                                                                    {
                                                                                        tag: 'p',
                                                                                        elem: 'text',
                                                                                        elemMods: { size: 'm', height: 'm', light: true },
                                                                                        content: 'Бесплатно по России'
                                                                                    },
                                                                                    {
                                                                                        tag: 'p',
                                                                                        elem: 'text',
                                                                                        content: 'с 9.00 до 21.00<br> тел./факс: (812) 327-02-97<br> e-mail: my@bn.ru<br> skype: www.bn.ru'
                                                                                    }
                                                                                ]
                                                                            },
                                                                            {
                                                                                elem: 'line',
                                                                                mix: { block: 'mr', mods: { b: 'l' } },
                                                                                content: [
                                                                                    {
                                                                                        tag: 'h3',
                                                                                        elem: 'title',
                                                                                        mix: { block: 'mr', elemMods: { b: 's' } },
                                                                                        content: 'Отдел продаж рекламы'
                                                                                    },
                                                                                    {
                                                                                        elem: 'text',
                                                                                        content: 'c 10.00 до 19.00<br> тел./факс: (812) 331-93-56<br> e-mail: reklama@bnmedia.ru'
                                                                                    }
                                                                                ]
                                                                            },
                                                                            {
                                                                                elem: 'line',
                                                                                mix: { block: 'mr', mods: { b: 'l' } },
                                                                                content: [
                                                                                    { tag: 'h3', elem: 'title', content: 'PR-служба' },
                                                                                    {
                                                                                        elem: 'text',
                                                                                        content: 'с 10.00 до 19.00<br> тел./факс: (812) 320-88-70<br> e-mail: pr@bnmail.ru'
                                                                                    }
                                                                                ]
                                                                            },
                                                                            {
                                                                                elem: 'line',
                                                                                mix: { block: 'mr', mods: { b: 'l' } },
                                                                                content: [
                                                                                    { tag: 'h3', elem: 'title', content: 'Для новостей и пресс-релизов' },
                                                                                    {
                                                                                        elem: 'text',
                                                                                        content: 'e-mail: newsed@bnmedia.ru'
                                                                                    }
                                                                                ]
                                                                            },
                                                                            {
                                                                                elem: 'line',
                                                                                mix: { block: 'mr', mods: { b: 'l' } },
                                                                                content: [
                                                                                    { tag: 'h3', elem: 'title', content: 'Служба HR' },
                                                                                    {
                                                                                        elem: 'text',
                                                                                        content: 'с 10.00 до 19.00<br> тел./факс: (812) 325-06-80<br> e-mail: hr@bn.ru'
                                                                                    }
                                                                                ]
                                                                            },
                                                                            {
                                                                                elem: 'line',
                                                                                content: [
                                                                                    { tag: 'h3', elem: 'title', content: 'БН в социальных сетях' },
                                                                                    {
                                                                                        elem: 'text',
                                                                                        content: 'ВКонтакте: <a href="http://vk.com/club383143">http://vk.com/club383143</a><br> Twitter: <a href="http://twitter.com/bn_ru">http://twitter.com/bn_ru</a>'
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
                                                        elem: 'items',
                                                        mix: { block: 'grid', elem: 'col', elemMods: { span: '15' } },
                                                        content: [
                                                            {
                                                                elem: 'item',
                                                                content: [
                                                                    {
                                                                        block: 'post',
                                                                        elemMods: { size: 'l', height: 'l' },
                                                                        mix: { block: 'mr', elemMods: { b: 'm' } },
                                                                        content: [
                                                                            {
                                                                                elem: 'line',
                                                                                content: [
                                                                                    {
                                                                                        tag: 'h3',
                                                                                        elem: 'title',
                                                                                        mix: { block: 'mr', elemMods: { b: 'xs' } },
                                                                                        content: 'Отправить сообщение'
                                                                                    },
                                                                                    {
                                                                                        tag: 'p',
                                                                                        elem: 'text',
                                                                                        elemMods: { size: 'm', height: 'm', light: true },
                                                                                        content: 'С нами можно связаться, отправив сообщение.<br> Мы ответим вам в течении суток.'
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        block: 'contact-form',
                                                                        mix: { block: 'contacts', elem: 'form' },
                                                                        attrs: { action: '/', method: 'post' },
                                                                        data: {
                                                                            subjects: [
                                                                                { val: 1, text: 'Тема 1' },
                                                                                { val: 2, text: 'Тема 2' },
                                                                                { val: 3, text: 'Тема 3' }
                                                                            ]
                                                                       }
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
