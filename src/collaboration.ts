import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { BioPlotDocument } from './model';

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
}

export type CollaborationEvent =
  | { type: 'document'; document: BioPlotDocument; senderId: string }
  | { type: 'presence'; users: PresenceUser[]; senderId: string };

export interface CollaborationSession {
  connect(documentId: string, user: PresenceUser): Promise<void>;
  publishDocument(document: BioPlotDocument): void;
  subscribe(listener: (event: CollaborationEvent) => void): () => void;
  disconnect(): void;
}

export class BroadcastChannelCollaboration implements CollaborationSession {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<(event: CollaborationEvent) => void>();
  private user: PresenceUser | null = null;
  private peers = new Map<string, PresenceUser>();

  async connect(documentId: string, user: PresenceUser) {
    this.user = user;
    this.channel = new BroadcastChannel(`bioplot:${documentId}`);
    this.peers.set(user.id, user);
    this.channel.onmessage = message => {
      const event = message.data as CollaborationEvent;
      if (!event || event.senderId === this.user?.id) return;
      if (event.type === 'presence') event.users.forEach(peer => this.peers.set(peer.id, peer));
      this.listeners.forEach(listener => listener(event));
    };
    this.broadcastPresence();
  }

  publishDocument(document: BioPlotDocument) {
    if (!this.channel || !this.user) return;
    this.channel.postMessage({ type: 'document', document, senderId: this.user.id } satisfies CollaborationEvent);
  }

  subscribe(listener: (event: CollaborationEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    this.channel?.close();
    this.channel = null;
    this.listeners.clear();
    this.peers.clear();
  }

  private broadcastPresence() {
    if (!this.channel || !this.user) return;
    this.channel.postMessage({ type: 'presence', users: [...this.peers.values()], senderId: this.user.id } satisfies CollaborationEvent);
  }
}

export class SupabaseRealtimeCollaboration implements CollaborationSession {
  private channel: RealtimeChannel | null = null;
  private listeners = new Set<(event: CollaborationEvent) => void>();
  private user: PresenceUser | null = null;

  constructor(private client: SupabaseClient) {}

  async connect(documentId: string, user: PresenceUser) {
    this.user = user;
    this.channel = this.client.channel(`bioplot:${documentId}`, { config: { presence: { key: user.id } } });
    this.channel
      .on('broadcast', { event: 'document' }, ({ payload }) => {
        const event = payload as CollaborationEvent;
        if (!event || event.senderId === this.user?.id) return;
        this.listeners.forEach(listener => listener(event));
      })
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel || !this.user) return;
        const state = this.channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat().filter(Boolean);
        const event: CollaborationEvent = { type: 'presence', users, senderId: this.user.id };
        this.listeners.forEach(listener => listener(event));
      });
    await new Promise<void>((resolve, reject) => {
      this.channel?.subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track(user);
          resolve();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error('Realtime collaboration could not connect.'));
      });
    });
  }

  publishDocument(document: BioPlotDocument) {
    if (!this.channel || !this.user) return;
    void this.channel.send({ type: 'broadcast', event: 'document', payload: { type: 'document', document, senderId: this.user.id } satisfies CollaborationEvent });
  }

  subscribe(listener: (event: CollaborationEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    if (this.channel) void this.client.removeChannel(this.channel);
    this.channel = null;
    this.listeners.clear();
  }
}

export function createCollaborationSession(): CollaborationSession {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && anon) return new SupabaseRealtimeCollaboration(createClient(url, anon));
  return new BroadcastChannelCollaboration();
}

export function createAnonymousPresence(): PresenceUser {
  const id = sessionStorage.getItem('bioplot_presence_id') ?? `guest_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem('bioplot_presence_id', id);
  return { id, name: 'BioPlot collaborator', color: '#0b7a75' };
}
