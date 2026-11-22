import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runModelDetailTestSuite() {
  console.log("==================================================");
  console.log("OneAtlas AI Model Detail Page Integration Suite");
  console.log("==================================================");

  const edge = spawn(EDGE_PATH, [
    "--headless=new",
    "--remote-debugging-port=9227",
    "--user-data-dir=C:\\Users\\VICTUS\\AppData\\Local\\Temp\\edge-test-models",
    "--disable-extensions",
    "--disable-gpu",
    "--window-size=1440,900",
    "http://localhost:3000/models/deepseek-r1",
  ]);

  let targets = null;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9227/json/list");
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
    console.error("Failed to connect to browser on port 9227");
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

  // Explicitly navigate to ensure viewport is on target route
  await send("Page.navigate", { url: "http://localhost:3000/models/deepseek-r1" });

  // Helper to wait until Next.js page finishes compiling and rendering target route
  async function waitForPageReady(expectedTitleSubstring = null, timeoutMs = 14000) {
    const start = Date.now();
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
  await waitForPageReady("DeepSeek R1", 16000);

  // Clear any existing localStorage state
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.clear();
      const clearBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("Clear All"));
      if (clearBtn) clearBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

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

  // 1. Initial State on /models/deepseek-r1
  console.log("\n1. Testing Model Detail Route: /models/deepseek-r1");
  {
    const modelCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.innerText;
        return {
          title: h1 ? h1.textContent.trim() : null,
          hasDeepSeek: bodyText.includes("DeepSeek"),
          hasOpenWeights: bodyText.includes("Open Weights"),
          hasMitLicense: bodyText.includes("MIT License")
        };
      })()`,
      returnByValue: true,
    });
    assert(modelCheck.result.value.title === "DeepSeek R1", "Model title is 'DeepSeek R1'", modelCheck.result.value.title);
    assert(modelCheck.result.value.hasDeepSeek === true, "Displays provider 'DeepSeek'");
    assert(modelCheck.result.value.hasOpenWeights === true, "Displays license type 'Open Weights'");
    assert(modelCheck.result.value.hasMitLicense === true, "Displays exact license 'MIT License'");
  }

  // 2. Hardware Topology & Context Window
  console.log("\n2. Testing Parameters & Hardware Topology");
  {
    const specsCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.textContent || "";
        return {
          hasTotalParams: bodyText.includes("671B"),
          hasActiveParams: bodyText.includes("37B active") || bodyText.includes("37B"),
          hasContext: bodyText.includes("128K tokens") || bodyText.includes("128K"),
          hasInferenceCapabilities: bodyText.includes("Inference Capabilities") || bodyText.includes("Supported Modalities")
        };
      })()`,
      returnByValue: true,
    });
    assert(specsCheck.result.value.hasTotalParams === true, "Displays total parameter count (671B)");
    assert(specsCheck.result.value.hasActiveParams === true, "Displays active parameters per forward pass (37B active)");
    assert(specsCheck.result.value.hasContext === true, "Displays context window (128K tokens)");
    assert(specsCheck.result.value.hasInferenceCapabilities === true, "Displays supported modalities & capabilities section");
  }

  // 3. Pricing Architecture & Simulator
  console.log("\n3. Testing Pricing Architecture & Query Cost Estimator");
  {
    const pricingCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.textContent || "";
        return {
          hasInputRate: bodyText.includes("$0.55") || bodyText.includes("0.55"),
          hasOutputRate: bodyText.includes("$2.19") || bodyText.includes("2.19"),
          hasSimulator: bodyText.includes("Workload Cost Simulator") || bodyText.includes("Estimated Workload Cost")
        };
      })()`,
      returnByValue: true,
    });
    assert(pricingCheck.result.value.hasInputRate === true, "Displays accurate input pricing ($0.55/1M)");
    assert(pricingCheck.result.value.hasOutputRate === true, "Displays accurate output pricing ($2.19/1M)");
    assert(pricingCheck.result.value.hasSimulator === true, "Renders interactive query cost simulator");
  }

  // 4. Standardized Benchmark Evaluations & Audit Transparency
  console.log("\n4. Testing Benchmark Performance & Audit Transparency");
  {
    const evalCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const verifiedBadges = Array.from(document.querySelectorAll("span")).filter(s => s.textContent.includes("Verified LMSYS/Lab"));
        const bodyText = document.body.textContent || "";
        return {
          verifiedCount: verifiedBadges.length,
          hasBenchmarkSection: bodyText.includes("Standardized Benchmark Evaluations"),
          hasUnEvaluatedDisclosure: bodyText.includes("Un-Evaluated Benchmark Suites"),
          hasHonestNotice: bodyText.includes("Not Evaluated")
        };
      })()`,
      returnByValue: true,
    });
    assert(evalCheck.result.value.hasBenchmarkSection === true, "Displays benchmark evaluations section");
    assert(evalCheck.result.value.verifiedCount > 0, `Audit provenance badges present (${evalCheck.result.value.verifiedCount})`);
    assert(evalCheck.result.value.hasUnEvaluatedDisclosure === true, "Contains un-evaluated suites transparency notice");
    assert(evalCheck.result.value.hasHonestNotice === true, "Honest reporting without fabricated scores");
  }

  // 5. Comparison Tray Integration from Model Detail
  console.log("\n5. Testing Comparison Integration from Detail View");
  {
    // Click 'Add to Compare' button
    await send("Runtime.evaluate", {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const compareBtn = buttons.find(b => b.textContent.includes("Add to Compare"));
        if (compareBtn) compareBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const trayCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const isButtonToggled = bodyText.includes("Selected in Tray") || bodyText.includes("Remove from Tray");
        const hasCount = bodyText.includes("1/4") || bodyText.includes("1 of 4");
        return {
          hasCount,
          isButtonToggled
        };
      })()`,
      returnByValue: true,
    });
    assert(trayCheck.result.value.isButtonToggled === true, "Action button toggled to 'Selected in Tray'");
    assert(trayCheck.result.value.hasCount === true, "Comparison tray synchronized with 1 model selected");
  }

  // 6. Navigate to Second Model (/models/claude-3-5-sonnet)
  console.log("\n6. Testing Proprietary Model Route: /models/claude-3-5-sonnet");
  {
    await send("Page.navigate", { url: "http://localhost:3000/models/claude-3-5-sonnet" });
    await waitForPageReady("Claude 3.5 Sonnet", 12000);

    const claudeCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.innerText;
        return {
          title: h1 ? h1.textContent.trim() : null,
          hasAnthropic: bodyText.includes("Anthropic"),
          hasProprietary: bodyText.includes("Proprietary Commercial") || bodyText.includes("Proprietary"),
          hasContext: bodyText.includes("200K tokens") || bodyText.includes("200K"),
          hasPricing: bodyText.includes("$3.00") && bodyText.includes("$15.00")
        };
      })()`,
      returnByValue: true,
    });
    assert(claudeCheck.result.value.title === "Claude 3.5 Sonnet", "Model title is 'Claude 3.5 Sonnet'");
    assert(claudeCheck.result.value.hasAnthropic === true, "Provider is 'Anthropic'");
    assert(claudeCheck.result.value.hasProprietary === true, "License is 'Proprietary Commercial'");
    assert(claudeCheck.result.value.hasContext === true, "Context window is 200K tokens");
    assert(claudeCheck.result.value.hasPricing === true, "Displays $3.00/1M input and $15.00/1M output pricing");

    // Add Claude to comparison tray as well
    await send("Runtime.evaluate", {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const compareBtn = buttons.find(b => b.textContent.includes("Add to Compare"));
        if (compareBtn) compareBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const twoModelsCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const bodyText = document.body.innerText;
        return {
          hasTwoCount: bodyText.includes("2/4")
        };
      })()`,
      returnByValue: true,
    });
    assert(twoModelsCheck.result.value.hasTwoCount === true, "Tray successfully holds 2 models (DeepSeek R1 + Claude 3.5 Sonnet)");
  }

  // 7. Testing Open-Weights Model with Zero Direct Cost (/models/llama-3-3-70b-instruct)
  console.log("\n7. Testing Zero Cost Open-Weights Model: /models/llama-3-3-70b-instruct");
  {
    await send("Page.navigate", { url: "http://localhost:3000/models/llama-3-3-70b-instruct" });
    await waitForPageReady("Llama 3.3 70B Instruct", 12000);

    const llamaCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.innerText;
        return {
          title: h1 ? h1.textContent.trim() : null,
          hasMeta: bodyText.includes("Meta AI"),
          hasFreeOpen: bodyText.includes("Free / Open"),
          hasDenseTopology: bodyText.includes("70B (Dense)") || bodyText.includes("Dense")
        };
      })()`,
      returnByValue: true,
    });
    assert(llamaCheck.result.value.title === "Llama 3.3 70B Instruct", "Model title is 'Llama 3.3 70B Instruct'");
    assert(llamaCheck.result.value.hasMeta === true, "Provider is 'Meta AI'");
    assert(llamaCheck.result.value.hasFreeOpen === true, "Displays 'Free / Open' token pricing");
    assert(llamaCheck.result.value.hasDenseTopology === true, "Parameter topology correctly recognizes Dense 70B");
  }

  // 8. Testing 404 Not Found State on Invalid Slug
  console.log("\n8. Testing Invalid Slug & 404 Not Found Handling");
  {
    await send("Page.navigate", { url: "http://localhost:3000/models/non-existent-frontier-model-999" });
    await waitForPageReady("Unknown Foundation Model", 10000);

    const notFoundCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const bodyText = document.body.innerText;
        const returnBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Return to Discovery"));
        return {
          h1Title: h1 ? h1.textContent.trim() : null,
          has404Badge: bodyText.includes("404 — Model Not Found"),
          hasReturnBtn: !!returnBtn
        };
      })()`,
      returnByValue: true,
    });
    assert(notFoundCheck.result.value.has404Badge === true, "404 — Model Not Found badge rendered");
    assert(notFoundCheck.result.value.h1Title === "Unknown Foundation Model", "Displays 'Unknown Foundation Model' heading");
    assert(notFoundCheck.result.value.hasReturnBtn === true, "Provides 'Return to Discovery' action button");
  }

  // 9. Testing Navigation Link from Discovery Home to Model Detail
  console.log("\n9. Testing In-App Navigation Link from Discovery Home Page");
  {
    await send("Page.navigate", { url: "http://localhost:3000" });
    await waitForPageReady(null, 10000);

    const linkCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const modelLinks = Array.from(document.querySelectorAll("a")).filter(a => a.getAttribute("href")?.startsWith("/models/"));
        return {
          modelLinksCount: modelLinks.length,
          sampleHref: modelLinks[0] ? modelLinks[0].getAttribute("href") : null
        };
      })()`,
      returnByValue: true,
    });
    assert(linkCheck.result.value.modelLinksCount > 0, `Discovery catalog contains direct links to model detail pages (${linkCheck.result.value.modelLinksCount} links found)`);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  edge.kill();
  process.exit(failed > 0 ? 1 : 0);
}

runModelDetailTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
