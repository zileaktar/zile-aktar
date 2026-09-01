/**
 * `products.description` alanı artık başlıklı/madde işaretli, çok bölümlü
 * zengin metin içerebilir (Ürün Hakkında, Öne Çıkan Özellikleri, Kullanım
 * Şekli, Saklama Koşulları, Önemli Uyarılar). Tam bir Markdown kütüphanesi
 * eklemek yerine, yalnızca ihtiyacımız olan 4 basit kalıbı ayrıştıran hafif
 * ve güvenli (dangerouslySetInnerHTML KULLANMAYAN) bir ayrıştırıcı:
 *
 *   "## Başlık"   -> alt başlık
 *   "- madde"     -> madde işaretli liste (ardışık satırlar tek <ul> olur)
 *   "⚠️ ..."      -> vurgulu uyarı kutusu (ardışık satırlar tek kutuda birleşir)
 *   diğer her şey -> normal paragraf
 */
export function RichProductDescription({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let warningBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc pl-5 space-y-1.5 text-sm text-carbon/70 leading-relaxed mb-4">
        {listBuffer.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  function flushWarning() {
    if (warningBuffer.length === 0) return;
    blocks.push(
      <div key={`warn-${blocks.length}`} className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4 space-y-1.5">
        {warningBuffer.map((item, i) => (
          <p key={i} className="text-xs text-primary-dark leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    );
    warningBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      flushList();
      flushWarning();
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="font-display font-bold text-primary text-base mt-5 mb-2 first:mt-0">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      flushWarning();
      listBuffer.push(line.slice(2));
    } else if (line.startsWith('⚠️')) {
      flushList();
      warningBuffer.push(line);
    } else if (line.length === 0) {
      flushList();
      flushWarning();
    } else {
      flushList();
      flushWarning();
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm text-carbon/70 leading-relaxed mb-3">
          {line}
        </p>
      );
    }
  }
  flushList();
  flushWarning();

  return <div>{blocks}</div>;
}
