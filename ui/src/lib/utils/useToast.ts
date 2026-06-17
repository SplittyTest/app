import { app } from '@/main';
export default function useToast() {
	return app.config.globalProperties.$toast;
}
