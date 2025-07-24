import { AdapterRegistry as IAdapterRegistry } from '../interfaces/provider';
import { ProtocolAdapter } from '../interfaces/adapter';
import { AdapterConfig } from '../types';

export class AdapterRegistry implements IAdapterRegistry {
  private adapters = new Map<string, ProtocolAdapter>();
  private protocolMapping = new Map<string, Set<string>>();

  register(adapter: ProtocolAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter with id '${adapter.id}' is already registered`);
    }

    this.adapters.set(adapter.id, adapter);

    // Build protocol -> adapter mapping
    for (const protocol of adapter.supportedProtocols) {
      if (!this.protocolMapping.has(protocol)) {
        this.protocolMapping.set(protocol, new Set());
      }
      this.protocolMapping.get(protocol)!.add(adapter.id);
    }
  }

  unregister(adapterId: string): void {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      return;
    }

    // Clean up protocol mappings
    for (const protocol of adapter.supportedProtocols) {
      const adapterSet = this.protocolMapping.get(protocol);
      if (adapterSet) {
        adapterSet.delete(adapterId);
        if (adapterSet.size === 0) {
          this.protocolMapping.delete(protocol);
        }
      }
    }

    this.adapters.delete(adapterId);
  }

  getAll(): ProtocolAdapter[] {
    return Array.from(this.adapters.values());
  }

  getById(adapterId: string): ProtocolAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  getByProtocol(protocolName: string): ProtocolAdapter[] {
    const adapterIds = this.protocolMapping.get(protocolName);
    if (!adapterIds) {
      return [];
    }

    return Array.from(adapterIds)
      .map(id => this.adapters.get(id))
      .filter((adapter): adapter is ProtocolAdapter => adapter !== undefined);
  }

  getEnabled(): ProtocolAdapter[] {
    return this.getAll().filter(adapter => adapter.config.enabled);
  }

  updateConfig(adapterId: string, config: Partial<AdapterConfig>): void {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new Error(`Adapter with id '${adapterId}' not found`);
    }

    adapter.config = { ...adapter.config, ...config };
  }

  getSortedByPriority(): ProtocolAdapter[] {
    return this.getEnabled().sort(
      (a, b) => b.config.priority - a.config.priority
    );
  }

  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byProtocol: Record<string, number>;
  } {
    const all = this.getAll();
    const enabled = all.filter(a => a.config.enabled);
    const disabled = all.filter(a => !a.config.enabled);

    const byProtocol: Record<string, number> = {};
    for (const [protocol, adapterIds] of this.protocolMapping.entries()) {
      byProtocol[protocol] = adapterIds.size;
    }

    return {
      total: all.length,
      enabled: enabled.length,
      disabled: disabled.length,
      byProtocol,
    };
  }
}
