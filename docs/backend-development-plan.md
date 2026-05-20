## FinSight NestJS Backend Development Plan

## 1. Development Phases

### Phase 1: Foundation & Auth

* **1.1 Project scaffold:** NestJS + TypeScript, ESLint, Prettier.
* **1.2 PostgreSQL + TypeORM:** Database connection, migrations, environment config (from `.env`).
* **1.3 Auth module:** JWT access + refresh tokens (Passport), bcrypt hashing, guards & decorators. Add `email`, `password`, and `currentHashedRefreshToken` to the `nasabah` entity.
* **1.4 User module:** CRUD for `nasabah` profile, `personaDasar`, `gajiBulanan`, and live financial ratios calculation.
* **1.5 Global pipes & filters:** ValidationPipe (class-validator), GlobalExceptionFilter, ResponseInterceptor.

### Phase 2: Transaction & ML Bridge

* **2.1 Transaction module:** POST `/transactions`, MCC detection branch, raw text classification via FastAPI NLP.
* **2.2 FastAPI HTTP client:** Axios-based HttpService wrapper under `src/integrations` with retry logic, timeouts, and fallbacks.
* **2.3 Wants/Needs ratio updater:** Service to recalculate & update user balance and live ratios per transaction.
* **2.4 Notification module:** Trigger push notifications after ratio updates (FCM using saved `fcmToken`).
* **2.5 MCC mapping table:** Seed script for `mcc_map` -> category lookup, fall back to FastAPI NLP if unmapped.

### Phase 3: Schedulers & Reports

* **3.1 7-day scheduler:** `@Cron` every Sunday 23:59 — queries 7-day transactions, calls FastAPI anomaly detection, generates weekly report.
* **3.2 30-day scheduler:** `@Cron` last day of month — triggers clustering for new persona, savings rate, monthly LLM report.
* **3.3 Report module:** Fetch generated PDF URL/blob from FastAPI, store in DB, and serve to the mobile app.
* **3.4 Monthly reset job:** Reset current Needs/Wants spending accumulators to 0 on the 1st of each month at 00:00.
* **3.5 Scheduler health endpoint:** GET `/scheduler/status` — last run, next run, status for ops visibility.

### Phase 4: Hardening & DevOps

* **4.1 Unit + integration tests:** Jest for services, Supertest for e2e, mock FastAPI responses.
* **4.2 Rate limiting & throttling:** `@nestjs/throttler` on public endpoints and per-user limits on ML-heavy routes.
* **4.3 Logging & observability:** Pino logger, correlation IDs, structured JSON logs.
* **4.4 API documentation:** Swagger via `@nestjs/swagger` at `/api`, auto-generated DTO schemas and Bearer Auth.
* **4.5 CI/CD pipeline:** GitHub Actions: lint → test → build → Docker.

---

## 2. FastAPI Bridge & ML Integrations

NestJS wraps all FastAPI calls inside an `MlClientService` (integrated in `src/integrations`) using Axios. The mobile app never calls FastAPI directly.

| Integration | Trigger | Route | Payload | Response |
| --- | --- | --- | --- | --- |
| **NLP Classification** | Raw transaction text (no MCC) | `POST /ml/classify-transaction` | `{ "description": "string", "amount": number }` | `{ "category": "wants\|needs", "confidence": number }` |
| **Anomaly Detection** | 7-day scheduler | `POST /ml/anomaly-detection` | `{ "id_nasabah": "string", "transactions": Transaksi[] }` | `{ "anomaly_detected": boolean, "score": number }` |
| **Clustering** | 30-day scheduler | `POST /ml/clustering` | `{ "id_nasabah": "string", "monthly_data": MonthlyData }` | `{ "persona": "string", "cluster_id": number }` |
| **Weekly Report Gen** | 7-day scheduler (after anomaly) | `POST /ml/generate-weekly-report` | `{ "id_nasabah": "string", "wants_ratio": number, "needs_ratio": number, "anomaly_detected": boolean }` | `{ "report_url": "string", "summary": "string" }` |
| **Monthly Report Gen** | 30-day scheduler (after clustering) | `POST /ml/generate-monthly-report` | `{ "id_nasabah": "string", "savings_rate": number, "wants_ratio": number, "needs_ratio": number, "persona": "string" }` | `{ "report_url": "string", "summary": "string" }` |

---

## 3. Database Schema (TypeORM Entities)

Entities conform exactly to the physical database ERD with necessary additions for auth and reports.

