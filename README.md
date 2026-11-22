# OneAtlas — AI Model Discovery & Intelligence Platform

OneAtlas is an enterprise-grade discovery and intelligence platform for foundation models, frontier neural network architectures, and reproducible benchmark evaluations (MMLU-Pro, HumanEval, SWE-bench, MATH, and Arena ELO).

---

## 🏛️ Architecture & Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router architecture with Turbopack bundler)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode, fully typed domain models)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose
- **Database Layer**: [PostgreSQL 16](https://www.postgresql.org/) (Official Docker image with volume persistence & healthcheck)
- **ORM**: [Prisma ORM](https://www.prisma.io/) (v6 LTS client singleton architecture)
- **Code Quality**: [ESLint 9](https://eslint.org/) Flat Config with Next.js Core Web Vitals & TypeScript rules

---

## 📂 Project Directory Structure

```text
oneAtlas/
├── docker-compose.yml        # PostgreSQL 16 service definition with healthcheck & named volume
├── prisma/
│   ├── migrations/           # Versioned SQL migration history
│   │   ├── 20261122065012_init/
│   │   └── 20261122072227_add_pricing_and_benchmark_provenance/
│   ├── schema.prisma         # Relational database schema for PostgreSQL
│   └── seed.mjs              # Idempotent database seeder (19 models across 6 labs)
├── scripts/
│   ├── test-apis.mjs         # End-to-end REST API automated test suite (63 assertions)
│   ├── test-comparison.mjs   # Headless browser Model Comparison automated test suite (23 assertions)
│   ├── test-leaderboard.mjs  # Headless browser Rankings & Benchmarks automated test suite (20 assertions)
│   ├── test-model-detail.mjs # Headless browser Model Detail Page automated test suite (31 assertions)
│   ├── test-providers.mjs    # Headless browser Provider Directory automated test suite (33 assertions)
│   └── verify-db.mjs         # Live Prisma & PostgreSQL connection verification script
├── src/
│   ├── app/                  # Next.js App Router (pages, layouts, routes)
│   │   ├── api/              # REST API Route Handlers
│   │   │   ├── benchmarks/   # GET /api/benchmarks
│   │   │   ├── categories/   # GET /api/categories
│   │   │   ├── health/       # GET /api/health (with live DB probe)
│   │   │   ├── models/       # GET /api/models (search, filter, sort, paginate)
│   │   │   │   └── [slug]/   # GET /api/models/[slug]
│   │   │   └── providers/    # GET /api/providers
│   │   │       └── [slug]/   # GET /api/providers/[slug]
│   │   ├── compare/          # Dedicated Model Comparison Matrix (/compare)
│   │   │   └── page.tsx
│   │   ├── leaderboard/      # Standalone Rankings & Benchmarks Module (/leaderboard)
│   │   │   └── page.tsx
│   │   ├── models/           # Dynamic AI Model Intelligence Dossier (/models/[slug])
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── providers/        # Frontier AI Provider & Research Lab Directory (/providers)
│   │   │   ├── [slug]/       # Dynamic Lab Dossier & Model Catalog (/providers/[slug])
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── error.tsx         # Global error boundary (Client Component)
│   │   ├── globals.css       # Tailwind CSS v4 directives & theme tokens
│   │   ├── layout.tsx        # Root HTML shell & viewport metadata
│   │   ├── not-found.tsx     # Custom 404 handler
│   │   └── page.tsx          # Model Discovery & Intelligence landing page (Database-driven)
│   ├── components/
│   │   ├── layout/           # High-level layout components (AppShell, Navbar, Sidebar, Footer)
│   │   ├── modules/          # Domain-specific modules (ModelCard, ModelDetailView, ModelFilters, ComparisonTray, BenchmarkOverview)
│   │   └── ui/               # Reusable atomic design system primitives (Badge, Button, Card, Icons, Input, StatCard)
│   ├── context/              # Client-side state contexts (SearchContext, ComparisonContext)
│   │   ├── ComparisonContext.tsx
│   │   └── SearchContext.tsx
│   ├── lib/
│   │   ├── api-response.ts   # Standardized API response wrappers & secure server error handlers
│   │   ├── data.ts           # Initial static seed/fallback definitions
│   │   ├── prisma.ts         # Global Prisma Client singleton (prevents dev connection exhaustion)
│   │   └── utils.ts          # Tailwind class merging (cn) and token/metric formatters
│   ├── services/             # Backend service layer (eager loading, no N+1 queries)
│   │   ├── benchmark.service.ts
│   │   ├── category.service.ts
│   │   ├── model.service.ts
│   │   └── provider.service.ts
│   └── types/
│       └── index.ts          # Core domain TypeScript interfaces & contracts
├── .env.example              # Documented environment variables template
├── .env.local                # Local environment variables (gitignored)
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Project scripts & dependencies
└── tsconfig.json             # TypeScript compiler settings & path aliases (@/*)
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: `v20+` or `v24+` (tested on Node v24.13.0)
- **npm**: `v10+` or `v11+`
- **Docker & Docker Compose**: Docker 24+ / 29+

### 1. Configure Local Environment Variables

Local environment variables are stored in `.env.local` (and automatically gitignored):

```bash
# Copy example if setting up for the first time
cp .env.example .env.local
```

Ensure `.env.local` contains the local database connection string:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
POSTGRES_DB=oneatlas
POSTGRES_PORT=5432

DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/oneatlas?schema=public"
```

> **Security Note**: Never commit `.env` or `.env.local` to version control. Both are protected by `.gitignore`.

---

## 🐳 Docker & PostgreSQL 16 Setup

The database runs in an isolated Docker container configured through [`docker-compose.yml`](file:///C:/oneAtlas/docker-compose.yml):

- **Image**: Official `postgres:16-alpine`
- **Port Security**: Bound strictly to `127.0.0.1:5432:5432` so PostgreSQL is **not** exposed to public or external networks.
- **Storage Persistence**: Uses named Docker volume `oneatlas_postgres_data`.
- **Healthcheck**: Uses `pg_isready -U postgres -d oneatlas` with automated interval, timeout, and retry policies.

### Docker Commands

```bash
# Start PostgreSQL in background
npm run docker:up
# or: docker compose up -d

# Check container status & healthcheck
docker compose ps

# View PostgreSQL container logs
npm run docker:logs
# or: docker compose logs -f postgres

# Stop PostgreSQL container (preserves volume data)
npm run docker:down
# or: docker compose down
```

---

## 🗄️ Database Seeding & Migrations

### Database Commands

```bash
# Apply pending database migrations and synchronize schema
npm run db:migrate

# Seed database idempotently (19 models across OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral)
npm run db:seed

# Regenerate Prisma Client types
npm run db:generate

# Execute live end-to-end database verification
npm run db:verify
```

### Seeding Overview & Provenance Guarantee

The seeder ([`prisma/seed.mjs`](file:///C:/oneAtlas/prisma/seed.mjs)) populates:
- **6 Frontier Providers**: OpenAI, Anthropic, Google DeepMind, Meta AI, DeepSeek, Mistral AI.
- **5 Categories**: General LLM, Reasoning & Math, Code Generation, Multimodal & Vision, Small & Edge Models.
- **7 Benchmarks**: MMLU, MMLU-Pro, HumanEval, GSM8K, MATH-500, SWE-bench Verified, Chatbot Arena ELO.
- **19 AI Models**: Fully populated with representative pricing (USD per 1M tokens), context windows, parameter sizes, open-weight flags, and relational links.
- **Benchmark Provenance**: All scores have an `isVerified` flag. Verified vendor/LMSYS results are marked `isVerified: true`. Any synthetic comparison baselines are explicitly marked `isVerified: false` with explanatory notes.
- **Idempotency**: All records use `upsert`, ensuring running `npm run db:seed` multiple times produces zero duplicates.

---

## 🌐 REST API Documentation

All API responses follow a consistent envelope structure:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 19,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

In the event of an error:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid 'sortBy' parameter. Allowed values: input_price, output_price, context_window, release_date, name, created_at."
  }
}
```

### 1. `GET /api/models`

Retrieve a paginated, searchable, filterable, and sortable list of AI models.

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `search` | `string` | Search query across model `name` and `tagline` (case-insensitive). |
| `provider` | `string` | Filter by provider `slug`, `id`, or `name` (e.g. `openai`, `anthropic`, `deepseek`). |
| `category` | `string` | Filter by category `slug` or `name` (e.g. `reasoning-math`, `code-generation`). |
| `license` | `string` | Filter by license string or type (`open-weights`, `proprietary`). |
| `openWeights`| `boolean`| Explicit boolean filter (`true`, `false`, `1`, `0`). |
| `sortBy` | `string` | Sort field: `input_price`, `output_price`, `context_window`, `release_date`, `name`, `created_at`. |
| `sortOrder` | `string` | Sort direction: `asc` or `desc` (default: `desc`). |
| `page` | `integer`| Page number (minimum `1`, default: `1`). |
| `limit` | `integer`| Items per page (minimum `1`, maximum `50`, default: `10`). |

**Example Requests:**
```bash
# Sort models by input pricing ascending (cheapest first)
curl "http://localhost:3000/api/models?sortBy=input_price&sortOrder=asc"

# Filter by provider and category with custom pagination
curl "http://localhost:3000/api/models?provider=deepseek&category=code-generation&page=1&limit=5"

# Search models by name
curl "http://localhost:3000/api/models?search=claude"
```

---

### 2. `GET /api/models/[slug]`

Retrieve comprehensive details for a single AI model by its unique slug.

**Example Request:**
```bash
curl "http://localhost:3000/api/models/claude-3-5-sonnet"
```

**Responses:**
- `200 OK`: Model object including provider details, categories, and verified benchmark scores.
- `404 Not Found`: Model does not exist.

---

### 3. `GET /api/providers`

Retrieve all AI research labs and providers with associated model counts, open-weights distribution, and sample architecture models.

**Example Request:**
```bash
curl "http://localhost:3000/api/providers"
```

---

### 4. `GET /api/providers/[slug]`

Retrieve comprehensive research lab intelligence for a single provider by its slug, including all associated models, unit economics pricing summary, and top frontier benchmark evaluations.

**Example Request:**
```bash
curl "http://localhost:3000/api/providers/deepseek"
```

**Responses:**
- `200 OK`: Provider object with full associated model catalog, `pricingSummary` (`minInputPrice`, `maxInputPrice`, `minOutputPrice`, `maxOutputPrice`, `hasFreeTier`), and `topBenchmarkScores`.
- `404 Not Found`: Provider slug does not exist (`PROVIDER_NOT_FOUND`).

---

### 5. `GET /api/categories`

Retrieve all taxonomy categories with model counts.

**Example Request:**
```bash
curl "http://localhost:3000/api/categories"
```

---

### 6. `GET /api/benchmarks`

Retrieve standardized evaluation suites with top 3 performing models and score counts.

**Example Request:**
```bash
curl "http://localhost:3000/api/benchmarks"
```

---

### 7. `GET /api/health`

Platform and live PostgreSQL database connectivity probe.

**Example Request:**
```bash
curl "http://localhost:3000/api/health"
```

---

## 🎨 Frontend Architecture & API Integration

The OneAtlas frontend couples Next.js Server Components with reactive Client Components connected to backend REST APIs backed by live PostgreSQL:

1. **Initial Server Hydration & Zero Hardcoded Data**:
   - Initial model discovery catalog, provider filters, and benchmark leaderboards are pre-rendered server-side on initial page load directly from the database layer.
   - All client interactions (search, filter changes, pagination, sort toggles) execute real-time asynchronous HTTP requests to `/api/models`, `/api/providers`, and `/api/benchmarks`.
   - No static or mock model arrays serve as the source of truth.

2. **Debounced Server-Side Search**:
   - `ModelFilters` implements a 300ms debounce buffer on text input to minimize API load and avoid query thrashing.
   - Previous in-flight requests are automatically aborted using `AbortController` when new searches or filters are triggered.

3. **Faceted Filtering & Sorting**:
   - **Provider & Category Filters**: Dropdown options are dynamically populated from `GET /api/providers` and `GET /api/categories`.
   - **License Mode**: Filter instantly between all models, open-weights only, or proprietary.
   - **Multi-criteria Sorting**: Sort by input pricing ($/1M tokens), output pricing ($/1M tokens), context window capacity, release date, or alphabetical name.
   - Changing any filter automatically resets pagination back to page 1.

4. **Server-Side Pagination & Page Size Control**:
   - `ModelPagination` provides complete page navigation, previous/next controls, page jump buttons, and a customizable page size selector (6, 10, 20 items per page).
   - Accurately reports item ranges (e.g., `Showing 1 - 10 of 19 models`).

5. **Loading States, Skeletons & Error Handling**:
   - `ModelCardSkeleton` displays pulsing shimmer placeholders matching the exact 4-column spec grid layout during API fetches.
   - If network or server issues occur, an inline error banner displays user-friendly diagnostic messages with an interactive **"Retry Connection"** button.
   - If queries yield no matches, an empty state is displayed with an instant **"Clear All Filters"** action button.

---

## ⚖️ Model Comparison & Architecture Matrix (`/compare`)

OneAtlas includes a foundation model comparison engine allowing engineers to analyze 2 to 4 frontier and open-weight models side-by-side:

1. **Card-Level Selection & Visual Feedback**:
   - Every `ModelCard` features a dedicated **Compare** action button.
   - Clicking toggles the model into the active comparison selection.
   - Selected cards display an active sky-accented outline, `In Tray` indicator badge, and a `Selected` toggle state.
   - Duplicate selections are prevented automatically.

2. **Persistent Bottom Comparison Tray**:
   - A floating tray appears at the bottom of the viewport whenever models are selected.
   - Displays selected model names, research labs, count indicator (e.g. `2/4`), and quick-remove (`x`) buttons.
   - **Enforces Minimum & Maximum Limits**:
     - Requires **at least 2 models** before enabling the **Compare Now** action.
     - Clamps selection at **maximum 4 models**, displaying an in-tray warning banner if users attempt to exceed capacity.
   - Includes a **Clear All** trigger to reset selections in one click.

3. **Comparison Matrix Route (`/compare`)**:
   - **Architecture & Specifications**: Side-by-side breakdown of neural architectures, parameter topologies (total vs active parameters), context windows, and licenses.
   - **Unit Economic Pricing**: Real-time evaluation of input and output token pricing per 1M tokens, including a 10K-input / 2K-output query cost estimate.
   - **Best-in-Class Highlights**:
     - Green badges automatically highlight the **Lowest Input Price**, **Lowest Output Price**, **Largest Context Window**, and **Top Benchmark Score** across all selected models.
   - **Benchmark Provenance Distinction**:
     - Benchmark records are tagged as **Verified LMSYS/Lab** (ground truth vendor evaluations) or **Estimated / Baseline**.
     - Missing evaluations are honestly labeled as `Not Evaluated` (never fabricated).
   - **Interactive Management**:
     - Individual models can be removed directly from the comparison table header.
     - An **Add Another Model** dropdown allows adding candidate models up to the 4-model limit directly on the comparison page.

4. **Cross-Route State Persistence**:
   - `ComparisonProvider` maintains state across page navigation between `/` and `/compare`.
   - Selections are synchronized to `localStorage` and URL query parameters (`/compare?models=slug1,slug2...`), enabling direct sharing of comparison matrices.

---

## 🏆 Frontier Rankings & Benchmark Leaderboards (`/leaderboard`)

OneAtlas provides an authoritative evaluations module designed for AI researchers, ML platform leads, and software engineers seeking verifiable model performance metrics:

1. **Live PostgreSQL Benchmark Data**:
   - All rankings and scores are queried directly from live PostgreSQL database records.
   - **Zero Fabricated Scores**: Never generates synthetic numbers or fake leaderboards. Models missing evaluations are transparently excluded rather than populated with placeholder averages.

2. **Standardized Evaluation Suites**:
   - **General Knowledge**:
     - `MMLU` (Massive Multitask Language Understanding — 57 academic subjects)
     - `MMLU-Pro` (Advanced reasoning variant with complex 10-choice questions)
   - **Reasoning & Mathematics**:
     - `GSM8K` (Grade School Math 8K step-by-step reasoning)
     - `MATH-500` (Challenging high school and Olympiad-level mathematics)
   - **Code Generation & Agentic Software Engineering**:
     - `HumanEval` (Python functional pass@1 unit testing)
     - `SWE-bench Verified` (Real-world GitHub issue resolution verified by human software engineers)
   - **Overall Human Preference**:
     - `Chatbot Arena ELO` (Crowdsourced double-blind conversational evaluation by LMSYS)

3. **Evaluation Category Filtering**:
   - Filter across 4 domain buckets:
     - **Overall**: Chatbot Arena ELO & MMLU-Pro
     - **Reasoning & Math**: MATH-500 & GSM8K
     - **Coding**: HumanEval & SWE-bench Verified
     - **General Knowledge**: MMLU & MMLU-Pro
   - Switching categories dynamically updates the available benchmark suite pills with live evaluation model counts.

4. **Top 3 Podium Showcase**:
   - Gold (#1), Silver (#2), and Bronze (#3) cards showcase top performers for the selected benchmark suite.
   - Includes visual rank badges, provider logos, score gauges, verified provenance status, and direct **Compare** and **Intel** action buttons.

5. **Authoritative Ranked Table**:
   - Visual score progress bar with real-time percentage or Elo formatting.
   - **Audit Provenance Badge**: Clearly separates `Verified LMSYS/Lab` results from `Estimated Baseline` scores.
   - Model hardware specs: parameter counts, context window length, and 1M token input/output pricing.
   - Quick **Compare** action button integrated with the platform comparison tray.

6. **Sorting, Filtering & Pagination**:
   - Sort by score descending (highest first) or ascending.
   - Filter by AI Provider / Research Lab (OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral).
   - Filter by License: Open Weights vs Proprietary.
   - Search by model name.
   - Pagination with configurable page sizes (5, 10, 20 items per page).

7. **Methodological Governance & Mathematical Integrity**:
   - **Unit Separation**: Percentage accuracy metrics (0–100%) and Bradley-Terry Elo points (1100–1400 ELO) are kept strictly separate. Incompatible units are never conflated or averaged together.
   - **Provenance Guarantee**: Distinguishes peer-reviewed lab disclosures and LMSYS measurements from third-party approximations.

---

## 🔍 Individual AI Model Intelligence Pages (`/models/[slug]`)

OneAtlas generates deep intelligence dossiers for foundation models via dynamic App Router routes (`/models/[slug]`):

1. **Live PostgreSQL Data Integration**:
   - Queries model details, research lab metadata, taxonomy categories, and evaluation scores dynamically via `GET /api/models/[slug]`.
   - Never falls back to hardcoded mock arrays.

2. **Parameter Topology & Architectural Integrity**:
   - Accurately decomposes and displays **Total Parameters** and **Active Parameters per Forward Pass**:
     - Recognizes Sparse Mixture-of-Experts (MoE) routing (e.g., DeepSeek R1 & V3: `671B total / 37B active`).
     - Recognizes Dense autoregressive architectures (e.g., Llama 3.3 70B: `70B Dense`).
     - Transparently denotes closed weights as `Proprietary / Undisclosed`.
   - Analyzes Context Window capacity in practical terms (e.g., token count, word equivalents, and estimated page capacity).

3. **Unit Economics & Interactive Cost Simulator**:
   - Side-by-side Input and Output pricing per 1,000,000 tokens.
   - **Honest Pricing Disclosures**: Models without public pricing are explicitly marked `Pricing Not Disclosed / Contact Lab` rather than filled with synthetic defaults.
   - **Workload Cost Simulator**: Interactive token slider with presets (`Chat`, `RAG`, `Agent Loop`, `Production Batch`) simulating real-world API costs with sub-cent precision.

4. **Inference Capabilities & Modality Profiling**:
   - Dynamic capability badges denoting Text, Vision / Interleaved Image tokens, Code Synthesis, Chain-of-Thought Reasoning, and Tool Calling based on taxonomy and architecture metadata.

5. **Benchmark Evaluations & Audit Transparency**:
   - Visual progress bars for evaluated scores across MMLU, MMLU-Pro, HumanEval, SWE-bench Verified, GSM8K, MATH-500, and Chatbot Arena ELO.
   - Clear audit labels: `Verified LMSYS/Lab` (vendor/LMSYS disclosures) vs `Estimated Baseline`.
   - **Honest Coverage Notice**: Lists standard benchmark suites that have **not** been evaluated for this model, preserving data integrity without synthetic score interpolation.

6. **Platform Integration & Comparison Flow**:
   - **Comparison Synchronization**: Single-click "Add to Compare" directly triggers the persistent floating comparison tray.
   - Direct transitions to the side-by-side comparison matrix (`/compare?models=slug`).
   - Breadcrumb navigation, "Back to Discovery", and filtered lab exploration (`/?provider=slug`).

7. **Resilient UX States & Dynamic SEO**:
   - **Pulsing Skeletons**: High-fidelity dark mode skeleton states during data hydration.
   - **Custom 404 Handler**: Clean "Unknown Foundation Model" screen with recovery actions when requesting invalid slugs.
   - **Dynamic Metadata**: Server-side `generateMetadata` generating unique titles, descriptions, and OpenGraph tags for every model.

---

## 🏢 AI Provider & Research Lab Directory (`/providers` & `/providers/[slug]`)

OneAtlas features a dedicated AI Provider Directory module providing deep intelligence dossiers on foundation model research organizations (OpenAI, Anthropic, Google DeepMind, Meta AI, DeepSeek, Mistral AI):

1. **Provider Directory Overview (`/providers`)**:
   - Queries live PostgreSQL database for all verified research organizations via `GET /api/providers`.
   - **Quick Directory Telemetry**: Summary banner tracking Frontier Labs count, Total Models in registry, and Verified Audit counts.
   - **Interactive Search & Faceted Filtering**: Real-time name/architecture search, filter tabs (`All`, `Verified Labs`, `Open Weights`, `Proprietary`), and sorting by model volume or alphabetical order.
   - **Rich Provider Cards**: Visual lab avatar with brand gradient accents, model count badges, open-weights/proprietary distribution metrics, sample model pills linking directly to `/models/[slug]`, official lab website link, and direct links to Discovery catalog (`/?provider=slug`) and Lab Dossier (`/providers/[slug]`).

2. **Dynamic Provider Dossier & Catalog (`/providers/[slug]`)**:
   - Dedicated laboratory intelligence dossier powered by `GET /api/providers/[slug]`.
   - **Hero Intelligence Dossier**: Organization name, verified badge, description, official lab website link, models count, and open-weights distribution.
   - **Unit Economics & Token Pricing Summary**: Displays lab-wide input and output price ranges per million tokens (e.g. `$0.14 - $0.55/1M`), explicit open-weights / free-tier availability, and transparent handling of undisclosed pricing.
   - **Frontier Benchmark Highlights**: Curated showcase of top performing models from the laboratory across standard evaluation suites (MMLU-Pro, SWE-bench Verified, HumanEval, Arena ELO) with audit provenance tags (`Verified LMSYS/Lab` vs `Estimated Baseline`).
   - **Associated Models Catalog**: Side-by-side interactive grid of all models engineered by the laboratory. Includes dedicated in-catalog search, category dropdown filter, license dropdown filter, and multi-criteria sorting (Name, Release Date, Input Price, Output Price, Context Window).
   - **Comparison Integration**: Every model card features a fully functional **Compare** button synced with `ComparisonContext` and the persistent floating tray.
   - **Direct Navigation**: Model cards provide quick-action links directly to individual intelligence dossiers (`/models/[slug]`).

3. **Methodological Transparency & Honest Reporting**:
   - Zero hardcoded mock arrays; live PostgreSQL Prisma data serves as the source of truth.
   - Missing fields, un-evaluated benchmarks, or undisclosed pricing tiers are acknowledged honestly without synthetic defaults.
   - Resilient loading skeletons, retry error handling, and dedicated 404 state (`404 — Provider Not Found`) with recovery actions.
   - Server-side dynamic SEO metadata (`generateMetadata`) generating tailored OpenGraph and Twitter cards for each laboratory.

---

## 🧪 Testing & Verification

Run the automated test suites testing all endpoints, frontend interactions, sorting, pagination, comparison, rankings, individual model detail pages, and provider directory:

```bash
# Run the 63-assertion REST API integration test suite
npm run test:api

# Run the 23-assertion Model Comparison automated headless browser test suite
npm run test:compare

# Run the 20-assertion Leaderboard & Rankings automated headless browser test suite
npm run test:leaderboard

# Run the 31-assertion AI Model Detail Page automated headless browser test suite
npm run test:model-detail

# Run the 33-assertion AI Provider Directory automated headless browser test suite
npm run test:providers

# Run ESLint check
npm run lint

# Run Next.js production compilation
npm run build
```
