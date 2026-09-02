import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { formatPriceFromCents } from '@/lib/format';
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/email';
import type { OrderStatus } from '@/lib/supabase/types';

// Siparişler /api/checkout üzerinden (bu sayfayı revalidate etmeden) oluşturulur;
// service_role istemcisi çerez taşımadığından Next.js sorguyu varsayılan olarak
// önbelleğe alır ve yeni siparişler listede görünmez. force-dynamic bunu kapatır.
export const dynamic = 'force-dynamic';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['pending', 'paid', 'failed', 'shipped', 'delivered', 'cancelled', 'refunded'])
});

/**
 * Server Action — Next.js bu mutasyona karşı otomatik CSRF koruması uygular
 * (Origin header karşılaştırması, framework içinde yerleşik). Yine de rol
 * kontrolü BURADA (sunucuda) tekrar yapılır: bir Server Action URL'i tahmin
 * edilse/doğrudan çağrılsa bile yetkisiz kullanıcı hiçbir siparişi güncelleyemez.
 * FormData alanları önceden yalnızca `as OrderStatus` ile cast ediliyordu —
 * bu, elle hazırlanmış (form dışından gönderilen) bir istekte rastgele bir
 * string'in doğrudan veritabanına gitmesine izin verirdi; Zod bunu çalışma
 * zamanında gerçekten doğrular.
 */
async function updateOrderStatus(formData: FormData) {
  'use server';
  const parsed = updateOrderStatusSchema.safeParse({
    orderId: formData.get('orderId'),
    status: formData.get('status')
  });
  if (!parsed.success) return;
  const { orderId, status } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single();
  assertRole(profile?.role, 'moderator');

  const serviceClient = createSupabaseServiceRoleClient();
  const { data: current } = await serviceClient.from('orders').select('status').eq('id', orderId).single();
  const previousStatus = current?.status;

  if (previousStatus === status) return;

  const patch: { status: OrderStatus; shipped_at?: string } = { status };
  if (status === 'shipped') patch.shipped_at = new Date().toISOString();
  await serviceClient.from('orders').update(patch).eq('id', orderId);

  // Durum geçişinde müşteriye bilgi e-postası (best-effort; sipariş akışını bozmaz).
  if (status === 'shipped') await sendOrderShippedEmail(orderId);
  else if (status === 'delivered') await sendOrderDeliveredEmail(orderId);

  revalidatePath('/admin/siparisler');
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  paid: 'Ödendi',
  failed: 'Başarısız',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  refunded: 'İade Edildi'
};

export default async function AdminOrdersPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_cents, contact_email, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-6">Siparişler</h1>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-carbon/50">
            <tr>
              <th className="px-4 py-3">Sipariş No</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Toplam</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {orders?.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/siparisler/${order.id}`} className="text-primary hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/60">{order.contact_email}</td>
                <td className="px-4 py-3">{formatPriceFromCents(order.total_cents)}</td>
                <td className="px-4 py-3">
                  <form action={updateOrderStatus} className="flex items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select name="status" defaultValue={order.status} className="text-xs border border-primary/15 rounded-lg px-2 py-1.5 bg-cream">
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs font-semibold text-primary hover:underline">
                      Güncelle
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
