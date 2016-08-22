({
    block: 'page',
    title : 'Новостройки',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_new-buildings.css' }
    ],
    scripts: [{ elem : 'js', url : '_new-buildings.js' }],
    content: {
        block: 'layout',
        content: [
            {
                block: 'header'
            },
            {
                block: 'new-buildings-content',
                content: [
                    {
                        elem: 'top',
                        content: [
                            {
                                elem: 'title',
                                content: 'Полная база новостроек Санкт-Петербурга',
                            },
                            {
                                elem: 'filter',
                                content: [
                                    {
                                        block: 'new-buildings-filter',
                                        js: { url: '/desktop.blocks/new-buildings-filter/test.json' },
                                        mix: {
                                            block: 'new_buildings_filter_controller',
                                            js: {
                                                searchPageUrl: '/desktop.bundles/new-buildings-search/new-buildings-search.html',
                                                id: 1
                                            }
                                        },
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        elem: 'body',
                        content: [
                            {
                                elem: 'list',
                                content: [
                                    {
                                        block: 'content_layout',
                                        content: [
                                            {
                                                elem: 'left',
                                                content: [
                                                    {
                                                        block: 'new-buildings-list',
                                                        mix: { block: 'new_buildings_filter_controller', js: { id: 1 } },
                                                        items: []
                                                    }
                                                ]
                                            },
                                            {
                                                elem: 'right',
                                                content: [
                                                    {
                                                        block: 'new-buildings-sidebar',
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                elem: 'empty',
                            }
                        ]
                    }
                ]
            },
            {
                block: 'footer'
            }
        ]
    }
})
