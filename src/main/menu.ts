import { Menu } from 'electron';
import { ImportProject } from './event';
import { mainWindow } from './main';

const template:Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> = [
    {
        label: "File",
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
                    ImportProject()
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
    },
    {
        label: 'Edit',
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
                        }
                    },
                    {
                        label: 'zh_TW',
                        click: () => {
                            mainWindow?.webContents.send('locate', 'zh_TW')
                        }
                    }
                ]
            },
        ]
    },
    {
        label: 'Execute',
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
    },
    {
        label: 'Help',
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

const menu = Menu.buildFromTemplate(template)
export default menu