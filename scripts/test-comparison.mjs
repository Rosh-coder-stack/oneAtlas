import { spawn } from "node:child_process";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function runComparisonTestSuite() {
  console.log("==================================================");
  console.log("OneAtlas Model Comparison Feature Integration Suite");
  console.log("==================================================");

  const edge = spawn(EDGE_PATH, [
    "--headless=new",
    "--remote-debugging-port=9225",
    "--disable-extensions",
    "--disable-gpu",
    "--window-size=1440,900",
    "http://localhost:3000",
  ]);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9225/json/list");
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
    console.error("Failed to connect to browser on port 9225");
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

  // Wait 3.5s for initial page hydration
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

  // Clear any existing localStorage state first
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.clear();
      const clearBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("Clear All"));
      if (clearBtn) clearBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 300));

  // 1. Initial State: No tray visible
  console.log("\n1. Testing Initial State (0 models selected)");
  {
    const initialCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        return { hasTray: !!tray };
      })()`,
      returnByValue: true,
    });
    assert(initialCheck.result.value.hasTray === false, "Comparison tray is hidden when 0 models selected");
  }

  // 2. Select 1 Model
  console.log("\n2. Testing Selection of 1st Model");
  {
    const selectFirst = await send("Runtime.evaluate", {
      expression: `(() => {
        const compareBtns = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && b.textContent.trim() === "Compare");
        if (compareBtns.length > 0) {
          compareBtns[0].click();
          return { clicked: true };
        }
        return { clicked: false, count: compareBtns.length };
      })()`,
      returnByValue: true,
    });
    assert(selectFirst.result.value.clicked === true, "Clicked Compare button on 1st model card");
    await new Promise((r) => setTimeout(r, 400));

    const trayCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        const compareLink = tray ? tray.querySelector("a") : null;
        return {
          trayVisible: !!tray,
          countText: badge ? badge.textContent.trim() : null,
          compareDisabled: compareLink ? compareLink.getAttribute("aria-disabled") === "true" : null,
          compareText: compareLink ? compareLink.textContent.trim() : null
        };
      })()`,
      returnByValue: true,
    });
    assert(trayCheck.result.value.trayVisible === true, "Comparison tray appears");
    assert(trayCheck.result.value.countText === "1/4", "Tray counter indicates '1/4'");
    assert(trayCheck.result.value.compareDisabled === true, "'Compare Now' is disabled for 1 model", trayCheck.result.value.compareText);
  }

  // 3. Select 2nd Model (Enable threshold)
  console.log("\n3. Testing Selection of 2nd Model (Threshold reached)");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const compareBtns = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && b.textContent.trim() === "Compare");
        if (compareBtns.length > 0) compareBtns[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const thresholdCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        const compareLink = tray ? tray.querySelector("a") : null;
        return {
          countText: badge ? badge.textContent.trim() : null,
          compareDisabled: compareLink ? compareLink.getAttribute("aria-disabled") === "true" : null,
          compareText: compareLink ? compareLink.textContent.trim() : null
        };
      })()`,
      returnByValue: true,
    });
    assert(thresholdCheck.result.value.countText === "2/4", "Tray counter indicates '2/4'");
    assert(thresholdCheck.result.value.compareDisabled === false, "'Compare Now' is enabled for 2 models", thresholdCheck.result.value.compareText);
  }

  // 4. Select 3rd and 4th Models (Maximum capacity)
  console.log("\n4. Testing Selection up to Maximum Limit (4 models)");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const compareBtns = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && b.textContent.trim() === "Compare");
        if (compareBtns.length >= 2) {
          compareBtns[0].click();
          compareBtns[1].click();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    const maxCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        return { countText: badge ? badge.textContent.trim() : null };
      })()`,
      returnByValue: true,
    });
    assert(maxCheck.result.value.countText === "4/4", "Tray counter indicates '4/4' maximum capacity");
  }

  // 5. Attempt 5th Model (Overflow prevention)
  console.log("\n5. Testing Overflow Prevention (Cannot exceed 4 models)");
  {
    const overflowAttempt = await send("Runtime.evaluate", {
      expression: `(() => {
        const compareBtns = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && b.textContent.trim() === "Compare");
        if (compareBtns.length > 0) {
          compareBtns[0].click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    assert(overflowAttempt.result.value === true, "Attempted to click 5th model Compare button");
    await new Promise((r) => setTimeout(r, 400));

    const overflowCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        const warning = tray ? tray.textContent.includes("Maximum 4 models") : false;
        return {
          countText: badge ? badge.textContent.trim() : null,
          warningTriggered: warning
        };
      })()`,
      returnByValue: true,
    });
    assert(overflowCheck.result.value.countText === "4/4", "Model count strictly clamped at 4/4");
    assert(overflowCheck.result.value.warningTriggered === true, "Warning notification triggered: Maximum 4 models limit");
  }

  // 6. Test Quick Removal from Tray
  console.log("\n6. Testing Removal of a Model from Tray");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const removeBtns = tray ? tray.querySelectorAll("button[aria-label^='Remove']") : [];
        if (removeBtns.length > 0) removeBtns[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const removeCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        return { countText: badge ? badge.textContent.trim() : null };
      })()`,
      returnByValue: true,
    });
    assert(removeCheck.result.value.countText === "3/4", "Model count decreased to '3/4' after removal");
  }

  // 7. Test Navigation to /compare Route
  console.log("\n7. Testing Navigation to /compare and Comparison Table Rendering");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const compareLink = document.querySelector(".fixed.bottom-4 a");
        if (compareLink) compareLink.click();
      })()`,
    });

    // Wait 3.5s for page navigation and API details fetching
    await new Promise((r) => setTimeout(r, 3500));

    const pageCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const url = window.location.href;
        const table = document.querySelector("table");
        const headers = Array.from(document.querySelectorAll("th h3")).map(h => h.textContent.trim());
        const bestBadges = Array.from(document.querySelectorAll("span")).filter(s => s.textContent && (s.textContent.includes("Lowest") || s.textContent.includes("Top Score") || s.textContent.includes("Largest")));
        const verifiedBadges = Array.from(document.querySelectorAll("span")).filter(s => s.textContent && s.textContent.includes("Verified LMSYS/Lab"));
        return {
          url,
          isCompareRoute: url.includes("/compare"),
          hasTable: !!table,
          comparedModelNames: headers,
          bestBadgeCount: bestBadges.length,
          verifiedBadgeCount: verifiedBadges.length
        };
      })()`,
      returnByValue: true,
    });
    const res = pageCheck.result.value;
    assert(res.isCompareRoute, "Navigated successfully to /compare route", res.url);
    assert(res.hasTable, "Side-by-side comparison matrix table rendered");
    assert(res.comparedModelNames.length >= 2, `Models compared: ${res.comparedModelNames.join(", ")}`);
    assert(res.bestBadgeCount > 0, `Highlighting best-in-class values (Found ${res.bestBadgeCount} best badges)`);
    assert(res.verifiedBadgeCount > 0, `Distinguishing verified benchmark audits (Found ${res.verifiedBadgeCount} verified badges)`);
  }

  // 8. Test Navigation Back to Discovery and State Persistence
  console.log("\n8. Testing Navigation Back to Discovery & Selection Persistence");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const backLink = Array.from(document.querySelectorAll("a")).find(a => a.textContent && a.textContent.includes("Back to Discovery"));
        if (backLink) backLink.click();
      })()`,
    });

    await new Promise((r) => setTimeout(r, 2500));

    const persistCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const url = window.location.href;
        const tray = document.querySelector(".fixed.bottom-4");
        const badge = tray ? tray.querySelector(".font-mono") : null;
        const selectedButtons = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && b.textContent.includes("Selected"));
        return {
          url,
          hasTray: !!tray,
          trayCount: badge ? badge.textContent.trim() : null,
          selectedCardsCount: selectedButtons.length
        };
      })()`,
      returnByValue: true,
    });
    const pres = persistCheck.result.value;
    assert(!pres.url.includes("/compare"), "Navigated back to Discovery home page");
    assert(pres.hasTray, "Comparison tray persisted across navigation");
    assert(pres.trayCount === "3/4", "Tray count maintained at 3/4");
    assert(pres.selectedCardsCount >= 1, "ModelCard buttons show 'Selected' state");
  }

  // 9. Test Clear All
  console.log("\n9. Testing 'Clear All' Action");
  {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const clearBtn = tray ? Array.from(tray.querySelectorAll("button")).find(b => b.textContent && b.textContent.includes("Clear All")) : null;
        if (clearBtn) clearBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    const clearCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const tray = document.querySelector(".fixed.bottom-4");
        const selectedButtons = Array.from(document.querySelectorAll("button")).filter(b => b.textContent && b.textContent.includes("Selected"));
        return {
          hasTray: !!tray,
          selectedCardsCount: selectedButtons.length
        };
      })()`,
      returnByValue: true,
    });
    assert(clearCheck.result.value.hasTray === false, "Tray disappears after 'Clear All'");
    assert(clearCheck.result.value.selectedCardsCount === 0, "All ModelCard buttons revert from 'Selected' to 'Compare'");
  }

  // Cleanup
  ws.close();
  edge.kill();

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runComparisonTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