### 3.1 `nasabah` (Customer / User Entity)
* `id_nasabah` (VARCHAR(255) PK) - Unique customer identifier
* `nama_nasabah` (VARCHAR(255) NOT NULL) - Full name
* `tanggal_lahir` (DATE NOT NULL) - Date of birth
* `nama_ibu_kandung` (VARCHAR(255) NOT NULL) - Mother's maiden name (security check)
* `segmen_demografi` (VARCHAR(255) NULLABLE) - Demographic classification tag
* `gaji_bulanan` (BIGINT NULLABLE) - Monthly income tracking
* `persona_dasar` (VARCHAR(255) NULLABLE) - Core behavioral/AI persona tag
* `is_dynamic` (BOOLEAN NOT NULL) - Flag for changing persona traits
* *Auth Extensions:*
  * `email` (VARCHAR(255) UNIQUE NOT NULL)
  * `password` (VARCHAR(255) NOT NULL) - BCrypt hash
  * `current_hashed_refresh_token` (VARCHAR(255) NULLABLE)
  * `fcm_token` (VARCHAR(255) NULLABLE) - Push notification token

### 3.2 `rekening` (Account Entity)
* `id_rekening` (VARCHAR(255) PK) - Unique account identifier
* `id_nasabah` (VARCHAR(255) FK → `nasabah(id_nasabah)`)
* `saldo` (BIGINT NOT NULL) - Current account balance
* `status` (VARCHAR(255) NOT NULL) - Account status (e.g., Active, Suspended)

### 3.3 `sejarah_persona` (Historical Persona Entity)
* `id_sejarah_persona` (SERIAL PK)
* `id_nasabah` (VARCHAR(255) FK → `nasabah(id_nasabah)`)
* `persona_dasar` (VARCHAR(255) NOT NULL) - Historic persona tag
* `bulan` (DATE NOT NULL) - Snapshot month date tracking (YYYY-MM-01)

### 3.4 `mcc_map` (Merchant Category Code Map)
* `mcc_id` (VARCHAR(255) PK)
* `mcc_number` (INT NOT NULL) - Standardized numeric MCC code

### 3.5 `transaksi` (Transaction Ledger Entity)
* `id_transaksi` (VARCHAR(255) PK)
* `id_rekening` (VARCHAR(255) FK → `rekening(id_rekening)`)
* `timestamp` (TIMESTAMP NOT NULL) - Chronological event timestamp
* `tipe_mutasi` (VARCHAR(255) NOT NULL) - `'Debit'` or `'Kredit'`
* `deskripsi_mutasi` (VARCHAR(255) NULLABLE) - Transaction description text
* `catatan_mutasi` (VARCHAR(255) NULLABLE) - User internal transaction notes
* `id_mcc` (VARCHAR(255) FK → `mcc_map(mcc_id)` NULLABLE)
* `nominal` (BIGINT NOT NULL) - Financial transaction amount in IDR
* `sisa_saldo` (BIGINT NOT NULL) - Post-transaction snapshot account balance
* `label_anomali` (BOOLEAN NOT NULL) - ML-labeled suspicious flag
* `bulan` (DATE NOT NULL) - YYYY-MM-01 format
* `hari_bulan` (DATE NOT NULL) - Transaction day (YYYY-MM-DD)
* `hari_minggu` (DATE NOT NULL) - Start of transaction week date
* `jam` (TIME NOT NULL) - Transaction time hour extractor
* `menit` (TIME NOT NULL) - Transaction time minute extractor
* `hour_sin` (VARCHAR(255) NULLABLE) - Trigonometric sine cyclic hour
* `hour_cos` (VARCHAR(255) NULLABLE) - Trigonometric cosine cyclic hour
* `month_sin` (VARCHAR(255) NULLABLE) - Trigonometric sine cyclic month
* `month_cos` (VARCHAR(255) NULLABLE) - Trigonometric cosine cyclic month
* *Categorization Extensions:*
  * `kategori_besar` (VARCHAR(255) NULLABLE) - `'Needs'` or `'Wants'`
  * `kategori_detail` (VARCHAR(255) NULLABLE) - e.g. `'Investasi & Finansial'`, `'F&B'`, etc.

### 3.6 `reports` (Weekly/Monthly Reports)
* `id` (VARCHAR(255) PK)
* `id_nasabah` (VARCHAR(255) FK → `nasabah(id_nasabah)`)
* `type` (VARCHAR(255) NOT NULL) - `'weekly'` or `'monthly'`
* `report_url` (VARCHAR(255) NOT NULL) - PDF report URL
* `summary` (TEXT NOT NULL) - AI summary text
* `period_start` (DATE NOT NULL)
* `period_end` (DATE NOT NULL)
* `created_at` (TIMESTAMP NOT NULL)

### 3.7 `notifications` (In-App Notification Logs)
* `id` (SERIAL PK)
* `id_nasabah` (VARCHAR(255) FK → `nasabah(id_nasabah)`)
* `title` (VARCHAR(255) NOT NULL)
* `body` (TEXT NOT NULL)
* `type` (VARCHAR(255) NOT NULL) - `'ratio_alert'`, `'weekly'`, or `'monthly'`
* `read_at` (TIMESTAMP NULLABLE)
* `created_at` (TIMESTAMP NOT NULL)

