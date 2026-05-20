<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Rationale: Initial ratification of the Leniser WhatsApp Bot constitution.
           First materialized version from the placeholder template, so MAJOR
           baseline 1.0.0 per semantic versioning policy defined herein.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. WhatsApp Bot Focus (Product Boundary)
  - [PRINCIPLE_2_NAME] → II. Go-First Implementation
  - [PRINCIPLE_3_NAME] → III. Deliberate Framework Selection (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] → IV. Test-Backed Behavior
  - [PRINCIPLE_5_NAME] → V. Observability & Operational Safety

Added sections:
  - Technology & Architecture Constraints (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance (filled from placeholder)

Removed sections: none

Templates requiring updates:
  - ✅ .specify/memory/constitution.md (this file)
  - ⚠ .specify/templates/plan-template.md — Constitution Check section is a
    placeholder ("[Gates determined based on constitution file]"). Should be
    expanded on next /speckit.plan run to enumerate the gates derived from
    Principles I–V (framework justification gate, Go-first gate, test gate,
    observability gate, scope gate). No structural change required now.
  - ✅ .specify/templates/spec-template.md (no contradictions; no edit needed)
  - ✅ .specify/templates/tasks-template.md (existing phases align with the
    Setup → Foundational → User Story → Polish flow; "Initialize [language]
    with [framework]" placeholder already enforces explicit framework choice)
  - ⚠ README.md — currently describes a yarn/Node.js + Docker workflow.
    Not updated automatically; flagged for manual review once a Go migration
    or Go-based reimplementation is planned.

Deferred / TODO items:
  - TODO(RATIFICATION_DATE_CONFIRMATION): Date set to 2026-05-19 (first
    materialization). Confirm with project owner whether an earlier informal
    adoption date should replace this.
-->

# Leniser WhatsApp Bot Constitution

## Core Principles

### I. WhatsApp Bot Focus (Product Boundary)

The project's purpose is and remains a WhatsApp bot. Every feature MUST trace
back to a user-facing interaction conducted through WhatsApp (incoming message,
outgoing message, media exchange, group event, or operational command to the
bot). Capabilities that do not serve a WhatsApp interaction surface (e.g.,
generic web dashboards, unrelated APIs, multi-channel chat abstractions) are
out of scope unless explicitly ratified via an amendment.

**Rationale**: A clear product boundary prevents scope creep, keeps the
architecture small, and ensures that engineering effort compounds on the core
value proposition rather than diverging into adjacent products.

### II. Go-First Implementation

All new production code MUST be written in Go. The supported toolchain is the
latest stable Go release at the time a feature begins (current stable Go
1.x line). Mixed-language additions (e.g., a Python script, a Node.js helper)
are forbidden in the runtime path. Build-time tooling in other languages is
permitted only if it does not ship to production and is documented in the
plan.

Migration of the existing JavaScript/TypeScript codebase to Go is a stated
direction; until completed, legacy code MAY remain but MUST NOT be expanded
with new features — new features go into Go modules.

**Rationale**: A single production language reduces operational complexity,
simplifies deployment artifacts (single static binary), and aligns the team
around one set of idioms, tooling, and performance characteristics.

### III. Deliberate Framework Selection (NON-NEGOTIABLE)

Every plan, design, or task that introduces or changes a framework, library,
or major dependency MUST explicitly answer the following before
implementation begins:

1. What problem does this framework solve that the Go standard library cannot
   solve with comparable cost?
2. What is the maintenance status, license, and dependency footprint?
3. What is the lock-in risk and exit strategy?
4. What at least one rejected alternative was considered, and why?

This applies in particular to: the WhatsApp client/binding library, HTTP
router/web framework, ORM or database driver wrapper, logging library,
configuration library, dependency injection container, and any AI/LLM SDK.

The `/speckit.plan` workflow MUST surface these questions for the user
("always ask about frameworks") rather than silently defaulting. A plan
that adopts a framework without recording the four answers above fails the
Constitution Check.

**Rationale**: Framework choices are durable and expensive to reverse. The
project explicitly prefers small, composable Go packages and the standard
library, accepting larger frameworks only when justified. Forcing explicit
deliberation prevents accidental architecture.

### IV. Test-Backed Behavior

Behavior that is user-observable through WhatsApp (commands, responses,
media handling, error replies) or that is operationally critical (message
persistence, retry, rate limiting, auth) MUST be covered by automated tests
before being considered complete. Acceptable test forms:

- Unit tests for pure logic (parsers, formatters, command routers).
- Integration tests for components that touch I/O boundaries, using fakes,
  in-memory implementations, or testcontainers where appropriate.
- Contract tests for any external integration (WhatsApp transport,
  database, LLM API) where the contract is non-trivial.

Strict red-green TDD is encouraged but not mandated. What IS mandated: no
PR introducing user-observable behavior may be merged without at least one
automated test exercising that behavior, and tests MUST be runnable via a
single `go test ./...` invocation from the repository root.

**Rationale**: A bot's correctness is judged by message-level behavior.
Without tests at that level, regressions hide easily and operational trust
in the bot erodes.

### V. Observability & Operational Safety

Every code path that processes an incoming WhatsApp event or performs an
outbound call MUST emit structured logs sufficient to reconstruct what
happened, including: a correlation identifier per message, the handler
invoked, the outcome (success/failure/skip), and the latency. Logs MUST NOT
contain message body content or personally identifying user data at the
default log level; such content is allowed only at a debug level that is
disabled in production.

Outbound calls to third-party services (WhatsApp transport, LLM providers,
databases) MUST have an explicit timeout and a defined failure behavior
(retry policy, fallback, or user-visible error). Panics MUST be recovered
at the top of each handler so a single malformed event cannot crash the
process.

**Rationale**: A WhatsApp bot runs unattended and interacts with real
users; debuggability and predictable degradation are prerequisites for
running it in production without constant babysitting.

## Technology & Architecture Constraints

- **Language**: Go (latest stable). No new production code in other
  languages.
- **Distribution**: The bot MUST be packageable as a single container image
  and runnable via the existing Docker Compose workflow (or a documented
  successor).
- **State**: Persistent state lives in an external datastore (currently
  MongoDB per the existing deployment). The choice of datastore MAY be
  revisited, but each plan MUST state its storage assumption explicitly.
- **Configuration**: All runtime configuration MUST come from environment
  variables or mounted files — never from hard-coded values or committed
  secrets. Secrets MUST NOT be committed to the repository under any
  circumstance.
- **External AI/LLM usage**: When a feature uses an LLM or other paid
  external API, the plan MUST identify the provider, the model, the
  expected cost shape (per-call / per-token), and a kill switch
  (configuration flag) to disable the feature without redeploying.
- **Backward compatibility of user commands**: Renaming or removing a
  WhatsApp command that users invoke is a breaking change and MUST be
  called out in the plan with a migration note.

## Development Workflow & Quality Gates

- **Specification first**: Non-trivial features follow the Spec Kit flow —
  `/speckit.specify` → `/speckit.clarify` (if needed) → `/speckit.plan` →
  `/speckit.tasks` → `/speckit.implement`.
- **Plan Constitution Check**: Each plan MUST include a Constitution
  Check section that explicitly addresses Principles I–V, with particular
  attention to Principle III (framework justification) whenever a new
  dependency is proposed.
- **Code review**: Every change is reviewed before merge. The reviewer is
  responsible for verifying Constitution compliance, not just code
  quality.
- **CI gate**: `go build ./...` and `go test ./...` MUST pass before
  merge once the Go codebase exists. Until then, the equivalent gate on
  the legacy stack applies.
- **Commits and branches**: Feature work happens on feature branches
  named per the Spec Kit convention (e.g., `001-feature-name`). The
  `main` branch is always releasable.
- **Documentation**: When a feature changes user-visible bot commands,
  the README (or a dedicated commands doc) MUST be updated in the same
  PR.

## Governance

This constitution supersedes ad-hoc conventions and individual
preferences. When this document and another guideline conflict, this
document wins until amended.

**Amendment procedure**:

1. Open a change proposal (issue or PR) that quotes the section to be
   changed and explains the motivation.
2. The proposal MUST classify the change as MAJOR, MINOR, or PATCH per
   the versioning policy below and propose the resulting version.
3. At least one reviewer other than the proposer MUST approve.
4. On merge, the Sync Impact Report at the top of this file MUST be
   updated, and any dependent templates flagged for follow-up.

**Versioning policy**:

- **MAJOR**: Removal or backward-incompatible redefinition of a
  principle, or removal of a governance rule.
- **MINOR**: Addition of a new principle or materially expanded
  guidance within an existing section.
- **PATCH**: Wording clarifications, typo fixes, non-semantic
  refinements.

**Compliance review**: Constitution adherence is verified at three
points: during `/speckit.plan` (via the Constitution Check gate), during
code review, and opportunistically during `/speckit.analyze` runs. A
violation found post-merge MUST be tracked as a follow-up issue and
addressed or formally waived via amendment.

**Runtime development guidance**: Day-to-day engineering guidance for
agents and contributors lives in `AGENTS.md` and the templates under
`.specify/templates/`. Those documents MUST remain consistent with this
constitution; on conflict, this constitution prevails and the other
documents MUST be updated.

**Version**: 1.0.0 | **Ratified**: 2026-05-19 | **Last Amended**: 2026-05-19
