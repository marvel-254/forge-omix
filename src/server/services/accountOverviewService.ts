import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { deployments, domains, projects, type AuthAccount } from '../db/schema'

function domainProjectId(hostingConnection: unknown): string | null {
  if (hostingConnection === null || typeof hostingConnection !== 'object' || Array.isArray(hostingConnection)) {
    return null
  }
  const projectId = (hostingConnection as { projectId?: unknown }).projectId
  return typeof projectId === 'string' ? projectId : null
}

export async function getAccountOverview(account: AuthAccount) {
  const [projectRows, deploymentRows, domainRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.accountId, account.id))
      .orderBy(desc(projects.updatedAt))
      .all(),
    db
      .select({ projectId: deployments.projectId })
      .from(deployments)
      .where(eq(deployments.accountId, account.id))
      .all(),
    db
      .select({ hostingConnection: domains.hostingConnection })
      .from(domains)
      .where(eq(domains.accountId, account.id))
      .all(),
  ])

  const deploymentCounts = new Map<string, number>()
  for (const deployment of deploymentRows) {
    deploymentCounts.set(deployment.projectId, (deploymentCounts.get(deployment.projectId) ?? 0) + 1)
  }

  const domainCounts = new Map<string, number>()
  for (const domain of domainRows) {
    const projectId = domainProjectId(domain.hostingConnection)
    if (projectId) domainCounts.set(projectId, (domainCounts.get(projectId) ?? 0) + 1)
  }

  return {
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
    },
    projects: projectRows.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt.toISOString(),
      deploymentCount: deploymentCounts.get(project.id) ?? 0,
      domainCount: domainCounts.get(project.id) ?? 0,
    })),
    totals: {
      projects: projectRows.length,
      deployments: deploymentRows.length,
      domains: domainRows.length,
    },
  }
}