---

## 4. Project Structure & Dependencies

Domain structures follow the official NestJS layout with modules, controllers, services, and TypeORM entities.

```text
src/
├── main.ts                      # Bootstrap, Swagger, ValidationPipe
├── app.module.ts                # Root module
│
├── config/                      # env validation and TypeORM config
│
├── common/
│   ├── decorators/              # @CurrentUser custom decorator
│   ├── guards/                  # JwtAuthGuard
│   ├── interceptors/            # ResponseInterceptor
│   └── filters/                 # GlobalExceptionFilter
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/          # JwtStrategy, JwtRefreshStrategy
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── entities/user.entity.ts # Nasabah
│   │
│   ├── accounts/
│   │   ├── accounts.module.ts
│   │   ├── accounts.controller.ts
│   │   ├── accounts.service.ts
│   │   └── entities/account.entity.ts # Rekening
│   │
│   ├── transactions/
│   │   ├── transactions.module.ts
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   └── entities/transaction.entity.ts # Transaksi
│   │
│   ├── persona_history/
│   │   ├── persona_history.module.ts
│   │   ├── persona_history.controller.ts
│   │   ├── persona_history.service.ts
│   │   └── entities/persona_history.entity.ts # SejarahPersona
│   │
│   ├── mcc_map/
│   │   ├── mcc_map.module.ts
│   │   ├── mcc_map.controller.ts
│   │   ├── mcc_map.service.ts
│   │   └── entities/mcc_map.entity.ts # MccMap
│   │
│   ├── reports/
│   │   ├── reports.module.ts
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   └── entities/report.entity.ts
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── entities/notification.entity.ts
│   │
│   └── scheduler/
│       ├── scheduler.module.ts
│       ├── weekly.scheduler.ts   # @Cron Sunday 23:59
│       └── monthly.scheduler.ts  # @Cron last day of month
│
└── integrations/
    ├── data-science/
    │   └── data-science.service.ts  # DS FastAPI NLP / Anomalies
    └── ai-engineer/
        └── ai-engineer.service.ts   # AI PDF / Persona summaries
```

---

## 5. API Endpoints Specification

Payloads and responses utilize standard camelCase matching the NestJS implementation of the underlying ERD properties. All protected endpoints require `Authorization: Bearer <access_token>`.

### 5.1 Auth Module (No JWT Required)

**`POST /auth/register`**
* **Description:** Creates a new customer (`nasabah`) account, hashes password, and returns a JWT pair.
* **Body Requirements:** 
  ```json
  {
    "idNasabah": "string",
    "namaNasabah": "string",
    "tanggalLahir": "YYYY-MM-DD",
    "namaIbuKandung": "string",
    "email": "string (email)",
    "password": "string (min 8 chars)",
    "gajiBulanan": "number (optional)"
  }
  ```
* **Response (201):**
  ```json
  {
    "user": {
      "idNasabah": "string",
      "namaNasabah": "string",
      "email": "string",
      "tanggalLahir": "string"
    },
    "accessToken": "JWT",
    "refreshToken": "JWT"
  }
  ```

**`POST /auth/login`**
* **Description:** Validates credentials and returns JWT pair.
* **Body Requirements:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
* **Response (200):**
  ```json
  {
    "user": {
      "idNasabah": "string",
      "namaNasabah": "string",
      "email": "string",
      "personaDasar": "string"
    },
    "accessToken": "JWT",
    "refreshToken": "JWT"
  }
  ```

**`POST /auth/refresh`**
* **Description:** Receives a valid refresh token and returns a new access/refresh pair.
* **Header Requirements:** `Authorization: Bearer <refresh_token>`
* **Response (200):**
  ```json
  {
    "accessToken": "JWT",
    "refreshToken": "JWT"
  }
  ```

**`POST /auth/logout`**
* **Description:** Clears the user's refresh token from the database.
* **Response (200):** `{ "message": "logged out" }`

---

### 5.2 Users Module (JWT Required)

**`GET /users/me`**
* **Description:** Returns profile info, current ratios, and savings rate.
* **Response (200):**
  ```json
  {
    "idNasabah": "string",
    "namaNasabah": "string",
    "email": "string",
    "tanggalLahir": "string",
    "segmenDemografi": "string | null",
    "gajiBulanan": "string",
    "personaDasar": "string | null",
    "isDynamic": "boolean",
    "needsPercentage": 51.2,
    "wantsPercentage": 41.8,
    "savingsPercentage": 7.0,
    "remainingCashPercentage": 7.0
  }
  ```

