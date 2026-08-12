import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          // React oilasi alohida bo'lakda — u deyarli hech qachon o'zgarmaydi,
          // shuning uchun ilova yangilanganda brauzer keshidan olinaveradi.
          manualChunks(id: string) {
            // React oilasi + lucide ikonkalari — qolgani (genai, qrcode)
            // dinamik import bo'lgani uchun rollup o'zi ajratadi.
            //
            // ⚠️ lucide-react SHU YERDA bo'lishi SHART. Bo'lmasa rollup har
            // ikonkani alohida faylga ajratadi (33 ta fayl, jami atigi 15 KB)
            // — telefonda hajm emas, SO'ROVLAR SONI sekinlashtiradi:
            // o'lchovda bitta 0.3 KB ikonka 3.5 soniya navbatda turdi.
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|lucide-react)[\\/]/.test(id)) {
              return 'vendor';
            }
          },
        },
      },
    }
  };
});
