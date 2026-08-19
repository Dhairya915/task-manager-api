import type WebSocket from 'ws';

export const connections = new Map<string, WebSocket>();
