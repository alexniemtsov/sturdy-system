import { RGANode } from '@/types/crdt';

export function extractTextFromNodes(nodes: Map<string, RGANode>, sequence: string[]): string {
  return sequence
    .map(nodeId => nodes.get(nodeId))
    .filter(node => node && node.visible)
    .map(node => node!.content)
    .join('');
}

export function findInsertPosition(text: string, targetPosition: number): number {
  return Math.min(Math.max(0, targetPosition), text.length);
}

export function calculateTextPosition(sequence: string[], nodes: Map<string, RGANode>, nodeId: string): number {
  let position = 0;
  for (const id of sequence) {
    if (id === nodeId) break;
    const node = nodes.get(id);
    if (node && node.visible) {
      position += node.content.length;
    }
  }
  return position;
}

export function findNodeAtPosition(
  sequence: string[], 
  nodes: Map<string, RGANode>, 
  position: number
): { nodeId: string | null; offset: number } {
  let currentPos = 0;
  
  for (const nodeId of sequence) {
    const node = nodes.get(nodeId);
    if (!node || !node.visible) continue;
    
    if (currentPos + node.content.length > position) {
      return { nodeId, offset: position - currentPos };
    }
    currentPos += node.content.length;
  }
  
  return { nodeId: null, offset: 0 };
}

export function splitNodeContent(content: string, position: number): [string, string] {
  if (position <= 0) return ['', content];
  if (position >= content.length) return [content, ''];
  return [content.slice(0, position), content.slice(position)];
}