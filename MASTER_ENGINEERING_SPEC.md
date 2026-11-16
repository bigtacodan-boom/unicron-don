# TO KILL A JARVIS

## Master Engineering, Connectivity, Research and Construction Specification

**Document:** `MASTER_ENGINEERING_SPEC.md`
**Project:** To Kill a Jarvis
**Engineering premise:** One Percent Theory
**Primary objective:** Build a modular automation intelligence system by understanding, connecting and orchestrating existing software capabilities.

---

## Scope of this document

The governing premise is the One Percent Theory: identify the small number of high-leverage capabilities, connections, execution paths and operating decisions that produce a disproportionately large share of the system's total power.

The system should therefore be designed around leverage, not feature count. It should reuse working blueprints, connect mature components through their real interfaces, select the strongest operating environment for each task, and deliver the highest practical output from the lowest practical hardware and operating cost.

This document brings the earlier research — Automaton, REA, reverse API engineering, repository discovery, orchestration, model selection, cloud and local execution, revenue automation, repository sweeping and build-integrity testing — into one connected engineering plan. It distinguishes verified interfaces from claims that still need source-level confirmation, so a coding agent has traceable references rather than guesses.

### A crucial research correction: two different projects are called Automaton

Both repositories are relevant, for different reasons:

- `Conway-Research/automaton` — https://github.com/Conway-Research/automaton — describes a continuously running, self-improving agent with a wallet, sandbox, heartbeat, model-cost tiers, self-modification and replication. Its design is relevant to sustained autonomy, resource economics and operating continuously.
- `ishan-parihar/automaton` — https://github.com/ishan-parihar/automaton — is a Rust graph-orchestration substrate with modules, workflows, a scheduler, a graph model and an MCP interface. Its design is relevant to connecting and executing capabilities.

These are not the same product, and neither should be assumed to be the final foundation. The first is a useful autonomy and economics case study; the second is a useful orchestration candidate. This specification evaluates both against the actual system requirements.

### A second valuable finding

ShadowAPI — https://github.com/darkooom/ShadowAPI — documents a complete observed-traffic pipeline: proxy, redact, store, infer, export OpenAPI, replay mocks and detect contract changes. That gives a concrete, testable pattern for reverse API engineering rather than a vague instruction to "connect APIs."

---

## 1. THE ONE PERCENT THEORY

The system operates under the One Percent Theory.

The premise is that a relatively small number of carefully selected capabilities, connections, models, execution environments and automation pathways can produce a disproportionately large amount of practical control and output.

The engineering objective is to identify those high-leverage components and connect them correctly.

The system should continuously answer:

1. Which existing project already performs the required function?
2. What does that project actually control?
3. How does it expose its functionality?
4. What APIs, protocols, SDKs, tools, events or interfaces does it provide?
5. Which other systems can connect to it?
6. What is the most efficient combination of components?
7. What is the lowest-cost environment capable of delivering the required result?
8. How can the combined capability be measured and improved?
9. How can the system retain knowledge of its discoveries and reuse them?

The theory applies to the entire engineering system.

For example, an expensive model should not automatically handle every task. A small local model may classify a request, a more capable model may investigate a difficult codebase, and a specialized model may perform a particular task. A workflow engine can coordinate these operations, while a separate execution environment performs the actual work.

The same principle applies to hardware, API connectivity, storage, browser automation, scheduling, research, and revenue-generating workflows.

The objective is maximum useful capability per unit of cost.

## 2. PROJECT DEFINITION

To Kill a Jarvis is an extensible automation intelligence and orchestration system.

It discovers existing software, investigates how that software works, identifies its available capabilities, understands its interfaces, connects compatible systems, and makes the combined functionality available through one coherent control architecture.

The project is not defined by one model, one agent framework, one programming language, or one operating system.

It is defined by the ability to connect and coordinate existing capabilities.

Its central functions are:

- Repository discovery and analysis.
- Reverse API engineering.
- Application and software behavior investigation.
- Capability and interface extraction.
- Connector and adapter management.
- Agent and workflow orchestration.
- Local and cloud execution.
- Model selection and inference routing.
- Computer, browser and desktop interaction.
- Persistent research and project memory.
- Cost and performance optimization.
- Revenue opportunity discovery and business automation.
- Repository prompt-injection scanning.
- Continuous integration and execution verification.

## 3. CORE ENGINEERING MODEL

The application consists of interconnected engineering layers.

### 3.1 Research and discovery layer

Purpose: discover existing working software and identify its actual capabilities.

Research sources:

- GitHub repositories.
- GitHub repository trees and source files.
- GitHub releases and commit history.
- GitHub Actions and workflow definitions.
- Official product documentation.
- SDK documentation.
- OpenAPI specifications.
- MCP tool catalogs.
- Package registries.
- Existing integration blueprints.
- Technical architecture documents.
- Test suites and examples.
- Issues and pull requests.
- Application network captures.
- Existing automation templates.

The discovery engine records each candidate and produces a structured capability report.

Each report includes:

- Project name and repository URL.
- Current version or commit SHA.
- License.
- Primary language and framework.
- Architecture.
- Installation and runtime requirements.
- Available APIs and SDKs.
- MCP interfaces.
- Input and output formats.
- Authentication mechanisms.
- Supported integrations.
- Dependencies.
- Hardware requirements.
- Test and benchmark evidence.
- Relevant limitations.
- Potential connections to other components.

The research engine should identify existing working implementations before proposing new implementation work.

