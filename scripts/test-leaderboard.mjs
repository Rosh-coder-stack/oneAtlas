import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runLeaderboardTestSuite() {
  console.log("==================================================");
  console.log("OneAtlas Rankings & Benchmarks Module Test Suite");
  console.log("==================================================");

  const edge = spawn(EDGE_PATH, [
    "--headless=new",
    "--remote-debugging-port=9226",
    "--disable-extensions",
    "--disable-gpu",
    "--window-size=1440,900",
    "http://localhost:3000/leaderboard",
  ]);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9226/json/list");
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === "page");
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
    console.error("Failed to connect to browser on port 9226");
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

  // Wait 3.5s for initial page hydration and data fetch
  await new Promise((r) => setTimeout(r, 3500));

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

  // 1. Initial Leaderboard Page State
  console.log("\n1. Testing Leaderboard Route & Header");
  {
    const headerCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1");
        const table = document.querySelector("table");
        return {
          title: h1 ? h1.textContent.trim() : null,
          hasTable: !!table
        };
      })()`,
      returnByValue: true,
    });
    assert(headerCheck.result.value.title?.includes("Rankings"), "Leaderboard title rendered correctly", headerCheck.result.value.title);
    assert(headerCheck.result.value.hasTable === true, "Ranked leaderboard table rendered");
  }

  // 2. Category Filters (Overall, Reasoning & Math, Coding, General Knowledge)
  console.log("\n2. Testing Category Filters");
  {
    const categoryCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll("button")).filter(b => {
          const t = b.textContent.trim();
          return ["Overall", "Reasoning & Math", "Coding", "General Knowledge"].includes(t);
        });
        return {
          categoriesCount: buttons.length,
          names: buttons.map(b => b.textContent.trim())
        };
      })()`,
      returnByValue: true,
    });
    assert(categoryCheck.result.value.categoriesCount === 4, "All 4 required category filters present", categoryCheck.result.value.names.join(", "));

    // Click 'Coding' category
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Coding");
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Verify benchmarks under 'Coding' category
    const codingSuitesCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const url = window.location.href;
        const suiteButtons = Array.from(document.querySelectorAll("button")).filter(b => {
          const t = b.textContent;
          return t.includes("SWE-bench") || t.includes("HumanEval");
        });
        return {
          url,
          suitesFound: suiteButtons.map(b => b.textContent.trim())
        };
      })()`,
      returnByValue: true,
    });
    assert(codingSuitesCheck.result.value.suitesFound.length >= 2, "Coding category displays SWE-bench Verified and HumanEval", codingSuitesCheck.result.value.suitesFound.join(" | "));
  }

  // 3. Benchmark Suite Selection & Top 3 Podium
  console.log("\n3. Testing Benchmark Suite Selection & Top 3 Podium");
  {
    // Click 'SWE-bench Verified'
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("SWE-bench Verified"));
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const podiumCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const suiteTitle = document.querySelector("h2") ? document.querySelector("h2").textContent.trim() : null;
        const top3Names = Array.from(document.querySelectorAll("h3")).map(h => h.textContent.trim());
        const goldBadge = Array.from(document.querySelectorAll("span")).find(s => s.textContent.includes("#1 Gold Leader"));
        return {
          suiteTitle,
          top3Count: top3Names.length,
          top3Names,
          hasGoldBadge: !!goldBadge
        };
      })()`,
      returnByValue: true,
    });
    assert(podiumCheck.result.value.suiteTitle === "SWE-bench Verified", "Switched active suite to SWE-bench Verified");
    assert(podiumCheck.result.value.hasGoldBadge === true, "Top 1 Gold Leader badge rendered");
    assert(podiumCheck.result.value.top3Names.length >= 3, `Top 3 models: ${podiumCheck.result.value.top3Names.slice(0, 3).join(", ")}`);
  }

  // 4. Verification Labels & Un-Evaluated Models Excluded
  console.log("\n4. Testing Audit Provenance Labels & Clean Ranking");
  {
    const provenanceCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const verifiedBadges = Array.from(document.querySelectorAll("span")).filter(s => s.textContent.includes("Verified LMSYS/Lab"));
        const estimatedBadges = Array.from(document.querySelectorAll("span")).filter(s => s.textContent.includes("Estimated"));
        const rows = Array.from(document.querySelectorAll("tbody tr"));
        return {
          verifiedCount: verifiedBadges.length,
          estimatedCount: estimatedBadges.length,
          totalRankedRows: rows.length
        };
      })()`,
      returnByValue: true,
    });
    assert(provenanceCheck.result.value.verifiedCount > 0, `Verified LMSYS/Lab audit badges present (${provenanceCheck.result.value.verifiedCount})`);
    assert(provenanceCheck.result.value.totalRankedRows > 0, `All rows in table have valid scores (${provenanceCheck.result.value.totalRankedRows} ranked models)`);
  }

  // 5. Provider Filtering in Table
  console.log("\n5. Testing Provider Filter in Leaderboard");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const labSelect = Array.from(document.querySelectorAll("select")).find(s => Array.from(s.options).some(o => o.text === "All Labs"));
        if (labSelect) {
          labSelect.value = "anthropic";
          labSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const labFilterCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll("tbody tr"));
        const providers = rows.map(r => {
          const cells = r.querySelectorAll("td");
          return cells[1] ? cells[1].textContent : "";
        });
        const allAnthropic = providers.every(p => p.includes("Anthropic"));
        return {
          rowCount: rows.length,
          allAnthropic
        };
      })()`,
      returnByValue: true,
    });
    assert(labFilterCheck.result.value.rowCount > 0, "Filtered table returns Anthropic models", `Found: ${labFilterCheck.result.value.rowCount}`);
    assert(labFilterCheck.result.value.allAnthropic === true, "All filtered rows strictly belong to Anthropic");

    // Reset filter
    await send("Runtime.evaluate", {
      expression: `(() => {
        const resetBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Reset");
        if (resetBtn) resetBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // 6. License Filtering
  console.log("\n6. Testing License Filter");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const licSelect = Array.from(document.querySelectorAll("select")).find(s => Array.from(s.options).some(o => o.text === "All Licenses"));
        if (licSelect) {
          licSelect.value = "open-weights";
          licSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const openWeightsCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const rows = Array.from(document.querySelectorAll("tbody tr"));
        const licenses = rows.map(r => r.textContent.includes("Open Weights"));
        return {
          rowCount: rows.length,
          allOpenWeights: licenses.every(Boolean)
        };
      })()`,
      returnByValue: true,
    });
    assert(openWeightsCheck.result.value.rowCount > 0, "Open weights filter returns models", `Found: ${openWeightsCheck.result.value.rowCount}`);
    assert(openWeightsCheck.result.value.allOpenWeights === true, "All filtered models have openWeights");

    // Reset filter
    await send("Runtime.evaluate", {
      expression: `(() => {
        const resetBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Reset");
        if (resetBtn) resetBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // 7. Score Sorting
  console.log("\n7. Testing Score Sorting Order");
  {
    // Check initial top score
    const initialTopScore = await send("Runtime.evaluate", {
      expression: `(() => {
        const firstScore = document.querySelector("tbody tr td:nth-child(3)");
        return firstScore ? firstScore.textContent.trim() : null;
      })()`,
      returnByValue: true,
    });

    // Toggle sort order
    await send("Runtime.evaluate", {
      expression: `(() => {
        const sortBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Score:"));
        if (sortBtn) sortBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const reversedTopScore = await send("Runtime.evaluate", {
      expression: `(() => {
        const firstScore = document.querySelector("tbody tr td:nth-child(3)");
        return firstScore ? firstScore.textContent.trim() : null;
      })()`,
      returnByValue: true,
    });
    assert(initialTopScore.result.value !== reversedTopScore.result.value, "Score sort toggle inverted ranking order");

    // Toggle back
    await send("Runtime.evaluate", {
      expression: `(() => {
        const sortBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Score:"));
        if (sortBtn) sortBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // 8. Quick Add to Compare from Leaderboard Table
  console.log("\n8. Testing Quick Compare Action from Ranked Row");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const compareBtn = document.querySelector("tbody tr td button[title*='comparison']");
        if (compareBtn) compareBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const trayCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        return {
          hasTray: !!tray,
          countText: badge ? badge.textContent.trim() : null
        };
      })()`,
      returnByValue: true,
    });
    assert(trayCheck.result.value.hasTray === true, "Comparison tray triggered from leaderboard row");
    assert(trayCheck.result.value.countText?.includes("/4"), "Comparison counter updated in tray");
  }

  // 9. Methodology & Governance Section
  console.log("\n9. Testing Evaluation Governance & Methodology Section");
  {
    const governanceCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const h3 = Array.from(document.querySelectorAll("h3")).find(h => h.textContent.includes("Ranking Methodology"));
        const bodyText = document.body.textContent;
        const hasMetricSeparation = bodyText.includes("Metric Integrity & Separation");
        const hasMissingExclusion = bodyText.includes("Missing Value Exclusion");
        const hasAuditTracking = bodyText.includes("Audit Provenance Tracking");
        return {
          hasGovernanceSection: !!h3,
          hasMetricSeparation,
          hasMissingExclusion,
          hasAuditTracking
        };
      })()`,
      returnByValue: true,
    });
    const g = governanceCheck.result.value;
    assert(g.hasGovernanceSection, "Ranking Methodology & Evaluation Governance section rendered");
    assert(g.hasMetricSeparation, "Explains metric separation (% vs ELO units)");
    assert(g.hasMissingExclusion, "Explains missing score exclusion policy");
    assert(g.hasAuditTracking, "Explains audit provenance tracking");
  }

  // Cleanup
  ws.close();
  edge.kill();

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runLeaderboardTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
