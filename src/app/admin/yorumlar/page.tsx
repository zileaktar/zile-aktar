import Link from 'next/link';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { moderateReviewAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { pending: 'Bekliyor', approved: 'Onaylı', rejected: 'Reddedildi' };

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author_name: string;
  status: string;
  created_at: string;
  products: { name: string; slug: string } | { name: string; slug: string }[] | null;
}

function ModButton({ id, action, label, className }: { id: string; action: string; label: string; className: string }) {
  return (
    <form action={moderateReviewAction}>
      <input type="hidden" name="reviewId" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className={`text-xs font-semibold hover:underline ${className}`}>{label}</button>
    </form>
  );
}

function ReviewCard({ r }: { r: ReviewRow }) {
  const product = Array.isArray(r.products) ? r.products[0] : r.products;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <span className="text-accent-dark text-sm">{'★'.repeat(r.rating)}</span>
          <span className="text-carbon/20 text-sm">{'★'.repeat(5 - r.rating)}</span>
          <span className="ml-2 text-sm font-semibold text-primary">{r.author_name}</span>
          {product && (
            <Link href={`/urun/${product.slug}`} className="ml-2 text-xs text-carbon/50 hover:underline">
              {product.name}
            </Link>
          )}
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream text-carbon/60">
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      </div>
      {r.title && <p className="font-medium text-sm">{r.title}</p>}
      <p className="text-sm text-carbon/70 leading-relaxed">{r.body}</p>
      <p className="text-[11px] text-carbon/40 mt-1.5">{new Date(r.created_at).toLocaleString('tr-TR')}</p>
      <div className="flex gap-3 mt-3">
        {r.status !== 'approved' && <ModButton id={r.id} action="approve" label="Onayla" className="text-green-700" />}
        {r.status !== 'rejected' && <ModButton id={r.id} action="reject" label="Reddet" className="text-amber-700" />}
        <ModButton id={r.id} action="delete" label="Sil" className="text-red-500" />
      </div>
    </div>
  );
}

export default async function AdminReviewsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, title, body, author_name, status, created_at, products(name, slug)')
    .order('created_at', { ascending: false })
    .limit(100);

  const reviews = (data ?? []) as unknown as ReviewRow[];
  const pending = reviews.filter((r) => r.status === 'pending');
  const others = reviews.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-primary">Ürün Yorumları</h1>

      <div>
        <h2 className="font-semibold text-primary mb-3">Onay Bekleyenler ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-carbon/50">Onay bekleyen yorum yok.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div>
          <h2 className="font-semibold text-carbon/60 mb-3">Geçmiş</h2>
          <div className="space-y-3">
            {others.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