### 3.2 Reverse API engineering layer

This is a central engineering capability.

Its purpose is to understand how software communicates and how its available functionality can be represented as reusable interfaces.

The reverse API engineering process consists of:

1. Identify the application or service.
2. Identify its communication methods.
3. Inspect available source code and documentation.
4. Observe authorized application network traffic.
5. Identify hosts, routes, methods and request patterns.
6. Identify headers, parameters and payload structures.
7. Identify authentication and session behavior.
8. Examine response structures and error handling.
9. Identify relationships between sequential API calls.
10. Infer reusable endpoint and operation definitions.
11. Generate an API contract.
12. Generate or configure a client adapter.
13. Test the adapter against observed behavior.
14. Store the resulting interface and evidence in the capability registry.

#### Candidate projects

**mitmproxy** — https://github.com/mitmproxy/mitmproxy

HTTP and HTTPS traffic inspection, flow capture and analysis.

Documentation: https://docs.mitmproxy.org/stable/

**mitmproxy2swagger** — https://github.com/alufers/mitmproxy2swagger

Converts observed traffic and HAR files into OpenAPI specifications.

**ShadowAPI** — https://github.com/darkooom/ShadowAPI

Observed HTTP traffic to OpenAPI 3.1, local mocks and contract-difference detection.

Its documented pipeline provides a useful implementation reference:

`Proxy → Record → Infer → Store → Export → Mock → Compare`

**REA — Reverse Engineer Anything**

- https://github.com/morluto/rea
- https://rea.tools/

Provides agent-accessible investigation across applications, binaries, source artifacts, runtime behavior, recorded network captures and other technical evidence.

REA is an investigation capability within the larger architecture.

Its findings should be converted into structured engineering knowledge, API definitions, implementation plans and tested integrations.

#### Reverse API engineering output format

Each discovered interface should produce a record containing:

- API identifier.
- Application or provider.
- Base URL or transport.
- HTTP method or protocol operation.
- Route or operation name.
- Request schema.
- Response schema.
- Authentication method.
- Required configuration.
- Error behavior.
- Related operations.
- Source evidence.
- Confidence level.
- Generated client location.
- Contract test location.

OpenAPI should be used where appropriate for HTTP APIs. Other protocols should retain their native definitions and operation models.

## 4. CAPABILITY ORCHESTRATION

### 4.1 Automaton research

Two separate projects are relevant and must be evaluated independently.

#### Conway Research Automaton

https://github.com/Conway-Research/automaton

Investigate its:

- Continuous agent loop.
- Think, act and observe cycle.
- Heartbeat scheduling.
- Persistent state.
- Resource and credit monitoring.
- Model-cost tiers.
- Sandbox execution.
- Agent self-modification.
- Git-versioned changes.
- Skills.
- Agent identity and registration.
- Replication architecture.

This project is relevant to sustained autonomy, resource economics and continuous operation.

#### Ishan Parihar Automaton

https://github.com/ishan-parihar/automaton

Investigate its:

- Rust architecture.
- Graph-native workflow model.
- Module registry.
- Workflow planner.
- DAG materializer.
- Parallel execution engine.
- Scheduler.
- SQLite and PostgreSQL storage.
- MCP interface.
- Resource management.
- Execution telemetry.
- Webhooks.
- Build system.

This project is relevant to graph orchestration and reusable automation modules.

Its published README describes a 38-tool MCP interface and a two-layer design graph/run graph architecture. Verify the actual tool definitions, crate membership, runtime implementation and tests against the repository before selecting it.

### 4.2 Orchestration architecture

The system needs a central capability graph.

Each available function is represented as a capability node.

Each connection is represented as an edge.

Relationships include:

- `CALLS`
- `DEPENDS_ON`
- `PROVIDES`
- `REQUIRES`
- `TRIGGERS`
- `USES_MODEL`
- `USES_PROVIDER`
- `EXECUTES_IN`
- `READS_FROM`
- `WRITES_TO`
- `RETURNS`
- `VALIDATED_BY`

Example:

```
GitHub Repository Discovery
→ Source Analysis
→ REA Investigation
→ Reverse API Engineering
→ API Contract
→ Generated Adapter
→ Capability Registry
→ Workflow Planner
→ Execution Provider
→ Test Results
→ Reusable Capability
```

The graph should support:

- Capability discovery.
- Dependency resolution.
- Pathfinding.
- Workflow generation.
- Parallel execution.
- Conditional branches.
- Retry and recovery.
- Scheduled execution.
- Version tracking.
- Execution telemetry.
- Capability substitution.

### 4.3 Candidate orchestration systems

Evaluate:

- Automaton: https://github.com/ishan-parihar/automaton
- Temporal: https://github.com/temporalio/temporal
- Activepieces: https://github.com/activepieces/activepieces
- Kestra: https://github.com/kestra-io/kestra
- Windmill: https://github.com/windmill-labs/windmill
- Node-RED: https://github.com/node-red/node-red
- Apache Airflow: https://github.com/apache/airflow
- OpenClaw: https://github.com/openclaw/openclaw
- StackStorm: https://github.com/StackStorm/st2

Evaluate the actual orchestration capabilities, persistence, retries, event handling, scheduling, integrations, resource requirements and licensing.

The system should use existing orchestration engines where they provide the required functionality.

## 5. UNIVERSAL CONNECTIVITY ARCHITECTURE

The system needs a common interface between its control plane and external capabilities.

### 5.1 Connector types

