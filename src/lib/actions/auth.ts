'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Çıkış (sign out) SUNUCU tarafında yapılmalıdır: oturum çerezleri middleware ve
 * server client tarafından `httpOnly: true` olarak yazılıyor — tarayıcıdaki
 * JavaScript bu çerezleri okuyamaz/silemez. Bu yüzden istemci tarafı
 * `supabase.auth.signOut()` çağrısı çerezi temizleyemiyor ve bir sonraki istekte
 * middleware kullanıcıyı hâlâ oturum açmış görüyordu.
 *
 * Bir Server Action içinde çerez YAZMAK serbesttir; `signOut()` burada çağrıldığında
 * server client'ın `setAll` fonksiyonu çerezleri (aynı httpOnly seçenekleriyle)
 * süresi dolmuş olarak set eder → oturum gerçekten kapanır.
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
