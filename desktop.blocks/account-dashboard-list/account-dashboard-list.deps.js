([{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block: 'i-bem'},
        { tech: 'bemhtml', block: 'account-dashboard-list-item'}
    ]
},
{
    shouldDeps: [
        { block: 'account-dashboard-list-tools' },
        { block: 'account-dashboard-list-title-edit' },
        { block: 'account-dashboard-list-comment-edit' },
        { block: 'account-dashboard-list-toolbar' },
        { block: 'account-dashboard-list-item' },
        { block: 'account-dashboard-title-edit' },
        { block: 'send_search_results' },
        { block: 'pager' },

        { block: 'checkbox', mods: { theme: 'islands', size: 'm' } },
        { block: 'dropdown', mods: { switcher: 'link', theme: 'islands' } },
        { block: 'icon', mods: { theme: 'islands' } },
        { block: 'link' },
        { block: 'text' }
    ]
}])