Implement provider adapters for:

1. REST APIs.
2. GraphQL APIs.
3. WebSocket connections.
4. gRPC services.
5. MCP servers.
6. Command-line applications.
7. Local libraries and SDKs.
8. Browser automation.
9. Desktop automation.
10. Git and repository services.
11. Workflow engines.
12. Cloud execution services.
13. Local execution environments.
14. File and storage systems.
15. Messaging and notification services.
16. Device and operating-system interfaces.

### 5.2 Universal connector contract

Every adapter should expose a consistent internal representation:

- Provider identity.
- Capability identity.
- Connection configuration.
- Authentication configuration.
- Input schema.
- Output schema.
- Operation definitions.
- Health check.
- Error representation.
- Timeout behavior.
- Execution status.
- Telemetry.
- Version information.

The connector registry should allow multiple implementations of the same capability.

For example, code execution may be provided by Docker, E2B, Daytona or another provider. The application should select the appropriate provider without redesigning the workflow.

### 5.3 Existing multi-provider sandbox abstraction

**OpenCore Sandbox SDK** — https://github.com/opencoredev/sandbox-sdk

Evaluate its common TypeScript API and provider adapters.

Its documented provider list includes E2B, Daytona, Vercel Sandbox, Upstash Box, Railway and local Docker-based execution.

Investigate the exact provider coverage and capability differences in the installed version.

## 6. EXECUTION ENVIRONMENTS

### 6.1 Local execution

Evaluate:

- Docker.
- Podman.
- Linux containers.
- Firecracker.
- Local virtual machines.
- Windows Subsystem for Linux.
- Native operating-system processes.

### 6.2 Cloud execution

**E2B Runtime**

- https://github.com/e2b-dev/runtime
- https://e2b.dev/

Investigate:

- Firecracker microVMs.
- Sandbox creation.
- Process execution.
- Filesystem operations.
- Port forwarding.
- Snapshot and resume.
- Persistent volumes.
- Resource isolation.
- Workload identity.
- Observability.
- Self-hosted deployment.

E2B documents a separation between its control plane and per-node execution orchestration. This is a useful reference for the system's own execution architecture.

#### Other providers

- Daytona: https://github.com/daytonaio/daytona
- Vercel Sandbox: https://vercel.com/docs/vercel-sandbox
- Docker: https://github.com/moby/moby
- OpenCore Sandbox SDK: https://github.com/opencoredev/sandbox-sdk

The execution router should select a provider based on task requirements, startup time, available hardware, persistence, required tools, estimated cost and measured performance.

## 7. MODEL AND INFERENCE SYSTEM

The application should support replaceable model providers.

### 7.1 Local model runtimes

**Ollama**

- https://github.com/ollama/ollama
- https://docs.ollama.com/api

**llama.cpp** — https://github.com/ggml-org/llama.cpp

**vLLM** — https://github.com/vllm-project/vllm

**SGLang** — https://github.com/sgl-project/sglang

Investigate CPU and GPU execution, quantization, model loading, memory consumption, parallel requests, tool calling and compatibility with the common inference interface.

### 7.2 Model discovery

**Hugging Face**

- https://huggingface.co/
- https://github.com/huggingface

Investigate:

- Model Hub.
- Dataset Hub.
- Spaces.
- Model metadata.
- Model cards.
- Inference Providers.
- Inference Endpoints.
- Local model loading.
- SDKs.
- Model evaluation.

Treat model metadata, licensing, hardware requirements and actual task performance as separate fields.

### 7.3 Model routing

**LiteLLM**

- https://github.com/BerriAI/litellm
- https://docs.litellm.ai/

Investigate its model routing, provider adapters, fallbacks, budgets, spend tracking and OpenAI-compatible interface.

The model router should select a model based on:

- Task category.
- Required reasoning capability.
- Context length.
- Tool-use capability.
- Input and output modality.
- Hardware availability.
- Latency.
- Price.
- Measured task performance.

#### One Percent model strategy

Use a tiered inference structure:

- **Tier 1 — Economical local processing.** Classification, routing, extraction, formatting and routine tasks.
- **Tier 2 — Capable local processing.** Code analysis, structured research, ordinary agent operations and moderate reasoning.
- **Tier 3 — Advanced inference.** Complex architecture, difficult debugging, advanced research, multi-step reasoning and high-value tasks.
- **Tier 4 — Specialized services.** Vision, speech, embeddings, reranking, multimodal processing and other specialist functions.

A task should receive the least expensive model that reliably meets its quality requirements.

The router should record actual cost and task results to improve future decisions.

## 8. COMPUTER, BROWSER AND DESKTOP CONTROL

Investigate these projects as separate control mechanisms.

**OpenClaw** — https://github.com/openclaw/openclaw

Investigate its Gateway, channels, agent runtime, memory, local deployment and interchangeable model/harness architecture.

**Playwright** — https://github.com/microsoft/playwright

Browser navigation, interaction, page inspection, screenshots and automated testing.

**Browser Use** — https://github.com/browser-use/browser-use

Agent-oriented browser control.

**E2B Open Computer Use** — https://github.com/e2b-dev/open-computer-use

Computer-use capabilities in an execution environment.

**Vercel Agent Desktop** — https://github.com/vercel-labs/agent-desktop

Investigate structured desktop interaction and accessibility-based controls.

#### Other computer-use research

- https://github.com/simular-ai/Agent-S
- https://github.com/microsoft/fara
- https://github.com/QwenLM/open-computer-use
- https://github.com/openai/openai-cua-sample-app

