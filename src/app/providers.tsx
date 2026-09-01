'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CartHydrator } from '@/components/providers/CartHydrator';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState içinde oluşturulur ki her render'da yeni QueryClient yaratılmasın
  // (SSR'da isteğe özel, client'ta uygulama ömrü boyunca tek instance).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartHydrator />
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
