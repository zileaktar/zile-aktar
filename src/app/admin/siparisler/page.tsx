import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { assertRole } from '@/lib/rbac';
import { assertAal2 } from '@/lib/admin-auth';
import { formatPriceFromCents, formatDateTimeTR, formatOrderTimeTR } from '@/lib/format';
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
  await assertAal2(supabase);

  const serviceClient = createSupabaseServiceRoleClient();
  const { data: current } = await serviceClient.from('orders').select('status').eq('id', orderId).single();
  const previousStatus = current?.status;

  if (previousStatus === status) return;

  const patch: { status: OrderStatus; shipped_at?: string; delivered_at?: string } = { status };
  if (status === 'shipped') patch.shipped_at = new Date().toISOString();
  if (status === 'delivered') patch.delivered_at = new Date().toISOString();
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

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_cents: number;
  contact_email: string;
  created_at: string;
}

/**
 * Durum değiştirme kontrolü — hem mobil kartta hem masaüstü tabloda aynısı.
 * Başarısız (ödemesi alınmamış) siparişte yapılacak işlem yok; menüde 'failed'
 * seçeneği olmadığı için eskiden ilk seçenek "Beklemede" görünüp yanıltıyordu.
 */
function StatusControl({ order }: { order: OrderRow }) {
  if (order.status === 'failed') {
    return (
      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
        Ödeme başarısız
      </span>
    );
  }
  return (
    <form action={updateOrderStatus} className="flex items-center gap-2">
      <input type="hidden" name="orderId" value={order.id} />
      <select
        name="status"
        defaultValue={order.status}
        aria-label={`${order.order_number} durumu`}
        className="text-xs border border-primary/15 rounded-lg px-2 py-2 bg-cream"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button type="submit" className="touch-target px-2 text-xs font-semibold text-primary hover:underline">
        Güncelle
      </button>
    </form>
  );
}

export default async function AdminOrdersPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, status, total_cents, contact_email, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  const orders = (data ?? []) as OrderRow[];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-6">Siparişler</h1>

      {orders.length === 0 && <p className="text-sm text-carbon/50">Henüz sipariş yok.</p>}

      {/* Telefon: kart görünümü — tablo dar ekrana sığmıyor, sütunlar kesiliyordu. */}
      <div className="sm:hidden space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/siparisler/${order.id}`} className="font-semibold text-primary hover:underline break-all">
                {order.order_number}
              </Link>
              <span className="text-xs text-carbon/60 whitespace-nowrap" title={formatDateTimeTR(order.created_at)}>
                {formatOrderTimeTR(order.created_at)}
              </span>
            </div>
            <div className="text-xs text-carbon/60 break-all">{order.contact_email}</div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="font-semibold text-carbon">{formatPriceFromCents(order.total_cents)}</span>
              <StatusControl order={order} />
            </div>
          </div>
        ))}
      </div>

      {/* Tablet/bilgisayar: tablo. Sığmazsa kendi kutusunda yatay kayar (kesilmez). */}
      {orders.length > 0 && (
        <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-carbon/50">
              <tr>
                <th className="px-4 py-3">Sipariş No</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Toplam</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    <Link href={`/admin/siparisler/${order.id}`} className="text-primary hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-carbon/70" title={formatDateTimeTR(order.created_at)}>
                    {formatOrderTimeTR(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-carbon/60 break-all">{order.contact_email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPriceFromCents(order.total_cents)}</td>
                  <td className="px-4 py-3">
                    <StatusControl order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
