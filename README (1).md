# Pacific Paradox: A Climate Story

> **"Who contributes the least to climate change. Who bears the heaviest consequences."**

Sebuah *scroll-driven data visualisation essay* tentang ketidakadilan iklim di kawasan Pasifik, dibuat untuk **Pacific Dataviz Challenge 2026**.

**Authors:** Muhammad Eka Dimas Saputra · Ni Luh Made Sri Utami · Safa Ayu Artanti  
**Origin:** Indonesia

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Struktur Narasi](#struktur-narasi)
- [Visualisasi & Fitur Interaktif](#visualisasi--fitur-interaktif)
- [Sumber Data](#sumber-data)
- [Teknologi](#teknologi)
- [Struktur File](#struktur-file)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Deploy ke GitHub Pages](#deploy-ke-github-pages)

---

## Tentang Proyek

**Pacific Paradox** menceritakan satu kontradiksi mendasar: negara-negara kepulauan di Pasifik hampir tidak berkontribusi terhadap emisi gas rumah kaca global (kurang dari 0,03% secara kolektif), namun merekalah yang paling merasakan dampak perubahan iklim — mulai dari kenaikan permukaan laut, badai yang semakin kuat, hingga kegagalan panen dan krisis air bersih.

Cerita ini disampaikan bukan melalui teks statis, melainkan melalui **tujuh bab yang terbuka seiring pengguna menggulir halaman**, masing-masing diperkuat oleh visualisasi data interaktif berbasis Apache ECharts.

---

## Struktur Narasi

Halaman dibagi menjadi tujuh bagian yang berurutan secara kausal — setiap bab membangun argumen untuk bab berikutnya.

### Cover — Introduction
Halaman pembuka menampilkan dua statistik ringkasan yang langsung memperkenalkan paradoks utama:
- **Rata-rata emisi GHG per kapita** seluruh negara kepulauan Pasifik (dalam ton CO₂e per orang)
- **Total orang yang terdampak** bencana iklim di seluruh kawasan

Kedua angka ini ditampilkan dengan animasi *count-up* saat halaman pertama kali dibuka, disertai progress bar perbandingan visual untuk memperlihatkan disparitas secara langsung.

---

### Chapter 01 — The Cause
**"They burn almost nothing. The world burns everything."**

Bab pertama membuktikan bahwa negara-negara Pasifik bukan penyebab krisis iklim yang mereka hadapi.

**Visualisasi yang tersedia:**

| Nama Chart | Jenis | Deskripsi |
|---|---|---|
| GHG Emissions per Capita | Horizontal Bar Chart | Semua negara Pasifik diurutkan dari emisi tertinggi ke terendah. Klik sebuah bar untuk memunculkan *callout* yang membandingkan emisi negara tersebut dengan rata-rata global (4,7 ton CO₂e) dan rata-rata Australia (14,2 ton CO₂e). |
| Emission Trends Over Time | Multi-line Chart | Tren emisi per kapita dari tahun 1970 hingga 2024. Pengguna dapat menambah atau menghapus negara dari perbandingan dengan mengklik *chip* nama negara di atas grafik. Default menampilkan Fiji, Kiribati, Tuvalu, dan Samoa. |

**Panel Insight** di samping chart menampilkan:
- Emisi terendah di kawasan (animasi count-up)
- Rata-rata emisi Pasifik vs rata-rata global vs Australia
- Catatan bahwa kontribusi kolektif Pasifik kurang dari 0,03% emisi dunia

---

### Chapter 02 — Evidence
**"The ocean is warming. The rain is shifting. The sea is rising."**

Empat sinyal fisik perubahan iklim, masing-masing diukur secara independen dengan instrumen berbeda, semuanya bergerak ke arah yang sama.

**Kartu Ringkasan (Evidence Cards):**

Empat kartu di atas halaman menampilkan nilai terbaru dan *spark chart* mini untuk:

| Indikator | Representasi |
|---|---|
| 🌡 Sea Surface Temperature Anomaly | Anomali suhu permukaan laut (°C di atas baseline), Fiji |
| ☀️ Land Surface Temperature Anomaly | Anomali suhu daratan (°C di atas baseline), Fiji |
| 🌧 Rainfall Anomaly | Deviasi curah hujan (mm), Fiji |
| 🌊 Sea Level Anomaly | Kenaikan permukaan laut (meter di atas baseline 1993), Fiji |

**Visualisasi Utama:**

| Nama Chart | Jenis | Deskripsi |
|---|---|---|
| Sea Surface Temperature Anomaly | Multi-line Chart | Tren anomali SST per negara dari 1980 hingga 2025. Klik nama negara di legenda untuk mengisolasi tren satu negara saja (*solo highlight*). |
| Sea Level Rise (Cumulative) | Multi-line Chart | Kenaikan kumulatif permukaan laut sejak 1993 dalam meter, untuk negara-negara terpilih. Klik legenda untuk fokus ke satu negara. |

---

### Chapter 03 — Human Cost
**"Behind every number, there are people. Families. Homes."**

Data bencana diterjemahkan menjadi angka kemanusiaan: berapa banyak orang yang benar-benar terdampak, dan berapa besar kerugian ekonomi yang ditinggalkan.

**Visualisasi yang tersedia:**

| Nama Chart | Jenis | Deskripsi |
|---|---|---|
| People Directly Affected by Disasters | Horizontal Bar Chart | Total orang terdampak bencana per negara dari seluruh catatan tersedia. Klik bar untuk melihat persentase kontribusi negara tersebut terhadap total Pasifik. |
| People Affected, Year by Year | Vertical Bar Chart | Total seluruh Pasifik per tahun — memperlihatkan tahun-tahun paling buruk (seperti 2017 yang mencatat 633.584 orang hanya di Fiji). Bar tahun terburuk disorot secara otomatis. |
| Economic Losses from Disasters | Multi-country Bar Chart | Kerugian ekonomi langsung (USD) per negara per tahun. Klik negara di legenda untuk mengisolasi datanya. |

**Panel Insight:**
- Total kumulatif orang terdampak di seluruh Pasifik (animasi count-up)
- Catatan khusus: pada 2017, Fiji mencatat terdampak setara seluruh populasinya; Topan Pam 2015 mempengaruhi 88% populasi Vanuatu

---

### Chapter 04 — Long-term Impact
**"When the harvest fails. When the water runs dry."**

Bab ini menampilkan dampak kronis yang berlangsung diam-diam: bukan bencana tunggal yang dramatis, melainkan erosi bertahap pada ketahanan pangan dan akses air.

**Kartu Metrik (3 kolom):**

| Metrik | Deskripsi |
|---|---|
| Crop Yield | Produktivitas tanaman pangan (kg/ha), Fiji, tahun terbaru + spark chart tren |
| Livestock Yield | Produktivitas ternak (kg/head), Fiji, tahun terbaru + spark chart tren |
| Safe Drinking Water | Persentase populasi dengan akses air minum aman — menampilkan negara dengan akses terendah |

**Visualisasi Utama:**

| Nama Chart | Jenis | Deskripsi |
|---|---|---|
| Safe Drinking Water Access | Horizontal Bar Chart | Akses air minum aman (%) per negara, tahun terbaru. Klik bar untuk callout yang menjelaskan kaitannya dengan gangguan curah hujan dan intrusi air laut. |
| Crop Yields Over Time | Multi-line Chart | Produktivitas tanaman pangan (kg/ha) dari 1961 hingga 2022. Menampilkan tren penurunan jangka panjang yang diperparah oleh cuaca ekstrem. Klik legenda untuk isolasi satu negara. |

---

### Chapter 05 — The Pacific Paradox *(Scrollytelling)*
**"They did not cause this. They cannot escape it."**

Ini adalah bab inti — sebuah *scrollytelling* interaktif di mana visualisasi berubah secara bertahap seiring pengguna menggulir melewati lima langkah narasi.

**Cara kerjanya:**
Pengguna menggulir ke bawah melewati lima panel teks. Setiap panel memicu perubahan animasi pada *scatter chart* yang terpasang secara *sticky* di sisi kiri/atas layar.

| Langkah | Judul | Yang Terjadi pada Chart |
|---|---|---|
| 01/05 | Twelve nations. One ocean. | Semua 12 negara muncul sebagai lingkaran di scatter plot (sumbu X: emisi GHG, sumbu Y: orang terdampak, ukuran lingkaran: jumlah orang terdampak) |
| 02/05 | Most of them barely contribute. | Negara-negara dengan emisi sangat rendah (Marshall Islands, Nauru, Tuvalu, Kiribati) disorot |
| 03/05 | But disasters don't care who is responsible. | Negara yang paling banyak terdampak bencana (Fiji, Solomon Islands, Vanuatu) disorot |
| 04/05 | Low emissions. High impact. Same countries. | Zona paradoks muncul — kuadran kiri-atas yang menunjukkan emisi rendah + dampak tinggi |
| 05/05 | This is not a coincidence. It is a pattern. | Tampilan penuh dengan semua elemen; semua negara terlihat dengan konteks lengkap |

**Interaktivitas tambahan:** Klik lingkaran mana pun untuk melihat detail emisi dan jumlah orang terdampak negara tersebut.

**KPI Row** di bawah scrollytelling merangkum seluruh cerita dalam 4 angka:
- Jumlah negara dengan anomali SST di atas +0,5°C
- Rata-rata emisi GHG Pasifik (ton CO₂e)
- Total orang terdampak bencana di seluruh catatan
- Dampak bencana tertinggi yang pernah dicatat oleh satu negara

**Kutipan penutup bab:**
> *"We are not drowning. We are fighting."* — Pacific Climate Warriors

---

### Conclusion
**"This is what the data leaves us with."**

Empat kartu rekap merangkum temuan dari setiap bab, diikuti pernyataan penutup tentang keadilan iklim.

---

## Visualisasi & Fitur Interaktif

### Ringkasan Semua Chart

| # | ID Element | Jenis Chart | Dataset | Bab |
|---|---|---|---|---|
| 1 | `ghgBarChart` | Horizontal Bar | GHG per capita | Ch. 01 |
| 2 | `ghgLineChart` | Multi-line | GHG trend 1970–2024 | Ch. 01 |
| 3 | `evSSTChart` | Spark line | SST anomaly, Fiji | Ch. 02 |
| 4 | `evTempChart` | Spark line | Land temp anomaly, Fiji | Ch. 02 |
| 5 | `evRainChart` | Spark line | Rainfall anomaly, Fiji | Ch. 02 |
| 6 | `evSeaChart` | Spark line | Sea level anomaly, Fiji | Ch. 02 |
| 7 | `sstLineChart` | Multi-line | SST per negara 1980–2025 | Ch. 02 |
| 8 | `seaLevelChart` | Multi-line | Sea level cumulative 1993– | Ch. 02 |
| 9 | `affectedChart` | Horizontal Bar | Orang terdampak per negara | Ch. 03 |
| 10 | `affectedTimelineChart` | Vertical Bar | Orang terdampak per tahun | Ch. 03 |
| 11 | `econLossChart` | Multi-country Bar | Kerugian ekonomi USD | Ch. 03 |
| 12 | `cropSparkChart` | Spark line | Crop yield, Fiji | Ch. 04 |
| 13 | `liveSparkChart` | Spark line | Livestock yield, Fiji | Ch. 04 |
| 14 | `waterSparkChart` | Spark line | Water access, terendah | Ch. 04 |
| 15 | `waterBarChart` | Horizontal Bar | Water access per negara | Ch. 04 |
| 16 | `cropLineChart` | Multi-line | Crop yield 1961–2022 | Ch. 04 |
| 17 | `paradoxScatter` | Scatter + Scrollytelling | Emisi vs dampak bencana | Ch. 05 |

### Fitur Interaktif Global

- **Light / Dark mode toggle** — tombol `◐` di pojok kanan navigasi. Semua chart dirender ulang dengan palet warna yang sesuai secara otomatis.
- **Scroll progress bar** — garis tipis di bagian atas halaman yang menunjukkan seberapa jauh pengguna telah membaca.
- **Navigasi chapter** — bar navigasi atas dengan tautan ke setiap chapter; *active state* berubah seiring scroll.
- **Animasi count-up** — angka-angka statistik utama beranimasi naik saat pertama kali masuk ke viewport.
- **Reveal on scroll** — setiap paragraf narasi dan panel muncul dengan animasi *fade-in* saat digulir ke area tampilan.

### Warna & Konsistensi Visual

Setiap negara mendapat **satu warna tetap** yang digunakan konsisten di seluruh 17 chart — pengguna yang sudah mengenal warna Fiji di Chapter 1 tidak perlu membaca legenda ulang di Chapter 4.

| Warna | Hex | Makna Semantik |
|---|---|---|
| Pacific Blue | `#1A5C8A` | Aksen utama, data netral, navigasi |
| Danger Red | `#C94030` | Data peringatan: bencana, kerugian, risiko tinggi |
| Ocean Teal | `#2A7A5A` | Data lingkungan: SST, permukaan laut, curah hujan |
| Amber | `#E07820` | Data pertanian: crop yield, livestock |

---

## Sumber Data

Seluruh data bersumber dari **Pacific Data Hub** yang dikelola oleh Secretariat of the Pacific Community (SPC):  
🔗 [https://stats.pacificdata.org/](https://stats.pacificdata.org/)

| Dataset | Isi |
|---|---|
| `DF_CLIMATE_CHANGE` | Emisi GHG per kapita, anomali SST, anomali suhu daratan, anomali curah hujan, kenaikan permukaan laut, orang terdampak bencana, kerugian ekonomi bencana |
| `DF_SDG_06` | Akses air minum aman (SDG 6 — Clean Water and Sanitation) |
| `DF_SDG_11` | Indikator ketahanan infrastruktur perkotaan (SDG 11) |
| `DF_AGRICULTURAL_PRODUCTION` | Produktivitas tanaman pangan (kg/ha) dan ternak (kg/head) |

**Periode data:** 1850–2025  
**Cakupan negara:** 20+ negara dan teritori di kawasan Pasifik

Data diproses dan digabungkan ke dalam satu file `data/pacific_data.json` yang memuat dua bagian:
- `main` — data time-series mentah per negara per tahun
- `summary` — statistik turunan (rata-rata, min, maks, pertumbuhan, peringkat) yang digunakan untuk chart bar dan panel insight

---

## Teknologi

| Komponen | Teknologi |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (Custom Properties, Flexbox, Grid, Scroll-triggered animations) |
| Logika & Chart | Vanilla JavaScript (ES2020+) |
| Library Chart | [Apache ECharts 5.4.3](https://echarts.apache.org/) (via CDN) |
| Font | Playfair Display (serif judul), Inter (sans-serif body), DM Mono (angka) |
| Hosting | GitHub Pages (static, no build step) |

Tidak ada framework JavaScript (React/Vue/dll), tidak ada bundler, tidak ada build step. Seluruh halaman adalah plain HTML + CSS + JS yang berjalan langsung di browser.

---

## Struktur File

```
.
├── index.html              Entry point — struktur halaman & semua bab narasi
├── style.css               Seluruh styling (light/dark theme, layout, animasi)
├── script.js               Logika data, rendering chart, scroll interactions
├── data/
│   └── pacific_data.json   Dataset gabungan dari Pacific Data Hub (time-series + summary)
├── .nojekyll               Memberitahu GitHub Pages untuk melewati pemrosesan Jekyll
└── README.md               Dokumentasi ini
```

---

## Menjalankan Secara Lokal

Browser memblokir `fetch()` ke file lokal yang dibuka langsung (`file://...`), sehingga halaman harus dijalankan melalui server lokal, bukan dengan dobel-klik.

**Dengan Python (paling mudah):**
```bash
cd folder-proyek
python -m http.server 8000
# Buka http://localhost:8000 di browser
```

**Dengan Node.js:**
```bash
cd folder-proyek
npx http-server
# Buka URL yang tampil di terminal
```

**Dengan VS Code:**  
Install ekstensi *Live Server*, lalu klik kanan `index.html` → *Open with Live Server*.

---

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub dan push seluruh folder ini:

   ```bash
   git init
   git add .
   git commit -m "Pacific Paradox: a climate story"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```

2. Buka repository → **Settings → Pages**
3. Di bawah **Build and deployment → Source**, pilih **Deploy from a branch**
4. Pilih branch **main** dan folder **/ (root)**, lalu klik **Save**
5. Tunggu 1–2 menit, lalu refresh halaman Settings → Pages. GitHub akan menampilkan URL live:

   ```
   https://<username>.github.io/<nama-repo>/
   ```

Tidak ada build step yang diperlukan. Situs menggunakan path relatif (`data/pacific_data.json`) sehingga bekerja baik dari root domain maupun dari subpath.

---

*Pacific Paradox — dibuat untuk Pacific Dataviz Challenge 2026*
