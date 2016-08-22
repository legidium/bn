([{
	tech: 'js',
	mustDeps: [
		{ tech: 'bemhtml', block: 'i-bem' },
    	{ tech: 'bemhtml', block: 'dropdown' },
    	{ tech: 'bemhtml', block: 'voprosique' },
    	{ tech: 'bemhtml', block: 'user_lists_in_search' },
    	{ tech: 'bemhtml', block: 'user_comments_in_search' }
	],
},
{
	shouldDeps: [
		{ block: 'dropdown', mods: {theme: 'islands', switcher : 'link',} },
        { block: 'voprosique' },
		{ block: 'embed' },
		{ block: 'icon' },
	]
}])