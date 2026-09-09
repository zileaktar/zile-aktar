# Ürün ve Afiş Görsel Promptları — Zile Aktar

Bu dosya, admin panelinden (`/admin/urunler`, `/admin/afisler`) yükleyeceğin görseller için
hazır İngilizce prompt'lar içerir (görsel üretim modelleri İngilizce'de daha iyi çalışır).
Claude görsel üretemez/arayamaz — bu metinleri Midjourney, Ideogram, DALL·E/ChatGPT veya
Adobe Firefly gibi bir araca yapıştırıp görseli sen oluşturursun.

**198 ürünün tamamı** aşağıda kategori kategori listelendi. Her ürün için tek satırlık
"ÖZNE" (subject) cümlesi hazır — ortak şablonla birleştirip kullan.

---

# BÖLÜM 1 — Ürün Fotoğrafları

## Ortak Şablon (her ürün için aynı kurallar)

Aşağıdaki her satırdaki "ÖZNE" cümlesini bu şablondaki **{ÖZNE}** yerine koyup tek prompt olarak kullan:

```
Professional e-commerce product photography, square format (1:1, min. 1600x1600px).
Subject: {ÖZNE}.
Centered composition on a soft matte cream (#f4f1ea) background, subtle warm
shadow beneath the product. Soft diffused natural light from upper-left, no
harsh shadows or reflections. Shallow depth of field, tack-sharp focus on the
product, slightly blurred background. Render the product's natural color and
texture accurately and appetizingly. Minimal styling — at most one or two
whole raw ingredients scattered nearby for context. No text, no labels, no
brand logos, no watermark, no hands, no people.
```

Aşağıdaki tablolarda **{ÖZNE}** kısmı her ürün için hazır yazılı — kopyala, yukarıdaki şablondaki
`{ÖZNE}` yerine yapıştır, görsel üretim aracına ver.

---


## Doğal ve Bitkisel Yağlar (70 ürün)

**Bu bölüm TEK TİP çekilir — 70 görsel birbirinin aynısı görünmeli.** Aşağıdaki
**Sabit Yağ Şablonu**nu kullan; her üründe yalnızca **iki yeri** değiştir:
**{YAĞ RENGİ}** ve **{HAM MADDE}** (tablodan al). Şişe, açı, çerçeve, ışık, zemin ve
arka plan HER GÖRSELDE AYNI kalır.

