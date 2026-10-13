import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { useSchemaStore } from '../../store/schemaStore'
import { CommentList } from '../../components/comment/CommentList'
import { CommentForm } from '../../components/comment/CommentForm'

/**
 * Comments canvas section (WordPress comment section parity, free).
 *
 * Renders the approved comments for the active page plus a submission form.
 * The section itself carries no props — it binds to the page it sits on via
 * the store's active page id, so a dropped Comments section always shows the
 * right thread.
 */

interface BaseRenderProps extends Record<string, unknown> {
  id: string
  puck: unknown
}

export const CommentsConfig: ComponentConfig = {
  fields: {},
  defaultProps: {},
  render: (props: BaseRenderProps) => {
    const project = useSchemaStore((s) => s.project)
    const activePageId = useSchemaStore((s) => s.activePageId)
    const [refreshKey, setRefreshKey] = useState(0)
    void props

    const pageId = activePageId ?? ''
    const projectId = project?.id ?? null

    return (
      <section
        className="w-full bg-background px-6 py-16 text-foreground"
        data-testid="comments-section"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Comments</h2>
          <div className="mt-8">
            <CommentList key={`${pageId}-${refreshKey}`} pageId={pageId} />
          </div>
          <div className="mt-10 border-t border-border pt-8">
            <h3 className="text-lg font-semibold">Leave a comment</h3>
            <div className="mt-4">
              <CommentForm
                projectId={projectId}
                pageId={pageId}
                onPosted={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        </div>
      </section>
    )
  },
}
