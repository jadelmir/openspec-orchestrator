import type { AgentAdapter, AgentCapabilities } from "./types.js";

export class AgentRegistry {
  private readonly adapters = new Map<string, AgentAdapter>();

  constructor(adapters: AgentAdapter[] = []) {
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter: AgentAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): AgentAdapter | undefined {
    return this.adapters.get(id);
  }

  all(): AgentAdapter[] {
    return [...this.adapters.values()];
  }

  async detected(cwd: string): Promise<AgentAdapter[]> {
    const results = await Promise.all(
      this.all().map(async (adapter) => ({ adapter, detected: await adapter.detect(cwd) }))
    );
    return results.filter((item) => item.detected).map((item) => item.adapter);
  }

  async installAll(cwd: string) {
    return Promise.all(
      this.all().map(async (adapter) => ({ adapter, results: await adapter.install(cwd) }))
    );
  }

  async updateAll(cwd: string) {
    return Promise.all(
      this.all().map(async (adapter) => ({ adapter, results: await adapter.update(cwd) }))
    );
  }

  filterByCapabilities(
    adapters: AgentAdapter[],
    required: Partial<AgentCapabilities>
  ): AgentAdapter[] {
    return adapters.filter((adapter) => {
      const capabilities = adapter.capabilities();
      return Object.entries(required).every(([key, value]) => {
        if (value === undefined) return true;
        const actual = capabilities[key as keyof AgentCapabilities];
        if (Array.isArray(value)) {
          return Array.isArray(actual) && value.every((entry) => actual.includes(entry as never));
        }
        return actual === value;
      });
    });
  }
}