The system should maintain separate adapters for browser automation, desktop automation and operating-system operations.

## 9. REPOSITORY INTELLIGENCE

GitHub is a major source of reusable engineering blueprints.

Official API documentation:

- https://docs.github.com/en/rest
- https://docs.github.com/en/webhooks
- https://docs.github.com/en/rest/git/trees
- https://docs.github.com/en/rest/repos/contents

The repository research engine should use GitHub APIs to retrieve:

- Repository metadata.
- Default branch.
- Repository trees.
- Source files.
- README files.
- Documentation.
- Manifests.
- Dependency files.
- Releases.
- Tags.
- Commits.
- Issues.
- Pull requests.
- Actions workflows.
- Test files.
- OpenAPI definitions.
- MCP server definitions.

The research process should prioritize source files and executable examples over repository descriptions.

For every investigated repository, generate:

1. **Repository overview.**
2. **Architecture map.**
3. **Dependency map.**
4. **API/interface map.**
5. **Capability inventory.**
6. **Installation and execution instructions.**
7. **Test inventory and reproduction steps.**
   - Identify every existing unit, integration, end-to-end, security, performance and compatibility test, along with its framework, commands, required services, environment variables, fixtures and external dependencies.
   - Determine which tests run locally, in a container, in CI, or only against external services.
   - Record last known status only where evidence exists. A test is never reported as passing unless it was executed and its result captured.
   - Document missing, flaky and skipped tests, and tests that do not meaningfully verify the behavior they claim to cover.
   - Provide exact reproduction steps for important failures.
8. **Build and execution inventory.**
   - Build systems, package managers, compilers, runtime versions, container definitions and CI workflows.
   - The exact commands to install, build, launch, test and clean.
   - Required operating systems, hardware, drivers, external services and credentials.
   - Build-time network dependencies, and whether the build works offline or from a populated cache.
   - Generated files, clearly distinguished from source-controlled files.
   - Whether the project builds reproducibly from a clean checkout.
9. **Interface and integration inventory.**
   - Public and internal APIs, SDKs, CLI commands, MCP servers, event systems, webhooks, plugins and extension points.
   - Request and response formats, authentication, permissions, rate limits, error behavior and version constraints, where evidence exists.
   - Which interfaces are documented, which are observable but undocumented, and which remain hypothetical.
   - The exact evidence supporting each interface claim.
10. **Dependency and licensing inventory.**
    - Direct and transitive dependencies with versions, licenses, maintenance status and known security concerns.
    - Dependencies that are abandoned, unmaintained, duplicated or replaceable.
    - License obligations and redistribution restrictions.
    - Dependencies requiring paid services, proprietary components or restricted access.
    - A visible source tree does not make a project open source; evaluate the actual license and its usage restrictions.
11. **Capability and reuse assessment.**
    - Which capabilities are reusable directly, which require an adapter, which require modification, and which must remain isolated.
    - Capabilities already duplicated by another component in the registry.
    - Integration complexity, operating cost, maintenance burden and security implications.
    - Whether the capability can be expressed through the §5.2 connector contract.
    - Popularity or technical interest is not a reason to integrate.
12. **Failure and limitation inventory.**
    - Known limitations, architectural weaknesses, unsupported use cases, open issues and operational risks.
    - Single points of failure, and assumptions that could invalidate the integration.
    - Confirmed defects kept separate from suspected problems.
    - Workarounds and their consequences.
    - The conditions under which the project must not be used.
13. **Final repository investigation report.**
    - Identity, version or commit examined, capabilities, interfaces, dependencies, security findings, test inventory, limitations and reuse assessment.
    - Evidence references: file paths, symbols, definitions, test results, documentation locations, commit identifiers.
    - An integration recommendation: adopt, adapt, isolate, monitor, reject, or investigate further.
    - An explicit confidence level and the unresolved questions.
    - Storage in research memory (§13), linked to the corresponding capability registry entry.

A repository investigation is not complete because its README has been read. Completion requires evidence enough to know what the project does, how it operates, how it can be connected, what it depends on, what it can break, and how its behavior can be verified.

---

## 10. REPOSITORY SECURITY AND PROMPT-INJECTION DEFENSE

Everything §3, §4 and §9 collect is untrusted input. A README, issue, pull request description, dependency manifest, install script, CI workflow, downloaded binary, web page or API response can contain text written to redirect the agent rather than to inform it. Because the system's whole premise is ingesting other people's software and instructions, prompt injection is not an edge case here: it is the primary attack surface, and its defense is load-bearing architecture rather than a filter bolted on afterwards.

### 10.1 Trust tiers

Every piece of content carries a tier, assigned at fetch time:

- **Tier 0 — Authored.** Files committed to this repository and reviewed by a human.
- **Tier 1 — Verified.** Third-party content whose publisher and content hash were confirmed against an independent source.
- **Tier 2 — Inspected.** Fetched content that has passed the scanning pipeline below but has not been human-reviewed.
- **Tier 3 — Untrusted.** Default for anything downloaded, unknown, or failed by inspection.

