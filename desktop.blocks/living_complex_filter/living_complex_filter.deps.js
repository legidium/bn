([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem'},
        { tech: 'bemhtml', block: 'account-dashboard-list-item' }
    ]
},
{
	shouldDeps: [
		{ block: 'checkbox-group', mods: { theme: 'islands', size: 'm', type: 'button' } },
		{ block: 'input', mods: { theme : 'islands', size : 'm', width: 's',  nocorners: true } },
		{ block: 'control-group' },
		{ block: 'controls_row' },
		{ block: 'menu', mods: { theme : 'islands', size : 'm', mode : 'check' } },
		{ block: 'new-buildings-select-class-popup' },
		{ block: 'plain_text' },
		{ block: 'spin', mods: { theme : 'islands', size : 'm', visible : true }},
		{ block: 'checkbox', mods: { theme : 'islands', } },
		{ block: 'select',  mods : { mode : 'radio', theme : 'islands', size : 'm' }, },
		{ block: 'radio-group',  mods : { theme : 'islands', size : 'm', type : 'button' }, },
		

	]
}])