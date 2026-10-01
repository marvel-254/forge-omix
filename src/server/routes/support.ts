import { Hono, type Context } from 'hono'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { accounts, supportMessages, supportTickets } from '../db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/authMiddleware'
import { createValidationMiddleware } from '../middleware/validation'
import { createApiResponse, createErrorResponse } from '../utils'

const router = new Hono<AuthEnv>()
router.use('*', authMiddleware())

const createSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  category: z.enum(['account', 'billing', 'domain', 'deployment', 'technical', 'other']),
  message: z.string().trim().min(1).max(5000),
}).strict()

const replySchema = z.object({ body: z.string().trim().min(1).max(5000) }).strict()
const adminReplySchema = replySchema.extend({ internal: z.boolean().optional() }).strict()
const updateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0)

function account(c: Context<AuthEnv>) {
  const current = c.get('account')
  if (!current) throw new Error('Authenticated account missing')
  return current
}

async function ticketFor(id: string | undefined, accountId: string, isAdmin: boolean) {
  if (!id) return null
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1)
  return row && (isAdmin || row.accountId === accountId) ? row : null
}

async function thread(ticketId: string, isAdmin: boolean) {
  const rows = await db.select().from(supportMessages)
    .where(eq(supportMessages.ticketId, ticketId))
    .orderBy(supportMessages.createdAt)
  return isAdmin ? rows : rows.filter((message) => !message.internal)
}

router.get('/', async (c) => {
  try {
    const current = account(c)
    const rows = current.role === 'admin'
      ? await db.select({ ticket: supportTickets, requesterEmail: accounts.email })
          .from(supportTickets).innerJoin(accounts, eq(accounts.id, supportTickets.accountId))
          .orderBy(desc(supportTickets.updatedAt)).limit(200)
          .then((items) => items.map(({ ticket, requesterEmail }) => ({ ...ticket, requesterEmail })))
      : await db.select().from(supportTickets).where(eq(supportTickets.accountId, current.id))
          .orderBy(desc(supportTickets.updatedAt)).limit(100)
    return createApiResponse(c, rows)
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to load support tickets', undefined, 500)
  }
})

router.post('/', createValidationMiddleware(createSchema), async (c) => {
  try {
    const current = account(c)
    const input = c.get('validatedData') as z.infer<typeof createSchema>
    const now = new Date()
    const id = crypto.randomUUID()
    await db.insert(supportTickets).values({
      id, accountId: current.id, subject: input.subject, category: input.category,
      priority: 'normal', status: 'open', assignedTo: null,
      createdAt: now, updatedAt: now, closedAt: null,
    })
    await db.insert(supportMessages).values({
      id: crypto.randomUUID(), ticketId: id, accountId: current.id,
      body: input.message, internal: false, createdAt: now,
    })
    return createApiResponse(c, { id }, 201)
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to create support ticket', undefined, 500)
  }
})

router.get('/:id', async (c) => {
  try {
    const current = account(c)
    const isAdmin = current.role === 'admin'
    const ticket = await ticketFor(c.req.param('id'), current.id, isAdmin)
    if (!ticket) return createErrorResponse(c, 'NOT_FOUND', 'Support ticket not found', undefined, 404)
    return createApiResponse(c, { ...ticket, messages: await thread(ticket.id, isAdmin) })
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to load support ticket', undefined, 500)
  }
})

router.post('/:id/replies', createValidationMiddleware(replySchema), async (c) => {
  try {
    const current = account(c)
    const ticket = await ticketFor(c.req.param('id'), current.id, current.role === 'admin')
    if (!ticket) return createErrorResponse(c, 'NOT_FOUND', 'Support ticket not found', undefined, 404)
    const input = c.get('validatedData') as z.infer<typeof replySchema>
    const now = new Date()
    await db.insert(supportMessages).values({
      id: crypto.randomUUID(), ticketId: ticket.id, accountId: current.id,
      body: input.body, internal: false, createdAt: now,
    })
    await db.update(supportTickets).set({
      status: current.role === 'admin' ? 'waiting_customer' : 'open', updatedAt: now,
    }).where(eq(supportTickets.id, ticket.id))
    return createApiResponse(c, { sent: true }, 201)
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to add support reply', undefined, 500)
  }
})

router.post('/:id/reopen', async (c) => {
  const current = account(c)
  try {
    const ticket = await ticketFor(c.req.param('id'), current.id, current.role === 'admin')
    if (!ticket) return createErrorResponse(c, 'NOT_FOUND', 'Support ticket not found', undefined, 404)
    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
      return createErrorResponse(c, 'INVALID_TICKET_STATE', 'This support ticket is already active', undefined, 409)
    }
    const now = new Date()
    await db.update(supportTickets).set({ status: 'open', closedAt: null, updatedAt: now })
      .where(eq(supportTickets.id, ticket.id))
    return createApiResponse(c, { reopened: true })
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to reopen support ticket', undefined, 500)
  }
})

router.post('/:id/admin-replies', createValidationMiddleware(adminReplySchema), async (c) => {
  const current = account(c)
  if (current.role !== 'admin') return createErrorResponse(c, 'FORBIDDEN', 'Operator access required', undefined, 403)
  try {
    const ticket = await ticketFor(c.req.param('id'), current.id, true)
    if (!ticket) return createErrorResponse(c, 'NOT_FOUND', 'Support ticket not found', undefined, 404)
    const input = c.get('validatedData') as z.infer<typeof adminReplySchema>
    const now = new Date()
    await db.insert(supportMessages).values({
      id: crypto.randomUUID(), ticketId: ticket.id, accountId: current.id,
      body: input.body, internal: input.internal ?? false, createdAt: now,
    })
    if (!input.internal) await db.update(supportTickets).set({
      status: 'waiting_customer', updatedAt: now,
    }).where(eq(supportTickets.id, ticket.id))
    else await db.update(supportTickets).set({ updatedAt: now }).where(eq(supportTickets.id, ticket.id))
    return createApiResponse(c, { sent: true }, 201)
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to add operator reply', undefined, 500)
  }
})

router.patch('/:id', createValidationMiddleware(updateSchema), async (c) => {
  const current = account(c)
  if (current.role !== 'admin') return createErrorResponse(c, 'FORBIDDEN', 'Operator access required', undefined, 403)
  try {
    const ticket = await ticketFor(c.req.param('id'), current.id, true)
    if (!ticket) return createErrorResponse(c, 'NOT_FOUND', 'Support ticket not found', undefined, 404)
    const input = c.get('validatedData') as z.infer<typeof updateSchema>
    const now = new Date()
    await db.update(supportTickets).set({
      ...(input.status ? { status: input.status, closedAt: ['resolved', 'closed'].includes(input.status) ? now : null } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
      updatedAt: now,
    }).where(eq(supportTickets.id, ticket.id))
    return createApiResponse(c, { updated: true })
  } catch {
    return createErrorResponse(c, 'DATABASE_ERROR', 'Failed to update support ticket', undefined, 500)
  }
})

export default router
