([{
	tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'search_results_item' },
    ]
},
{
	shouldDeps: [
		{
			block: 'radio-group',
			mods: { theme: 'islands', size: 'm', type: 'button' }
		},
		{
			block: 'search_results',
			mods: { without: 'map' }
		},
		{ block: 'help' },
		{
			block: 'button',
			mods: { theme: 'islands', size: 'l', type: 'button' }
		},
		{ block: 'spin', mods: { theme: 'islands', size: 'm' }}
	]
}])