The tiers map onto the trust classes used by the rest of the security pipeline. Class A (trusted system configuration) and Class B (approved project instructions) are Tier 0, or Tier 1 where authored outside this repository but verified. Class C (external reference material — documentation, release notes, articles, package descriptions) is Tier 2 once inspected. Class D (untrusted executable or interactive content — repository and lifecycle scripts, downloaded files, browser content, API-returned instructions, model-generated code, unknown binaries) is Tier 3 by default. Class E (potentially hostile content — instructions that attempt to override policy, reveal secrets, disable safeguards, alter persistence or trigger destructive operations) is the subset inspection flags, and it is quarantined rather than merely labeled. The classification travels with the content between components.

The governing rule: **content is data, never instruction.** Text inside Tier 2 or Tier 3 content cannot change what the system does, cannot grant a capability, cannot widen a scope, and cannot cause a credential to be used. Only two things may issue an instruction: the control plane's own configuration, and a recorded human approval. Any imperative text found in fetched content is reported as a finding, not obeyed — including text that claims to be from the system, the operator, or a security review.

### 10.2 Inspection pipeline

Fetch into quarantine, then, in order:

1. **Provenance.** Record source URL, retrieval timestamp, commit SHA or release tag, and content hashes.
2. **Instruction-pattern scan.** Detect imperatives aimed at an agent, urgency and authority claims, requests to reveal configuration or credentials, instructions to contact an external endpoint, and attempts to alter tool use or scope.
3. **Concealment scan.** Detect instruction text hidden from human reviewers: HTML comments, zero-width and bidi-override characters, CSS-hidden elements, white-on-white text, tiny fonts, base64 and other encoded blobs, oversized whitespace padding, and text placed far past the visible document.
4. **Manifest and dependency review.** Lockfile presence and pinning, registry provenance, typosquat and dependency-confusion patterns, install-time hooks.
5. **Script review.** Build, install, setup and Dockerfile content, with special attention to `postinstall`-class hooks, `curl | sh` pipelines, and steps that reach the network or the host filesystem.
6. **Capability diff.** Compare what the content claims or requires against what the task actually needs; an unneeded network reach or credential request is itself a finding.
7. **Verdict and evidence.** Pass, pass-with-constraints, or reject, with exact file and line references, rule identifiers and rule-set version.

Concealment is treated as hostile regardless of content: text engineered to be invisible to a reviewer is a prompt-injection signal whether or not the payload is legible.

### 10.3 Execution containment

A freshly discovered repository is never executed on the control host. Execution happens in a §6 environment with:

- No network by default; egress only through an explicit allowlist, logged.
- No credentials mounted. Credentials are brokered per run as short-lived, capability-scoped tokens that expire with the run and are never written into the sandbox filesystem.
- Read-only source, ephemeral writable layer, CPU/memory/time limits.
- Recorded process, network and filesystem telemetry for the run.
- A container or microVM boundary appropriate to the risk: rootless containers for Tier 2, microVM (Firecracker-class, e.g. via E2B) for Tier 3 or anything executing unknown native code.

### 10.4 Supply chain

Pinned versions everywhere (lockfiles, commit SHAs, image digests), SBOM generation per dependency set, vulnerability scanning, license compatibility checks, and provenance/attestation verification where the ecosystem provides it. An unpinned dependency is a capability the system did not choose.

### 10.5 Candidate tooling

Verify versions and current capability against source before adopting; the rule set matters more than the tool.

- Custom rule set in-house for agent-directed instruction patterns and concealment; evaluated against a maintained corpus.
- Semgrep — https://github.com/semgrep/semgrep — custom rules over untrusted source.
- Trivy — https://github.com/aquasecurity/trivy — vulnerabilities, misconfiguration, secrets, SBOM.
- Syft / Grype — https://github.com/anchore/syft — SBOM generation and vulnerability matching.
- gitleaks — https://github.com/gitleaks/gitleaks — secret detection in fetched content.
- gVisor — https://github.com/google/gvisor — additional isolation for container workloads.

### 10.6 Secret and credential protection

Credentials are never ordinary project data.

- Store them in an approved secret mechanism, never in source, prompts, logs, reports, test fixtures or generated documentation.
- Redact credentials from captured traffic before storage: authorization headers, cookies, access tokens, passwords, private keys and sensitive query parameters, driven by the secret patterns configured for that capture. A capture is not admission-grade until redacted.
- Prevent accidental credential inclusion in commits through the integrity checks in §11.
- Hold each credential at minimum required permissions, keep research credentials separate from execution credentials, and never let one connector see another connector's credentials.
- Rotate or revoke when compromise is suspected.
- Record credential access where audit mechanisms permit, without recording values.

### 10.7 Permission and action boundaries

Every connector and execution provider declares its permissions, and permission is held per component: a component does not gain a permission because another component has it.

Declared categories: read-only access; local file creation; local file modification; repository modification; network access; external service access; process execution; package installation; credential access; deployment; financial or purchasing actions; destructive operations.

Deletion, deployment, publishing, financial commitments, credential changes, permission escalation and irreversible external effects require explicit authorization under the permission policy in §12.3.

### 10.8 Security event records

Every security event produces a structured record: event identifier, timestamp, source and its trust class, affected component, requested action, permission involved, detection mechanism, risk classification, decision taken, whether execution was blocked, allowed or isolated, evidence references, and follow-up status.

Records are tamper-evident to the extent the storage layer supports, and they live in §13 alongside everything else so a flagged event is never only in a log.

### 10.9 Acceptance criteria

- A regression corpus of injection samples — planted in README text, HTML comments, zero-width sequences, dependency manifests, install scripts and CI files — is classified before any execution in **100%** of cases; the corpus grows by one fixture per real incident.
- A sample that reaches execution does so with zero credential access and zero non-allowlisted egress, proven from run telemetry.
- Every rejection carries file-and-line evidence that a human can check without re-running the scan.
- An attempt to widen a task's scope through injected text is logged as a finding and does not change the executed action.

