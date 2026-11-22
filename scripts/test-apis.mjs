const BASE_URL = "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${testName} ${details ? `(${details})` : ""}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    failedCount++;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const status = res.status;
  const json = await res.json().catch(() => null);
  return { status, json };
}

async function runTests() {
  console.log("==================================================");
  console.log("OneAtlas Backend REST APIs & Data Layer Test Suite");
  console.log("==================================================");

  // 1. Health API with live DB check
  console.log("\n1. Testing GET /api/health");
  {
    const { status, json } = await request("/api/health");
    assert(status === 200, "Health status 200 OK");
    assert(json?.status === "ok", "Platform status 'ok'");
    assert(json?.database?.status === "connected", "Database status 'connected'");
    assert(json?.database?.provider === "postgresql", "Database provider 'postgresql'");
  }

  // 2. Providers API
  console.log("\n2. Testing GET /api/providers");
  {
    const { status, json } = await request("/api/providers");
    assert(status === 200, "Providers status 200 OK");
    assert(json?.success === true, "success is true");
    assert(Array.isArray(json?.data) && json.data.length >= 6, "Returns at least 6 providers", `Found: ${json?.data?.length}`);
    const slugs = json?.data?.map((p) => p.slug) || [];
    assert(
      ["openai", "anthropic", "google", "meta-ai", "deepseek", "mistral-ai"].every((lab) => slugs.includes(lab)),
      "Contains all 6 required labs (OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral)"
    );
  }

  // 3. Categories API
  console.log("\n3. Testing GET /api/categories");
  {
    const { status, json } = await request("/api/categories");
    assert(status === 200, "Categories status 200 OK");
    assert(json?.success === true, "success is true");
    assert(Array.isArray(json?.data) && json.data.length >= 5, "Returns at least 5 categories", `Found: ${json?.data?.length}`);
  }

  // 4. Benchmarks API
  console.log("\n4. Testing GET /api/benchmarks");
  {
    const { status, json } = await request("/api/benchmarks");
    assert(status === 200, "Benchmarks status 200 OK");
    assert(json?.success === true, "success is true");
    assert(Array.isArray(json?.data) && json.data.length >= 5, "Returns standard benchmarks", `Found: ${json?.data?.length}`);
    const firstBench = json?.data?.[0];
    assert(firstBench?.evaluatedModelsCount > 0, "Benchmark includes evaluation counts");
  }

  // 5. Models API - Default Pagination
  console.log("\n5. Testing GET /api/models (Default pagination)");
  {
    const { status, json } = await request("/api/models");
    assert(status === 200, "Models status 200 OK");
    assert(json?.success === true, "success is true");
    assert(json?.data?.length === 10, "Default page limit returns 10 models", `Got: ${json?.data?.length}`);
    assert(json?.pagination?.total >= 15, "Total count is at least 15 models", `Total: ${json?.pagination?.total}`);
    assert(json?.pagination?.page === 1, "Page is 1");
    assert(json?.pagination?.limit === 10, "Limit is 10");
    assert(json?.pagination?.hasNextPage === true, "Has next page");
  }

  // 6. Models API - Pagination params
  console.log("\n6. Testing GET /api/models?page=2&limit=5");
  {
    const { status, json } = await request("/api/models?page=2&limit=5");
    assert(status === 200, "Pagination status 200 OK");
    assert(json?.data?.length === 5, "Returns 5 models for page 2");
    assert(json?.pagination?.page === 2, "Page metadata is 2");
    assert(json?.pagination?.limit === 5, "Limit metadata is 5");
    assert(json?.pagination?.hasPrevPage === true, "Has previous page");
  }

  // 7. Models API - Search by name
  console.log("\n7. Testing GET /api/models?search=deepseek");
  {
    const { status, json } = await request("/api/models?search=deepseek");
    assert(status === 200, "Search status 200 OK");
    assert(json?.data?.length >= 3, "Finds DeepSeek models", `Found: ${json?.data?.length}`);
    const allMatch = json?.data?.every(
      (m) => m.name.toLowerCase().includes("deepseek") || m.tagline.toLowerCase().includes("deepseek")
    );
    assert(allMatch, "All returned models match the search query 'deepseek'");
  }

  // 8. Models API - Filter by provider
  console.log("\n8. Testing GET /api/models?provider=anthropic");
  {
    const { status, json } = await request("/api/models?provider=anthropic");
    assert(status === 200, "Provider filter status 200 OK");
    assert(json?.data?.length >= 3, "Finds Anthropic models", `Found: ${json?.data?.length}`);
    assert(
      json?.data?.every((m) => m.provider.slug === "anthropic"),
      "All models have provider slug 'anthropic'"
    );
  }

  // 9. Models API - Filter by category
  console.log("\n9. Testing GET /api/models?category=reasoning-math");
  {
    const { status, json } = await request("/api/models?category=reasoning-math");
    assert(status === 200, "Category filter status 200 OK");
    assert(json?.data?.length >= 2, "Finds Reasoning & Math models", `Found: ${json?.data?.length}`);
    const matchesCategory = json?.data?.every((m) =>
      m.categories.some((c) => c.slug === "reasoning-math")
    );
    assert(matchesCategory, "All models belong to 'reasoning-math' category");
  }

  // 10. Models API - Filter by license (open weights)
  console.log("\n10. Testing GET /api/models?license=open-weights");
  {
    const { status, json } = await request("/api/models?license=open-weights");
    assert(status === 200, "License filter status 200 OK");
    assert(json?.data?.length >= 5, "Finds Open Weights models", `Found: ${json?.data?.length}`);
    assert(
      json?.data?.every((m) => m.openWeights === true),
      "All returned models have openWeights === true"
    );
  }

  // 11. Models API - Sort by input pricing (ascending)
  console.log("\n11. Testing GET /api/models?sortBy=input_price&sortOrder=asc&limit=19");
  {
    const { status, json } = await request("/api/models?sortBy=input_price&sortOrder=asc&limit=19");
    assert(status === 200, "Input price sort status 200 OK");
    const prices = json?.data?.map((m) => m.inputPricePerMillion).filter((p) => p !== null) || [];
    let isAscending = true;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] < prices[i - 1]) {
        isAscending = false;
        break;
      }
    }
    assert(isAscending, "Models are sorted by inputPricePerMillion ascending", `Prices: ${prices.slice(0, 5).join(", ")}...`);
  }

  // 12. Models API - Sort by output pricing (descending)
  console.log("\n12. Testing GET /api/models?sortBy=output_price&sortOrder=desc&limit=19");
  {
    const { status, json } = await request("/api/models?sortBy=output_price&sortOrder=desc&limit=19");
    assert(status === 200, "Output price sort status 200 OK");
    const prices = json?.data?.map((m) => m.outputPricePerMillion).filter((p) => p !== null) || [];
    let isDescending = true;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        isDescending = false;
        break;
      }
    }
    assert(isDescending, "Models are sorted by outputPricePerMillion descending", `Prices: ${prices.slice(0, 5).join(", ")}...`);
  }

  // 13. Models API - Sort by context window (descending)
  console.log("\n13. Testing GET /api/models?sortBy=context_window&sortOrder=desc&limit=19");
  {
    const { status, json } = await request("/api/models?sortBy=context_window&sortOrder=desc&limit=19");
    assert(status === 200, "Context window sort status 200 OK");
    const windows = json?.data?.map((m) => m.contextWindow).filter((w) => w !== null) || [];
    let isDescending = true;
    for (let i = 1; i < windows.length; i++) {
      if (windows[i] > windows[i - 1]) {
        isDescending = false;
        break;
      }
    }
    assert(isDescending, "Models are sorted by contextWindow descending", `Top window: ${windows[0]} tokens`);
  }

  // 14. Model Detail by slug
  console.log("\n14. Testing GET /api/models/claude-3-5-sonnet");
  {
    const { status, json } = await request("/api/models/claude-3-5-sonnet");
    assert(status === 200, "Model detail status 200 OK");
    assert(json?.data?.slug === "claude-3-5-sonnet", "Returned correct slug");
    assert(json?.data?.provider?.name === "Anthropic", "Returned provider relation");
    assert(Array.isArray(json?.data?.categories) && json.data.categories.length > 0, "Returned categories relation");
    assert(Array.isArray(json?.data?.benchmarks) && json.data.benchmarks.length > 0, "Returned benchmark relation");
    const firstScore = json?.data?.benchmarks?.[0];
    assert(firstScore?.isVerified === true, "Benchmark score includes verified flag");
  }

  // 15. Invalid Slug (404 Not Found)
  console.log("\n15. Testing GET /api/models/non-existent-model-xyz (404)");
  {
    const { status, json } = await request("/api/models/non-existent-model-xyz");
    assert(status === 404, "Returns 404 for unknown slug");
    assert(json?.success === false, "success is false");
    assert(json?.error?.code === "MODEL_NOT_FOUND", "Error code is MODEL_NOT_FOUND");
  }

  // 16. Invalid Sort Field (400 Bad Request)
  console.log("\n16. Testing GET /api/models?sortBy=invalid_field (400)");
  {
    const { status, json } = await request("/api/models?sortBy=invalid_field");
    assert(status === 400, "Returns 400 Bad Request on invalid sortBy");
    assert(json?.success === false, "success is false");
    assert(json?.error?.code === "INVALID_SORT_FIELD", "Error code is INVALID_SORT_FIELD");
  }

  // 17. Invalid Page Parameter (400 Bad Request)
  console.log("\n17. Testing GET /api/models?page=-5 (400)");
  {
    const { status, json } = await request("/api/models?page=-5");
    assert(status === 400, "Returns 400 Bad Request on invalid page");
    assert(json?.success === false, "success is false");
    assert(json?.error?.code === "INVALID_PAGE", "Error code is INVALID_PAGE");
  }

  // 18. Empty Search Results (200 OK with empty array)
  console.log("\n18. Testing GET /api/models?search=nonexistentterm123456789 (Empty results)");
  {
    const { status, json } = await request("/api/models?search=nonexistentterm123456789");
    assert(status === 200, "Returns 200 OK for empty query results");
    assert(json?.data?.length === 0, "Data array is empty");
    assert(json?.pagination?.total === 0, "Total count is 0");
  }

  // Final summary
  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test runner failed:", e);
  process.exit(1);
});
