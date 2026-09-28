import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { domains } from '../db/schema'
import type { Domain, DomainRegistration, DomainSearchResult } from '../types/commerce'
import {
  DomainNameSchema,
  DomainRegistrationSchema,
  DomainSchema,
  DomainSearchResultSchema,
  type DomainConnectInput,
  type DomainCreateInput,
} from '../validation/commerce'
import { getOwnedProject } from './projectService'

export interface DomainRegistrarProvider {
  register(domain: Domain): Promise<DomainRegistration>
}

let domainRegistrarProvider: DomainRegistrarProvider | null = null

export function getDomainRegistrarProvider(): DomainRegistrarProvider | null {
  return domainRegistrarProvider
}

export function setDomainRegistrarProvider(provider: DomainRegistrarProvider | null): void {
  domainRegistrarProvider = provider
}

export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'DOMAIN_REGISTRAR_NOT_CONFIGURED' | 'DOMAIN_REGISTRAR_FAILED',
    readonly status: 404 | 501 | 502
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

function mapDomain(row: typeof domains.$inferSelect): Domain {
  return DomainSchema.parse({
    id: row.id,
    accountId: row.accountId,
    name: row.name,
    status: row.status,
    registration: row.registration,
    ...(row.hostingConnection ? { hostingConnection: row.hostingConnection } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  })
}

async function getOwnedDomain(accountId: string, id: string): Promise<Domain | null> {
  const row = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, id), eq(domains.accountId, accountId)))
    .get()
  return row ? mapDomain(row) : null
}

export function searchDomains(query: string): DomainSearchResult[] {
  const name = DomainNameSchema.parse(query)
  return [DomainSearchResultSchema.parse({
    name,
    availability: 'unknown',
    verification: 'not_checked',
    source: 'no_registrar',
  })]
}

export async function listDomains(accountId: string): Promise<Domain[]> {
  const rows = await db
    .select()
    .from(domains)
    .where(eq(domains.accountId, accountId))
    .orderBy(desc(domains.createdAt))
    .all()
  return rows.map(mapDomain)
}

export async function createDomain(accountId: string, input: DomainCreateInput): Promise<Domain> {
  const name = DomainNameSchema.parse(input.name)
  let hostingConnection: { status: 'pending'; projectId: string } | null = null

  if (input.projectId) {
    const project = await getOwnedProject(input.projectId, accountId)
    if (!project) throw new DomainError('Project not found', 'NOT_FOUND', 404)
    hostingConnection = { status: 'pending', projectId: project.id }
  }

  const now = new Date()
  const row = await db
    .insert(domains)
    .values({
      id: `domain_${crypto.randomUUID()}`,
      accountId,
      name,
      status: hostingConnection ? 'pending' : 'available',
      registration: {
        ownership: 'unknown',
        status: 'not_registered',
        autoRenew: false,
      },
      hostingConnection,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()

  return mapDomain(row)
}

export async function connectDomain(
  accountId: string,
  id: string,
  input: DomainConnectInput
): Promise<Domain> {
  const existing = await getOwnedDomain(accountId, id)
  if (!existing) throw new DomainError('Domain not found', 'NOT_FOUND', 404)

  const project = await getOwnedProject(input.projectId, accountId)
  if (!project) throw new DomainError('Project not found', 'NOT_FOUND', 404)

  const row = await db
    .update(domains)
    .set({
      status: 'pending',
      hostingConnection: { status: 'pending', projectId: project.id },
      updatedAt: new Date(),
    })
    .where(and(eq(domains.id, id), eq(domains.accountId, accountId)))
    .returning()
    .get()
  if (!row) throw new DomainError('Domain not found', 'NOT_FOUND', 404)
  return mapDomain(row)
}

export async function disconnectDomain(accountId: string, id: string): Promise<Domain> {
  const existing = await getOwnedDomain(accountId, id)
  if (!existing) throw new DomainError('Domain not found', 'NOT_FOUND', 404)

  const row = await db
    .update(domains)
    .set({
      status: 'available',
      hostingConnection: null,
      updatedAt: new Date(),
    })
    .where(and(eq(domains.id, id), eq(domains.accountId, accountId)))
    .returning()
    .get()
  if (!row) throw new DomainError('Domain not found', 'NOT_FOUND', 404)
  return mapDomain(row)
}

export async function registerDomain(accountId: string, id: string): Promise<Domain> {
  const existing = await getOwnedDomain(accountId, id)
  if (!existing) throw new DomainError('Domain not found', 'NOT_FOUND', 404)

  const provider = getDomainRegistrarProvider()
  if (!provider) {
    throw new DomainError(
      'Domain registrar provider is not configured',
      'DOMAIN_REGISTRAR_NOT_CONFIGURED',
      501
    )
  }

  let registration: DomainRegistration
  try {
    registration = DomainRegistrationSchema.parse(await provider.register(existing))
  } catch {
    throw new DomainError('Domain registration failed', 'DOMAIN_REGISTRAR_FAILED', 502)
  }
  if (registration.status !== 'registered') {
    throw new DomainError('Domain registration failed', 'DOMAIN_REGISTRAR_FAILED', 502)
  }

  const row = await db
    .update(domains)
    .set({
      status: existing.hostingConnection ? 'pending' : 'registered',
      registration,
      updatedAt: new Date(),
    })
    .where(and(eq(domains.id, id), eq(domains.accountId, accountId)))
    .returning()
    .get()
  if (!row) throw new DomainError('Domain not found', 'NOT_FOUND', 404)
  return mapDomain(row)
}
