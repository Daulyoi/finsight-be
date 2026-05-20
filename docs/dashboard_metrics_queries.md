# Financial Dashboard SQL Queries (Fullstack Integration)

Dokumen ini berisi query SQL untuk Dashboard FinSight. Semua perhitungan dirancang untuk **reset otomatis setiap tanggal 1**, bersifat **dinamis** terhadap waktu akses user, dan **terproteksi dari data leakage** (tidak menampilkan data masa depan).

## Parameter Dashboard
- `:id_user` : ID User yang sedang login (Contoh: 'USR-001').
- `:access_date` : Tanggal & waktu saat user membuka dashboard (Contoh: '2026-01-15 23:59:59').

---

## 1 & 2. Ringkasan Bulanan (Average & Total)
Menampilkan total dan rata-rata pengeluaran serta pemasukan per bulan. 
*Leakage Protection: Data bulan depan tidak akan muncul jika user mengakses di bulan ini.*

```sql
SELECT 
    id_user,
    DATE_TRUNC('month', timestamp) AS bulan,
    SUM(CASE WHEN tipe_mutasi = 'Kredit' THEN nominal ELSE 0 END) AS total_income,
    SUM(CASE WHEN tipe_mutasi = 'Debit' THEN nominal ELSE 0 END) AS total_spending,
    AVG(CASE WHEN tipe_mutasi = 'Kredit' THEN nominal END) AS avg_income_per_trx,
    AVG(CASE WHEN tipe_mutasi = 'Debit' THEN nominal END) AS avg_spending_per_trx
FROM transaksi
WHERE id_user = :id_user
-- PENCEGAHAN LEAKAGE: Hanya ambil data sampai detik akses
AND timestamp <= CAST(:access_date AS TIMESTAMP)
GROUP BY 1, 2
ORDER BY 2 DESC;
```

## 3. Rata-rata Spending Harian (Bulan Berjalan)
Menghitung rata-rata pengeluaran harian user sejak tanggal 1 di bulan berjalan hingga detik akses.

```sql
WITH month_stats AS (
    SELECT 
        SUM(CASE WHEN tipe_mutasi = 'Kredit' THEN nominal ELSE 0 END) AS total_income,
        SUM(CASE WHEN tipe_mutasi = 'Debit' THEN nominal ELSE 0 END) AS total_spending,
        COUNT(DISTINCT DATE(timestamp)) AS days_active
    FROM transaksi
    WHERE id_user = :id_user 
    AND timestamp >= DATE_TRUNC('month', CAST(:access_date AS TIMESTAMP))
    AND timestamp <= CAST(:access_date AS TIMESTAMP)
)
SELECT 
    (total_spending / NULLIF(days_active, 0)) AS avg_daily_spending,
    ((total_spending / NULLIF(days_active, 0)) / NULLIF(total_income, 0)) * 100 AS daily_spending_to_income_ratio
FROM month_stats;
```

## 4, 7. Akumulasi Kumulatif (Running Total)
Menampilkan akumulasi pemasukan dan pengeluaran yang terus bertambah hingga waktu akses.

```sql
SELECT 
    timestamp,
    tipe_mutasi,
    nominal,
    SUM(CASE WHEN tipe_mutasi = 'Debit' THEN nominal ELSE 0 END) 
        OVER (PARTITION BY id_user, DATE_TRUNC('month', timestamp) ORDER BY timestamp) AS cumulative_spending,
    SUM(CASE WHEN tipe_mutasi = 'Kredit' THEN nominal ELSE 0 END) 
        OVER (PARTITION BY id_user, DATE_TRUNC('month', timestamp) ORDER BY timestamp) AS cumulative_income
FROM transaksi
WHERE id_user = :id_user
AND timestamp >= DATE_TRUNC('month', CAST(:access_date AS TIMESTAMP))
AND timestamp <= CAST(:access_date AS TIMESTAMP);
```

## 5 & 6. Rasio Keuangan: Needs, Wants, Savings, & Remaining
Breakdown alokasi pemasukan bulan berjalan. Total dari keempat rasio ini adalah 100%.

```sql
WITH current_month AS (
    SELECT 
        SUM(CASE WHEN tipe_mutasi = 'Kredit' THEN nominal ELSE 0 END) AS income,
        -- Wants: Semua kategori besar Wants kecuali Investasi
        SUM(CASE WHEN tipe_mutasi = 'Debit' AND kategori_besar = 'Wants' 
                 AND kategori_detail != 'Investasi & Finansial' THEN nominal ELSE 0 END) AS total_wants,
        -- Needs: Semua kategori besar Needs kecuali Investasi
        SUM(CASE WHEN tipe_mutasi = 'Debit' AND kategori_besar = 'Needs' 
                 AND kategori_detail != 'Investasi & Finansial' THEN nominal ELSE 0 END) AS total_needs,
        -- Savings: Khusus kategori detail Investasi & Finansial
        SUM(CASE WHEN tipe_mutasi = 'Debit' AND kategori_detail = 'Investasi & Finansial' THEN nominal ELSE 0 END) AS total_savings,
        -- Total Spending: Semua Debit
        SUM(CASE WHEN tipe_mutasi = 'Debit' THEN nominal ELSE 0 END) AS total_spending
    FROM transaksi
    WHERE id_user = :id_user
    AND timestamp >= DATE_TRUNC('month', CAST(:access_date AS TIMESTAMP))
    AND timestamp <= CAST(:access_date AS TIMESTAMP)
)
SELECT 
    round((total_needs / NULLIF(income, 0)) * 100, 2) AS needs_percentage,
    round((total_wants / NULLIF(income, 0)) * 100, 2) AS wants_percentage,
    round((total_savings / NULLIF(income, 0)) * 100, 2) AS savings_percentage,
    round(((income - total_spending) / NULLIF(income, 0)) * 100, 2) AS remaining_cash_percentage
FROM current_month;
```

## 8. Breakdown Pengeluaran: Top 3 Kategori vs Lainnya
Mengelompokkan pengeluaran ke dalam 3 `kategori_detail` terbesar, sisanya digabung ke "Lainnya".

```sql
WITH category_totals AS (
    SELECT 
        kategori_detail,
        SUM(nominal) AS total_amount
    FROM transaksi
    WHERE id_user = :id_user 
    AND tipe_mutasi = 'Debit'
    AND timestamp >= DATE_TRUNC('month', CAST(:access_date AS TIMESTAMP))
    AND timestamp <= CAST(:access_date AS TIMESTAMP)
    GROUP BY 1
),
ranked_categories AS (
    SELECT 
        kategori_detail,
        total_amount,
        ROW_NUMBER() OVER (ORDER BY total_amount DESC) as rank
    FROM category_totals
)
SELECT 
    CASE WHEN rank <= 3 THEN kategori_detail ELSE 'Lainnya' END AS category,
    SUM(total_amount) AS amount
FROM ranked_categories
GROUP BY 1
ORDER BY 2 DESC;
```

> [!IMPORTANT]
> **Kemanan Data**: Variabel `:id_user` dan `:access_date` WAJIB disuplai oleh sistem backend untuk menjamin akurasi dan privasi.
