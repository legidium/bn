({
    shouldDeps: [
        { elem: 'action-save-pdf' },
        { elem: 'action-send' },
        { elem: 'action-share' },
        { elem: 'action-print' },

        { block: 'button', mods: { theme: 'islands', size: 'm', view: 'plain' } },
        { block: 'dropdown', mods: { switcher: 'button', theme: 'islands', size: 'm' } },
        { block: 'send_search_results' },
        { block: 'share_search_results' }
    ]
})