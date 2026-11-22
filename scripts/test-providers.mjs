import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runProvidersTestSuite() {
  console.log("==================================================");
  console.log("OneAtlas AI Provider Directory Integration Suite");
  console.log("==================================================");

  // 1. API Verification Tests
  console.log("\n1. Testing Backend Provider REST Endpoints");
  let passed = 0;
  let failed = 0;
  function assert(cond, name, details = "") {
    if (cond) {
      console.log(`  ✓ PASS: ${name} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // Probe GET /api/providers
  try {
    const res = await fetch("http://localhost:3000/api/providers");
    assert(res.status === 200, "GET /api/providers status 200 OK");
    const json = await res.json();
    assert(json?.success === true && Array.isArray(json?.data), "GET /api/providers returned success envelope");
    assert(json?.data?.length >= 6, `Returns at least 6 frontier providers (Found: ${json?.data?.length})`);
  } catch (err) {
    assert(false, "GET /api/providers reachable", err.message);
  }

  // Probe GET /api/providers/deepseek
  try {
    const res = await fetch("http://localhost:3000/api/providers/deepseek");
    assert(res.status === 200, "GET /api/providers/deepseek status 200 OK");
    const json = await res.json();
    assert(json?.success === true && json?.data?.name === "DeepSeek", "DeepSeek details returned correctly");
    assert(Array.isArray(json?.data?.models) && json.data.models.length === 3, "DeepSeek includes all 3 associated models");
    assert(json?.data?.pricingSummary?.hasFreeTier === true, "DeepSeek pricing summary accurately reports free tier/open weights");
    assert(json?.data?.topBenchmarkScores?.length > 0, "DeepSeek reports top benchmark scores");
  } catch (err) {
    assert(false, "GET /api/providers/deepseek reachable", err.message);
  }

  // Probe GET /api/providers/unknown-lab-404
  try {
    const res = await fetch("http://localhost:3000/api/providers/unknown-lab-404");
    assert(res.status === 404, "GET /api/providers/unknown-lab-404 returns 404 Not Found");
    const json = await res.json();
    assert(json?.error?.code === "PROVIDER_NOT_FOUND", "Error code is PROVIDER_NOT_FOUND");
  } catch (err) {
    assert(false, "GET /api/providers/unknown-lab-404 reachable", err.message);
  }

  // 2. Headless Browser Tests
  const edge = spawn(EDGE_PATH, [
    "--headless=new",
    "--remote-debugging-port=9228",
    "--user-data-dir=C:\\Users\\VICTUS\\AppData\\Local\\Temp\\edge-test-providers",
    "--disable-extensions",
    "--disable-gpu",
    "--window-size=1440,900",
    "http://localhost:3000/providers",
  ]);

  let targets = null;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9228/json/list");
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === "page" && !t.url.startsWith("chrome-extension://"));
        if (page) {
          targets = [page];
          break;
        }
      }
    } catch {
      // Retry
    }
  }

  if (!targets) {
    console.error("Failed to connect to browser on port 9228");
    edge.kill();
    process.exit(1);
  }

  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => {
    ws.onopen = r;
  });
  await send("Page.enable");
  await send("Runtime.enable");

  // Navigate explicitly to /providers to ensure viewport is on target page
  await send("Page.navigate", { url: "http://localhost:3000/providers" });

  // Helper to wait until Next.js page finishes compiling and rendering target route
  async function waitForPageReady(expectedTitleSubstring = null, timeoutMs = 14000) {
    const start = Date.now();
    // Allow at least 400ms for navigation to unmount old page
    await new Promise((r) => setTimeout(r, 400));
    while (Date.now() - start < timeoutMs) {
      const res = await send("Runtime.evaluate", {
        expression: `(() => {
          const h1 = document.querySelector("h1");
          const pulse = document.querySelector(".animate-pulse");
          return {
            hasH1: !!h1,
            title: h1 ? h1.textContent.trim() : null,
            isLoading: !!pulse
          };
        })()`,
        returnByValue: true,
      });
      const val = res?.result?.value;
      if (val?.hasH1 && !val?.isLoading) {
        if (!expectedTitleSubstring || val.title?.includes(expectedTitleSubstring)) {
          return val;
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  }

  // Initial wait for first-hit route compilation
  await waitForPageReady("AI Provider", 16000);

  // Clear any existing comparison selection in localStorage
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.clear();
      const clearBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("Clear All"));
      if (clearBtn) clearBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  // 3. Provider Directory Route (/providers)
  console.log("\n2. Testing /providers Directory View");
  {
    const directoryCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.textContent || "";
        const labCards = Array.from(document.querySelectorAll("a")).filter(a => a.textContent.includes("Lab Dossier"));
        return {
          title: h1 ? h1.textContent.trim() : null,
          hasDeepSeek: bodyText.includes("DeepSeek"),
          hasAnthropic: bodyText.includes("Anthropic"),
          hasOpenAI: bodyText.includes("OpenAI"),
          hasGoogle: bodyText.includes("Google"),
          hasMeta: bodyText.includes("Meta AI"),
          hasMistral: bodyText.includes("Mistral"),
          labCardsCount: labCards.length
        };
      })()`,
      returnByValue: true,
    });
    assert(directoryCheck.result.value.title?.includes("AI Provider"), "Directory title rendered correctly", directoryCheck.result.value.title);
    assert(directoryCheck.result.value.hasDeepSeek === true, "Displays DeepSeek card");
    assert(directoryCheck.result.value.hasAnthropic === true, "Displays Anthropic card");
    assert(directoryCheck.result.value.hasOpenAI === true, "Displays OpenAI card");
    assert(directoryCheck.result.value.hasGoogle === true, "Displays Google DeepMind card");
    assert(directoryCheck.result.value.hasMeta === true, "Displays Meta AI card");
    assert(directoryCheck.result.value.hasMistral === true, "Displays Mistral AI card");
    assert(directoryCheck.result.value.labCardsCount >= 6, `Renders at least 6 provider cards (${directoryCheck.result.value.labCardsCount} cards found)`);
  }

  // 4. Search within Provider Directory
  console.log("\n3. Testing Provider Directory Search");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector("input[placeholder*='Search AI providers']");
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeSetter.call(input, "Anthropic");
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const searchCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.textContent || "";
        const labCards = Array.from(document.querySelectorAll("a")).filter(a => a.textContent.includes("Lab Dossier"));
        return {
          hasAnthropic: bodyText.includes("Anthropic"),
          hasDeepSeek: bodyText.includes("DeepSeek"),
          count: labCards.length
        };
      })()`,
      returnByValue: true,
    });
    assert(searchCheck.result.value.hasAnthropic === true, "Search query finds Anthropic");
    assert(searchCheck.result.value.count === 1, "Only 1 matching provider card rendered for 'Anthropic'");

    // Clear search
    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector("input[placeholder*='Search AI providers']");
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeSetter.call(input, "");
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
  }

  // 5. Navigate to Provider Detail (/providers/deepseek)
  console.log("\n4. Testing Dynamic Route: /providers/deepseek");
  {
    await send("Page.navigate", { url: "http://localhost:3000/providers/deepseek" });
    await waitForPageReady("DeepSeek", 12000);

    const detailCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.textContent || "";
        const compareButtons = Array.from(document.querySelectorAll("button")).filter(b => b.textContent.includes("Compare"));
        return {
          h1Title: h1 ? h1.textContent.trim() : null,
          hasPricingSummary: bodyText.includes("Unit Economics") || bodyText.includes("Pricing Summary"),
          hasBenchmarkHighlights: bodyText.includes("Benchmark Highlights"),
          hasR1: bodyText.includes("DeepSeek R1"),
          hasV3: bodyText.includes("DeepSeek V3"),
          hasCoder: bodyText.includes("DeepSeek Coder V2"),
          compareButtonsCount: compareButtons.length
        };
      })()`,
      returnByValue: true,
    });
    assert(detailCheck.result.value.h1Title === "DeepSeek", "Provider heading is 'DeepSeek'");
    assert(detailCheck.result.value.hasPricingSummary === true, "Displays unit economics & pricing summary");
    assert(detailCheck.result.value.hasBenchmarkHighlights === true, "Displays frontier benchmark highlights");
    assert(detailCheck.result.value.hasR1 === true, "Displays DeepSeek R1 model card");
    assert(detailCheck.result.value.hasV3 === true, "Displays DeepSeek V3 model card");
    assert(detailCheck.result.value.hasCoder === true, "Displays DeepSeek Coder V2 model card");
    assert(detailCheck.result.value.compareButtonsCount >= 3, `Compare buttons available for all models (${detailCheck.result.value.compareButtonsCount})`);
  }

  // 6. Comparison Integration from Provider Model Card
  console.log("\n5. Testing Comparison Integration from Provider Catalog");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const compareBtn = buttons.find(b => b.textContent.trim() === "Compare");
        if (compareBtn) compareBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const compareCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.textContent || "";
        return {
          hasSelectedState: bodyText.includes("Selected"),
          hasTrayCount: bodyText.includes("1/4") || bodyText.includes("1 of 4")
        };
      })()`,
      returnByValue: true,
    });
    assert(compareCheck.result.value.hasSelectedState === true, "Model button toggles to 'Selected'");
    assert(compareCheck.result.value.hasTrayCount === true, "Comparison tray reflects 1 selected model");
  }

  // 7. Category & License Filtering within Provider Detail
  console.log("\n6. Testing In-Lab Model Category & License Filtering");
  {
    // Filter by 'Code Generation' category
    await send("Runtime.evaluate", {
      expression: `(() => {
        const selects = Array.from(document.querySelectorAll("select"));
        const catSelect = selects[0];
        if (catSelect) {
          catSelect.value = "code-generation";
          catSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const catCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.textContent || "";
        return {
          hasCoder: bodyText.includes("DeepSeek Coder V2")
        };
      })()`,
      returnByValue: true,
    });
    assert(catCheck.result.value.hasCoder === true, "Filtering by category retains matching models");
  }

  // 8. Invalid Provider Slug 404 State
  console.log("\n7. Testing Invalid Provider Slug 404 Handling");
  {
    await send("Page.navigate", { url: "http://localhost:3000/providers/invalid-unknown-lab-999" });
    await waitForPageReady("Unknown AI Research Lab", 10000);

    const notFoundCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.textContent || "";
        const returnBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Return to Provider Directory"));
        return {
          h1Title: h1 ? h1.textContent.trim() : null,
          has404Badge: bodyText.includes("404 — Provider Not Found"),
          hasReturnBtn: !!returnBtn
        };
      })()`,
      returnByValue: true,
    });
    assert(notFoundCheck.result.value.has404Badge === true, "404 — Provider Not Found badge rendered");
    assert(notFoundCheck.result.value.h1Title === "Unknown AI Research Lab", "Displays 'Unknown AI Research Lab' heading");
    assert(notFoundCheck.result.value.hasReturnBtn === true, "Provides 'Return to Provider Directory' recovery button");
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  edge.kill();
  process.exit(failed > 0 ? 1 : 0);
}

runProvidersTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
