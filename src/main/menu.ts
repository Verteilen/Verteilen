import { dialog, Menu } from 'electron';
import { mainWindow } from './main';


const template:Array<(Electron.MenuItemConstructorOptions) | (Electron.MenuItem)> = [
    {
        label: "檔案",
        submenu: [
            { 
                label: "新增專案",
                click: async () => {
                    if(mainWindow == undefined) return;
                    mainWindow.webContents.send('createProject')
                }
            },
            { type : 'separator' },
            { 
                label: "匯入專案",
                click: async () => {
                    if(mainWindow == undefined) return;
                    dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile'],
                        filters: [
                            { name: 'JSON', extensions: ['json'] },
                        ]
                    }).then(v => {
                        
                    })
                }
            },
            { 
                label: "匯出專案 (全部)",
                click: async () => {
                    if(mainWindow == undefined) return;
                    dialog.showOpenDialog(mainWindow, {
                        properties: ['openDirectory']
                    }).then(v => {
                        
                    })
                }
            },
            { type : 'separator' },
            { label: '退出', role: 'quit' }
        ]
    },
    {
        label: '編輯',
        submenu: [
            { label: '撤銷', role: 'undo' },
            { label: '重作', role: 'redo' },
            { type: 'separator' },
            { label: '剪下', role: 'cut' },
            { label: '複製', role: 'copy' },
            { label: '貼上', role: 'paste' },
            { label: '刪除', role: 'delete' },
            { type: 'separator' },
            { label: '選擇全部', role: 'selectAll' }
        ]
    },
    {
        label: '執行',
        submenu: [
            {
                label: '執行所有'
            },
            {
                label: '執行所有 (強制)'
            }
        ]
    },
    {
        label: '幫助',
        submenu: [
            ...process.env.NODE_ENV === 'development' ? [
                {
                    label: '控制台',
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