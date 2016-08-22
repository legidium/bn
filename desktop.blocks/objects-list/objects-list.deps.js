([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem'},
        { tech: 'bemhtml', block: 'objects-list-item' },
        { tech: 'bemhtml', block: 'checkbox', mods: { theme: 'islands', size: 'm' } }
    ]
},
{
    shouldDeps: [
        { block: 'checkbox', mods: { theme: 'islands', size: 'm' } } ,
        { block: 'objects-list-item' },
        { block: 'pagination' }
    ]
}])