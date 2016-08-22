([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'search_map_controls' },
        { tech: 'bemhtml', block: 'search_map_popup' },
        { tech: 'bemhtml', block: 'search_map_results' },
        
    ]
},
{
    shouldDeps: [
        { block: 'i-bem' },
        { block: 'map', mods: {provider: 'yandex'} },
        { block: 'search_map_controls' },
        { block: 'search_map_popup' },
        { block: 'search_map_results' },
        { block: 'input', mods: {theme: 'islands'} },
        { block: 'button', mods: {theme: 'islands'} },
        { block: 'popup', mods: { theme : 'islands', target : 'anchor', autoclosable : true} },
    ]
}])
