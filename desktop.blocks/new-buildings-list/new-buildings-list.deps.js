([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'new-buildings-list-item' },
    ]
},
{
    shouldDeps: [
        { block: 'new-buildings-list-toolbar' },
        { block: 'new-buildings-list-item' },
        { elem: 'overlay'},
        { elem: 'empty'},
        { block: 'pagination' },
        { block: 'link' }
    ]
}])
