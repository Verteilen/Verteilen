const Path = require('path');
const vuePlugin = require('@vitejs/plugin-vue')

const { defineConfig } = require('vite');
import { VitePWA } from 'vite-plugin-pwa'
import IconsResolve from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import Components from 'unplugin-vue-components/vite';

/**
 * https://vitejs.dev/config
 */
const config = defineConfig({
    root: Path.join(__dirname, 'src', 'renderer'),
    publicDir: 'public',
    server: {
        port: 8080,
        open: false
    },
    open: false,
    build: {
        outDir: Path.join(__dirname, 'build', 'renderer'),
        chunkSizeWarningLimit: 1600,
        emptyOutDir: true
    },
    plugins: [
        VitePWA(
            { 
                includeAssets: ['icon/icon.ico', 'icon/icon.jpg', 'icon/icon.png'],
                registerType: 'autoUpdate',
                injectRegister: false,
                manifest: {
                    name: "Verteilen Compute Server",
                    short_name: "Verteilen",
                    display: "standalone",
                    description: 'Compute tool for multi computer',
                    background_color: "#000000",
                    theme_color: '#ffffff',
                    start_url: '.',
                    icons: [
                        {
                            src: 'icon/icon.png',
                            sizes: '494x493',
                            type: 'image'
                        }
                    ]
                }
            }
        ),
        vuePlugin(
            { 
                script: {
                    defineModel: true 
                }
            }
        ),
        Components({
            resolvers: [IconsResolve()],
            dts: true,
        }),
        Icons({
            compiler: 'vue3',
            autoInstall: true,
        })
    ],
    define: {
        __INTLIFY_JIT_COMPILATION__: true
    },
});

module.exports = config;
