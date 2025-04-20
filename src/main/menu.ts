import cluster from 'cluster';
import { Menu } from 'electron';
import { mainWindow } from './electron';
import { backendEvent } from './event';
import { i18n } from './plugins/i18n';

const template_file = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    {
        label: i18n.global.t('menu.file'),
        submenu: [
            { 
                label: i18n.global.t('menu.new-project'),
                click: async () => {
                    if(mainWindow == undefined) return;
                    mainWindow.webContents.send('createProject')
                }
            },
            { type : 'separator' },
            { 
                label: i18n.global.t('menu.import'),
                click: async () => {
                    backendEvent.ImportProject()
                }
            },
            { 
                label: i18n.global.t('menu.export'),
                click: async () => {
                    if(mainWindow == undefined) return;
                    mainWindow.webContents.send('menu_export_project')
                }
            },
            { type : 'separator' },
            { label: i18n.global.t('menu.quit'), role: 'quit' }
        ]
    }
]

const template_edit = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    {
        label: i18n.global.t('menu.edit'),
        submenu: [
            { label: i18n.global.t('menu.undo'), role: 'undo' },
            { label: i18n.global.t('menu.redo'), role: 'redo' },
            { type: 'separator' },
            { label: i18n.global.t('menu.cut'), role: 'cut' },
            { label: i18n.global.t('menu.copy'), role: 'copy' },
            { label: i18n.global.t('menu.paste'), role: 'paste' },
            { label: i18n.global.t('menu.delete'), role: 'delete' },
            { type: 'separator' },
            { label: i18n.global.t('menu.selectAll'), role: 'selectAll' },
            { type: 'separator' },
            { 
                label: i18n.global.t('toolbar.setting'),
                click: () => {
                    mainWindow?.webContents.send('setting')
                }
            }
        ]
    }
]

const template_helper = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    {
        label: i18n.global.t('menu.help'),
        submenu: [
            {
                label: 'Console',
                click: () => {
                    mainWindow?.webContents.openDevTools();
                }
            }
        ]
    }
]

const template_server = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    ...template_file(),
    ...template_edit(),
    ...template_helper()
]

const template_client = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    ...template_edit(),
    ...template_helper()
]

export let menu_server:Electron.Menu | undefined = undefined
export let menu_client:Electron.Menu | undefined = undefined

if(cluster.isPrimary){
    menu_server = Menu.buildFromTemplate(template_server())
    menu_client = Menu.buildFromTemplate(template_client())
}

export const setupMenu = () => {
    menu_server = Menu.buildFromTemplate(template_server())
    menu_client = Menu.buildFromTemplate(template_client())
    mainWindow?.setMenu(backendEvent.menu_state ? menu_server : menu_client)
}