const Path = require('path');
const vuePlugin = require('@vitejs/plugin-vue')

const { defineConfig } = require('vite');
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
    },
    open: false,
    build: {
        outDir: Path.join(__dirname, 'build', 'renderer'),
        chunkSizeWarningLimit: 1600,
        emptyOutDir: true
    },
    plugins: [
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
        }),
    ]
});

module.exports = config;
