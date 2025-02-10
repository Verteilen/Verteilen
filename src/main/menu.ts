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
            { label: '選擇全部', role: 'selectAll' },
            { type: 'separator' },
            { 
                label: "語言",
                submenu: [
                    {
                        label: 'en',
                        click: async () => {
                            mainWindow?.webContents.send('locate', 'en')
                        }
                    },
                    {
                        label: 'zh_TW',
                        click: async () => {
                            mainWindow?.webContents.send('locate', 'zh_TW')
                        }
                    }
                ]
            },
        ]
    },
    {
        label: '執行',
        submenu: [
            {
                label: '執行所有'
            },
            {
                label: '執行所有 (保留)'
            }
        ]
    },
    {
        label: '幫助',
        submenu: [
            {
                label: "說明",
                click: async () => {
                    console.log("[工具欄] 打開說明")
                    mainWindow?.webContents.send('show_helper')
                }
            },
            {
                label: '控制台',
                click: async () => {
                    mainWindow?.webContents.openDevTools();
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
export default menu