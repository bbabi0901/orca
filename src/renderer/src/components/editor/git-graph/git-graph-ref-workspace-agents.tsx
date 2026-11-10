import { useCallback } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { AgentStateDot, agentStateLabel } from '@/components/AgentStateDot'
import { CompactAgentRow } from '@/components/sidebar/workspace-card/activity/worktree-card-compact-agent-row'
import { useWorktreeAgentRows } from '@/components/sidebar/workspace-card/activity/useWorktreeAgentRows'
import { activateWorktreeAgentPane } from '@/components/sidebar/workspace-card/activity/use-worktree-agent-activation'
import { activateRetainedAgentRow } from '@/components/sidebar/workspace-card/activity/activate-retained-agent-row'
import { agentRowDisplayDotState } from '@/lib/agent-status/presentation/agent-row-dot-state'
import { AGENT_LIST_STATUS_RANK } from '../../../../../shared/agent-status/presentation/agent-list-status'
import { useNow } from '@/hooks/use-now'
import { AgentTypeIcon } from '@/components/agent/icons/agent-type-icon'
import { useAgentRowConversationName } from '@/components/dashboard/use-agent-row-conversation-name'
import type { DashboardAgentRow } from '@/components/dashboard/useDashboardData'
import { getAgentRowPrimaryText } from '../../../../../shared/agent-status/presentation/agent-row-primary-text'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/utils'
import type { Worktree } from '../../../../../shared/worktree/types'

function AgentName({ agent }: { agent: DashboardAgentRow }) {
  const name = useAgentRowConversationName(agent) ?? getAgentRowPrimaryText(agent.entry)
  return (
    <>
      <span className="inline-flex shrink-0">
        <AgentTypeIcon agentType={agent.agentType} size={12} />
      </span>
      {name && <span className="max-w-40 min-w-0 truncate">{name}</span>}
    </>
  )
}

/** The agent sessions of the workspace that has this ref checked out, so the graph tells who worked on a branch. */
export function GitGraphRefWorkspaceAgents({
  worktree,
  named = false
}: {
  worktree: Worktree
  /** Names the first session inline where the row has room; the rest stay in the hover card. */
  named?: boolean
}) {
  const t = useTranslate()
  const rows = useWorktreeAgentRows(worktree.id)
  const now = useNow(30_000, rows.length > 0)
  const onActivate = useCallback(
    (tabId: string, paneKey: string) => {
      const row = rows.find((candidate) => candidate.paneKey === paneKey)
      if (row?.rowSource === 'retained') {
        activateRetainedAgentRow(worktree.id, tabId, paneKey)
      } else {
        activateWorktreeAgentPane(worktree.id, tabId, paneKey)
      }
    },
    [rows, worktree.id]
  )
  if (rows.length === 0) {
    return null
  }
  // The chip shows the session needing attention first, as the sidebar card does.
  const top = rows.reduce((first, next) =>
    AGENT_LIST_STATUS_RANK[agentRowDisplayDotState(next)] <
    AGENT_LIST_STATUS_RANK[agentRowDisplayDotState(first)]
      ? next
      : first
  )
  const state = agentRowDisplayDotState(top)
  const label = t('gitGraph.workspaceAgents', 'Agents in this workspace')
  return (
    <HoverCard openDelay={200} closeDelay={120}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-0.5',
            // The session name gives way before the branch name does.
            named ? 'min-w-6 shrink-[999] overflow-hidden' : 'shrink-0'
          )}
          aria-label={`${label}: ${rows.length}, ${agentStateLabel(state)}`}
        >
          <AgentStateDot state={state} title={null} />
          {named && <AgentName agent={top} />}
          {rows.length > 1 && (
            <span className="shrink-0 text-2xs leading-none tabular-nums">
              {named ? `+${rows.length - 1}` : rows.length}
            </span>
          )}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        variant="workspace-details"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {rows.map((agent) => (
          <CompactAgentRow
            key={agent.paneKey}
            agent={agent}
            now={now}
            showModel={false}
            cacheTimerActive={false}
            onActivate={onActivate}
          />
        ))}
      </HoverCardContent>
    </HoverCard>
  )
}
