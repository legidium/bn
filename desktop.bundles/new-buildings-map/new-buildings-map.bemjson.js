({
    block: 'page',
    title : 'Новостройки, карта',
    head : [
        { elem : 'meta', attrs : { name : 'description', content : '' } },
        { elem : 'meta', attrs : { name : 'viewport', content : 'width=device-width, initial-scale=1' } },
        { elem : 'css', url : '_new-buildings-map.css' }
    ],
    scripts: [{ elem : 'js', url : '_new-buildings-map.js' }],
    content: {
        block: 'layout',
        content: [
            {
                block: 'header'
            },
            {
                 block: 'new-buildings-map'
            },
            {
                block: 'footer'
            }
        ]
    }
})
