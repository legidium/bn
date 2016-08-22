([{
	tech: 'js',
	mustDeps: [
		{ tech: 'bemhtml', block: 'i-bem' },
		{ tech: 'bemhtml', block: 'address_list_item' }
	]
},
{
	shouldDeps: [
		{ block: 'address_list_item' },
		{ block: 'icon', mods: { action: 'remove' } }
	]
}])