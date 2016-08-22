({
	shouldDeps: [
		{ elems: [
			{ block: 'link' },
			{ elem: 'add-to-favorites', mods : { added : 'true' } },
			{ elem: 'add-to-lists', mods : { added : 'true' } },
			{ elem: 'add-note', mods : { added : 'true' } },
			{ elem: 'input-for-note' },
			{ elem: 'note-button' },
			{ elem: 'note-status' },
			{ elem: 'note' }
		]},
		{ block: 'textarea', mods: { width: 'available' } },
		{ block: 'icon' }
	]
})