([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem'},
        { tech: 'bemhtml', block: 'account-my-lists-list-item' },
    ]
},
{
    shouldDeps: [
        { block: 'account-my-lists-list-toolbar' },
        { block: 'account-my-lists-list-item' },
        { block: 'account-my-lists-list-pager' }
    ]
}])
