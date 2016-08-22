([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' }
    ]
},
{
    shouldDeps: [
        { block: 'link' },
        { block: 'help' },
        { block: 'input', mods: { theme: 'islands' }},
        { block: 'textarea', mods: { theme: 'islands', size: 'm', width: 'available' }},
        { block: 'button', mods: { theme: 'islands', size: 'm', type: 'submit' }},
        { block: 'button', mods: { theme: 'island', type: 'link'} }
    ]
}])