**`PATCH /users/me`**
* **Description:** Updates the profile fields of the user.
* **Body Requirements:** `namaNasabah` (optional), `gajiBulanan` (optional), `isDynamic` (optional).
* **Response (200):** Updated user object matching the `GET /users/me` structure.

**`GET /users/me/dashboard`**
* **Description:** Aggregates home screen summary metrics (persona, live ratios, monthly income/spending) using leakage-proof dates.
* **Response (200):**
  ```json
  {
    "personaDasar": "string | null",
    "needsPercentage": 51.2,
    "wantsPercentage": 41.8,
    "savingsPercentage": 7.0,
    "remainingCashPercentage": 7.0,
    "currentMonth": {
      "income": 5000000,
      "expense": 3200000,
      "period": "2026-05"
    }
  }
  ```

---

### 5.3 Transactions Module (JWT Required)

**`POST /transactions`**
* **Description:** Submits a transaction. Categorizes via MCC lookup or FastAPI NLP and updates the account balance.
* **Body Requirements:**
  ```json
  {
    "idRekening": "string",
    "nominal": "number",
    "tipeMutasi": "Debit | Kredit",
    "deskripsiMutasi": "string (optional)",
    "catatanMutasi": "string (optional)",
    "idMcc": "string (optional)"
  }
  ```
* **Response (201):**
  ```json
  {
    "transaction": {
      "idTransaksi": "string",
      "nominal": "string",
      "tipeMutasi": "string",
      "kategoriBesar": "string",
      "kategoriDetail": "string",
      "labelAnomali": "boolean",
      "timestamp": "string"
    },
    "updatedRatios": {
      "needsPercentage": 49.5,
      "wantsPercentage": 44.2
    }
  }
  ```

**`GET /transactions`**
* **Description:** Paginated transaction history with filters.
* **Query Requirements:** `page` (default 1), `limit` (default 20), `tipeMutasi` (optional), `kategoriBesar` (optional), `from` (optional), `to` (optional).
* **Response (200):**
  ```json
  {
    "data": [
      {
        "idTransaksi": "string",
        "nominal": "string",
        "tipeMutasi": "string",
        "kategoriBesar": "string",
        "kategoriDetail": "string",
        "labelAnomali": "boolean",
        "timestamp": "string"
      }
    ],
    "meta": {
      "total": 142,
      "page": 1,
      "limit": 20,
      "lastPage": 8
    }
  }
  ```

**`GET /transactions/:id`**
* **Description:** Detailed transaction view. Returns 404 if owned by another customer.
* **Response (200):** Full `Transaksi` entity JSON.

**`GET /transactions/summary`**
* **Description:** Monthly aggregates and top categories.
* **Query Requirements:** `month` (1-12), `year`.
* **Response (200):**
  ```json
  {
    "totalIncome": 5000000,
    "totalExpense": 3200000,
    "wantsTotal": 1344000,
    "needsTotal": 1632000,
    "wantsPercentage": 41.8,
    "needsPercentage": 51.2,
    "savingsPercentage": 7.0,
    "byCategory": [
      { "category": "Food & Beverage", "total": 850000 },
      { "category": "Investasi & Finansial", "total": 350000 },
      { "category": "Lainnya", "total": 2000000 }
    ]
  }
  ```

---

### 5.4 Reports Module (JWT Required)

**`GET /reports/weekly`**
* **Description:** Returns the latest weekly PDF URL and text summary.
* **Response (200):**
  ```json
  {
    "id": "string",
    "type": "weekly",
    "periodStart": "2026-05-11",
    "periodEnd": "2026-05-17",
    "reportUrl": "https://...",
    "summary": "LLM text",
    "createdAt": "string"
  }
  ```

**`GET /reports/monthly`**
* **Description:** Returns the latest monthly PDF URL and text summary.
* **Response (200):** Matches the weekly shape with `type: "monthly"`.

**`GET /reports/history`**
* **Description:** Returns paginated report history.

---

### 5.5 Notifications Module (JWT Required)

**`POST /notifications/token`**
* **Description:** Registers the FCM token for notification delivery.
* **Body Requirements:** `{ "token": "string", "platform": "ios | android" }`
* **Response (201):** `{ "message": "token registered" }`

**`GET /notifications`**
* **Description:** Returns in-app notification history and marks them as read.
* **Response (200):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "string",
        "body": "string",
        "type": "ratio_alert",
        "readAt": "string | null",
        "createdAt": "string"
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 20, "lastPage": 1 }
  }
  ```

---

### 5.6 Scheduler Module (Internal Use)

**`GET /scheduler/status`**
* **Header Requirements:** `x-api-key: <internal_key>`
* **Response (200):** Returns status, last run, and next run for weekly/monthly tasks.