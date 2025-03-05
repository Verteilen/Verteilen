import { Menu } from 'electron';
import { backendEvent } from './event';
import { mainWindow } from './main';
import { i18n } from './plugins/i18n';

const template_file = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    {
        label: i18n.global.t('menu.file'),
        submenu: [
            { 
                label: "New Project",
                click: async () => {
                    if(mainWindow == undefined) return;
                    mainWindow.webContents.send('createProject')
                }
            },
            { type : 'separator' },
            { 
                label: "Import",
                click: async () => {
                    backendEvent.ImportProject()
                }
            },
            { 
                label: "Export (All)",
                click: async () => {
                    if(mainWindow == undefined) return;
                    mainWindow.webContents.send('menu_export_project')
                }
            },
            { type : 'separator' },
            { label: 'Quit', role: 'quit' }
        ]
    }
]

const template_edit = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    {
        label: i18n.global.t('menu.edit'),
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' },
            { type: 'separator' },
            { 
                label: "Language",
                submenu: [
                    {
                        label: 'en',
                        click: () => {
                            mainWindow?.webContents.send('locate', 'en')
                            i18n.global.locale = 'en'
                            setupMenu()
                        }
                    },
                    {
                        label: 'zh_TW',
                        click: () => {
                            mainWindow?.webContents.send('locate', 'zh_TW')
                            i18n.global.locale = 'zh_TW'
                            setupMenu()
                        }
                    }
                ]
            },
        ]
    }
]

const template_execute = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    {
        label: i18n.global.t('menu.execute'),
        submenu: [
            {
                label: 'Run All',
                click: () => {
                    mainWindow?.webContents.send('run_all')
                }
            },
            {
                label: 'Run All (Keep)',
                click: () => {
                    mainWindow?.webContents.send('run_all_keep')
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
    ...template_execute(),
    ...template_helper()
]

const template_client = ():Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> => [
    ...template_edit(),
    ...template_helper()
]

export let menu_server = Menu.buildFromTemplate(template_server())
export let menu_client = Menu.buildFromTemplate(template_client())

export const setupMenu = () => {
    menu_server = Menu.buildFromTemplate(template_server())
    menu_client = Menu.buildFromTemplate(template_client())
    mainWindow?.setMenu(backendEvent.menu_state ? menu_server : menu_client)
}