({
    block: 'page',
    title : 'Ошибка 404',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_error-404.css' }
    ],
    scripts: [{ elem : 'js', url : '_error-404.js' }],
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
                                elem: 'middle',
                                content: [
                                    {
                                        block: 'error-404',
                                        content: [
                                            {
                                                elem: 'title',
                                                mix: { block: 'pd', mods: { l: true } },
                                                content: 'Всё в порядке, сайт работает, но запрашиваемая страница не найдена.'
                                            },
                                            {
                                                elem: 'content',
                                                content: [
                                                    {
                                                        tag: 'a',
                                                        attrs: { href: '#' },
                                                        elem: 'link',
                                                        elemMods: { home: true }
                                                    },
                                                    {
                                                        tag: 'a',
                                                        attrs: { href: '#' },
                                                        elem: 'link',
                                                        elemMods: { search: true }
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
