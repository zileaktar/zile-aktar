'use client';

import { createContext, useContext, useTransition, type FormHTMLAttributes, type Ref } from 'react';

/*
 * React 19'da `<form action={fn}>` ile gönderilen form, işlem bitince
 * OTOMATİK SIFIRLANIR. Sunucu bir doğrulama hatası döndürdüğünde (ör. "puan
 * seçin", "IBAN geçersiz") kullanıcının yazdığı her şey silinip gidiyordu.
 * ActionForm aynı işi `onSubmit` + `startTransition` ile yapar: form
 * sıfırlanmaz, yazılanlar yerinde kalır. Başarıda sıfırlamak isteyen bileşen
 * zaten `formRef.current?.reset()` çağırıyor.
 *
 * `useFormStatus` yalnızca `action` prop'uyla gönderilen formlarda çalıştığı
 * için "Kaydediliyor…" durumu `useActionFormPending()` ile okunur.
 */

const PendingContext = createContext(false);

/** ActionForm içindeki gönder düğmeleri için: işlem sürüyor mu? */
export function useActionFormPending(): boolean {
  return useContext(PendingContext);
}

type ActionFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'action' | 'onSubmit'> & {
  action: (formData: FormData) => void;
  ref?: Ref<HTMLFormElement>;
};

export function ActionForm({ action, children, ref, ...rest }: ActionFormProps) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={ref}
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return; // çift tıklamada ikinci gönderim yok
        // submitter: birden fazla gönder düğmesi olursa hangisine basıldığı da gitsin
        // (eski tarayıcılar ikinci parametreyi yok sayar).
        const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => action(formData));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}
