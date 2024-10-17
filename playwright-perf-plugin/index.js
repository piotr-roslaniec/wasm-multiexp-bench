class ChromeTraceAnalyzer {
  // Source: https://github.com/meursyphus/flitter/blob/adf92d26e99a23c9858ce9e59d179368d8b6a9d2/packages/test/src/lib/ChromeTraceAnalyzer.js#L4

  nodes;

  constructor(trace) {
    this.setConfig(trace);
  }

  getDurationMs(name) {
    if (this.nodes == null) throw new Error("nodes is not initialized");
    const result = this.nodes.find((node) =>
      node.callFrame.functionName.match(name),
    );
    return result.duration / 1000; // as ms
  }

  setConfig(trace) {
    const { traceEvents } = trace;

    const profileChunks = traceEvents
      .filter((entry) => entry.name === "ProfileChunk")
      .filter((entry) => entry.args.data.cpuProfile != null);
    const nodes = profileChunks
      .map((entry) => entry.args.data.cpuProfile.nodes)
      .flat()
      .filter((node) => node != null)
      .filter((node) => node.callFrame != null)
      .sort((a, b) => a.id - b.id);
    const sampleTimes = {};

    profileChunks.forEach((chunk) => {
      const {
        cpuProfile: { samples },
        timeDeltas,
      } = chunk.args.data;

      samples.forEach((id, index) => {
        const delta = timeDeltas[index];
        const time = sampleTimes[id] || 0;
        sampleTimes[id] = time + delta;
      });
    });

    this.nodes = nodes.map((node) => ({
      id: node.id,
      parent: node.parent,
      callFrame: node.callFrame,
      children: [],
      duration: sampleTimes[node.id] || 0,
    }));

    const nodesMap = new Map();

    this.nodes.forEach((node) => {
      nodesMap.set(node.id, node);
    });

    [...this.nodes]
      .sort((a, b) => b.id - a.id)
      .forEach((node) => {
        if (node.parent == null) return;
        const parentNode = nodesMap.get(node.parent);
        if (parentNode) {
          parentNode.children.push(node);
          parentNode.duration += node.duration;
        }
      });
  }

  eventNames() {
    return this.nodes.map((n) => n.callFrame.functionName);
  }
}

class TracePlugin {
  browser;
  page;
  observableCalls;

  constructor(browser, page, observableCalls) {
    this.browser = browser;
    this.page = page;
    this.observableCalls = observableCalls;
  }

  async startTracing() {
    try {
      await this.browser.startTracing(this.page);
      await this.page.evaluate(() => window.performance.mark("Perf:Started"));
    } catch (error) {
      console.error("Failed to start tracing:", error);
    }
  }

  async stopTracing() {
    try {
      await this.page.evaluate(() => window.performance.mark("Perf:Ended"));
      const buffer = await this.browser.stopTracing();
      if (!buffer) {
        throw new Error(
          "Buffer is undefined. Tracing may not have been started.",
        );
      }
      const trace = JSON.parse(buffer.toString("utf8"));
      const analyzer = new ChromeTraceAnalyzer(trace);
      let duration = this.analyzeTraces(analyzer);
      let eventNames = analyzer.eventNames();
      return { duration, eventNames };
    } catch (error) {
      console.error("Failed to stop tracing:", error);
      return null;
    }
  }

  analyzeTraces(analyzer) {
    const start = performance.now();
    const duration = {};
    for (const call of this.observableCalls) {
      duration[call] = analyzer.getDurationMs(call);
    }
    console.log(`Analyzed tracing in ${performance.now() - start}ms`);
    return duration;
  }
}

module.exports = { TracePlugin };
