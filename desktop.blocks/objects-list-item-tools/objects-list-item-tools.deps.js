([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'popup', mods: { theme : 'islands', target: 'anchor', autoclosable: true, closable: true } },
        { tech: 'bemhtml', block: 'objects-list-item-lists' },
        { tech: 'bemhtml', block: 'objects-list-item-note' }
    ]
},
{
    shouldDeps: [
        { block: 'querystring' },
        { block: 'icon' },
        { block: 'link', mods: { theme: 'islands', pseudo: true } },
        { block: 'popup', mods: { theme: 'islands', target: 'anchor', autoclosable: true, closable: true } },
        { block: 'objects-list-item-lists' },
        { block: 'objects-list-item-note' },

    ]
}])