> **Tutarlılık ipucu:** Önce beğendiğin 1 görsel üret, sonra o görseli **referans**
> olarak ver (Midjourney `--sref <link>` veya `--seed <numara>`; ChatGPT/DALL·E'de
> "aynı fotoğraf, aynı şişe ve düzen, sadece yağ rengini ve yanındaki malzemeyi
> değiştir"). Böylece 70 görsel birebir aynı stilde çıkar.

### Sabit Yağ Şablonu

```
Professional e-commerce product photography, square 1:1, minimum 1600x1600px.
One tall, slim, cylindrical 1-litre clear glass bottle (supermarket olive-oil
style: straight vertical sides, long narrow neck, small natural cork stopper).
The bottle is completely bare — absolutely no label, sticker, neck band,
engraving or text anywhere. Bottle standing upright, perfectly centered, filled
to about 90%. Camera straight-on at the bottle's mid-height, eye level, zero
tilt; the bottle takes up about 70% of the frame height. Identical framing
every time.

The oil inside is {YAĞ RENGİ}, shown in its true, natural, realistic colour and
clarity.

Directly in front of the bottle's base, slightly to the right, one small, neat,
tidy cluster of {HAM MADDE}. This is the ONLY other object in the scene.

Background: soft matte cream (#f4f1ea), evenly lit. Surface: pale natural wood.
Soft diffused light from the upper-left; one single soft shadow to the
lower-right; no harsh reflections, no bright hotspots on the glass. Shallow
depth of field — tack-sharp on the bottle and the ingredients, background gently
blurred. Realistic, understated, natural colours (no colour grading, no
stylisation). Elegant, premium, calm, minimal. No text, no numbers, no letters,
no logos, no watermark, no hands, no people.
```

### Ürün tablosu (yalnızca bu iki sütun değişir)

| Ürün | {YAĞ RENGİ} | {HAM MADDE} |
|---|---|---|
| **Acı Badem Yağı** | pale golden yellow | a few bitter almonds, some in the brown shell and some shelled |
| **Ada Çayı Yağı** | pale yellow-green | a fresh sage sprig and a small pinch of dried sage leaves |
| **Alabalık Yağı** | pale golden | one whole fresh trout |
| **Anason Yağı** | almost colourless, faint pale yellow | a small heap of aniseed and one dried anise flower head |
| **Ardıç Yağı** | pale yellow | a short juniper sprig with blue-black juniper berries |
| **Argan Yağı** | rich warm gold | a few cracked argan nuts showing the pale kernels |
| **Aspir Yağı** | pale straw gold | a small handful of orange safflower petals and a few safflower seeds |
| **At Kestanesi Yağı** | pale yellow | two or three horse chestnuts, one still in its spiky green husk |
| **Avokado Yağı** | deep green-gold | one ripe avocado cut in half with the stone in place |
| **Aynısefa Yağı** | warm golden orange | a few bright orange calendula (pot marigold) blossoms |
| **Bamya Tohumu Yağı** | pale green-gold | a couple of dried okra pods split open showing the pale seeds |
| **Bergamut Yağı** | pale greenish yellow | one whole bergamot citrus and a cut half with a glossy leaf |
| **Biberiye Yağı** | pale yellow | two or three fresh rosemary sprigs |
| **Buğday Yağı** | warm amber | a small pile of wheat grains and a few ripe wheat ears |
| **Ceviz Yağı** | light amber | a few walnuts, some whole in shell and one halved |
| **Çam Terebentin Yağı** | almost colourless, very pale | a piece of amber pine resin with a pine cone and a few needles |
| **Çay Ağacı Yağı** | almost colourless, faint pale yellow | a fresh tea tree (melaleuca) sprig with narrow leaves |
| **Çilek Yağı** | pale golden | a few ripe strawberries, one sliced to show the tiny seeds |
| **Çin Yağı** | pale yellow, nearly clear | a few fresh mint leaves and two clear menthol crystals |
| **Çörek Otu Yağı** | dark amber-brown | a small heap of black nigella (black cumin) seeds |
| **Defne Yağı** | dark green | a few dried bay laurel leaves and a small cluster of black laurel berries |
| **Gliserin Yağı** | completely clear and colourless, thick | a folded piece of natural linen cloth (refined product, no single raw ingredient) |
| **Gül Yağı** | very pale yellow | a small handful of fresh pink damask rose petals |
| **Hardal Yağı** | deep golden yellow | a small spoon of yellow and brown mustard seeds and one mustard flower |
| **Haşhaş Yağı** | pale golden | one dried poppy seed pod and a scattering of poppy seeds |
| **Havuç Yağı** | deep orange | two fresh carrots with green tops, one sliced into rounds |
| **Helichrysum (ölmez Çiçek) Yağı** | pale yellow | a small bunch of dried yellow immortelle (helichrysum) flowers |
| **Hindistan Cevizi Yağı** | clear, faintly pale liquid | half a coconut showing the white flesh and a piece of husk |
| **Hint Yağı** | clear pale yellow, thick and glossy | a small pile of mottled castor beans and one castor leaf |
| **Hodan Yağı** | pale gold | a few star-shaped blue borage flowers |
| **Isırgan Tohumu Yağı** | greenish gold | a cluster of green nettle seeds on a nettle leaf |
| **İncir Çekirdeği Yağı** | pale gold | one fig cut in half showing the seeds and one whole fig |
| **Jojoba Yağı** | clear bright gold | a small heap of brown jojoba seeds |
| **Kabak Çekirdeği Yağı** | very dark green, almost black-green | a handful of green hulled pumpkin seeds and a few in the shell |
| **Kakao Yağı** | pale ivory, soft semi-solid | a cracked cacao pod showing beans and a few whole cocoa beans |
| **Karabaş Otu Yağı** | pale yellow | a small bunch of dried French lavender (Lavandula stoechas) flowers |
| **Karanfil Yağı** | pale to medium amber | a small heap of dried clove buds |
| **Karınca Yumurtası Yağı** | pale yellow | a small pale mound of ant eggs (pupae) |
| **Kayısı Çekirdeği Yağı** | pale golden | a few apricot kernels and one fresh apricot halved to show the stone |
| **Kekik Yağı** | pale amber | two or three sprigs of dried thyme |
| **Kenevir Yağı** | green-gold | a small pile of hemp seeds and one hemp leaf |
| **Keten Yağı** | golden yellow | a spoon of golden-brown flax seeds and one pale blue flax flower |
| **Lavanta Yağı** | pale yellow, nearly clear | a small bundle of dried lavender flower spikes |
| **Limon Yağı** | pale yellow | one whole lemon, a cut half and a leaf |
| **Melisa Yağı** | pale yellow | a fresh sprig of lemon balm leaves |
| **Mür Yağı** | amber-brown | a few reddish-brown pieces of myrrh resin |
| **Nane Yağı** | pale yellow, nearly clear | a small bunch of fresh mint leaves |
| **Nar Çekirdeği Yağı** | golden yellow | half a pomegranate showing the ruby arils and a few loose seeds |
| **Niaouli Yağı** | pale yellow, nearly clear | a fresh niaouli (melaleuca) sprig with slender leaves |
| **Okaliptus Yağı** | almost colourless, very pale | a sprig of silvery-green eucalyptus leaves |
| **Ozon Yağı** | pale, thick and cloudy (ozonated) | a few olives and a small olive branch |
| **Papatya Yağı** | pale golden yellow | a small handful of fresh chamomile flowers |
| **Portakal Yağı** | pale orange-yellow | one whole orange, a cut half and a blossom with a leaf |
| **Rezene Yağı** | pale yellow | a spoon of fennel seeds and a feathery fennel frond |
| **Sandal Ağacı Yağı** | pale gold, thick | a few pale sandalwood chips and a small billet of sandalwood |
| **Sarı Kantaron Yağı** | deep ruby red | a small bunch of fresh yellow St John's wort flowers |
| **Sarı Sabır (aleovera) Yağı** | pale yellow-green | one thick aloe vera leaf cut to show the clear gel |
| **Sarımsak Yağı** | pale yellow | one whole garlic bulb and a few loose cloves |
| **Sedir Ağacı Yağı** | pale yellow, thick | a small pile of cedarwood shavings and a cedar sprig |
| **Sığla Ağacı Yağı** | warm amber | a piece of Anatolian sweetgum (storax) resin and a sweetgum leaf |
| **Susam Yağı** | warm amber-gold | a spoon of white and black sesame seeds |
| **Tatlı Badem Yağı** | very pale gold | a few sweet almonds (some in shell, some shelled) and an almond blossom |
| **Tesbih Ağacı Yağı** | pale yellow | a small heap of round chinaberry (soapberry) seeds |
| **Üzüm Çekirdeği Yağı** | pale green-gold | a small bunch of grapes and a scattering of grape seeds |
| **Vanilya Yağı** | pale golden | two or three glossy vanilla pods, one split open |
| **Yasemin Yağı** | pale yellow | a few white star-shaped jasmine flowers |
| **Yılan Yağı** | pale yellow | one smooth dark river stone (no raw ingredient) |
| **Ylang Ylang Yağı** | pale yellow | a couple of drooping yellow ylang-ylang flowers |
| **Zencefil Yağı** | pale yellow to light amber | a knob of fresh ginger root and a few peeled slices |
| **Zeytin Yağı** | golden green | a small cluster of green and black olives on an olive branch with leaves |


## Baharatlar (38 ürün)

| Ürün | {ÖZNE} |
|---|---|
| **Acı Tozbiber** | a small wooden bowl filled with fine "Acı Tozbiber" powder, rich red-orange color |
| **Çiğköfte Baharatı** | a small wooden bowl of the mixed ground spice blend "Çiğköfte Baharatı" |
| **Harnup Toz** | a small wooden bowl of "Harnup Toz", true-to-life color and texture |
| **Havlican Tozu** | a small wooden bowl filled with fine "Havlican Tozu" powder |
| **İsot** | a small wooden bowl of "İsot", true-to-life color and texture |
| **Kabartma Tozu** | a small wooden bowl filled with fine "Kabartma Tozu" powder |
| **Kajun** | a small wooden bowl of "Kajun", true-to-life color and texture |
| **Kakao** | a small wooden bowl of "Kakao", true-to-life color and texture |
| **Karabiber** | a small wooden bowl of "Karabiber", true-to-life color and texture |
| **Karanfil** | a small wooden bowl of "Karanfil", true-to-life color and texture |
| **Karbonat** | a small wooden bowl of "Karbonat", true-to-life color and texture |
| **Kekik** | a small wooden bowl of "Kekik", true-to-life color and texture |
| **Kimyon** | a small wooden bowl of "Kimyon", true-to-life color and texture |
| **Kişniş Tozu** | a small wooden bowl filled with fine "Kişniş Tozu" powder |
| **Köfte Baharatı** | a small wooden bowl of the mixed ground spice blend "Köfte Baharatı" |
| **Kömbe Baharatı** | a small wooden bowl of the mixed ground spice blend "Kömbe Baharatı" |
| **Köri Toz** | a small wooden bowl of "Köri Toz", true-to-life color and texture |
| **Mahlep** | a small wooden bowl of "Mahlep", true-to-life color and texture |
| **Nane** | a small wooden bowl of "Nane", true-to-life color and texture |
| **Orta Acı Pulbiber** | a small wooden bowl overflowing with coarse "Orta Acı Pulbiber" chili flakes, vivid deep red texture |
| **Orta Acı Tozbiber** | a small wooden bowl filled with fine "Orta Acı Tozbiber" powder, rich red-orange color |
| **Osmanlı Baharatı** | a small wooden bowl of the mixed ground spice blend "Osmanlı Baharatı" |
| **Sahlep** | a small wooden bowl of "Sahlep", true-to-life color and texture |
| **Sarımsak Tozu** | a small wooden bowl filled with fine "Sarımsak Tozu" powder |
| **Soğan Tozu** | a small wooden bowl filled with fine "Soğan Tozu" powder |
| **Sucuk Baharatı** | a small wooden bowl of the mixed ground spice blend "Sucuk Baharatı" |
| **Sumak** | a small wooden bowl of "Sumak", true-to-life color and texture |
| **Tatlı Pulbiber** | a small wooden bowl overflowing with coarse "Tatlı Pulbiber" chili flakes, vivid deep red texture |
| **Tatlı Tozbiber** | a small wooden bowl filled with fine "Tatlı Tozbiber" powder, rich red-orange color |
| **Tavuk Baharatı** | a small wooden bowl of the mixed ground spice blend "Tavuk Baharatı" |
| **Toz Karanfil** | a small wooden bowl filled with fine "Toz Karanfil" powder |
| **Toz Tarçın** | a small wooden bowl filled with fine "Toz Tarçın" powder |
| **Yedibahar** | a small wooden bowl of "Yedibahar", true-to-life color and texture |
| **Yenibahar** | a small wooden bowl of "Yenibahar", true-to-life color and texture |
| **Zehir Acı Pulbiber** | a small wooden bowl overflowing with coarse "Zehir Acı Pulbiber" chili flakes, vivid deep red texture |
| **Zehir Zemberek Acı Pulbiber** | a small wooden bowl overflowing with coarse "Zehir Zemberek Acı Pulbiber" chili flakes, vivid deep red texture |
| **Zencefil** | a small wooden bowl of "Zencefil", true-to-life color and texture |
| **Zerdeçal** | a small wooden bowl of "Zerdeçal", true-to-life color and texture |

## Şifalı Bitkiler / Çaylar (60 ürün)

| Ürün | {ÖZNE} |
|---|---|
| **Açlık Otu** | a small kraft paper pouch with loose dried "Açlık Otu" herb leaves spilling gently out |
| **Ada Çayı** | a small kraft paper pouch with loose dried "Ada Çayı" spilling gently out |
| **Ahududu Kökü** | a small wooden bowl of dried "Ahududu Kökü" root pieces, rustic chopped texture |
| **Alıç Çiçeği** | a small glass bowl of loose dried "Alıç Çiçeği" petals |
| **Altın Otu** | a small kraft paper pouch with loose dried "Altın Otu" herb leaves spilling gently out |
| **Aslan Pençesi Otu** | a small kraft paper pouch with loose dried "Aslan Pençesi Otu" herb leaves spilling gently out |
| **Avokado Yaprağı** | a small kraft paper pouch with loose dried "Avokado Yaprağı" leaves spilling gently out |
| **Aynısefa Otu** | a small kraft paper pouch with loose dried "Aynısefa Otu" herb leaves spilling gently out |
| **Ayva Yaprağı** | a small kraft paper pouch with loose dried "Ayva Yaprağı" leaves spilling gently out |
| **Ballı Baba Otu** | a small kraft paper pouch with loose dried "Ballı Baba Otu" herb leaves spilling gently out |
| **Biberiye Otu** | a small kraft paper pouch with loose dried "Biberiye Otu" herb leaves spilling gently out |
| **Böğürtlen Kökü** | a small wooden bowl of dried "Böğürtlen Kökü" root pieces, rustic chopped texture |
| **Böğürtlen Yaprağı** | a small kraft paper pouch with loose dried "Böğürtlen Yaprağı" leaves spilling gently out |
| **Civanperçemi Otu** | a small kraft paper pouch with loose dried "Civanperçemi Otu" herb leaves spilling gently out |
| **Çınar Yaprağı** | a small kraft paper pouch with loose dried "Çınar Yaprağı" leaves spilling gently out |
| **Çoban Çantası** | a small kraft paper pouch with loose dried "Çoban Çantası" spilling gently out |
| **Çoban Çökerten Otu** | a small kraft paper pouch with loose dried "Çoban Çökerten Otu" herb leaves spilling gently out |
| **Defne Yaprağı** | a small kraft paper pouch with loose dried "Defne Yaprağı" leaves spilling gently out |
| **Deve Dikeni Tohumu** | a small wooden bowl of whole dried "Deve Dikeni Tohumu" seeds |
| **Dul Avrat Otu** | a small kraft paper pouch with loose dried "Dul Avrat Otu" herb leaves spilling gently out |
| **Ebegümeci Otu** | a small kraft paper pouch with loose dried "Ebegümeci Otu" herb leaves spilling gently out |
| **Enginar Yaprağı** | a small kraft paper pouch with loose dried "Enginar Yaprağı" leaves spilling gently out |
| **Fesleğen Otu** | a small kraft paper pouch with loose dried "Fesleğen Otu" herb leaves spilling gently out |
| **Funda Yaprağı** | a small kraft paper pouch with loose dried "Funda Yaprağı" leaves spilling gently out |
| **Gül Kurusu** | a small glass bowl of dried "Gül Kurusu" |
| **Hatmi Çiçeği** | a small glass bowl of loose dried "Hatmi Çiçeği" petals |
| **Hayıt Otu** | a small kraft paper pouch with loose dried "Hayıt Otu" herb leaves spilling gently out |
| **Hibiskus Otu** | a small kraft paper pouch with loose dried "Hibiskus Otu" herb leaves spilling gently out |
| **Hindiba Otu** | a small kraft paper pouch with loose dried "Hindiba Otu" herb leaves spilling gently out |
| **Ihlamur** | a small kraft paper pouch with loose dried "Ihlamur" spilling gently out |
| **Isırgan Yaprağı** | a small kraft paper pouch with loose dried "Isırgan Yaprağı" leaves spilling gently out |
| **Karabaş Otu** | a small kraft paper pouch with loose dried "Karabaş Otu" herb leaves spilling gently out |
| **Kedi Otu** | a small kraft paper pouch with loose dried "Kedi Otu" herb leaves spilling gently out |
| **Kırkkilit Otu** | a small kraft paper pouch with loose dried "Kırkkilit Otu" herb leaves spilling gently out |
| **Kiraz Sapı** | a small kraft paper pouch with loose dried "Kiraz Sapı" spilling gently out |
| **Kurt Pençesi Otu** | a small kraft paper pouch with loose dried "Kurt Pençesi Otu" herb leaves spilling gently out |
| **Lavanta Otu** | a small kraft paper pouch with loose dried "Lavanta Otu" herb leaves spilling gently out |
| **Melek Otu** | a small kraft paper pouch with loose dried "Melek Otu" herb leaves spilling gently out |
| **Melisa Limon Kokulu Ot** | a small kraft paper pouch with loose dried "Melisa Limon Kokulu Ot" spilling gently out |
| **Mercan Köşk Otu** | a small kraft paper pouch with loose dried "Mercan Köşk Otu" herb leaves spilling gently out |
| **Meyan Kökü** | a small wooden bowl of dried "Meyan Kökü" root pieces, rustic chopped texture |
| **Mısır Püskülü** | a small kraft paper pouch with loose dried "Mısır Püskülü" spilling gently out |
| **Oğul Otu** | a small kraft paper pouch with loose dried "Oğul Otu" herb leaves spilling gently out |
| **Okaliptus Otu** | a small kraft paper pouch with loose dried "Okaliptus Otu" herb leaves spilling gently out |
| **Ökse Otu** | a small kraft paper pouch with loose dried "Ökse Otu" herb leaves spilling gently out |
| **Papatya** | a small kraft paper pouch with loose dried "Papatya" spilling gently out |
| **Sarı Kantaron** | a small kraft paper pouch with loose dried "Sarı Kantaron" spilling gently out |
| **Sinameki Otu** | a small kraft paper pouch with loose dried "Sinameki Otu" herb leaves spilling gently out |
| **Sinirli Otu** | a small kraft paper pouch with loose dried "Sinirli Otu" herb leaves spilling gently out |
| **Süpürge Tohumu** | a small wooden bowl of whole dried "Süpürge Tohumu" seeds |
| **Şahtere Otu** | a small kraft paper pouch with loose dried "Şahtere Otu" herb leaves spilling gently out |
| **Şerbetçi Otu** | a small kraft paper pouch with loose dried "Şerbetçi Otu" herb leaves spilling gently out |
| **Üzerlik Otu** | a small kraft paper pouch with loose dried "Üzerlik Otu" herb leaves spilling gently out |
| **Yakı Otu** | a small kraft paper pouch with loose dried "Yakı Otu" herb leaves spilling gently out |
| **Yapışkan Andız Otu** | a small kraft paper pouch with loose dried "Yapışkan Andız Otu" herb leaves spilling gently out |
| **Yarpuz Otu** | a small kraft paper pouch with loose dried "Yarpuz Otu" herb leaves spilling gently out |
| **Yasemin Otu** | a small kraft paper pouch with loose dried "Yasemin Otu" herb leaves spilling gently out |
| **Yeşil Yulaf** | a small kraft paper pouch with loose dried "Yeşil Yulaf" spilling gently out |
| **Yoğurt Otu** | a small kraft paper pouch with loose dried "Yoğurt Otu" herb leaves spilling gently out |
| **Zeytin Yaprağı** | a small kraft paper pouch with loose dried "Zeytin Yaprağı" leaves spilling gently out |

## Sabun Çeşitleri (20 ürün)

| Ürün | {ÖZNE} |
|---|---|
| **Anti-akne Kojik Sabunu** | a handmade rustic soap bar of "Anti-akne Kojik Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Ardıç Katranı Sabunu** | a handmade rustic soap bar of "Ardıç Katranı Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Ardıç Katranlı Ve Kükürt Sabunu** | a handmade rustic soap bar of "Ardıç Katranlı Ve Kükürt Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Argan Yağlı Sabun** | a handmade rustic soap bar of "Argan Yağlı Sabun" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Avokado Sabunu** | a handmade rustic soap bar of "Avokado Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Bıttım Sabunu** | a handmade rustic soap bar of "Bıttım Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Biberiyeli Kojik Sabun** | a handmade rustic soap bar of "Biberiyeli Kojik Sabun" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Çay Ağacı Sabunu** | a handmade rustic soap bar of "Çay Ağacı Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Defne Sabunu** | a handmade rustic soap bar of "Defne Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Gül Sabunu** | a handmade rustic soap bar of "Gül Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Keçi Sütlü Kojik Sabunu** | a handmade rustic soap bar of "Keçi Sütlü Kojik Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Kojik Asit Sabunu** | a handmade rustic soap bar of "Kojik Asit Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Kokusuz İhram Sabunu** | a handmade rustic soap bar of "Kokusuz İhram Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Kükürt Sabunu** | a handmade rustic soap bar of "Kükürt Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Lavanta Sabun** | a handmade rustic soap bar of "Lavanta Sabun" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Leke Karşıtı Kojik Sabunu** | a handmade rustic soap bar of "Leke Karşıtı Kojik Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Pirinç Sütlü Kojik Sabunu** | a handmade rustic soap bar of "Pirinç Sütlü Kojik Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Sedir Sabunu** | a handmade rustic soap bar of "Sedir Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Yaşlanma Karşıtı Kojik Sabunu** | a handmade rustic soap bar of "Yaşlanma Karşıtı Kojik Sabunu" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |
| **Zeytinyağlı Sabun** | a handmade rustic soap bar of "Zeytinyağlı Sabun" type, natural color and texture matching its ingredients, slightly textured surface, resting on a small wooden soap dish |

## Sirkeler (10 ürün)

| Ürün | {ÖZNE} |
|---|---|
| **Alıç Sirkesi** | a clear glass bottle of "Alıç Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Ananas Sirkesi** | a clear glass bottle of "Ananas Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Detoks Sirkesi (kayısılı)** | a clear glass bottle of "Detoks Sirkesi (kayısılı)", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Dört Hırsız Sirkesi** | a clear glass bottle of "Dört Hırsız Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Elma Nar Pancar Sirkesi** | a clear glass bottle of "Elma Nar Pancar Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Enginar Sirkesi** | a clear glass bottle of "Enginar Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Enginarlı Elma Sirkesi** | a clear glass bottle of "Enginarlı Elma Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Fermente Pancar** | a clear glass bottle of "Fermente Pancar", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Işgın Kökü Sirkesi** | a clear glass bottle of "Işgın Kökü Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |
| **Sandarak Sakızı Elma Sirkesi** | a clear glass bottle of "Sandarak Sakızı Elma Sirkesi", liquid in its true natural color, a few whole raw ingredients placed beside it |


---

# BÖLÜM 2 — Kampanya Afişi Promptları

Anasayfa carousel'i için (`/admin/afisler`). Bunlar ürün fotoğraflarından FARKLI teknik
kurallara sahip — yatay (21:9), sol tarafı yazı için sade/karanlık bırakılmalı, sağ tarafta
ürün olmalı (mobilde kenarlardan ~%12 kırpılıyor).

## Ortak Şablon (afiş)

```
Ultra high resolution 2400x1030px horizontal banner (21:9 aspect ratio),
professional promotional photography for a Turkish herbalist e-commerce brand.

Composition: keep all important subject matter within the center 76% of the
frame (avoid the outer 12% on left and right edges — cropped on mobile).
Right half (55-85% from left) holds the main subject: {ÖZNE}.
Left 40% of the frame is a softly blurred, darker negative-space background
(deep forest green / warm shadow tones) — clean and uncluttered, reserved
for overlaid text, no objects placed there.

Lighting: warm directional light from the right. Color palette: deep forest
green, cream, amber, warm wood tones. Style: professional editorial food/
product photography, sharp focus on subject, shallow depth of field on
background. No text, no numbers, no logos, no watermark, no people.
```

## Hazır afiş temaları

| Tema | {ÖZNE} | Başlık | Alt başlık | Buton | Bağlantı |
|---|---|---|---|---|---|
| Genel/karşılama | an appetizing arrangement of raw honey in a glass jar with wooden dipper, dried herbs in small bowls, cinnamon sticks and whole spices, on a dark rustic walnut table | Doğadan Gelen Şifa | Hakiki bal, soğuk sıkım yağlar ve şifalı bitkiler — doğrudan üreticiden sofranıza. | Ürünleri Keşfet | / |
| Kış çayları | a steaming glass cup of herbal tea, dried linden/sage, honeycomb, cinnamon sticks | Kışa Hazır Olun | Bağışıklığınızı güçlendiren şifalı bitki çayları şimdi kapınızda. | Çayları İncele | /?kategori=cay |
| İndirim/kampanya | assorted spices in burlap sacks and wooden bowls (sumac, turmeric, black seed, thyme), vibrant natural colors, bright studio lighting | Sezon Fırsatları Başladı | Seçili ürünlerde kaçırılmayacak indirimler. | Fırsatları Gör | / |
| Doğal yağlar | rows of clear glass bottles filled with different colored cold-pressed oils, olive branch beside them | Soğuk Sıkım, Katkısız | Zeytinyağından çörek otu yağına, %100 doğal soğuk sıkım yağlar. | Yağları İncele | /?kategori=yag |
| Ücretsiz kargo | a delivery box being packed with jars and pouches of natural products, wrapped in kraft paper and twine | 700 TL Üzeri Kargo Bedava | Sepetinizi tamamlayın, kargo ücreti bizden. | Alışverişe Başla | / |
| Kurutulmuş biber | dried red chili peppers (whole and crushed pul biber flakes) piled and spilling from a rustic wooden bowl, alongside a small burlap sack, some whole dried peppers strung together hanging slightly in the background | Acısı Damağınızda | Güneşte kurutulmuş, elle hazırlanmış pul biber ve toz biber çeşitleri. | Biberleri İncele | /?kategori=baharat |
| Sabun/kozmetik | handmade natural soap bars stacked and one sliced open showing texture, dried lavender and rose petals scattered around | El Yapımı Doğal Sabunlar | Katkısız, doğal yağlarla üretilen el yapımı sabun çeşitleri. | Sabunları İncele | /?kategori=kozmetik |
| Sirkeler | glass bottles of colorful fruit vinegars (apple, pomegranate, beet) arranged with fresh fruit slices | Doğal Fermente Sirkeler | Elma, nar ve daha fazlası — geleneksel yöntemle üretilen sirkeler. | Sirkeleri İncele | /?kategori=sirke |

**Kullanım:** Yukarıdaki şablondaki `{ÖZNE}`'yi tablodan seçtiğin temanın açıklamasıyla değiştir,
görsel araca ver. Görsel hazır olunca `/admin/afisler`'e yükle, Başlık/Alt başlık/Buton/Bağlantı
sütunlarını aynı satırdan kopyala.

---

## Genel notlar

- **Renk/marka paleti:** koyu orman yeşili (#1b4332), krem (#f4f1ea), amber/hardal sarısı — tüm
  görsellerde bu tonlara yakın dursun ki site ile uyumlu görünsün.
- **Format:** Ürün görselleri **kare (1:1)**, afişler **yatay (21:9)**, min. 1600px genişlik.
- **Metin YOK:** Hiçbir görselde yazı/logo/rakam istemeyin — başlık/fiyat siteden otomatik biniyor.
- İyi sonuç için **Midjourney** veya **Ideogram** öneriyoruz; ChatGPT/DALL·E de dener ama
  kompozisyon talimatlarına (sol/sağ yerleşim, kare format) daha az sadık kalabilir.
- Bir görsel beğenmezsen (ürün kenara çok yakın, renk yanlış vb.) aynı promptu tekrar üret —
  her seferinde farklı bir sonuç çıkar.
