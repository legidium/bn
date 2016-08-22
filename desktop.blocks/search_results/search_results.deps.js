([{
	tech: 'js',
    mustDeps: [
    	{ tech: 'bemhtml', block: 'i-bem' },
        { tech: 'bemhtml', block: 'search_results_item' },
        
    ]
},
{
	shouldDeps: [
		{ block: 'icon' },
		{ block: 'popup' },
		{ block: 'dropdown', mods : { switcher : 'link', theme : 'islands' } },
		{ block: 'button'},
		{ block: 'link'},
		{ block: 'voprosique' },
		{ block: 'user_lists_in_search' },
		{ block: 'user_comments_in_search' },
		{ tech: 'bemhtml', block: 'search_results_item' },
	]
}])
