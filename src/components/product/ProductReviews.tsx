'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import type { PublicReview } from '@/lib/data/reviews';
import { submitReviewAction, type ReviewFormState } from '@/app/urun/[slug]/actions';

function Stars({ value, size = 'text-sm' }: { value: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight text-accent-dark`} aria-label={`${value} / 5`}>
      {'★★★★★'.slice(0, Math.round(value))}
      <span className="text-carbon/20">{'★★★★★'.slice(Math.round(value))}</span>
    </span>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="touch-target bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-full text-sm transition"
    >
      {pending ? 'Gönderiliyor...' : 'Yorumu Gönder'}
    </button>
  );
}

interface Props {
  productId: string;
  slug: string;
  reviews: PublicReview[];
  count: number;
  average: number;
  context: {
    isLoggedIn: boolean;
    hasReviewed: boolean;
    reviewStatus: 'pending' | 'approved' | 'rejected' | null;
    verifiedOrderId: string | null;
  };
}

export function ProductReviews({ productId, slug, reviews, count, average, context }: Props) {
  const [rating, setRating] = useState(0);
  const [state, formAction] = useFormState<ReviewFormState, FormData>(submitReviewAction.bind(null, slug), { error: null });
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    if (state.success) setShowThanks(true);
  }, [state.success]);

  return (
    <section className="max-w-3xl mt-12 pt-10 border-t border-primary/10">
      <div className="flex items-center gap-3 mb-5">
        <h3 className="font-display font-bold text-primary text-base">Müşteri Yorumları</h3>
        {count > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-carbon/60">
            <Stars value={average} /> {average.toFixed(1)} · {count} yorum
          </span>
        )}
      </div>

      {/* Yorum listesi */}
      {reviews.length > 0 ? (
        <div className="space-y-4 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="font-semibold text-sm text-primary">{r.author_name}</span>
                <Stars value={r.rating} />
              </div>
              {r.title && <p className="font-medium text-sm mb-1">{r.title}</p>}
              <p className="text-sm text-carbon/70 leading-relaxed">{r.body}</p>
              <p className="text-[11px] text-carbon/40 mt-2">{new Date(r.created_at).toLocaleDateString('tr-TR')}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-carbon/50 mb-8">Bu ürüne henüz yorum yapılmadı. İlk yorumu siz yapın!</p>
      )}

      {/* Yorum formu */}
      {!context.isLoggedIn ? (
        <p className="text-sm text-carbon/60">
          Yorum yapmak için{' '}
          <Link href={`/giris?redirectTo=/urun/${slug}`} className="text-primary font-semibold underline">
            giriş yapın
          </Link>
          .
        </p>
      ) : context.hasReviewed || showThanks ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          {context.reviewStatus === 'approved'
            ? 'Yorumunuz yayında. Teşekkür ederiz!'
            : 'Yorumunuz alındı, onaylandıktan sonra yayınlanacak. Teşekkür ederiz!'}
        </div>
      ) : (
        <form action={formAction} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <p className="font-display font-bold text-primary text-sm">Yorum Yap</p>
          {context.verifiedOrderId && (
            <p className="text-[11px] text-green-700 font-semibold">✓ Doğrulanmış alışveriş</p>
          )}

          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="rating" value={rating} />

          <div className="flex items-center gap-1" role="radiogroup" aria-label="Puan">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} yıldız`}
                className={`text-2xl leading-none transition ${n <= rating ? 'text-accent-dark' : 'text-carbon/20 hover:text-carbon/40'}`}
              >
                ★
              </button>
            ))}
          </div>

          <input
            name="title"
            maxLength={120}
            placeholder="Başlık (opsiyonel)"
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={2000}
            placeholder="Deneyiminizi paylaşın..."
            className="w-full bg-cream border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />

          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitBtn />
        </form>
      )}
    </section>
  );
}
