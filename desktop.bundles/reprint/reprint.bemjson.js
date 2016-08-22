({
    block: 'page',
    title : 'Правила перепечатки',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_reprint.css' }
    ],
    scripts: [{ elem : 'js', url : '_reprint.js' }],
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
                                mix: { block: 'reprint', elem: 'left' },
                                content: [
                                    {
                                        block: 'sidebar-menu',
                                        mix: { block: 'pd', mods: { vh: 'l-m' } },
                                        items: [
                                            { title: 'О Компании', link: '#'},
                                            { title: 'Правила перепечатки', link: '#', active: true },
                                            { title: 'Реклама', link: '#' },
                                            { title: 'Контакты', link: '#'}
                                        ]
                                    }
                                ]
                            },
                            {
                                elem: 'right',
                                mix: { block: 'reprint', elem: 'right' },
                                content: [
                                    {
                                        block: 'grid',
                                        mix: [
                                            { block: 'pd', mods: { 'l': true } },
                                            { block: 'reprint', elem: 'content' }
                                        ],
                                        content: [
                                            {
                                                elem: 'row',
                                                content: [
                                                    {
                                                        elem: 'col',
                                                        elemMods: { span: '15' },
                                                        content: [
                                                            {
                                                                block: 'post',
                                                                mods: { size: 'l', height: 'l' },
                                                                content: [
                                                                    {
                                                                        tag: 'h1',
                                                                        elem: 'title',
                                                                        mix: { block: 'mr', mods: { b: 'l' } },
                                                                        content: 'Правила перепечатки'
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'При использовании материалов сайта необходимо указывать автора материала, если информация о нём имеется, и ссылку на источник на сайте www.bn.ru.'
                                                                    },
                                                                    {
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: [
                                                                            {
                                                                                tag: 'img',
                                                                                elem: 'image',
                                                                                elemMods: { block: true },
                                                                                attrs: {
                                                                                    src: '../../img/reprint-sample.png',
                                                                                    alt: "Пример правильной перепечатки"
                                                                                }
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        tag: 'p',
                                                                        elem: 'line',
                                                                        mix: { block: 'mr', mods: { b: 'm' } },
                                                                        content: 'Со всеми правилами можно ознакомиться в документе <a href="#">«Правила перепечатки»</a>.'
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
