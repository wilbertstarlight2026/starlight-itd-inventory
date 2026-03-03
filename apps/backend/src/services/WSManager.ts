import type { WebSocket } from 'ws';
import type { LiveEvent } from '@starlight/shared';

const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

class WSManager {
  private clients = new Set<WebSocket>();

  add(ws: WebSocket): void {
    this.clients.add(ws);
  }

  remove(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  broadcast(event: LiveEvent): void {
    const payload = JSON.stringify(event);
    const dead: WebSocket[] = [];

    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        try {
          client.send(payload);
        } catch {
          dead.push(client);
        }
      } else if (client.readyState === WS_CLOSING || client.readyState === WS_CLOSED) {
        dead.push(client);
      }
    }

    for (const socket of dead) {
      this.clients.delete(socket);
    }
  }

  get count(): number {
    return this.clients.size;
  }
}

export const wsManager = new WSManager();
