import { Menu } from 'electron';
import { mainWindow } from './main';


const template:Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> = [
    {
        label: "File",
        submenu: [
            { 
                label: "New Project",
                click: async () => {
                    
                }
            },
            { type : 'separator' },
            { 
                label: "Import Project",
                click: async () => {
                    
                }
            },
            { 
                label: "Export Project",
                click: async () => {
                    
                }
            },
            { type : 'separator' },
            { role: 'quit' }
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
            { role: 'selectAll' }
        ]
    },
    {
        label: 'Action',
        submenu: [
            {
                label: 'Run All'
            },
            {
                label: 'Run All (Force)'
            }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            },
            ...process.env.NODE_ENV === 'development' ? [
                {
                    label: 'console',
                    click: async () => {
                        mainWindow?.webContents.openDevTools();
                    }
                }
            ] : []
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
export default menu