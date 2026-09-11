import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BioPlotDocument, migrateDocument } from './model';

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>;
  load(id: string): Promise<BioPlotDocument | null>;
  save(document: BioPlotDocument): Promise<void>;
  remove(id: string): Promise<void>;
}

const LOCAL_KEY = 'bioplot_v3_documents';

export class LocalProjectRepository implements ProjectRepository {
  private read(): BioPlotDocument[] {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(migrateDocument) : [];
    } catch {
      return [];
    }
  }
  private write(documents: BioPlotDocument[]) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(documents));
  }
  async list() {
    return this.read()
      .map(document => ({ id: document.id, title: document.title, updatedAt: document.updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async load(id: string) {
    return this.read().find(document => document.id === id) ?? null;
  }
  async save(document: BioPlotDocument) {
    const documents = this.read();
    const next = { ...document, updatedAt: new Date().toISOString() };
    const index = documents.findIndex(item => item.id === next.id);
    if (index >= 0) documents[index] = next;
    else documents.unshift(next);
    this.write(documents);
  }
  async remove(id: string) {
    this.write(this.read().filter(document => document.id !== id));
  }
}

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private client: SupabaseClient) {}

  private async userId() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error('Supabase authentication is required.');
    return data.user.id;
  }

  async list() {
    const userId = await this.userId();
    const { data, error } = await this.client
      .from('bioplot_projects')
      .select('id,title,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(row => ({ id: row.id, title: row.title, updatedAt: row.updated_at }));
  }

  async load(id: string) {
    const userId = await this.userId();
    const { data, error } = await this.client
      .from('bioplot_projects')
      .select('document')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.document ? migrateDocument(data.document) : null;
  }

  async save(document: BioPlotDocument) {
    const userId = await this.userId();
    const updatedAt = new Date().toISOString();
    const { error } = await this.client.from('bioplot_projects').upsert({
      id: document.id,
      user_id: userId,
      title: document.title,
      document: { ...document, updatedAt },
      updated_at: updatedAt
    });
    if (error) throw error;
  }

  async remove(id: string) {
    const userId = await this.userId();
    const { error } = await this.client.from('bioplot_projects').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  }
}

export const localProjects = new LocalProjectRepository();

export function createCloudRepository(): SupabaseProjectRepository | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) return null;
  return new SupabaseProjectRepository(createClient(url, anon));
}
