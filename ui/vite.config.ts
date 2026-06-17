import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
	server: {
		port: 3001,
	},
	plugins: [
		vue(),
		tailwindcss(),
		tsconfigPaths(),
		Components({
			resolvers: [PrimeVueResolver()],
		}),
	],
	css: {
		preprocessorOptions: {
			less: {
				javascriptEnabled: true,
			},
		},
	},
	resolve: {
		// alias: [
		// 	{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
		// 	{ find: '@assets', replacement: fileURLToPath(new URL('./src/assets', import.meta.url)) },
		// 	{ find: '@components', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
		// 	{ find: '@stores', replacement: fileURLToPath(new URL('./src/stores', import.meta.url)) },
		// 	{ find: '@styles', replacement: fileURLToPath(new URL('./src/styles', import.meta.url)) },
		// 	{ find: '@views', replacement: fileURLToPath(new URL('./src/views', import.meta.url)) },
		// ],
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@assets': path.resolve(__dirname, './src/assets'),
			'@components': path.resolve(__dirname, './src/components'),
			'@stores': path.resolve(__dirname, './src/stores'),
			'@styles': path.resolve(__dirname, './src/styles'),
			'@views': path.resolve(__dirname, './src/views'),
		},
	},
});