## 11. BUILD INTEGRITY AND TESTING

Purpose: prove that adding a capability, or changing an existing one, has not damaged prior work — and that any damage is reversible in one step. The system modifies software and wires systems together; without this layer, every gain is unverifiable and every regression is discovered in production.

### 11.1 Test levels

1. **Contract tests, per adapter.** The §3.2 interface record names a contract test location; that test replays recorded fixtures against the adapter and asserts schema conformance, request shape, error behavior and timeout handling. No network required, so it runs on every commit.
2. **Capability tests.** Does the capability do the claimed thing at all? A known input in a sandbox with an asserted output. This is the test that separates a working integration from a plausible README.
3. **Composition tests.** Does the graph edge work — does A's actual output satisfy B's declared input? Edge-level tests, run for every edge a workflow traverses.
4. **Regression suite.** The entire capability registry's contract and capability tests must remain green. A change that breaks an unrelated capability is a failing change, not an acceptable trade-off.
5. **Baseline benchmarks.** Latency, cost, tokens and wall time per task, compared against the stored baseline from §13; fail on regression beyond a declared tolerance.
6. **Integrity tests.** Tree hash and file inventory before and after an agent's work, so files the task did not authorize show up as a diff rather than surfacing later.

### 11.2 Reproducibility

Pinned toolchains, hermetic environments, recorded image digests, fixed random seeds, and recorded model identity for inference-dependent tests (model, version, parameters). Every run emits a manifest sufficient to replay it. Where a run diverges from its manifest, the divergence is explained rather than averaged away — a nondeterministic capability that is not labeled as such is an unreliable capability.

### 11.3 Rollback

Every change is a git-versioned commit or patch that can be reverted whole. The capability registry records which commit is live for each connector. Connector versions swap blue/green with post-deploy smoke tests, and a failed smoke test reverts automatically. Rollback must be a single action with a recorded outcome, not a reconstruction.

### 11.4 Evidence artifacts

Per run: test log, run manifest, diff, hashes, timings, verdict, and the environment identity. Stored in §13 and linked from the capability record, so "this works" is always an artifact someone can open.

### 11.5 Gating and cost

The One Percent Theory applies to testing as much as to inference. Fast deterministic tiers (contract, integrity, unit) run on every commit. Sandboxed capability and composition tests run on every merge. Real-provider and high-cost benchmark tiers run nightly or on explicit label, because paying to re-prove an unchanged property is spend without leverage. Every skip is recorded with its reason; nothing is skipped silently.

### 11.6 Repository state and change isolation

Before any operation that could modify a repository, record the baseline: identity, current branch, current commit, working-tree status, untracked files, existing modifications, relevant configuration, lockfile state, and submodule state where applicable.

The purpose is to distinguish pre-existing user changes from changes the system made. Pre-existing modifications are never overwritten, discarded, reset or silently cleaned.

Implementation work happens in an isolated branch, worktree or controlled workspace, in a fixed sequence: inspect the repository → record its initial state → create the isolated area → make scoped changes → run the relevant checks → review the complete diff → confirm unrelated files are untouched → record results → present for approval or follow the explicitly authorized publishing path.

Protected branches are not modified directly by automated work unless that exact operation was authorized.

### 11.7 File modification safeguards

- Identify target files before writing, and preserve content outside the authorized scope.
- Prefer a scoped edit over whole-file replacement whenever a safe scoped edit exists.
- Verify a file exists before updating it; detect unexpected deletion or renaming.
- Detect modification of unrelated files.
- Validate syntax and format after modification, and never write secrets into files.
- If a target file differs from the version previously inspected, re-read and reconcile instead of overwriting.

### 11.8 Result taxonomy

Build and test outcomes are reported as distinct states and never collapsed into success or failure: build succeeded; build failed; build not attempted; build incomplete; build succeeded but tests failed; tests skipped; tests could not run for missing prerequisites.

Nothing is reported as verified unless the corresponding operation actually executed, and every record carries the run fields from §11.4 — source snapshot, toolchain and dependency versions, commands, environment excluding secret values, provider, timings, exit status, logs, artifacts, warnings and skips.

### 11.9 Acceptance criteria

- No capability enters the registry without a passing contract test and a passing capability test.
- An injected, unrequested file modification is caught by the integrity check before hand-off.
- A deliberately broken connector fails its composition tests rather than passing on a stale fixture.
- Rollback from a green state, through a breaking change, back to green completes in one action and is logged.

## 12. REVENUE AUTOMATION

Purpose: the layer that turns connected capability into income, and the practical test of whether the graph produces value at all. It is also the funding mechanism for further capability, which makes it subject to the same leverage rule as everything else: a small number of repeatable, verifiable engagements beats a large number of speculative ones.

### 12.1 Highest-leverage opportunity classes

The system's own capabilities are the product. Evaluate, in roughly this order of fit:

- Repository and architecture audits — directly reuses §9.
- Reverse-API documentation and client generation — directly reuses §3.2.
- Integration and connector builds — reuses §5.
- Workflow automation and orchestration setup — reuses §4.
- Test, CI and build-integrity setup — reuses §11.
- Model and dataset evaluation — reuses §7.

Each class maps to an artifact the system already knows how to produce and can already verify, which is the point: no new capability is invented to earn.

