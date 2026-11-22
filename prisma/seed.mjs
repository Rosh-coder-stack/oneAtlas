import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting idempotent OneAtlas database seeding...");

  // ============================================================================
  // 1. Providers
  // ============================================================================
  const providersData = [
    {
      slug: "openai",
      name: "OpenAI",
      websiteUrl: "https://openai.com",
      logoUrl: "https://openai.com/favicon.ico",
      description: "Research organization and creator of the GPT and o-series reasoning models.",
      isVerified: true,
    },
    {
      slug: "anthropic",
      name: "Anthropic",
      websiteUrl: "https://anthropic.com",
      logoUrl: "https://anthropic.com/favicon.ico",
      description: "AI safety and research company developing the Claude model family.",
      isVerified: true,
    },
    {
      slug: "google",
      name: "Google DeepMind",
      websiteUrl: "https://deepmind.google",
      logoUrl: "https://deepmind.google/favicon.ico",
      description: "Alphabet's frontier AI laboratory developing the Gemini multimodal model family.",
      isVerified: true,
    },
    {
      slug: "meta-ai",
      name: "Meta AI",
      websiteUrl: "https://ai.meta.com",
      logoUrl: "https://ai.meta.com/favicon.ico",
      description: "Meta's fundamental AI research division pioneering open-weight Llama foundation models.",
      isVerified: true,
    },
    {
      slug: "deepseek",
      name: "DeepSeek",
      websiteUrl: "https://deepseek.com",
      logoUrl: "https://deepseek.com/favicon.ico",
      description: "Chinese AI research lab pioneering high-efficiency sparse MoE architectures (V3, R1).",
      isVerified: true,
    },
    {
      slug: "mistral-ai",
      name: "Mistral AI",
      websiteUrl: "https://mistral.ai",
      logoUrl: "https://mistral.ai/favicon.ico",
      description: "European AI research lab developing open and commercial models (Mistral Large, Codestral, Pixtral).",
      isVerified: true,
    },
  ];

  const providers = {};
  for (const p of providersData) {
    providers[p.slug] = await prisma.provider.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`✓ Seeded ${Object.keys(providers).length} providers.`);

  // ============================================================================
  // 2. Categories
  // ============================================================================
  const categoriesData = [
    {
      slug: "general-llm",
      name: "General LLM",
      description: "General-purpose natural language understanding, generation, and multi-turn instruction following.",
    },
    {
      slug: "reasoning-math",
      name: "Reasoning & Math",
      description: "Frontier thinking models optimized for multi-step algorithmic derivation and competition STEM.",
    },
    {
      slug: "code-generation",
      name: "Code Generation",
      description: "Specialized models for software engineering, repository-level debugging, and code synthesis.",
    },
    {
      slug: "multimodal-vision",
      name: "Multimodal & Vision",
      description: "Architectures natively processing interleaved text, images, video, and audio tokens.",
    },
    {
      slug: "small-edge-models",
      name: "Small & Edge Models",
      description: "Highly compressed models under 15B parameters deployable on edge, mobile, and consumer GPUs.",
    },
  ];

  const categories = {};
  for (const c of categoriesData) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }
  console.log(`✓ Seeded ${Object.keys(categories).length} categories.`);

  // ============================================================================
  // 3. Benchmarks
  // ============================================================================
  const benchmarksData = [
    {
      slug: "mmlu",
      name: "MMLU",
      category: "Knowledge & Understanding",
      description: "Massive Multitask Language Understanding across 57 humanities, STEM, and social science subjects.",
      maxScore: 100.0,
    },
    {
      slug: "mmlu-pro",
      name: "MMLU-Pro",
      category: "Reasoning & Knowledge",
      description: "More rigorous 10-choice college-level reasoning benchmark designed to suppress random guessing.",
      maxScore: 100.0,
    },
    {
      slug: "humaneval",
      name: "HumanEval",
      category: "Code Synthesis",
      description: "Zero-shot Python coding synthesis evaluating functional correctness on docstring specifications.",
      maxScore: 100.0,
    },
    {
      slug: "gsm8k",
      name: "GSM8K",
      category: "Math & Word Problems",
      description: "Grade School Math benchmark consisting of 8,500 multi-step mathematical word problems.",
      maxScore: 100.0,
    },
    {
      slug: "math-500",
      name: "MATH-500",
      category: "Advanced Mathematics",
      description: "Challenging high-school competition math problems requiring deep multi-step formal derivations.",
      maxScore: 100.0,
    },
    {
      slug: "swe-bench",
      name: "SWE-bench Verified",
      category: "Software Engineering",
      description: "Evaluates end-to-end resolution of real-world GitHub issues across popular open-source repositories.",
      maxScore: 100.0,
    },
    {
      slug: "arena-elo",
      name: "Chatbot Arena ELO",
      category: "Human Preference",
      description: "Crowdsourced blind A/B evaluation by LMSYS measuring human preference across 1M+ conversational prompts.",
      maxScore: 1500.0,
    },
  ];

  const benchmarks = {};
  for (const b of benchmarksData) {
    benchmarks[b.slug] = await prisma.benchmark.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
  }
  console.log(`✓ Seeded ${Object.keys(benchmarks).length} standard benchmarks.`);

  // ============================================================================
  // 4. Models (19 representative models across all 6 required labs)
  // ============================================================================
  const modelsData = [
    // OpenAI Models
    {
      slug: "gpt-4o",
      name: "GPT-4o",
      tagline: "Flagship omni-model integrating audio, vision, and text processing in real time.",
      description: "High-intelligence multimodal flagship from OpenAI with real-time text and vision capabilities.",
      architecture: "Dense Multimodal Transformer",
      parametersCount: "Proprietary",
      contextWindow: 128000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-05-13"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://platform.openai.com/docs/models/gpt-4o",
      inputPricePerMillion: 2.50,
      outputPricePerMillion: 10.00,
      providerSlug: "openai",
      categorySlugs: ["general-llm", "multimodal-vision"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 88.7, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "humaneval", score: 90.2, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "gsm8k", score: 95.8, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "arena-elo", score: 1286.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "gpt-4o-mini",
      name: "GPT-4o mini",
      tagline: "Cost-efficient small omni-model designed for speed and high-throughput workloads.",
      description: "OpenAI's high-speed, cost-optimized model delivering near-flagship intelligence at a fraction of latency.",
      architecture: "Compressed Dense Transformer",
      parametersCount: "Proprietary (~8B class)",
      contextWindow: 128000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-07-18"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://platform.openai.com/docs/models/gpt-4o-mini",
      inputPricePerMillion: 0.15,
      outputPricePerMillion: 0.60,
      providerSlug: "openai",
      categorySlugs: ["general-llm", "small-edge-models"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 82.0, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "humaneval", score: 87.2, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "arena-elo", score: 1224.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "o1",
      name: "OpenAI o1",
      tagline: "Deep chain-of-thought reasoning model for complex science, math, and coding problems.",
      description: "Trained using reinforcement learning to think and self-correct before outputting answers.",
      architecture: "Reasoning Autoregressive Transformer",
      parametersCount: "Proprietary",
      contextWindow: 200000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-12-05"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://platform.openai.com/docs/models/o1",
      inputPricePerMillion: 15.00,
      outputPricePerMillion: 60.00,
      providerSlug: "openai",
      categorySlugs: ["reasoning-math", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "math-500", score: 96.4, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "swe-bench", score: 48.9, isVerified: true, notes: "Verified OpenAI technical report" },
        { benchmarkSlug: "mmlu-pro", score: 84.4, isVerified: true, notes: "Verified independent evaluation" },
        { benchmarkSlug: "arena-elo", score: 1358.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "o3-mini",
      name: "OpenAI o3-mini",
      tagline: "Next-gen compact reasoning model providing fast STEM and competitive programming answers.",
      description: "Low-latency reasoning model featuring configurable reasoning efforts (low, medium, high).",
      architecture: "Compact Reasoning Transformer",
      parametersCount: "Proprietary",
      contextWindow: 200000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2025-01-31"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://platform.openai.com/docs/models/o3-mini",
      inputPricePerMillion: 1.10,
      outputPricePerMillion: 4.40,
      providerSlug: "openai",
      categorySlugs: ["reasoning-math", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "math-500", score: 97.9, isVerified: true, notes: "Verified high-effort technical release" },
        { benchmarkSlug: "swe-bench", score: 49.3, isVerified: true, notes: "Verified high-effort technical release" },
        { benchmarkSlug: "arena-elo", score: 1305.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },

    // Anthropic Models
    {
      slug: "claude-3-5-sonnet",
      name: "Claude 3.5 Sonnet",
      tagline: "Industry-defining coding intelligence model with advanced artifacts and computer use.",
      description: "Anthropic's flagship intelligence model setting industry benchmarks for software development and reasoning.",
      architecture: "Dense Transformer Autoregressive",
      parametersCount: "Proprietary",
      contextWindow: 200000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-10-22"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://docs.anthropic.com/en/docs/models-overview",
      inputPricePerMillion: 3.00,
      outputPricePerMillion: 15.00,
      providerSlug: "anthropic",
      categorySlugs: ["general-llm", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 88.7, isVerified: true, notes: "Verified Anthropic model card" },
        { benchmarkSlug: "humaneval", score: 93.7, isVerified: true, notes: "Verified Anthropic model card" },
        { benchmarkSlug: "swe-bench", score: 49.0, isVerified: true, notes: "Verified SWE-bench Verified score" },
        { benchmarkSlug: "arena-elo", score: 1283.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "claude-3-5-haiku",
      name: "Claude 3.5 Haiku",
      tagline: "High-speed, low-latency model delivering previous generation flagship intelligence.",
      description: "Matches the capabilities of Claude 3 Opus while operating at rapid speeds for enterprise agent workflows.",
      architecture: "Dense Transformer Autoregressive",
      parametersCount: "Proprietary",
      contextWindow: 200000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-11-04"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://docs.anthropic.com/en/docs/models-overview",
      inputPricePerMillion: 0.80,
      outputPricePerMillion: 4.00,
      providerSlug: "anthropic",
      categorySlugs: ["general-llm", "small-edge-models"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 83.2, isVerified: true, notes: "Verified Anthropic technical report" },
        { benchmarkSlug: "humaneval", score: 88.9, isVerified: true, notes: "Verified Anthropic technical report" },
        { benchmarkSlug: "arena-elo", score: 1238.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "claude-3-opus",
      name: "Claude 3 Opus",
      tagline: "Nuanced cognitive model engineered for long-form synthesis and enterprise analysis.",
      description: "Anthropic's largest parameter tier delivering high literary quality and intricate analytical capability.",
      architecture: "Dense Transformer Autoregressive",
      parametersCount: "Proprietary",
      contextWindow: 200000,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-03-04"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://docs.anthropic.com/en/docs/models-overview",
      inputPricePerMillion: 15.00,
      outputPricePerMillion: 75.00,
      providerSlug: "anthropic",
      categorySlugs: ["general-llm"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 86.8, isVerified: true, notes: "Verified Anthropic model card" },
        { benchmarkSlug: "gsm8k", score: 95.0, isVerified: true, notes: "Verified Anthropic model card" },
        { benchmarkSlug: "arena-elo", score: 1256.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },

    // Google DeepMind Models
    {
      slug: "gemini-2-0-flash",
      name: "Gemini 2.0 Flash",
      tagline: "Next-gen multimodal reasoning model designed for speed, agentic loops, and real-time audio.",
      description: "Google's breakthrough multi-modal architecture with native tool use and 1M token context window.",
      architecture: "Multimodal Native Transformer",
      parametersCount: "Proprietary",
      contextWindow: 1048576,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-12-11"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      inputPricePerMillion: 0.10,
      outputPricePerMillion: 0.40,
      providerSlug: "google",
      categorySlugs: ["general-llm", "multimodal-vision"],
      benchmarks: [
        { benchmarkSlug: "mmlu-pro", score: 75.3, isVerified: true, notes: "Verified Google DeepMind release" },
        { benchmarkSlug: "math-500", score: 89.9, isVerified: true, notes: "Verified Google DeepMind release" },
        { benchmarkSlug: "arena-elo", score: 1302.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "gemini-1-5-pro",
      name: "Gemini 1.5 Pro",
      tagline: "Deep analytical model featuring unprecedented 2,000,000 token context window.",
      description: "Excels at audio, video, document corpus analysis, and complex codebases spanning millions of tokens.",
      architecture: "Sparse Mixture-of-Experts Multimodal",
      parametersCount: "Proprietary",
      contextWindow: 2097152,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-05-14"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      inputPricePerMillion: 1.25,
      outputPricePerMillion: 5.00,
      providerSlug: "google",
      categorySlugs: ["general-llm", "multimodal-vision"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 85.9, isVerified: true, notes: "Verified Google DeepMind report" },
        { benchmarkSlug: "math-500", score: 86.5, isVerified: true, notes: "Verified Google DeepMind report" },
        { benchmarkSlug: "arena-elo", score: 1261.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "gemini-1-5-flash",
      name: "Gemini 1.5 Flash",
      tagline: "Lightweight and fast multimodal model with 1M token context capacity.",
      description: "Engineered for high-frequency low-latency tasks such as summary generation, translation, and media extraction.",
      architecture: "Compressed Multimodal MoE",
      parametersCount: "Proprietary",
      contextWindow: 1048576,
      license: "Proprietary Commercial API",
      openWeights: false,
      releaseDate: new Date("2024-05-14"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
      inputPricePerMillion: 0.075,
      outputPricePerMillion: 0.30,
      providerSlug: "google",
      categorySlugs: ["general-llm", "small-edge-models"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 78.9, isVerified: true, notes: "Verified Google DeepMind report" },
        { benchmarkSlug: "gsm8k", score: 83.4, isVerified: true, notes: "Verified Google DeepMind report" },
        { benchmarkSlug: "arena-elo", score: 1227.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },

    // Meta AI Models
    {
      slug: "llama-3-3-70b-instruct",
      name: "Llama 3.3 70B Instruct",
      tagline: "Meta's most capable open-weight 70B model matching prior 405B performance.",
      description: "State-of-the-art open-weight foundation model trained with advanced post-training alignment pipelines.",
      architecture: "Dense Transformer Autoregressive",
      parametersCount: "70B",
      contextWindow: 128000,
      license: "Llama 3.3 Community License",
      openWeights: true,
      releaseDate: new Date("2024-12-06"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://ai.meta.com/llama/",
      huggingFaceUrl: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
      inputPricePerMillion: 0.00,
      outputPricePerMillion: 0.00,
      providerSlug: "meta-ai",
      categorySlugs: ["general-llm", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 88.6, isVerified: true, notes: "Verified Meta AI release paper" },
        { benchmarkSlug: "humaneval", score: 81.7, isVerified: true, notes: "Verified Meta AI release paper" },
        { benchmarkSlug: "math-500", score: 74.0, isVerified: true, notes: "Verified Meta AI release paper" },
        { benchmarkSlug: "arena-elo", score: 1248.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "llama-3-1-405b-instruct",
      name: "Llama 3.1 405B Instruct",
      tagline: "The world's largest openly available frontier model with 405 billion parameters.",
      description: "Frontier open-weight model capable of enterprise synthetic data generation and complex reasoning.",
      architecture: "Dense Transformer Autoregressive",
      parametersCount: "405B",
      contextWindow: 128000,
      license: "Llama 3.1 Community License",
      openWeights: true,
      releaseDate: new Date("2024-07-23"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://ai.meta.com/llama/",
      huggingFaceUrl: "https://huggingface.co/meta-llama/Meta-Llama-3.1-405B-Instruct",
      inputPricePerMillion: 0.00,
      outputPricePerMillion: 0.00,
      providerSlug: "meta-ai",
      categorySlugs: ["general-llm"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 88.6, isVerified: true, notes: "Verified Meta AI paper" },
        { benchmarkSlug: "gsm8k", score: 96.8, isVerified: true, notes: "Verified Meta AI paper" },
        { benchmarkSlug: "arena-elo", score: 1269.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "llama-3-1-8b-instruct",
      name: "Llama 3.1 8B Instruct",
      tagline: "Highly popular edge-deployable open-weight model with 128K context window.",
      description: "Designed for consumer hardware, edge devices, and local developer workflows without cloud dependence.",
      architecture: "Dense Transformer with Grouped-Query Attention",
      parametersCount: "8B",
      contextWindow: 128000,
      license: "Llama 3.1 Community License",
      openWeights: true,
      releaseDate: new Date("2024-07-23"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://ai.meta.com/llama/",
      huggingFaceUrl: "https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct",
      inputPricePerMillion: 0.00,
      outputPricePerMillion: 0.00,
      providerSlug: "meta-ai",
      categorySlugs: ["general-llm", "small-edge-models"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 73.0, isVerified: true, notes: "Verified Meta AI paper" },
        { benchmarkSlug: "humaneval", score: 72.6, isVerified: true, notes: "Verified Meta AI paper" },
        { benchmarkSlug: "arena-elo", score: 1184.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },

    // DeepSeek Models
    {
      slug: "deepseek-v3",
      name: "DeepSeek V3",
      tagline: "Frontier 671B MoE architecture with Multi-head Latent Attention (MLA).",
      description: "Mixture-of-Experts model with 37B active parameters per token, delivering frontier-class capabilities at unprecedented efficiency.",
      architecture: "Sparse MoE with Multi-Head Latent Attention",
      parametersCount: "671B (37B active)",
      contextWindow: 128000,
      license: "DeepSeek License (Commercial Allowed)",
      openWeights: true,
      releaseDate: new Date("2024-12-26"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://github.com/deepseek-ai/DeepSeek-V3",
      huggingFaceUrl: "https://huggingface.co/deepseek-ai/DeepSeek-V3",
      inputPricePerMillion: 0.14,
      outputPricePerMillion: 0.28,
      providerSlug: "deepseek",
      categorySlugs: ["general-llm", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 88.5, isVerified: true, notes: "Verified DeepSeek V3 Technical Report" },
        { benchmarkSlug: "humaneval", score: 82.6, isVerified: true, notes: "Verified DeepSeek V3 Technical Report" },
        { benchmarkSlug: "math-500", score: 90.2, isVerified: true, notes: "Verified DeepSeek V3 Technical Report" },
        { benchmarkSlug: "arena-elo", score: 1298.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "deepseek-r1",
      name: "DeepSeek R1",
      tagline: "Frontier open-weight reasoning model matching o1 performance through pure RL training.",
      description: "Pioneers large-scale reinforcement learning without supervised fine-tuning, exhibiting human-like emergent reasoning behaviors.",
      architecture: "Sparse MoE Reasoning Model",
      parametersCount: "671B (37B active)",
      contextWindow: 128000,
      license: "MIT License",
      openWeights: true,
      releaseDate: new Date("2025-01-20"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://github.com/deepseek-ai/DeepSeek-R1",
      huggingFaceUrl: "https://huggingface.co/deepseek-ai/DeepSeek-R1",
      inputPricePerMillion: 0.55,
      outputPricePerMillion: 2.19,
      providerSlug: "deepseek",
      categorySlugs: ["reasoning-math", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "math-500", score: 97.3, isVerified: true, notes: "Verified DeepSeek R1 Technical Report" },
        { benchmarkSlug: "swe-bench", score: 49.2, isVerified: true, notes: "Verified DeepSeek R1 Technical Report" },
        { benchmarkSlug: "arena-elo", score: 1354.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "deepseek-coder-v2",
      name: "DeepSeek Coder V2",
      tagline: "Open-source specialized coding model with support for 338 programming languages.",
      description: "MoE code generation model with 21B active parameters, matching closed-source commercial coding engines.",
      architecture: "Sparse MoE Code Specialized",
      parametersCount: "236B (21B active)",
      contextWindow: 128000,
      license: "DeepSeek License",
      openWeights: true,
      releaseDate: new Date("2024-06-17"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://github.com/deepseek-ai/DeepSeek-Coder-V2",
      huggingFaceUrl: "https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Instruct",
      inputPricePerMillion: 0.14,
      outputPricePerMillion: 0.28,
      providerSlug: "deepseek",
      categorySlugs: ["code-generation"],
      benchmarks: [
        { benchmarkSlug: "humaneval", score: 90.2, isVerified: true, notes: "Verified DeepSeek Coder V2 Report" },
        { benchmarkSlug: "swe-bench", score: 38.6, isVerified: false, notes: "Estimated baseline score on Lite split - not verified on SWE-bench full" },
        { benchmarkSlug: "arena-elo", score: 1218.0, isVerified: true, notes: "Verified LMSYS Arena Coding" },
      ],
    },

    // Mistral AI Models
    {
      slug: "mistral-large-2",
      name: "Mistral Large 2",
      tagline: "123B flagship model featuring native code synthesis and 128K context window.",
      description: "Mistral AI's flagship dense transformer engineered for high-concurrency enterprise reasoning and multilingual proficiency.",
      architecture: "Dense Transformer Autoregressive",
      parametersCount: "123B",
      contextWindow: 128000,
      license: "Mistral Research License / Commercial API",
      openWeights: true,
      releaseDate: new Date("2024-07-24"),
      status: "ACTIVE",
      isFeatured: true,
      documentationUrl: "https://docs.mistral.ai/getting-started/models/models_overview/",
      huggingFaceUrl: "https://huggingface.co/mistralai/Mistral-Large-Instruct-2407",
      inputPricePerMillion: 2.00,
      outputPricePerMillion: 6.00,
      providerSlug: "mistral-ai",
      categorySlugs: ["general-llm", "code-generation"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 84.0, isVerified: true, notes: "Verified Mistral AI technical announcement" },
        { benchmarkSlug: "humaneval", score: 92.0, isVerified: true, notes: "Verified Mistral AI technical announcement" },
        { benchmarkSlug: "math-500", score: 76.8, isVerified: true, notes: "Verified Mistral AI technical announcement" },
        { benchmarkSlug: "arena-elo", score: 1251.0, isVerified: true, notes: "Verified LMSYS Arena leaderboard" },
      ],
    },
    {
      slug: "codestral-22b",
      name: "Codestral 22B",
      tagline: "Dedicated software engineering model proficient in over 80 programming languages.",
      description: "Engineered specifically for fill-in-the-middle code completion, test generation, and multi-file code editing.",
      architecture: "Dense Transformer with Fill-In-The-Middle",
      parametersCount: "22B",
      contextWindow: 32768,
      license: "Mistral Non-Commercial License (MNCL)",
      openWeights: true,
      releaseDate: new Date("2024-05-29"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://docs.mistral.ai/getting-started/models/models_overview/",
      huggingFaceUrl: "https://huggingface.co/mistralai/Codestral-22B-v0.1",
      inputPricePerMillion: 0.20,
      outputPricePerMillion: 0.60,
      providerSlug: "mistral-ai",
      categorySlugs: ["code-generation", "small-edge-models"],
      benchmarks: [
        { benchmarkSlug: "humaneval", score: 81.1, isVerified: true, notes: "Verified Mistral AI release" },
        { benchmarkSlug: "swe-bench", score: 28.5, isVerified: false, notes: "Synthetic internal evaluation baseline - not an official SWE-bench submission" },
        { benchmarkSlug: "arena-elo", score: 1195.0, isVerified: true, notes: "Verified LMSYS Arena Coding" },
      ],
    },
    {
      slug: "pixtral-large-124b",
      name: "Pixtral Large 124B",
      tagline: "Frontier multimodal image and text understanding model with 128K context window.",
      description: "Combines a 1B vision encoder directly with Mistral Large 2 for high-resolution document, chart, and visual analysis.",
      architecture: "Vision-Language Multimodal Transformer",
      parametersCount: "124B",
      contextWindow: 128000,
      license: "Mistral Research License / Commercial API",
      openWeights: true,
      releaseDate: new Date("2024-11-18"),
      status: "ACTIVE",
      isFeatured: false,
      documentationUrl: "https://docs.mistral.ai/getting-started/models/models_overview/",
      huggingFaceUrl: "https://huggingface.co/mistralai/Pixtral-Large-Instruct-2411",
      inputPricePerMillion: 2.00,
      outputPricePerMillion: 6.00,
      providerSlug: "mistral-ai",
      categorySlugs: ["multimodal-vision"],
      benchmarks: [
        { benchmarkSlug: "mmlu", score: 84.1, isVerified: true, notes: "Verified Mistral AI visual release" },
        { benchmarkSlug: "arena-elo", score: 1260.0, isVerified: true, notes: "Verified LMSYS Vision Arena" },
      ],
    },
  ];

  let seededModelsCount = 0;
  for (const m of modelsData) {
    const provider = providers[m.providerSlug];
    if (!provider) {
      throw new Error(`Provider not found for slug: ${m.providerSlug}`);
    }

    // Upsert Model
    const model = await prisma.model.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        tagline: m.tagline,
        description: m.description,
        architecture: m.architecture,
        parametersCount: m.parametersCount,
        contextWindow: m.contextWindow,
        license: m.license,
        openWeights: m.openWeights,
        releaseDate: m.releaseDate,
        status: m.status,
        isFeatured: m.isFeatured,
        documentationUrl: m.documentationUrl,
        huggingFaceUrl: m.huggingFaceUrl,
        inputPricePerMillion: m.inputPricePerMillion,
        outputPricePerMillion: m.outputPricePerMillion,
        providerId: provider.id,
      },
      create: {
        slug: m.slug,
        name: m.name,
        tagline: m.tagline,
        description: m.description,
        architecture: m.architecture,
        parametersCount: m.parametersCount,
        contextWindow: m.contextWindow,
        license: m.license,
        openWeights: m.openWeights,
        releaseDate: m.releaseDate,
        status: m.status,
        isFeatured: m.isFeatured,
        documentationUrl: m.documentationUrl,
        huggingFaceUrl: m.huggingFaceUrl,
        inputPricePerMillion: m.inputPricePerMillion,
        outputPricePerMillion: m.outputPricePerMillion,
        providerId: provider.id,
      },
    });

    // Idempotent Category mappings
    for (const catSlug of m.categorySlugs) {
      const category = categories[catSlug];
      if (category) {
        await prisma.modelCategory.upsert({
          where: {
            modelId_categoryId: {
              modelId: model.id,
              categoryId: category.id,
            },
          },
          update: {},
          create: {
            modelId: model.id,
            categoryId: category.id,
          },
        });
      }
    }

    // Idempotent Benchmark scores
    for (const bScore of m.benchmarks) {
      const benchmark = benchmarks[bScore.benchmarkSlug];
      if (benchmark) {
        await prisma.modelBenchmark.upsert({
          where: {
            modelId_benchmarkId: {
              modelId: model.id,
              benchmarkId: benchmark.id,
            },
          },
          update: {
            score: bScore.score,
            isVerified: bScore.isVerified,
            notes: bScore.notes,
          },
          create: {
            modelId: model.id,
            benchmarkId: benchmark.id,
            score: bScore.score,
            isVerified: bScore.isVerified,
            notes: bScore.notes,
          },
        });
      }
    }

    seededModelsCount++;
  }

  console.log(`✓ Seeded ${seededModelsCount} AI models with relational categories & benchmark scores.`);
  console.log("Database seeding completed idempotently!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
