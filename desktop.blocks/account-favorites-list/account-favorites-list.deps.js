([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'account-favorites-list-item' }
    ]
},
{
    shouldDeps: [
        { block: 'account-favorites-list-toolbar' },
        { block: 'account-favorites-list-item' },
        { block: 'account-favorites-list-pager' },
        { block: 'button', mods: { theme: 'islands', size: 'l' } },
        { block: 'help' },
        { tech: 'bemhtml', block: 'i-bem' }
    ]
}])