### 12.2 Pipeline as graph

Opportunity discovery → qualification → scoped offer → delivery → verification → invoicing. Each stage is a capability node with the edges from §4.2, so any stage can be substituted or improved without redesigning the pipeline. Qualification is where most candidates should die cheaply: an engagement that cannot be delivered with existing capabilities, verified by existing tests, and completed inside a spend cap is not an opportunity.

### 12.3 Permission model (mandatory)

- **Human authority.** Money movement, contract acceptance, contacting a third party, publishing on a third-party platform, and anything with legal or reputational effect require explicit human approval recorded as who, when, what and why.
- **Scoped credentials.** Per engagement, least privilege, revocable, expiring.
- **Spend caps.** Hard limits enforced by the router in §7.3, per workflow and per engagement, with alerts before the cap and a halt at it.
- **Volume limits.** Per-platform rate and volume limits; compliance with each platform's terms and applicable law.
- **Prohibited, without exception:** circumventing access controls or authorization, scraping or automation where the platform's terms forbid it, misrepresenting identity, mass unsolicited outreach, and any action whose legitimacy the operator cannot defend if asked.
- **Audit log.** Every external action recorded with actor, intent, evidence and result.

### 12.4 Reuse economics

Every delivery becomes a reusable module in §4.2's registry. The second engagement of a class should cost materially less than the first; if it does not, the delivery was bespoke and the leverage was missed. Effort, price and outcome data return to §13 so qualification improves with each engagement.

### 12.5 Opportunity discovery and scoring

Before §12.2's pipeline commits effort, an opportunity is scored on explicit dimensions:

| Dimension | Question |
| --- | --- |
| Demand evidence | Is there evidence that someone needs this? |
| Capability fit | Can existing registry components deliver it? |
| Development effort | How much implementation is required? |
| Cost | What are the infrastructure, model, API and operating costs? |
| Time to delivery | How quickly can a usable result exist? |
| Competition | What alternatives already exist? |
| Differentiation | What advantage can actually be offered? |
| Maintenance | How much ongoing support is required? |
| Compliance | Are legal, licensing and platform terms satisfied? |

Market evidence must be kept separate from assumptions generated during analysis: an unsourced claim of demand is recorded as an assumption, not as evidence, and no opportunity advances on assumptions alone. Scores are stored in §13 so qualification improves with each engagement.

### 12.6 Acceptance criteria

- A complete dry-run delivery runs end to end in a sandbox with no external side effects and produces a verifiable artifact.
- An unauthorized money movement, publication or third-party contact is blocked and logged, not merely discouraged.
- Breaching a spend cap halts the workflow and records the halt.
- A delivered artifact passes its own contract tests, and its module is registered and reusable.

## 13. PERSISTENT RESEARCH MEMORY

Purpose: discoveries must not be rediscovered. This is the compounding asset — the mechanism by which each investigation makes the next one cheaper, and the only way the One Percent Theory improves over time rather than resetting every session.

### 13.1 Record types

Repository reports (§3.1 fields), API contracts with evidence (§3.2), capability records (§5.2), provider and execution benchmarks (§6), model benchmarks and observed cost (§7), failure records, decision records, human approvals (§12.3), scan verdicts (§10), and revenue opportunities with outcomes (§12).

### 13.2 Storage

- Relational core (SQLite for single-node, Postgres for multi-node) for records and graph edges; both candidate Automaton projects use SQLite/Postgres, so this matches a plausible substrate rather than inventing one.
- Object store for artifacts: traffic captures, OpenAPI documents, logs, manifests, SBOMs.
- Full-text and embedding indexes for retrieval over documents and captures.
- Git for versioned documents: this specification, decisions, contracts.

### 13.3 Retrieval discipline

Before any research task, query memory by capability, provider, endpoint and domain. If a cached answer exists and is still valid, use it and cite it. The planner must state why a cached answer is insufficient before spending on fresh research — that statement is recorded, and repeated unjustified re-research is a defect. Invalidation is per record type: TTL for volatile facts, version- or commit-pinned for interface facts, immediate for anything whose contract test has since failed.

### 13.4 Evidence discipline

Every fact carries its source URL, retrieval timestamp, version or commit, confidence, and whether it was **source-verified** or merely **read from a description**. This is what lets the document distinguish a verified interface from a claim: the difference lives in the record, not in the prose. Contradictions are stored side by side and flagged, never silently overwritten.

### 13.5 Acceptance criteria

- Repeating a completed investigation returns the recorded answer and evidence with no network calls, and the run log shows the cache hit.
- An upstream version change invalidates exactly the dependent records and no others.
- Every registry capability traces back to the evidence and the §10 scan verdict that admitted it.
- No fact in the registry lacks a source, a timestamp and a verified/unverified flag.

## 14. IMPLEMENTATION SEQUENCE

Phased by leverage and by what unblocks verification, not by feature appeal. Each phase has an explicit dependency and an exit gate; a phase that cannot pass its gate does not hand off.

**Phase 0 — Substrate.** Repository, this specification, memory schema (§13), decision log, baseline scan rule set (§10), local sandbox (rootless Docker or Podman) plus one cloud adapter (E2B or Daytona).
*Gate:* a job runs in a sandbox with no network and emits a replayable manifest.

**Phase 1 — Capability spine.** Universal connector contract (§5.2), capability registry, and one real adapter end to end — recommend GitHub trees/contents, since §9 needs it anyway — with the contract-test harness.
*Gate:* contract and capability tests green in CI; registry entry traceable to evidence and a scan verdict.

