import { defineFixture } from '../../../component-fixtures/component-fixture'
import { GitGraphRefs } from './git-graph-ref-menu'
import { GitGraphTab } from './git-graph-tab'
import { gitGraphHistoryForTab } from './git-graph-tab-controllers'
import { GitHistoryRow } from '@/components/right-sidebar/source-control/sync/git-history-row'
import { buildGitHistoryViewModels } from '../../../../../shared/git/history/git-history-graph'
import type { AgentStatusEntry } from '../../../../../shared/agent-status/contracts/agent-status-types'
import type { TerminalTab } from '../../../../../shared/workspace-layout/terminal-tab-types'
import type { Worktree } from '../../../../../shared/worktree/types'
import type { Repo } from '../../../../../shared/repo-types'
import type { GitHistoryResult } from '../../../../../shared/git/history/git-history-types'

const now = Date.now()
const MINUTE = 60_000
const LEAF = '11111111-1111-4111-8111-111111111111'
const worktreeId = 'fixture-repo::/repo-login'
const workspace: Worktree = {
  id: worktreeId,
  repoId: 'fixture-repo',
  path: '/repo-login',
  branch: 'refs/heads/feat/login',
  hostId: 'local',
  head: 'a',
  isBare: false,
  isMainWorktree: false,
  displayName: 'login',
  comment: '',
  linkedIssue: null,
  linkedPR: null,
  linkedLinearIssue: null,
  isArchived: false,
  isUnread: false,
  isPinned: false,
  sortOrder: 0,
  lastActivityAt: 0
}
// The workspace showing the graph: its branch has no switch target but still has sessions.
const current: Worktree = {
  ...workspace,
  id: 'fixture-repo::/repo',
  path: '/repo',
  branch: 'refs/heads/main',
  isMainWorktree: true,
  displayName: 'main'
}

function session(
  worktreeId: string,
  index: number,
  agentType: AgentStatusEntry['agentType'],
  state: AgentStatusEntry['state'],
  prompt: string,
  startedAgo: number
): { tab: TerminalTab; entry: AgentStatusEntry } {
  const tab: TerminalTab = {
    id: `fixture-tab-${worktreeId === current.id ? 'main' : 'login'}-${index}`,
    ptyId: null,
    worktreeId,
    title: prompt,
    customTitle: null,
    color: null,
    sortOrder: index,
    createdAt: now
  }
  return {
    tab,
    entry: {
      paneKey: `${tab.id}:${LEAF}`,
      worktreeId,
      tabId: tab.id,
      agentType,
      state,
      prompt,
      updatedAt: now,
      stateStartedAt: now - startedAgo,
      stateHistory: []
    }
  }
}

const sessions = [
  session(worktreeId, 0, 'claude', 'working', 'Wire the OAuth callback', 12 * MINUTE),
  session(worktreeId, 1, 'codex', 'waiting', 'Review the login plan', 3 * MINUTE),
  session(current.id, 0, 'claude', 'working', 'Draft the release notes', 2 * MINUTE)
]
const store = {
  tabsByWorktree: {
    [worktreeId]: sessions.slice(0, 2).map(({ tab }) => tab),
    [current.id]: sessions.slice(2).map(({ tab }) => tab)
  },
  agentStatusByPaneKey: Object.fromEntries(sessions.map(({ entry }) => [entry.paneKey, entry]))
}
const agentWorkspaces = new Map([
  [workspace.branch, workspace],
  [current.branch, current]
])
const references = [
  { id: 'refs/heads/main', name: 'main' },
  { id: workspace.branch, name: 'feat/login' }
]

function render() {
  return (
    <div className="flex w-full bg-background p-3 text-xs text-foreground">
      <GitGraphRefs
        controller={gitGraphHistoryForTab('fixture-repo::/repo').actions}
        support={{ supported: true, reason: undefined }}
        onCheckout={() => {}}
        onSwitch={async () => {}}
        workspaces={new Map([[workspace.branch, workspace]])}
        agentWorkspaces={agentWorkspaces}
        references={references}
        currentRefId="refs/heads/main"
      />
    </div>
  )
}

export const chip = defineFixture({ width: 320, store, render })

// A workspace without sessions keeps the plain chip.
export const noSessions = defineFixture({ width: 320, render })

export const sessionsOpen = defineFixture({
  width: 420,
  store,
  render,
  interact: async (frame) => {
    frame
      .querySelector('[data-slot="hover-card-trigger"]')
      ?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }))
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
})

// The Source Control commits list shows the same sessions on its ref badges.
export const historyRow = defineFixture({
  width: 420,
  store,
  render: () => (
    <div className="w-full bg-sidebar text-foreground">
      <GitHistoryRow
        viewModel={
          buildGitHistoryViewModels([
            { id: 'a', parentIds: [], subject: 'Add login form', message: '', references }
          ])[0]!
        }
        agentWorkspaces={agentWorkspaces}
      />
    </div>
  )
})

const repo: Repo = {
  id: 'fixture-repo',
  path: '/repo',
  displayName: 'repo',
  badgeColor: '',
  addedAt: 0,
  executionHostId: 'local'
}
const commit = (id: string, parentIds: string[], subject: string, minutesAgo: number) => ({
  id,
  parentIds,
  subject,
  message: subject,
  author: 'Ada Lovelace',
  timestamp: now - minutesAgo * MINUTE
})
const branch = (name: string) => ({ id: `refs/heads/${name}`, name })
const remote = (name: string) => ({ id: `refs/remotes/origin/${name}`, name: `origin/${name}` })
// Long names and remote copies, the case that crowds a row.
const graphCurrent: Worktree = { ...current, branch: 'refs/heads/ada-lovelace/worktree-test' }
const graphWorkspaces: Worktree[] = [
  graphCurrent,
  { ...workspace, branch: 'refs/heads/chore/ai-report-usp-persona-plan' },
  { ...workspace, id: 'fixture-repo::/repo-main', path: '/repo-main', branch: 'refs/heads/main' }
]
const history: GitHistoryResult = {
  items: [
    {
      ...commit('p1', ['m2'], 'docs: AI report persona plan for the USP section', 2),
      references: [
        branch('chore/ai-report-usp-persona-plan'),
        remote('chore/ai-report-usp-persona-plan')
      ]
    },
    {
      ...commit('m2', ['m1', 'f2'], 'Merge pull request #247 from acme/chore/release-2.0.0', 5),
      references: [branch('main'), branch('ada-lovelace/worktree-test'), remote('main')]
    },
    {
      ...commit('f2', ['f1'], 'docs: align the release notes with the 2.0.0 listing', 20),
      references: [branch('chore/release-2.0.0'), remote('chore/release-2.0.0')]
    },
    commit('f1', ['m1'], 'chore: bump the extension version to 2.0.0', 30),
    commit('m1', [], 'Initial commit', 90)
  ],
  currentRef: branch('ada-lovelace/worktree-test'),
  hasMore: false,
  hasIncomingChanges: false,
  hasOutgoingChanges: false,
  limit: 50
}

// The whole tab, so the row layout around the chips is captured too.
export const graph = defineFixture({
  width: 980,
  store: {
    ...store,
    repos: [repo],
    worktreesByRepo: { [repo.id]: graphWorkspaces },
    activeWorktreeId: current.id,
    activeWorkspaceExecutionHostId: 'local'
  },
  setup: () => {
    window.api.git.history = async () => history
  },
  render: () => (
    <div className="h-52 w-full">
      <GitGraphTab worktreeId={current.id} />
    </div>
  )
})
