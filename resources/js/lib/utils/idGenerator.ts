export function generateSiteId(): string {
  return `site_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}

export function generateNodeId(siteId: string, clock: number): string {
  return `${siteId}_${clock}`;
}

export function parseSiteIdFromNodeId(nodeId: string): string {
  const parts = nodeId.split('_');
  return parts.slice(0, -1).join('_');
}

export function parseClockFromNodeId(nodeId: string): number {
  const parts = nodeId.split('_');
  return parseInt(parts[parts.length - 1], 10);
}