**Phase 2 — Discovery.** Repository intelligence (§9) writing to memory (§13), with the §10 scan pipeline applied to every fetched repository.
*Gate:* a seed set processed into reports with scan verdicts, and no untrusted content executed outside containment.

**Phase 3 — Reverse API engineering.** Capture (mitmproxy) → infer and export (§3.2, ShadowAPI-style) → generate adapter → contract test against replayed fixtures. First target must be a service the operator owns.
*Gate:* the generated spec reproduces observed behavior on the replayed fixture set.

**Phase 4 — Orchestration.** Adopt the winner of the §4.3 evaluation, wire the §4.2 edge types, add parallel execution, retry and scheduling.
*Gate:* a multi-node workflow with a conditional branch and a recovery path, with telemetry recorded.

**Phase 5 — Routing and economics.** LiteLLM-style router, tiered model policy (§7.3), cost and token telemetry, budget enforcement.
*Gate:* a task is routed to the cheapest tier that meets its measured quality bar, and a spend cap is enforced.

**Phase 6 — Control surfaces.** Browser (Playwright), desktop/computer-use and OS adapters, all behind the same §5.2 contract.
*Gate:* a capability test per adapter runs inside a sandbox with an egress allowlist.

**Phase 7 — Revenue layer (§12).** Dry-run deliveries first, then a single approved real engagement.
*Gate:* dry-run acceptance criteria pass and the human-approval path is exercised with a recorded approval.

**Phase 8 — Hardening (continuous).** Benchmark suite, rollback drills, injection corpus expansion, cost-reduction pass, capability substitution as better components appear.

**Dependencies.** 1 → 2 → 3. Phase 4 requires 1. Phase 5 requires 1 and 4, for spend visibility across a workflow. Phase 6 requires 1 and §10 containment. Phase 7 requires 2, 3, 11 and the §12.3 permission layer.

**Sequencing rules.** No phase begins by bypassing an unmet gate. Phases may overlap only where the dependency table allows. Any function that an existing mature component performs better than planned build work is adopted instead of built — that substitution is the One Percent Theory applied to the roadmap itself.

## 15. VERIFICATION CRITERIA

Each subsystem must prove itself alone; the system must prove itself assembled. Criteria are measurable and produce artifacts, because a claim without an artifact is a description.

### 15.1 Per-subsystem

| Subsystem | Proof required | Artifact |
| --- | --- | --- |
| §3.2 Reverse API engineering | Generated contract reproduces observed requests and responses on replayed fixtures | Contract + replay test log |
| §4.2 Capability graph | Pathfinding, parallel execution, conditional branch, retry recovery | Workflow telemetry |
| §5.2 Connector contract | Every adapter passes the same conformance suite | Conformance report |
| §6 Execution router | Provider selection matches declared constraints; measured startup and cost recorded | Routing decision log |
| §7.3 Model router | Cheapest tier meeting the task's quality bar is selected; caps enforced | Routing + spend record |
| §8 Control surfaces | Capability test per surface inside containment | Test log + run manifest |
| §10 Injection defense | 100% of corpus classified pre-execution; zero credential/non-allowlisted egress | Scan verdicts + run telemetry |
| §11 Build integrity | Contract, capability, composition and regression tests green; rollback demonstrated | Test + revert logs |
| §12 Revenue layer | Dry-run end to end; blocked unauthorized action; halted spend cap | Dry-run artifact + audit log |
| §13 Research memory | Cache hit on repeat investigation; correct invalidation; full provenance | Retrieval + invalidation logs |

### 15.2 End to end

- **Unknown repository scenario.** Given a repository the system has never seen: discovery report, scan verdict, capability inventory, at least one generated and tested adapter, and a registry entry — inside declared cost and time budgets, with all evidence recorded.
- **Replay.** Re-running from the manifest yields the same verdicts and contracts, or a recorded explanation of the divergence.
- **Isolation.** No execution of untrusted content reaches host credentials or unrestricted network.
- **Safety.** The unauthorized-action suite — money, publication, third-party contact — is blocked and logged in every case.
- **Economics.** Cost per completed scenario is recorded, and trends down across runs at equal measured quality. This is the number that tells us whether the One Percent Theory is actually working.

### 15.3 Done for this document

This specification is a plan, not evidence. Every interface claim it makes is verified — source link, version or commit, retrieval date — or labeled unverified until confirmed in §13. The two Automaton projects remain candidates, not foundations, until their tool definitions, crates, runtime and tests have been checked at source. A claim that survives review moves into memory with its evidence; a claim that does not is marked as the description it was.

---

> **Document status:** §1–§9 derive from the supplied research text, which ended mid-checklist in §9. §9 now runs to thirteen investigation deliverables; items 8–13 and the expansions within §10–§12 come from a second supplied continuation, whose own text ended mid-table in its §12.3 opportunity-scoring section. That material was merged into the existing sections rather than appended as a duplicate §10–§12, so the document keeps one numbering and one statement of each requirement. §13–§15 — persistent research memory, implementation sequence and verification criteria — were written to close the remaining gap.
>
> The whole document preserves one architecture: the One Percent Theory, the capability graph, the universal connector contract and the tiered model economics. It introduces no directive outside that scope. Named tools are evaluation candidates; their URLs and capabilities require source-level confirmation before adoption, and every interface claim is either verified at source or labeled as a description.
