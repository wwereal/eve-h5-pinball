function getSearchQuery(name: string) {
    const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    const r = window.location.search.substring(1).match(reg);
    if (r !== null) {
        return decodeURIComponent(r[2]!);
    }
    return null;
}
// addVconsole逻辑后续提取到公共package中
const addVconsole = async () => {
    // 当Query中存在_vconsole字样时，即显示vconsole
    if (getSearchQuery('_vconsole') !== null) {
        const VConsole = (await import('vconsole' as any)).default;
        const vConsole = new VConsole();

        // 点击刷新
        const refreshPlugin = new (VConsole as any).VConsolePlugin('refresh_page', 'Refresh');
        refreshPlugin.on('renderTab', (callback: any) => {
            callback('Click Button to reload Page');
        });
        refreshPlugin.on('addTool', (callback: any) => {
            callback([
                {
                    name: 'Reload',
                    onClick: () => {
                        window.location.reload();
                    },
                },
            ]);
        });
        vConsole.addPlugin(refreshPlugin);
    }
};

export default addVconsole;
