([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'menu'}
    ]
},
{
    shouldDeps: [
        { block: 'menu', mods: { theme: 'island' } },
        { block: 'button', mods: { theme: 'island', type: 'link'} },
        { block: 'plain_text' },
    ]
}])
