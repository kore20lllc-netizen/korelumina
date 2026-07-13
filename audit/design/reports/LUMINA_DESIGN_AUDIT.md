# Lumina Design Audit

Generated: Wed Jul  8 02:21:23 EDT 2026

## Foundation Components
```
=================================================
1:import { WorkspaceCard } from "./WorkspaceCard";
10:export function AuditSummary({ report }: { report: AuditReport }) {
10:export function WorkspaceCard({
10:import { LuminaButton } from "@/components/lumina/LuminaButton";
10:interface GlowCardProps
100:                    </LuminaButton>
1004:                    <LuminaButton size="md" onClick={submitFolder} disabled={!folder || folder.entries.length === 0}>
1007:                    </LuminaButton>
102:                  <LuminaButton
102:            <LuminaButton onClick={this.retry} className="w-full sm:w-auto">
105:            </LuminaButton>
105:          <LuminaButton size="lg" className="w-full mt-2" type="submit" disabled={busy}>
106:            <LuminaButton
107:          </LuminaButton>
107:      <LuminaButton size="md" className="w-full" onClick={apply} disabled={applying}>
108:            <GlowCard className="p-0 min-h-[360px] overflow-hidden"><FeedSkeleton /></GlowCard>
109:            <GlowCard className="p-0 min-h-[360px]"><InspectorSkeleton /></GlowCard>
109:      </GlowCard>
110:      </LuminaButton>
1112:          <LuminaButton variant="ghost" size="md" onClick={onCancel}>Cancel</LuminaButton>
1116:            <LuminaButton variant="ghost" size="md" onClick={onCancel}>Back</LuminaButton>
1117:            <LuminaButton size="md" onClick={onRetry}>Try again</LuminaButton>
112:            <LuminaButton variant="primary" size="lg" onClick={goToRepoAudit}>
1121:          <LuminaButton size="md" onClick={onClose}>Open imports</LuminaButton>
113:            </LuminaButton>
114:            </LuminaButton>
114:            <LuminaButton
114:RuntimeHeader.displayName = "RuntimeHeader";
1143:                <LuminaButton size="md" className="flex-1" onClick={() => openProject(p)}>
1145:                </LuminaButton>
115:        <LuminaButton variant="ghost" size="lg" className="w-full" onClick={googleContinue} disabled={busy}>
117:        </LuminaButton>
1192:            <LuminaButton variant="ghost" size="md" onClick={() => setRenameTarget(null)}>Cancel</LuminaButton>
1193:            <LuminaButton size="md" onClick={commitRename}>Save</LuminaButton>
12:      </GlowCard>
12:import { LuminaButton } from "@/components/lumina/LuminaButton";
12:import { RuntimeHeader } from "./parts/RuntimeHeader";
120:            </LuminaButton>
122:            <LuminaButton
122:        <RuntimeHeader
123:                  </LuminaButton>
125:            <LuminaButton variant="ghost" size="md" onClick={close}>Cancel</LuminaButton>
1258:            <LuminaButton variant="ghost" size="md" onClick={resetEditLinks} disabled={!editTarget || !overrides[editTarget.id]}>
126:            <LuminaButton size="md" onClick={deploy} disabled={stage === "deploying"}>
1260:            </LuminaButton>
1262:              <LuminaButton variant="ghost" size="md" onClick={() => setEditTarget(null)}>Cancel</LuminaButton>
1263:              <LuminaButton size="md" onClick={commitEditLinks}>Save</LuminaButton>
13:      <RuntimeMetricTile
13:interface RuntimeHeaderProps {
1302:          <LuminaButton variant="ghost" size="md" onClick={onCancel}>Cancel</LuminaButton>
1305:            <LuminaButton variant="ghost" size="md" onClick={onCancel}>Back</LuminaButton>
1306:            <LuminaButton size="md" onClick={onClose}>
1308:            </LuminaButton>
131:                <LuminaButton size="md" onClick={handleGenerate} disabled={generating}>
131:            </LuminaButton>
131:        <GlowCard className="relative overflow-hidden p-7">
134:                </LuminaButton>
135:                    <LuminaButton
135:          <LuminaButton
136:                <LuminaButton size="md" onClick={handleApply} disabled={applying}>
138:        <LuminaButton variant="ghost" size="md" onClick={onOpenImports}>
139:                </LuminaButton>
14:    </GlowCard>
14:import { KnowledgeMetricTile } from "./KnowledgeMetricTile";
140:        </LuminaButton>
143:                    </LuminaButton>
15:}: WorkspaceCardProps) {
15:export function KnowledgeMetricTile({
150:                  <LuminaButton variant="ghost" size="sm" className="lg:hidden text-gold hover:text-gold" aria-label="Open inspector">
152:                  </LuminaButton>
154:                <LuminaButton
159:              <LuminaButton
16:          <GlowCard key={index} className="p-5">
16:const ACCENT_STROKE: Record<NonNullable<RuntimeMetricTileProps["accent"]>, string> = {
16:import { LuminaButton } from "@/components/lumina/LuminaButton";
160:            </LuminaButton>
162:                </LuminaButton>
165:              </LuminaButton>
167:              <LuminaButton
17:    </GlowCard>
17:export function WorkspaceMetricCard({
170:          <GlowCard className="glass-runtime p-4 h-[560px] overflow-hidden flex flex-col">
173:          </LuminaButton>
174:              </LuminaButton>
176:              <LuminaButton variant="glow" size="sm">
179:                    <LuminaButton
179:              </LuminaButton>
180:                  <LuminaButton size="md" onClick={saveProfile} disabled={savingProfile || !user}>{savingProfile ? "Saving…" : "Save"}</LuminaButton>
181:              <LuminaButton variant="primary" size="sm">
184:              </LuminaButton>
186:                    </LuminaButton>
186:          </GlowCard>
187:        </GlowCard>
189:          <GlowCard className="glass-runtime p-0 h-[560px] overflow-hidden flex flex-col">
189:        <LuminaSurface variant="panel">
19:      <RuntimeMetricTile
19:export interface GlassWorkspaceHeroProps {
19:import { LuminaButton } from "@/components/lumina/LuminaButton";
192:                    {usage.plan !== "free" && (<LuminaButton variant="ghost" size="sm" onClick={cancelSubscription}>Cancel</LuminaButton>)}
193:                    <LuminaButton size="md" onClick={() => setView("pricing")}>Upgrade</LuminaButton>
195:GlowCard.displayName="GlowCard";
2:import { GlowCard } from "@/components/lumina/GlowCard";
2:import { LuminaButton } from "@/components/lumina/LuminaButton";
2:import { RuntimeMetricTile } from "./RuntimeMetricTile";
20:              <LuminaButton variant="primary" size="lg" onClick={startBuilding}>Start Building</LuminaButton>
20:          </GlowCard>
20:import { LuminaButton } from "@/components/lumina/LuminaButton";
201:                  <LuminaButton size="sm" onClick={generateKey}>Generate key</LuminaButton>
206:          <LuminaButton variant="ghost" size="sm" onClick={() => refresh()} title="Refresh status">
207:              <LuminaButton variant="ghost" size="md" onClick={() => inputRef.current?.click()}>
208:              <GlowCard className="glass-runtime h-full min-h-[720px] rounded-[32px] overflow-hidden">
208:          </LuminaButton>
209:                      <LuminaButton variant="ghost" size="sm" onClick={() => setRevealed(revealed === k.id ? null : k.id)}>{revealed === k.id ? "Hide" : "Reveal"}</LuminaButton>
209:              </LuminaButton>
21:              <LuminaButton variant="outline" size="lg" onClick={contactSales}>Talk to Sales</LuminaButton>
21:    <GlowCard className="p-4">
210:                      <LuminaButton variant="ghost" size="sm" onClick={() => revokeKey(k.id)}>Revoke</LuminaButton>
212:              </GlowCard>
216:          </GlowCard>
219:          <GlowCard className="glass-runtime p-0 h-[560px] overflow-hidden hidden xl:flex flex-col">
22:}: KnowledgeMetricTileProps) {
225:                      <LuminaButton variant={connected ? "ghost" : "primary"} size="sm" onClick={() => toggleIntegration(i)}>
225:                <LuminaButton
226:          <LuminaButton onClick={() => run("init", () => initializeCapacitor(projectId), "Capacitor initialized")} disabled={!!busy}>
227:                      </LuminaButton>
227:          </GlowCard>
229:          </LuminaButton>
23:            <LuminaButton variant="glow" onClick={onRetry}>Retry</LuminaButton>
23:          <WorkspaceCard
23:}: WorkspaceMetricCardProps) {
23:export function RuntimeMetricTile({
23:import { LuminaButton } from "@/components/lumina/LuminaButton";
230:          <LuminaButton variant="glow" onClick={() => run("sync", () => syncCapacitor(projectId))} disabled={!!busy}>
233:          </LuminaButton>
233:      <LuminaButton size="sm" variant="primary" className="hidden sm:inline-flex" onClick={guard("publish", () => setPublishOpen(true))}>
234:                  <LuminaButton variant="primary" size="lg" onClick={startBuilding}>
234:              <GlowCard className="glass-runtime rounded-[28px]">
234:          <LuminaButton variant="glow" onClick={() => run("ios", () => openIOS(projectId))} disabled={!!busy}>
236:                  </LuminaButton>
236:      </LuminaButton>
237:          </LuminaButton>
238:                </LuminaButton>
238:              </GlowCard>
238:          <LuminaButton variant="glow" onClick={() => run("android", () => openAndroid(projectId))} disabled={!!busy}>
24:      <RuntimeMetricTile
24:    <GlowCard
24:export const RuntimeHeader = forwardRef<
241:          </LuminaButton>
242:          <LuminaButton variant="outline" onClick={() => run("build", () => buildMobileBundle(projectId))} disabled={!!busy}>
244:              <GlowCard className="glass-runtime rounded-[28px]">
245:          </LuminaButton>
247:                    <LuminaButton variant={prefs[k] ? "primary" : "ghost"} size="sm" onClick={() => togglePref(k)}>
248:              </GlowCard>
249:                    </LuminaButton>
25:        <GlowCard className="p-4"><div className="text-xs text-muted-foreground">Total executions</div><div className="text-2xl font-semibold">{analytics.totalAIExecutions}</div></GlowCard>
25:    <WorkspaceCard
25:  GlowCard,
25:}: RuntimeMetricTileProps) {
255:      </LuminaSurface>
26:        <GlowCard className="p-4"><div className="text-xs text-muted-foreground">Estimated cost</div><div className="text-2xl font-semibold">${estCost.toFixed(2)}</div></GlowCard>
26:  RuntimeHeaderProps
26:} from "@/components/lumina/GlowCard";
26:import { LuminaButton } from "@/components/lumina/LuminaButton";
27:        <GlowCard className="p-4"><div className="text-xs text-muted-foreground">Days with activity</div><div className="text-2xl font-semibold">{analytics.aiUsageByDay.length}</div></GlowCard>
27:    <GlowCard accent={accent} className={cn("relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,.18)]", className)}>
275:            <LuminaButton
283:            </LuminaButton>
284:              <LuminaButton size="sm" disabled={!prompt.trim()} onClick={submitPrompt}>
284:            <LuminaButton
285:                              <LuminaButton size="sm" onClick={() => setView("pricing")}>Upgrade</LuminaButton>
287:              </LuminaButton>
29:      <RuntimeMetricTile
29:  LuminaSurface,
291:            </LuminaButton>
295:            <LuminaButton
299:          <LuminaButton
3:import { GlowCard } from "@/components/lumina/GlowCard";
3:import { LuminaButton } from "@/components/lumina/LuminaButton";
30:    <GlowCard className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6">
30:export function GlassWorkspaceHero({
302:            </LuminaButton>
302:          <LuminaButton
304:          </LuminaButton>
307:          </LuminaButton>
31:                <LuminaButton variant="primary" size="lg" onClick={startBuilding}>Start Building</LuminaButton>
31:      <KnowledgeMetricTile
32:    <LuminaButton
338:                      <LuminaButton
34:    </GlowCard>
34:export function LuminaSurface({
353:                      </LuminaButton>
36:          </WorkspaceCard>
36:export default WorkspaceCard;
369:                                <LuminaButton size="sm" variant="ghost" onClick={() => setView("pricing")}>
37:  LuminaButton,
37:import { AuditSummary } from "./repo-audit/AuditSummary";
370:                    <LuminaButton
371:                                </LuminaButton>
38:                <LuminaButton variant="primary" size="lg" onClick={contactSales}>
38:          <LuminaButton size="md" onClick={onDeploy}>
38:} from "@/components/lumina/LuminaButton";
38:export const GlowCard =
385:                    </LuminaButton>
39:      <KnowledgeMetricTile
39:}: GlassWorkspaceHeroProps) {
39:}: LuminaSurfaceProps) {
39:forwardRef<HTMLDivElement, GlowCardProps>(
399:            <LuminaButton
4:import { GlowCard } from "@/components/lumina/GlowCard";
4:import { LuminaButton } from "@/components/lumina/LuminaButton";
40:                </LuminaButton>
40:          </LuminaButton>
40:function GlowCard(
402:                          <LuminaButton
402:                        <LuminaButton size="sm" onClick={inviteMember}>
404:                        </LuminaButton>
409:                          </LuminaButton>
41:        <GlowCard className="p-4 space-y-2">
411:            </LuminaButton>
413:            <LuminaButton
418:              <AuditSummary report={report} />
423:            </LuminaButton>
428:            <LuminaButton variant="primary" size="lg" onClick={contactSales}>
43:          <LuminaButton
430:            </LuminaButton>
431:            <LuminaButton variant="outline" size="lg" onClick={contactSales}>
433:            </LuminaButton>
437:                            <LuminaButton variant="ghost" size="sm" onClick={() => removeMember(m.userId)} disabled={!canRemove}>
439:                            </LuminaButton>
449:        <LuminaButton
456:            <LuminaButton variant="outline" size="sm" onClick={() => setDrawerOpen(true)} className="w-full">
457:        </LuminaButton>
458:                                <LuminaButton
458:            </LuminaButton>
459:        <LuminaButton
46:          <LuminaButton
467:        </LuminaButton>
468:                                </LuminaButton>
469:                                <LuminaButton variant="ghost" size="sm" onClick={() => revokeInvite(inv.id)}>
469:        <LuminaButton
47:      <KnowledgeMetricTile
471:                                </LuminaButton>
473:          <LuminaButton variant="ghost" size="lg" onClick={() => setView("dashboard")}>
474:                <LuminaButton size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(logText); toast.success("Logs copied"); }}>
474:              <LuminaButton variant="primary" size="lg" onClick={startBuilding}>
475:          </LuminaButton>
476:                </LuminaButton>
476:              </LuminaButton>
476:          <LuminaButton variant="primary" size="lg" disabled={!pickedIntent} onClick={handleStart}>
477:                <LuminaButton size="sm" variant="ghost" onClick={() => {
477:              <LuminaButton variant="outline" size="lg" onClick={contactSales}>
477:        </LuminaButton>
479:              </LuminaButton>
479:          </LuminaButton>
48:      <GlowCard className="relative overflow-hidden p-7">
481:                        <LuminaButton variant="ghost" size="sm" onClick={leaveTeam}>
481:        <LuminaButton
483:                        </LuminaButton>
485:                </LuminaButton>
486:                <LuminaButton size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>Close</LuminaButton>
49:          </LuminaButton>
491:        </LuminaButton>
493:                <Row label="Two-factor auth"><LuminaButton variant="ghost" size="sm">Enable</LuminaButton></Row>
495:                <Row label="Sign out everywhere"><LuminaButton variant="ghost" size="sm" onClick={signOutEverywhere}>Sign out</LuminaButton></Row>
497:                  <LuminaButton
5:import { GlowCard } from "@/components/lumina/GlowCard";
5:import { LuminaButton } from "@/components/lumina/LuminaButton";
5:interface WorkspaceCardProps
50:    </WorkspaceCard>
502:                  <LuminaButton
507:                  </LuminaButton>
51:            <LuminaButton size="md" onClick={onApply} disabled={applying || loading || !diff}>
51:          </LuminaButton>
51:          <LuminaButton
515:        <LuminaButton onClick={onNext} size="md">
517:                  </LuminaButton>
517:        </LuminaButton>
52:          </LuminaButton>
53:          <LuminaButton onClick={onSubmit}>
53:      <LuminaButton
54:            </LuminaButton>
54:          <LuminaButton
54:    </GlowCard>
54:    </WorkspaceCard>
55:          </LuminaButton>
55:        </GlowCard>
55:      <KnowledgeMetricTile
55:    </LuminaButton>
56:          <LuminaButton
56:          <LuminaButton variant="ghost" onClick={() => setView("dashboard")}>← Back to Projects</LuminaButton>
56:        <GlowCard className="p-4 space-y-2">
57:          </LuminaButton>
58:export default WorkspaceMetricCard;
586:                          <LuminaButton
59:          <LuminaButton variant="subtle" size="md" onClick={goToSignIn}>
596:                          </LuminaButton>
6:  WorkspaceCard,
6:export interface KnowledgeMetricTileProps {
6:export interface RuntimeMetricTileProps {
6:import { GlowCard } from "@/components/lumina/GlowCard";
601:                            <LuminaButton
61:          </LuminaButton>
614:        <LuminaButton variant="ghost" onClick={onBack} size="md"><ArrowLeft className="h-3.5 w-3.5" />Back</LuminaButton>
615:        <LuminaButton onClick={onNext} size="md">Review changes <ArrowRight className="h-3.5 w-3.5" /></LuminaButton>
62:          </LuminaButton>
62:          <LuminaButton variant="primary" size="md" onClick={startBuilding}>Start Building</LuminaButton>
620:                            </LuminaButton>
622:                            <LuminaButton
63:        </GlowCard>
63:        <GlowCard className="p-4">
63:      <KnowledgeMetricTile
64:          </LuminaButton>
64:      </LuminaButton>
641:                            </LuminaButton>
65:            <LuminaButton
65:      <LuminaButton
66:          <LuminaButton
68:            <LuminaButton
69:          <GlowCard className="p-3"><div className="text-xs text-muted-foreground">Storage used</div><div className="text-lg font-semibold">{(health.localStorageBytes / 1024).toFixed(1)} KB</div></GlowCard>
7:      <GlowCard className="p-6">
7:    <GlowCard className={cn("p-5", className)}>
7:} from "./WorkspaceCard";
7:export interface LuminaSurfaceProps
7:import { WorkspaceCard } from "./WorkspaceCard";
70:          <GlowCard className="p-3"><div className="text-xs text-muted-foreground">Quota est.</div><div className="text-lg font-semibold">{(health.localStorageQuotaEstimate / (1024 * 1024)).toFixed(0)} MB</div></GlowCard>
71:            <GlowCard className="rounded-2xl p-5">
71:          <GlowCard className="p-3"><div className="text-xs text-muted-foreground">Users seeded</div><div className="text-lg font-semibold">{health.totalUsers}</div></GlowCard>
71:      <KnowledgeMetricTile
716:          <LuminaButton variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
718:          </LuminaButton>
719:          <LuminaButton
72:                <LuminaButton variant="ghost" size="md" onClick={onStop} aria-label="Stop generation">
72:            </LuminaButton>
72:          <GlowCard className="p-3"><div className="text-xs text-muted-foreground">Admin seeded</div><div className="text-lg font-semibold">{health.adminSeeded ? "Yes" : "No"}</div></GlowCard>
721:            <LuminaButton size="md" onClick={() => setImportOpen(true)}>
724:            </LuminaButton>
727:          </LuminaButton>
73:            <LuminaButton variant="ghost" size="md" className="flex-1" onClick={reset}>
73:        </GlowCard>
73:    </GlowCard>
738:              <LuminaButton size="md" onClick={() => setImportOpen(true)}>
74:            <LuminaButton
74:          </LuminaButton>
74:export interface LuminaButtonProps
741:              </LuminaButton>
742:              <LuminaButton variant="ghost" size="md" onClick={() => setImportOpen(true)}>
745:              </LuminaButton>
75:                </LuminaButton>
75:            </LuminaButton>
758:        <LuminaButton variant="ghost" onClick={onBack} size="md"><ArrowLeft className="h-3.5 w-3.5" />Back</LuminaButton>
759:        <LuminaButton onClick={onApply} size="md" disabled={selectedCount === 0}>
76:            </GlowCard>
76:            <LuminaButton
76:            <LuminaButton variant="ghost" size="sm" onClick={() => navigate("/")}>
76:      </LuminaButton>
762:        </LuminaButton>
77:              <LuminaButton onClick={onGenerate} disabled={!prompt.trim() || generating} size="md">
77:            <LuminaButton
78:            </LuminaButton>
78:            <LuminaButton
78:export const LuminaButton = forwardRef<
79:            <LuminaButton size="sm" onClick={handleUse}>
79:      <KnowledgeMetricTile
8:    <GlowCard className="p-4">
8:import { LuminaButton } from "@/components/lumina/LuminaButton";
80:  LuminaButtonProps
802:                    <LuminaButton size="md" onClick={submitUrl} disabled={!url.trim()}>
805:                    </LuminaButton>
81:              </LuminaButton>
81:            </LuminaButton>
81:          <GlowCard className="rounded-2xl p-5">
813:        <LuminaButton variant="ghost" onClick={onClose}>Close</LuminaButton>
814:        <LuminaButton onClick={onOpen}>
816:        </LuminaButton>
84:            </LuminaButton>
841:                    <LuminaButton size="md" onClick={submitZip} disabled={files.length === 0}>
844:                    </LuminaButton>
855:          <LuminaButton onClick={onUpgrade} size="md" className="w-full mt-4">
857:          </LuminaButton>
86:            <LuminaButton
87:              <LuminaButton variant="ghost" size="md" className="flex-1" onClick={() => { setOpen(false); goToSignIn(); }}>
87:            </LuminaButton>
87:          </GlowCard>
87:      <KnowledgeMetricTile
88:          <GlowCard className="rounded-2xl p-5">
888:          <LuminaButton variant="primary" onClick={onUpgrade} size="md" className="w-full mt-4">
89:              </LuminaButton>
890:          </LuminaButton>
895:        <LuminaButton variant="ghost" onClick={onClose}>Not now</LuminaButton>
9:import { LuminaButton } from "@/components/lumina/LuminaButton";
9:interface WorkspaceMetricCardProps {
90:              <LuminaButton variant="primary" size="md" className="flex-1" onClick={() => { setOpen(false); startBuilding(); }}>Start Building</LuminaButton>
92:            </LuminaButton>
94:          </GlowCard>
97:          <LuminaButton variant="ghost" size="md" onClick={goToTemplates}>
98:                    <LuminaButton variant="ghost" size="sm" onClick={() => navigate(`/templates/${live.slug}`)}>
99:          </LuminaButton>
99:LuminaButton.displayName = "LuminaButton";
apps/lumina-builder/src/components/deploy/DeployModal.tsx
apps/lumina-builder/src/components/ErrorBoundary.tsx
apps/lumina-builder/src/components/import/GlobalImportDropZone.tsx
apps/lumina-builder/src/components/import/ImportModal.tsx
apps/lumina-builder/src/components/import/ImportSuccessPanel.tsx
apps/lumina-builder/src/components/landing/BackgroundVideo.tsx
apps/lumina-builder/src/components/landing/BuiltForExistingSoftware.tsx
apps/lumina-builder/src/components/landing/Comparison.tsx
apps/lumina-builder/src/components/landing/DeliveryConfidence.tsx
apps/lumina-builder/src/components/landing/EnterpriseGovernance.tsx
apps/lumina-builder/src/components/landing/FAQ.tsx
apps/lumina-builder/src/components/landing/Features.tsx
apps/lumina-builder/src/components/landing/FinalCTA.tsx
apps/lumina-builder/src/components/landing/Footer.tsx
apps/lumina-builder/src/components/landing/FutureOfSoftware.tsx
apps/lumina-builder/src/components/landing/Hero.tsx
apps/lumina-builder/src/components/landing/HeroVideoFrame.tsx
apps/lumina-builder/src/components/landing/HowItWorks.tsx
apps/lumina-builder/src/components/landing/InfrastructureYourWay.tsx
apps/lumina-builder/src/components/landing/InHouseDevelopers.tsx
apps/lumina-builder/src/components/landing/LandingNav.tsx
apps/lumina-builder/src/components/landing/OwnEverything.tsx
apps/lumina-builder/src/components/landing/PlatformArchitecture.tsx
apps/lumina-builder/src/components/landing/Pricing.tsx
apps/lumina-builder/src/components/landing/ProblemSolution.tsx
apps/lumina-builder/src/components/landing/RepoAuditFeature.tsx
apps/lumina-builder/src/components/landing/SocialProof.tsx
apps/lumina-builder/src/components/landing/Templates.tsx
apps/lumina-builder/src/components/layout/dialogs/CreateWorkspaceDialog.tsx
apps/lumina-builder/src/components/layout/Shell.tsx
apps/lumina-builder/src/components/layout/Sidebar.tsx
apps/lumina-builder/src/components/layout/TeamSwitcher.tsx
apps/lumina-builder/src/components/layout/TopBar.tsx
apps/lumina-builder/src/components/lumina/background/LuminaAmbient.tsx
apps/lumina-builder/src/components/lumina/background/LuminaBackground.tsx
apps/lumina-builder/src/components/lumina/background/LuminaGlassLayer.tsx
apps/lumina-builder/src/components/lumina/Blobs.tsx
apps/lumina-builder/src/components/lumina/GlowCard.tsx
apps/lumina-builder/src/components/lumina/LuminaButton.tsx
apps/lumina-builder/src/components/lumina/LuminaSegmentedControl.tsx
apps/lumina-builder/src/components/lumina/navigation/NavigationFooter.tsx
apps/lumina-builder/src/components/lumina/navigation/NavigationItem.tsx
apps/lumina-builder/src/components/lumina/navigation/NavigationRail.tsx
apps/lumina-builder/src/components/lumina/navigation/NavigationSection.tsx
apps/lumina-builder/src/components/lumina/surface/LuminaSurface.tsx
apps/lumina-builder/src/components/NavLink.tsx
apps/lumina-builder/src/components/notifications/NotificationsCenter.tsx
apps/lumina-builder/src/components/preview/PreviewFrame.tsx
apps/lumina-builder/src/components/preview/ProjectSettingsDialog.tsx
apps/lumina-builder/src/components/preview/RuntimeStatusBanner.tsx
apps/lumina-builder/src/components/preview/UpgradeModal.tsx
apps/lumina-builder/src/components/RequireAuth.tsx
apps/lumina-builder/src/components/runtime/RuntimeStatusCard.tsx
apps/lumina-builder/src/components/runtime/RuntimeToolbar.tsx
apps/lumina-builder/src/components/sales/SalesRequestDialog.tsx
apps/lumina-builder/src/components/shell/BottomDock.tsx
apps/lumina-builder/src/components/shell/CommandPalette.tsx
apps/lumina-builder/src/components/shell/PublishDialog.tsx
apps/lumina-builder/src/components/templates/starters/AuroraMarketing.tsx
apps/lumina-builder/src/components/templates/starters/HelixCRM.tsx
apps/lumina-builder/src/components/templates/starters/LumenAI.tsx
apps/lumina-builder/src/components/templates/starters/PulseAnalytics.tsx
apps/lumina-builder/src/components/templates/TemplateShell.tsx
apps/lumina-builder/src/components/templates/TemplatesMarketplace.tsx
apps/lumina-builder/src/components/transform/TransformAnalyticsMount.tsx
apps/lumina-builder/src/components/transform/TransformAnalyticsPanel.tsx
apps/lumina-builder/src/components/transform/TransformButton.tsx
apps/lumina-builder/src/components/transform/TransformModal.tsx
apps/lumina-builder/src/components/ui/accordion.tsx
apps/lumina-builder/src/components/ui/alert-dialog.tsx
apps/lumina-builder/src/components/ui/alert.tsx
apps/lumina-builder/src/components/ui/aspect-ratio.tsx
apps/lumina-builder/src/components/ui/avatar.tsx
apps/lumina-builder/src/components/ui/badge.tsx
apps/lumina-builder/src/components/ui/breadcrumb.tsx
apps/lumina-builder/src/components/ui/button.tsx
apps/lumina-builder/src/components/ui/calendar.tsx
apps/lumina-builder/src/components/ui/card.tsx
apps/lumina-builder/src/components/ui/carousel.tsx
apps/lumina-builder/src/components/ui/chart.tsx
apps/lumina-builder/src/components/ui/checkbox.tsx
apps/lumina-builder/src/components/ui/collapsible.tsx
apps/lumina-builder/src/components/ui/command.tsx
apps/lumina-builder/src/components/ui/context-menu.tsx
apps/lumina-builder/src/components/ui/dialog.tsx
apps/lumina-builder/src/components/ui/drawer.tsx
apps/lumina-builder/src/components/ui/dropdown-menu.tsx
apps/lumina-builder/src/components/ui/form.tsx
apps/lumina-builder/src/components/ui/hover-card.tsx
apps/lumina-builder/src/components/ui/input-otp.tsx
apps/lumina-builder/src/components/ui/input.tsx
apps/lumina-builder/src/components/ui/label.tsx
apps/lumina-builder/src/components/ui/menubar.tsx
apps/lumina-builder/src/components/ui/navigation-menu.tsx
apps/lumina-builder/src/components/ui/pagination.tsx
apps/lumina-builder/src/components/ui/popover.tsx
apps/lumina-builder/src/components/ui/progress.tsx
apps/lumina-builder/src/components/ui/radio-group.tsx
apps/lumina-builder/src/components/ui/resizable.tsx
apps/lumina-builder/src/components/ui/scroll-area.tsx
apps/lumina-builder/src/components/ui/select.tsx
apps/lumina-builder/src/components/ui/separator.tsx
apps/lumina-builder/src/components/ui/sheet.tsx
apps/lumina-builder/src/components/ui/sidebar.tsx
apps/lumina-builder/src/components/ui/skeleton.tsx
apps/lumina-builder/src/components/ui/slider.tsx
apps/lumina-builder/src/components/ui/sonner.tsx
apps/lumina-builder/src/components/ui/switch.tsx
apps/lumina-builder/src/components/ui/table.tsx
apps/lumina-builder/src/components/ui/tabs.tsx
apps/lumina-builder/src/components/ui/textarea.tsx
apps/lumina-builder/src/components/ui/toast.tsx
apps/lumina-builder/src/components/ui/toaster.tsx
apps/lumina-builder/src/components/ui/toggle-group.tsx
apps/lumina-builder/src/components/ui/toggle.tsx
apps/lumina-builder/src/components/ui/tooltip.tsx
apps/lumina-builder/src/components/workspaces/admin/AIUsageTab.tsx
apps/lumina-builder/src/components/workspaces/admin/AuditLogsTab.tsx
apps/lumina-builder/src/components/workspaces/admin/BillingTab.tsx
apps/lumina-builder/src/components/workspaces/admin/DeploymentsTab.tsx
apps/lumina-builder/src/components/workspaces/admin/dialogs/AdminProjectDeleteDialog.tsx
apps/lumina-builder/src/components/workspaces/admin/dialogs/AdminResetDataDialog.tsx
apps/lumina-builder/src/components/workspaces/admin/dialogs/AdminUserDeleteDialog.tsx
apps/lumina-builder/src/components/workspaces/admin/FeatureFlagsTab.tsx
apps/lumina-builder/src/components/workspaces/admin/ImpersonationBanner.tsx
apps/lumina-builder/src/components/workspaces/admin/MaintenanceTab.tsx
apps/lumina-builder/src/components/workspaces/admin/OverviewTab.tsx
apps/lumina-builder/src/components/workspaces/admin/ProjectsTab.tsx
apps/lumina-builder/src/components/workspaces/admin/ProvidersTab.tsx
apps/lumina-builder/src/components/workspaces/admin/UsersTab.tsx
apps/lumina-builder/src/components/workspaces/AdminWorkspace.tsx
apps/lumina-builder/src/components/workspaces/ai/ActivityPanel.tsx
apps/lumina-builder/src/components/workspaces/ai/PromptComposer.tsx
apps/lumina-builder/src/components/workspaces/ai/TemplateGrid.tsx
apps/lumina-builder/src/components/workspaces/AIWorkspace.tsx
apps/lumina-builder/src/components/workspaces/AuthView.tsx
apps/lumina-builder/src/components/workspaces/DashboardView.tsx
apps/lumina-builder/src/components/workspaces/designer/AIAssistPanel.tsx
apps/lumina-builder/src/components/workspaces/designer/canvasStore.tsx
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx
apps/lumina-builder/src/components/workspaces/dev/BuildSteps.tsx
apps/lumina-builder/src/components/workspaces/dev/DevAIAssistPanel.tsx
apps/lumina-builder/src/components/workspaces/DeveloperWorkspace.tsx
apps/lumina-builder/src/components/workspaces/dialogs/ProjectDeleteDialog.tsx
apps/lumina-builder/src/components/workspaces/dialogs/ProjectRenameDialog.tsx
apps/lumina-builder/src/components/workspaces/EntryView.tsx
apps/lumina-builder/src/components/workspaces/ImportsView.tsx
apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx
apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx
apps/lumina-builder/src/components/workspaces/knowledge/acquisition/KnowledgeAcquisitionPanel.tsx
apps/lumina-builder/src/components/workspaces/knowledge/AcquisitionActivityPanel.tsx
apps/lumina-builder/src/components/workspaces/knowledge/graph/KnowledgeGraphPanel.tsx
apps/lumina-builder/src/components/workspaces/knowledge/KnowledgeOverviewPanel.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeActivityFeed.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeCoveragePanel.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeExecutiveSummary.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeHealthOverview.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeMetricTile.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeOverviewSkeleton.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgePipelineOverview.tsx
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeSystemStatus.tsx
apps/lumina-builder/src/components/workspaces/knowledge/reasoning/KnowledgeReasoningPanel.tsx
apps/lumina-builder/src/components/workspaces/KnowledgeOperationsWorkspace.tsx
apps/lumina-builder/src/components/workspaces/PricingView.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/AuditPdfPreviewDialog.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/AuditPdfThemeEditor.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/AuditSummary.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/AutoFixModal.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/BuildErrorsCard.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/BuildLogsDrawer.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/BuildPassedBanner.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/DeepAuditProgress.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/DependencyAuditCard.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/DiffPreviewDialog.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/EnvironmentAuditCard.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/FindingFixSteps.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/FindingsFilters.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/FixUntilGreenPanel.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/RepairActionBar.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/RepairPlanCard.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/RepoSourcePicker.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/SecurityAuditCard.tsx
apps/lumina-builder/src/components/workspaces/repo-audit/StepDiffPanel.tsx
apps/lumina-builder/src/components/workspaces/RepoAuditWorkspace.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeActionsToolbar.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeEmptyState.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeErrorState.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeEventStream.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHeader.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHealthBadge.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHealthOverview.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeInspector.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeLifecycleTimeline.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeLogsPanel.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeMetricTile.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectRow.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectsList.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeSearchFilters.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeSkeletons.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeSparkline.tsx
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeStatusDot.tsx
apps/lumina-builder/src/components/workspaces/runtime/RuntimeOperationsWorkspace.tsx
apps/lumina-builder/src/components/workspaces/RuntimeDiagnosticsWorkspace.tsx
apps/lumina-builder/src/components/workspaces/settings/dialogs/LeaveWorkspaceDialog.tsx
apps/lumina-builder/src/components/workspaces/settings/dialogs/ResetAppDataDialog.tsx
apps/lumina-builder/src/components/workspaces/settings/dialogs/ResetMockDataDialog.tsx
apps/lumina-builder/src/components/workspaces/settings/RoleSwitcher.tsx
apps/lumina-builder/src/components/workspaces/SettingsView.tsx
apps/lumina-builder/src/components/workspaces/shared/GlassWorkspaceHero.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceCard.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceEmptyState.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceGrid.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceLayout.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceLoading.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceMetricCard.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceSection.tsx
apps/lumina-builder/src/components/workspaces/shared/WorkspaceTabBar.tsx
```

## Glass Classes
```
className="absolute inset-x-3 bottom-3 z-20 h-[40vh] max-h-[460px] glass-strong rounded-3xl flex flex-col overflow-hidden anim-in"
className="absolute left-full ml-3 px-2.5 py-1 rounded-lg glass-strong text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition translate-x-1 group-hover:translate-x-0 z-50"
className="absolute left-full z-50 ml-3 translate-x-1 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1 text-xs opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none"
className="fixed right-4 bottom-4 top-20 w-[340px] z-40 rounded-2xl glass-strong border border-border shadow-[0_30px_80px_-20px_hsl(230_80%_2%/0.9)] flex flex-col overflow-hidden anim-in"
className="fixed top-0 inset-x-0 z-[60] glass-strong border-b border-amber-400/40 px-4 py-2 flex items-center gap-3 text-sm"
className="flex-1 min-w-0 flex flex-col glass-panel overflow-hidden"
className="glass border border-gold/20 max-w-2xl"
className="glass border border-gold/20 max-w-3xl"
className="glass border-l border-white/10 w-full sm:max-w-xl p-0 flex flex-col"
className="glass rounded-2xl border border-white/10 overflow-hidden"
className="glass rounded-2xl border border-white/10 p-10 text-center text-muted-foreground"
className="glass rounded-2xl border border-white/10 p-4 flex flex-col gap-3"
className="glass rounded-2xl border border-white/10 p-5 sticky top-4"
className="glass rounded-2xl border border-white/10 p-5"
className="glass rounded-2xl border border-white/10 p-6 text-center text-muted-foreground text-[13px]"
className="glass rounded-2xl border border-white/10 p-8 max-w-md text-center"
className="glass rounded-2xl p-2 h-max"
className="glass rounded-2xl p-4 border border-white/10"
className="glass rounded-2xl p-4 mb-6 border border-violet/30 bg-violet/[0.04] flex items-start gap-3"
className="glass rounded-2xl p-4 md:p-5 focus-within:ring-1 focus-within:ring-violet/60 transition"
className="glass rounded-2xl p-5 mb-8"
className="glass rounded-2xl p-6 min-h-[320px]"
className="glass rounded-xl divide-y divide-border"
className="glass rounded-xl overflow-hidden max-h-[600px] overflow-y-auto"
className="glass rounded-xl overflow-hidden"
className="glass rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
className="glass rounded-xl p-4"
className="glass rounded-xl p-6 max-w-md mx-auto text-center"
className="glass-panel border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-lg"
className="glass-panel p-6 md:p-8 anim-in flex-1 min-h-0 overflow-y-auto"
className="glass-panel p-6 md:p-8 anim-in shrink-0"
className="glass-panel p-6 rounded-2xl"
className="glass-panel relative z-10 w-full max-w-lg p-8 text-center sm:p-10"
className="glass-panel rounded-2xl flex flex-col overflow-hidden"
className="glass-panel rounded-2xl p-3 flex flex-col"
className="glass-panel rounded-2xl p-4 flex flex-col"
className="glass-panel rounded-2xl p-5"
className="glass-panel rounded-2xl px-2"
className="glass-panel rounded-xl p-4"
className="glass-panel-landing p-5 rounded-2xl transition-all duration-500 ease-fluid hover:-translate-y-1 flex flex-col"
className="glass-panel-landing p-6 rounded-2xl group transition-all duration-500 ease-fluid hover:-translate-y-1"
className="glass-panel-landing p-6 rounded-2xl h-full"
className="glass-panel-landing p-8 md:p-10 rounded-2xl"
className="glass-panel-landing rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
className="glass-panel-landing rounded-2xl p-6"
className="glass-panel-landing rounded-2xl px-2 sm:px-6"
className="glass-panel-landing rounded-2xl"
className="glass-panel-landing rounded-3xl p-8 md:p-12"
className="glass-panel-landing rounded-3xl p-8 md:p-14 text-center"
className="glass-ripple"
className="glass-runtime h-full min-h-[720px] rounded-[32px] overflow-hidden"
className="glass-runtime p-0 h-[560px] overflow-hidden flex flex-col"
className="glass-runtime p-0 h-[560px] overflow-hidden hidden xl:flex flex-col"
className="glass-runtime p-4 h-[560px] overflow-hidden flex flex-col"
className="glass-runtime rounded-[28px]"
className="glass-runtime-noise"
className="glass-strong border-border max-w-2xl p-0 overflow-hidden"
className="glass-strong border-border max-w-2xl"
className="glass-strong border-border max-w-3xl p-0 overflow-hidden"
className="glass-strong border-border max-w-lg p-0 overflow-hidden"
className="glass-strong border-border max-w-md p-0 overflow-hidden"
className="glass-strong border-border max-w-md"
className="glass-strong border-border max-w-sm"
className="glass-strong border-border w-80 p-0 overflow-hidden"
className="glass-strong border-border"
className="group glass-panel-landing rounded-2xl p-6 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
className="group relative aspect-[4/3] text-left rounded-2xl glass overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)] anim-in cursor-pointer"
className="group relative glass-panel-landing rounded-2xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:border-white/20 border-white/20"
className="group relative glass-panel-landing rounded-2xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
className="group relative text-left p-3.5 rounded-xl glass transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-1 overflow-hidden"
className="group text-left p-4 rounded-2xl glass transition-all duration-300 ease-fluid hover:-translate-y-0.5 hover:bg-surface-1"
className="h-12 w-12 rounded-2xl glass mx-auto grid place-items-center mb-3"
className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition"
className="max-w-3xl mx-auto glass-panel rounded-3xl p-10 md:p-14 text-center"
className="max-w-md text-center rounded-2xl border border-white/10 glass-panel p-8"
className="mb-3 flex h-11 shrink-0 items-center gap-2 overflow-hidden rounded-2xl glass px-3"
className="p-0 w-full sm:max-w-[420px] glass-strong border-l border-white/10"
className="p-4 rounded-xl glass flex items-start justify-between gap-3"
className="relative flex-1 min-h-0 overflow-hidden rounded-3xl glass-strong p-3 md:p-4"
className="relative glass-panel rounded-[2rem] p-10 md:p-16 overflow-hidden text-center"
className="relative glass-panel rounded-[2rem] p-6 sm:p-10 md:p-14 overflow-hidden"
className="relative glass-panel-landing p-5 rounded-2xl group transition-all duration-500 ease-fluid hover:-translate-y-1 overflow-hidden focus-within:-translate-y-1"
className="relative glass-panel-landing rounded-3xl p-10 md:p-14 text-center"
className="relative glass-panel-landing rounded-3xl p-6 md:p-10 mt-10"
className="relative glass-panel-landing rounded-3xl p-8 md:p-10 mt-8"
className="relative glass-panel-landing rounded-3xl p-8 md:p-12"
className="relative glass-panel-landing rounded-3xl p-8 md:p-14 overflow-hidden"
className="relative glass-panel-landing rounded-3xl p-8 md:p-14"
className="relative glass-strong rounded-2xl p-1.5"
className="relative overflow-hidden glass rounded-2xl border border-emerald-400/40 p-6 shadow-[0_0_80px_-30px_hsl(150_70%_50%/0.55)]"
className="relative z-30 h-14 flex items-center gap-3 px-4 md:px-6 glass border-b border-border"
className="rounded-2xl glass overflow-hidden flex flex-col anim-in"
className="sticky top-2 z-30 glass rounded-2xl border border-gold/20 shadow-[0_0_60px_-30px_hsl(45_90%_60%/0.5)] p-3 flex flex-wrap items-center gap-2"
className="text-left glass-panel-landing rounded-2xl overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_hsl(265_90%_65%/0.55)] group flex flex-col"
className="text-left p-3 rounded-xl glass hover:bg-surface-1 transition"
className="text-left p-4 rounded-2xl glass hover:bg-surface-1 transition flex items-center justify-between gap-3"
className="w-[360px] p-0 glass-strong border-border overflow-hidden"
className="w-60 p-2 glass-strong border-border"
className="w-full h-10 flex items-center justify-center gap-2 rounded-t-2xl glass border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
className="w-full lg:w-60 shrink-0 glass-panel p-3 max-h-[30vh] lg:max-h-none overflow-y-auto"
className="w-full lg:w-64 shrink-0 glass-panel p-4 flex flex-col gap-4 max-h-[40vh] lg:max-h-none overflow-y-auto anim-in"
className="w-full lg:w-72 shrink-0 glass-panel p-4 max-h-[50vh] lg:max-h-none overflow-y-auto anim-in"
className="w-full max-w-2xl glass-strong border-l border-white/10 flex flex-col"
className="w-full max-w-md glass rounded-2xl p-8 anim-in"
className="w-full md:w-[280px] lg:w-[320px] min-h-0 shrink-0 glass-panel p-5 flex flex-col anim-in"
className="w-full sm:max-w-md p-0 glass-strong border-l border-border flex flex-col"
```

## Gradient Classes
```
bg-button-lumina
text-gradient-lumina
text-gradient-royal-gold
```

## Style Frequency
```
 183 rounded-md
 181 rounded-full
 157 rounded-lg
 150 rounded-2xl
 137 rounded-xl
  38 backdrop-blur-xl
  34 rounded-3xl
  28 rounded-sm
  15 backdrop-blur-md
  10 shadow-md
  10 shadow-lg
   8 backdrop-blur-2xl
   7 shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)]
   7 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)]
   7 backdrop-blur-sm
   6 shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)]
   4 shadow-[0_0_8px_hsl(var(--cyan))]
   4 shadow-[0_0_6px_hsl(var(--rose))]
   3 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]
   3 rounded-r-md
   3 rounded-bl-sm
   3 rounded-[2rem]
   2 shadow-sm
   2 shadow-2xl
   2 shadow-[var(--glow-violet)]
   2 shadow-[0_8px_24px_rgba(0,0,0,.12)]
   2 shadow-[0_4px_16px_-4px_hsl(var(--magenta)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)]
   2 shadow-[0_4px_16px_-4px_hsl(45_90%_55%/0.6)]
   2 shadow-[0_4px_12px_-4px_hsl(var(--violet)/0.6)]
   2 shadow-[0_4px_12px_-4px_hsl(var(--cyan)/0.6)]
   2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]
   2 shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)]
   2 shadow-[0_20px_60px_rgba(0,0,0,.18)]
   2 shadow-[0_18px_44px_-18px_hsl(265_90%_65%/0.55)]
   2 shadow-[0_0_8px_hsl(var(--gold))]
   2 shadow-[0_0_6px_hsl(var(--gold))]
   2 shadow-[0_0_6px_hsl(var(--cyan))]
   2 shadow-[0_0_24px_-4px_hsl(var(--violet)/0.7)]
   2 rounded-tl-sm
   2 rounded-l-md
   2 rounded-br-sm
   2 rounded-[32px]
   2 rounded-[30px]
   2 rounded-[2px]
   2 rounded-[28px]
   2 rounded-[1.5rem]
   2 backdrop-blur-[2px]
   1 shadow-xl
   1 shadow-none
   1 shadow-lux
   1 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]
   1 shadow-[inset_0_1px_0_hsl(220_20%_100%/0.18)]
   1 shadow-[inset_0_0_15px_hsl(var(--violet)/0.2)]
   1 shadow-[0_8px_28px_-12px_hsl(255_90%_65%/0.45)]
   1 shadow-[0_8px_24px_rgba(0,0,0,.18)]
   1 shadow-[0_8px_24px_-12px_hsl(var(--gold)/0.6)]
   1 shadow-[0_8px_22px_-10px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.08)]
   1 shadow-[0_6px_24px_-8px_hsl(var(--gold)/0.55),inset_0_1px_0_hsl(0_0%_100%/0.18)]
   1 shadow-[0_4px_24px_-6px_hsl(45_90%_60%/0.55)]
   1 shadow-[0_4px_16px_-6px_hsl(255_90%_65%/0.55)]
   1 shadow-[0_4px_16px_-4px_hsl(var(--violet)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)]
   1 shadow-[0_4px_16px_-4px_hsl(255_90%_65%/0.6),inset_0_1px_0_hsl(220_20%_100%/0.18)]
   1 shadow-[0_35px_90px_-30px_rgba(255,80,190,.45)]
   1 shadow-[0_35px_90px_-30px_rgba(255,190,70,.40)]
   1 shadow-[0_35px_90px_-30px_rgba(120,90,255,.45)]
   1 shadow-[0_35px_90px_-30px_rgba(0,220,255,.40)]
   1 shadow-[0_30px_90px_-40px_rgba(0,0,0,.60)]
   1 shadow-[0_30px_80px_-20px_hsl(230_80%_2%/0.9)]
   1 shadow-[0_24px_70px_-32px_rgba(0,0,0,.55)]
   1 shadow-[0_24px_60px_-24px_hsl(var(--violet)/0.5)]
   1 shadow-[0_24px_60px_-24px_hsl(45_90%_50%/0.4),0_0_0_1px_hsl(45_90%_60%/0.18)]
   1 shadow-[0_20px_80px_rgba(0,0,0,0.30)]
   1 shadow-[0_20px_70px_rgba(0,0,0,.38)]
   1 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)]
   1 shadow-[0_20px_60px_-20px_hsl(var(--violet)/0.55)]
   1 shadow-[0_20px_60px_-20px_hsl(var(--cyan)/0.55)]
   1 shadow-[0_20px_50px_-24px_rgba(124,92,255,.55),inset_0_1px_0_rgba(255,255,255,.08)]
   1 shadow-[0_18px_42px_-24px_rgba(0,0,0,.65)]
   1 shadow-[0_18px_40px_-20px_rgba(0,0,0,.60),inset_0_1px_0_rgba(255,255,255,.08)]
   1 shadow-[0_16px_38px_-12px_hsl(258_100%_70%/.90)]
   1 shadow-[0_10px_40px_-10px_hsl(var(--gold)/0.55)]
   1 shadow-[0_10px_34px_-12px_rgba(244,63,94,.65),inset_0_1px_0_rgba(255,255,255,.18)]
   1 shadow-[0_10px_32px_-8px_hsl(var(--gold)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.22)]
   1 shadow-[0_10px_32px_-12px_rgba(34,211,238,.60),inset_0_1px_0_rgba(255,255,255,.18)]
   1 shadow-[0_10px_32px_-12px_rgba(251,191,36,.60),inset_0_1px_0_rgba(255,255,255,.18)]
   1 shadow-[0_10px_32px_-10px_hsl(var(--gold)/0.8)]
   1 shadow-[0_10px_30px_-14px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.12)]
   1 shadow-[0_10px_30px_-12px_hsl(var(--gold)/0.55)]
   1 shadow-[0_10px_30px_-10px_hsl(var(--violet)/0.7)]
   1 shadow-[0_10px_30px_-10px_hsl(var(--cyan)/0.7)]
   1 shadow-[0_10px_30px_-10px_hsl(40_100%_55%/.65),inset_0_1px_0_rgba(255,255,255,.30)]
   1 shadow-[0_10px_30px_-10px_hsl(258_100%_70%/.70),inset_0_1px_0_rgba(255,255,255,.35)]
   1 shadow-[0_10px_30px_-10px_hsl(155_85%_45%/.70),inset_0_1px_0_rgba(255,255,255,.30)]
   1 shadow-[0_10px_30px_-10px_hsl(0_85%_55%/.70),inset_0_1px_0_rgba(255,255,255,.25)]
   1 shadow-[0_10px_28px_-10px_rgba(124,92,255,.70),inset_0_1px_0_rgba(255,255,255,.25)]
   1 shadow-[0_0_8px_rgb(52_211_153/0.75)]
   1 shadow-[0_0_8px_rgb(252_211_77/0.75)]
   1 shadow-[0_0_8px_rgb(251_113_133/0.75)]
   1 shadow-[0_0_8px_hsl(var(--magenta))]
   1 shadow-[0_0_80px_-30px_hsl(280_80%_60%/0.5)]
   1 shadow-[0_0_80px_-30px_hsl(150_70%_50%/0.55)]
   1 shadow-[0_0_80px_-20px_hsl(45_90%_60%/0.45)]
   1 shadow-[0_0_6px_hsl(255_90%_65%/0.9)]
   1 shadow-[0_0_6px_hsl(255_90%_65%/0.7)]
   1 shadow-[0_0_60px_-30px_hsl(45_90%_60%/0.5)]
   1 shadow-[0_0_60px_-20px_hsl(40_90%_60%/0.35)]
   1 shadow-[0_0_60px_-20px_hsl(0_80%_60%/0.45)]
   1 shadow-[0_0_60px_-10px_hsl(var(--violet)/0.4)]
   1 shadow-[0_0_44px_-24px_hsl(var(--gold)/0.9)]
   1 shadow-[0_0_40px_-12px_hsl(var(--gold)/0.4)]
   1 shadow-[0_0_30px_rgba(139,92,246,0.15)]
   1 shadow-[0_0_30px_-12px_hsl(280_80%_60%/0.6)]
   1 shadow-[0_0_28px_-6px_hsl(var(--gold)/0.75)]
   1 shadow-[0_0_28px_-4px_hsl(45_90%_60%/0.8)]
   1 shadow-[0_0_24px_rgba(124,92,255,.30)]
   1 shadow-[0_0_24px_-8px_hsl(var(--violet)/0.6)]
   1 shadow-[0_0_24px_-6px_hsl(var(--cyan)/0.7)]
   1 shadow-[0_0_24px_-4px_hsl(var(--magenta)/0.6)]
   1 shadow-[0_0_24px_-2px_hsl(var(--cyan)/0.7)]
   1 shadow-[0_0_22px_rgba(34,211,238,.24)]
   1 shadow-[0_0_22px_rgba(244,63,94,.22)]
   1 shadow-[0_0_22px_rgba(124,92,255,.28)]
   1 shadow-[0_0_18px_-6px_hsl(var(--gold)/0.6)]
   1 shadow-[0_0_18px_-4px_hsl(var(--violet)/0.6)]
   1 shadow-[0_0_18px_-4px_hsl(45_90%_60%/0.55)]
   1 shadow-[0_0_18px_-2px_hsl(var(--violet)/0.7)]
   1 shadow-[0_0_14px_-2px_hsl(var(--violet)/0.7)]
   1 shadow-[0_0_14px_-2px_hsl(var(--cyan)/0.7)]
   1 shadow-[0_0_10px_hsl(var(--violet))]
   1 shadow-[0_0_10px_hsl(var(--gold))]
   1 shadow-[0_0_10px_currentColor]
   1 shadow-[0_0_0_1px_hsl(var(--violet)/0.5),0_12px_40px_-12px_hsl(var(--violet)/0.6)]
   1 shadow-[0_0_0_1px_hsl(var(--sidebar-border))]
   1 shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]
   1 rounded-tr-sm
   1 rounded-t-lg
   1 rounded-t-2xl
   1 rounded-t-[10px]
   1 rounded-[inherit]
   1 rounded-[29px]
   1 backdrop-blur-[34px]
```

## Radius Frequency
```
 188 rounded-full
 185 rounded-md
 167 rounded-lg
 153 rounded-2xl
 140 rounded-xl
  36 rounded-3xl
  28 rounded-sm
   3 rounded-r-md
   3 rounded-bl-sm
   3 rounded-[2rem]
   2 rounded-tl-sm
   2 rounded-l-md
   2 rounded-br-sm
   2 rounded-[32px]
   2 rounded-[30px]
   2 rounded-[2px]
   2 rounded-[28px]
   2 rounded-[1.5rem]
   1 rounded-tr-sm
   1 rounded-t-lg
   1 rounded-t-2xl
   1 rounded-t-[10px]
   1 rounded-2xl;
   1 rounded-[inherit]
   1 rounded-[29px]
```

## Blur Frequency
```
  38 backdrop-blur-xl
  20 blur-3xl
  15 backdrop-blur-md
   8 backdrop-blur-2xl
   7 backdrop-blur-sm
   2 backdrop-blur-[2px]
   1 blur-2xl
   1 backdrop-blur-[34px]
```

## Color Literals
```
  61 hsl(var(--gold)
  48 hsl(var(--violet)
  35 hsl(var(--cyan)
  18 hsl(var(--magenta)
  15 hsl(var(--royal-blue)
  10 hsl(var(--rose)
   7 hsl(var(--background)
   7 hsl(265 90% 65%)
   7 hsl(255_90%_65%/0.55)
   6 hsl(230 25% 8% / 0.6)
   6 hsl(230 25% 7%)
   6 hsl(220 20% 100% / 0.06)
   5 rgba(255,255,255,.03)
   5 hsl(var(--electric)
   5 hsl(220_20%_100%/0.18)
   5 #0a0a12
   4 rgba(255,255,255,.08)
   4 hsl(220 8% 65%)
   3 rgba(34,211,238,.08)
   3 rgba(255,255,255,.18)
   3 rgba(255,255,255,.05)
   3 rgba(255,255,255,.02)
   3 rgba(0,0,0,.55)
   3 rgba(0,0,0,.18)
   3 hsl(230_80%_2%/0.9)
   3 hsl(230_40%_8%)
   3 hsl(220_50%_6%)
   3 hsl(220_40%_10%)
   3 hsl(220 20% 100% / 0.08)
   3 #e5e7eb
   3 #ccc
   3 #C9A24B
   3 #475569
   3 #1B2C5B
   2 rgba(34,211,238,.16)
   2 rgba(255,255,255,.30)
   2 rgba(255,255,255,.25)
   2 rgba(244,63,94,.22)
   2 rgba(244,63,94,.08)
   2 rgba(124,92,255,.28)
   2 rgba(124,92,255,.10)
   2 rgba(0,0,0,.60)
   2 rgba(0,0,0,.12)
   2 rgb(0_0_0/0.7)
   2 hsl(var(--foreground)
   2 hsl(45_90%_60%/0.55)
   2 hsl(45_90%_60%/0.18)
   2 hsl(45_90%_55%/0.6)
   2 hsl(38 100% 82%)
   2 hsl(265_90%_65%/0.55)
   2 hsl(265 90% 60%)
   2 hsl(258_100%_74%)
   2 hsl(250_72%_56%)
   2 hsl(220_20%_100%/0.1)
   2 hsl(220 20% 100% / 0.04)
   2 hsl(220 18% 8% / 0.95)
   2 hsl(220 15% 98%)
   2 hsl(220 12% 100% / 0.1)
   2 hsl(220 12% 100% / 0.05)
   2 #fff
   2 #F4F1EA
   2 #64748b
   2 #22c55e
   2 #0E1224
   2 #000
   1 rgba(99,102,241,.16)
   1 rgba(94,92,230,.22)
   1 rgba(6,8,15,.52)
   1 rgba(6,8,15,.10)
   1 rgba(59,130,246,.18)
   1 rgba(59,130,246,.16)
   1 rgba(5,6,10,.58)
   1 rgba(5,6,10,.18)
   1 rgba(45,212,191,.20)
   1 rgba(34,211,238,.60)
   1 rgba(34,211,238,.26)
   1 rgba(34,211,238,.24)
   1 rgba(34,211,238,.22)
   1 rgba(34,211,238,.20)
   1 rgba(255,80,190,.45)
   1 rgba(255,255,255,0)
   1 rgba(255,255,255,.35)
   1 rgba(255,255,255,.14)
   1 rgba(255,255,255,.12)
   1 rgba(255,255,255,.10)
   1 rgba(255,255,255,.06)
   1 rgba(255,255,255,.04)
   1 rgba(255,190,70,.40)
   1 rgba(251,191,36,.60)
   1 rgba(251,191,36,.22)
   1 rgba(251,191,36,.08)
   1 rgba(249,115,22,.12)
   1 rgba(244,63,94,.65)
   1 rgba(244,63,94,.24)
   1 rgba(244,63,94,.20)
   1 rgba(244,114,182,.18)
   1 rgba(236,72,153,.18)
   1 rgba(192,132,252,.20)
   1 rgba(168,85,247,.22)
   1 rgba(168,85,247,.16)
   1 rgba(16,185,129,.10)
   1 rgba(139,92,246,0.15)
   1 rgba(124,92,255,.70)
   1 rgba(124,92,255,.55)
   1 rgba(124,92,255,.30)
   1 rgba(124,92,255,.22)
   1 rgba(124,92,255,.18)
   1 rgba(124,92,255,.12)
   1 rgba(124,92,255,.08)
   1 rgba(120,90,255,.45)
   1 rgba(12,14,24,.42)
   1 rgba(0,220,255,.40)
   1 rgba(0,0,0,0.55)
   1 rgba(0,0,0,0.30)
   1 rgba(0,0,0,.65)
   1 rgba(0,0,0,.38)
   1 rgb(52_211_153/0.75)
   1 rgb(252_211_77/0.75)
   1 rgb(251_113_133/0.75)
   1 rgb(0_0_0/0.8)
   1 hsl(var(--surface-3)
   1 hsl(var(--surface-2)
   1 hsl(var(--surface-1)
   1 hsl(var(--sidebar-border)
   1 hsl(var(--sidebar-accent)
   1 hsl(var(--primary-glow)
   1 hsl(var(--brand-royal)
   1 hsl(var(--border)
   1 hsl(var(--${c})
   1 hsl(var(--${a})
   1 hsl(45_90%_60%/0.8)
   1 hsl(45_90%_60%/0.5)
   1 hsl(45_90%_60%/0.45)
   1 hsl(45_90%_50%/0.4)
   1 hsl(45 90% 60%)
   1 hsl(42_100%_58%)
   1 hsl(40_90%_60%/0.35)
   1 hsl(40_90%_55%/0.15)
   1 hsl(40_100%_55%/.65)
   1 hsl(38 100% 70%)
   1 hsl(34_95%_47%)
   1 hsl(280_80%_60%/0.6)
   1 hsl(280_80%_60%/0.5)
   1 hsl(258_100%_70%/.90)
   1 hsl(258_100%_70%/.70)
   1 hsl(255_90%_65%/0.9)
   1 hsl(255_90%_65%/0.7)
   1 hsl(255_90%_65%/0.6)
   1 hsl(255_90%_65%/0.45)
   1 hsl(255 90% 65% / 0.48)
   1 hsl(255 90% 65% / 0.42)
   1 hsl(255 90% 65% / 0.38)
   1 hsl(230 80% 2% / 0.85)
   1 hsl(230 80% 2% / 0.65)
   1 hsl(230 80% 2% / 0.5)
   1 hsl(230 25% 5% / 0.88)
   1 hsl(230 25% 4% / 0.78)
   1 hsl(230 25% 2% / 0.4)
   1 hsl(220 8% 75%)
   1 hsl(220 20% 100% / calc(0.07 * var(--glass-tint-scale)
   1 hsl(220 20% 100% / calc(0.05 * var(--glass-tint-scale)
   1 hsl(220 20% 100% / calc(0.03 * var(--glass-tint-scale)
   1 hsl(220 20% 100% / calc(0.02 * var(--glass-tint-scale)
   1 hsl(220 20% 100% / 0.18)
   1 hsl(220 20% 100% / 0.16)
   1 hsl(220 20% 100% / 0.14)
   1 hsl(220 20% 100% / 0.11)
   1 hsl(220 20% 100% / 0.10)
   1 hsl(220 20% 100% / 0.09)
   1 hsl(220 20% 100% / 0.02)
   1 hsl(220 20% 100% / 0.01)
   1 hsl(220 15% 96%)
   1 hsl(195 90% 60%)
   1 hsl(158_72%_33%)
   1 hsl(155_85%_45%/.70)
   1 hsl(152_78%_48%)
   1 hsl(150_80%_55%/0.18)
   1 hsl(150_70%_50%/0.55)
   1 hsl(0_85%_60%)
   1 hsl(0_85%_55%/.70)
   1 hsl(0_80%_60%/0.45)
   1 hsl(0_80%_55%/0.18)
   1 hsl(0_72%_48%)
   1 hsl(0_0%_100%/0.22)
   1 hsl(0_0%_100%/0.18)
   1 hsl(0 0% 100%)
   1 hsl(0 0% 100% / 0.9)
   1 hsl(0 0% 100% / 0.5)
   1 Binary file apps/lumina-builder/src/assets/optimized/lumina.webp matches
   1 Binary file apps/lumina-builder/src/assets/optimized/lumina-blob.webp matches
   1 #fea
   1 #f8fafc
   1 #373f59
   1 #33415566
   1 #334155
   1 #2b3144
   1 #2563eb55
   1 #242b3d
   1 #22d3ee
   1 #1c2233
```

## Raw Shadow Locations
```
apps/lumina-builder/src/components/ui/sidebar.tsx:421:          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
apps/lumina-builder/src/components/landing/Templates.tsx:106:              className="text-left glass-panel-landing rounded-2xl overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_hsl(265_90%_65%/0.55)] group flex flex-col"
apps/lumina-builder/src/components/landing/Pricing.tsx:135:                  <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-primary-foreground bg-button-lumina shadow-[var(--glow-violet)]">
apps/lumina-builder/src/components/landing/PlatformArchitecture.tsx:75:                      ? "text-white bg-brand ring-1 ring-white/20 shadow-[0_4px_16px_-6px_hsl(255_90%_65%/0.55)]"
apps/lumina-builder/src/components/landing/PlatformArchitecture.tsx:122:                      "shadow-[0_8px_28px_-12px_hsl(255_90%_65%/0.45)]"
apps/lumina-builder/src/components/landing/InfrastructureYourWay.tsx:53:                <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-primary-foreground bg-button-lumina shadow-[var(--glow-violet)]">
apps/lumina-builder/src/components/sales/SalesRequestDialog.tsx:312:              className="bg-button-lumina text-white shadow-[0_4px_16px_-4px_hsl(var(--violet)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] hover:opacity-90"
apps/lumina-builder/src/components/shell/PublishDialog.tsx:28:            <div className="h-11 w-11 rounded-2xl bg-button-lumina grid place-items-center shadow-[0_0_24px_-4px_hsl(var(--violet)/0.7)]">
apps/lumina-builder/src/components/shell/BottomDock.tsx:108:                    : "bg-button-lumina text-white rounded-tr-sm shadow-[0_0_24px_-8px_hsl(var(--violet)/0.6)]"
apps/lumina-builder/src/components/shell/BottomDock.tsx:123:            <button onClick={send} className="h-10 px-4 rounded-xl bg-button-lumina text-white text-sm font-medium shadow-[0_0_18px_-4px_hsl(var(--violet)/0.6)]">Send</button>
apps/lumina-builder/src/components/layout/TopBar.tsx:127:              <span className="absolute inset-0 rounded-lg bg-brand opacity-90 ring-1 ring-white/20 shadow-[inset_0_1px_0_hsl(220_20%_100%/0.18)]" />
apps/lumina-builder/src/components/layout/TopBar.tsx:228:        <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_6px_hsl(255_90%_65%/0.7)]" />
apps/lumina-builder/src/components/layout/Sidebar.tsx:152:          className="group relative h-10 w-10 rounded-xl bg-button-lumina grid place-items-center shadow-[0_4px_16px_-4px_hsl(255_90%_65%/0.6),inset_0_1px_0_hsl(220_20%_100%/0.18)] hover:brightness-110 transition-all mb-1"
apps/lumina-builder/src/components/runtime/RuntimeToolbar.tsx:153:              "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.75)]",
apps/lumina-builder/src/components/runtime/RuntimeToolbar.tsx:155:              "bg-amber-300 shadow-[0_0_8px_rgb(252_211_77/0.75)]",
apps/lumina-builder/src/components/runtime/RuntimeToolbar.tsx:157:              "bg-rose-400 shadow-[0_0_8px_rgb(251_113_133/0.75)]",
apps/lumina-builder/src/components/runtime/RuntimeStatusCard.tsx:60:    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-background border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
apps/lumina-builder/src/components/runtime/RuntimeStatusCard.tsx:63:        <div className="w-full max-w-md rounded-3xl border border-gold/25 bg-surface-1/75 backdrop-blur-xl p-5 shadow-[0_0_44px_-24px_hsl(var(--gold)/0.9)]">
apps/lumina-builder/src/components/lumina/LuminaSegmentedControl.tsx:33:        "shadow-[0_18px_40px_-20px_rgba(0,0,0,.60),inset_0_1px_0_rgba(255,255,255,.08)]",
apps/lumina-builder/src/components/lumina/LuminaSegmentedControl.tsx:59:                    "shadow-[0_10px_28px_-10px_rgba(124,92,255,.70),inset_0_1px_0_rgba(255,255,255,.25)]",
apps/lumina-builder/src/components/lumina/LuminaSegmentedControl.tsx:71:                    ? "opacity-100 shadow-[0_0_10px_currentColor] scale-110"
apps/lumina-builder/src/components/lumina/surface/LuminaSurface.tsx:22:    "glass-panel rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_-32px_rgba(0,0,0,.55)]",
apps/lumina-builder/src/components/lumina/surface/LuminaSurface.tsx:25:    "glass-panel rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-[0_30px_90px_-40px_rgba(0,0,0,.60)]",
apps/lumina-builder/src/components/lumina/GlowCard.tsx:29:    "hover:border-violet/40 hover:shadow-[0_35px_90px_-30px_rgba(120,90,255,.45)]",
apps/lumina-builder/src/components/lumina/GlowCard.tsx:31:    "hover:border-fuchsia/40 hover:shadow-[0_35px_90px_-30px_rgba(255,80,190,.45)]",
apps/lumina-builder/src/components/lumina/GlowCard.tsx:33:    "hover:border-cyan/40 hover:shadow-[0_35px_90px_-30px_rgba(0,220,255,.40)]",
apps/lumina-builder/src/components/lumina/GlowCard.tsx:35:    "hover:border-amber/40 hover:shadow-[0_35px_90px_-30px_rgba(255,190,70,.40)]",
apps/lumina-builder/src/components/lumina/GlowCard.tsx:125:"shadow-[0_20px_70px_rgba(0,0,0,.38)]",
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:13:          "shadow-[0_10px_30px_-10px_hsl(258_100%_70%/.70),inset_0_1px_0_rgba(255,255,255,.35)] " +
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:14:          "hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_16px_38px_-12px_hsl(258_100%_70%/.90)]",
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:19:          "shadow-[0_10px_30px_-10px_hsl(155_85%_45%/.70),inset_0_1px_0_rgba(255,255,255,.30)] " +
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:25:          "shadow-[0_10px_30px_-10px_hsl(40_100%_55%/.65),inset_0_1px_0_rgba(255,255,255,.30)] " +
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:31:          "shadow-[0_10px_30px_-10px_hsl(0_85%_55%/.70),inset_0_1px_0_rgba(255,255,255,.25)] " +
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:37:          "shadow-[0_8px_22px_-10px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.08)] " +
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:44:          "shadow-[0_10px_30px_-14px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.12)] " +
apps/lumina-builder/src/components/lumina/LuminaButton.tsx:46:          "hover:shadow-[0_0_24px_rgba(124,92,255,.30)]",
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:126:                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_6px_hsl(var(--gold))]" />
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:168:                        ? "border-gold/70 bg-gradient-to-br from-gold/15 to-royal-blue/10 shadow-[0_0_28px_-6px_hsl(var(--gold)/0.75)]"
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:175:                        active ? "bg-gold shadow-[0_0_6px_hsl(var(--gold))]" : "bg-muted-foreground/40"
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:216:                      ? "bg-surface-3 text-foreground shadow-[inset_0_0_15px_hsl(var(--violet)/0.2)]"
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:222:                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" />}
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:352:            <div className="h-9 w-9 rounded-lg bg-button-lumina shadow-[0_0_18px_-2px_hsl(var(--violet)/0.7)]" />
apps/lumina-builder/src/components/workspaces/DesignerWorkspace.tsx:423:        <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-[0_0_10px_hsl(var(--violet))]" style={{ left: `calc(${value}% - 6px)` }} />
apps/lumina-builder/src/components/workspaces/repo-audit/FixUntilGreenPanel.tsx:62:      "glass rounded-2xl border p-5 shadow-[0_0_80px_-30px_hsl(280_80%_60%/0.5)]",
apps/lumina-builder/src/components/workspaces/repo-audit/RepoSourcePicker.tsx:68:        className="bg-gradient-to-r from-gold to-amber-400 text-black hover:brightness-110 shadow-[0_4px_24px_-6px_hsl(45_90%_60%/0.55)]"
apps/lumina-builder/src/components/workspaces/repo-audit/RepairActionBar.tsx:30:    <div className="sticky top-2 z-30 glass rounded-2xl border border-gold/20 shadow-[0_0_60px_-30px_hsl(45_90%_60%/0.5)] p-3 flex flex-wrap items-center gap-2">
apps/lumina-builder/src/components/workspaces/repo-audit/RepairActionBar.tsx:99:          "border border-gold/60 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/90 shadow-[0_0_18px_-4px_hsl(45_90%_60%/0.55)] hover:shadow-[0_0_28px_-4px_hsl(45_90%_60%/0.8)] transition-all duration-300",
apps/lumina-builder/src/components/workspaces/repo-audit/RepairActionBar.tsx:101:          "border border-transparent bg-gradient-to-r from-violet via-electric to-cyan text-white hover:brightness-110 shadow-[0_0_30px_-12px_hsl(280_80%_60%/0.6)]",
apps/lumina-builder/src/components/workspaces/repo-audit/BuildPassedBanner.tsx:12:    <div className="relative overflow-hidden glass rounded-2xl border border-emerald-400/40 p-6 shadow-[0_0_80px_-30px_hsl(150_70%_50%/0.55)]">
apps/lumina-builder/src/components/workspaces/repo-audit/DeepAuditProgress.tsx:109:          ? "border-rose-400/40 shadow-[0_0_60px_-20px_hsl(0_80%_60%/0.45)]"
apps/lumina-builder/src/components/workspaces/repo-audit/DeepAuditProgress.tsx:111:          ? "border-amber-400/30 shadow-[0_0_60px_-20px_hsl(40_90%_60%/0.35)]"
apps/lumina-builder/src/components/workspaces/repo-audit/DeepAuditProgress.tsx:112:          : "border-gold/30 shadow-[0_0_80px_-20px_hsl(45_90%_60%/0.45)]",
apps/lumina-builder/src/components/workspaces/repo-audit/DeepAuditProgress.tsx:182:                  className="inline-flex items-center gap-1.5 rounded-lg border border-gold/60 bg-gold/10 px-3 py-1.5 text-[12px] font-semibold text-gold hover:bg-gold/20 hover:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectRow.tsx:23:    "border border-violet/30 bg-[linear-gradient(180deg,rgba(124,92,255,.28),rgba(124,92,255,.10))] text-violet-100 shadow-[0_0_22px_rgba(124,92,255,.28)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectRow.tsx:26:    "border border-cyan/30 bg-[linear-gradient(180deg,rgba(34,211,238,.26),rgba(34,211,238,.08))] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.24)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectRow.tsx:29:    "border border-rose/30 bg-[linear-gradient(180deg,rgba(244,63,94,.24),rgba(244,63,94,.08))] text-rose-100 shadow-[0_0_22px_rgba(244,63,94,.22)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectRow.tsx:76:                "shadow-[0_20px_50px_-24px_rgba(124,92,255,.55),inset_0_1px_0_rgba(255,255,255,.08)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeProjectRow.tsx:84:                "hover:shadow-[0_18px_42px_-24px_rgba(0,0,0,.65)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHealthBadge.tsx:14:    "border border-cyan/30 bg-[linear-gradient(180deg,rgba(34,211,238,.22),rgba(34,211,238,.08))] text-cyan-100 shadow-[0_10px_32px_-12px_rgba(34,211,238,.60),inset_0_1px_0_rgba(255,255,255,.18)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHealthBadge.tsx:17:    "border border-amber-400/30 bg-[linear-gradient(180deg,rgba(251,191,36,.22),rgba(251,191,36,.08))] text-amber-100 shadow-[0_10px_32px_-12px_rgba(251,191,36,.60),inset_0_1px_0_rgba(255,255,255,.18)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHealthBadge.tsx:20:    "border border-rose-400/30 bg-[linear-gradient(180deg,rgba(244,63,94,.22),rgba(244,63,94,.08))] text-rose-100 shadow-[0_10px_34px_-12px_rgba(244,63,94,.65),inset_0_1px_0_rgba(255,255,255,.18)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHealthBadge.tsx:23:    "border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))] text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.05)]",
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeMetricTile.tsx:27:    <GlowCard accent={accent} className={cn("relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,.18)]", className)}>
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeMetricTile.tsx:37:          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,.12)]">
apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeLifecycleTimeline.tsx:29:              <span className={cn("absolute left-0 top-2 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,.18)]", PHASE_COLOR[e.phase])}>
apps/lumina-builder/src/components/workspaces/shared/WorkspaceTabBar.tsx:54:                    "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
apps/lumina-builder/src/components/workspaces/shared/GlassWorkspaceHero.tsx:46:        "shadow-[0_20px_80px_rgba(0,0,0,0.30)]",
apps/lumina-builder/src/components/workspaces/shared/WorkspaceCard.tsx:23:        "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)]",
apps/lumina-builder/src/components/workspaces/EntryView.tsx:373:                      ? "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]"
apps/lumina-builder/src/components/workspaces/EntryView.tsx:416:                      ? "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]"
apps/lumina-builder/src/components/workspaces/PricingView.tsx:132:                  p.highlighted && "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]",
apps/lumina-builder/src/components/workspaces/PricingView.tsx:133:                  isRecommended && "ring-2 ring-violet shadow-[0_0_0_1px_hsl(var(--violet)/0.5),0_12px_40px_-12px_hsl(var(--violet)/0.6)]",
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:222:      "bg-gold shadow-[0_0_8px_hsl(var(--gold))]",
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:224:      "bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]",
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:330:            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 w-72 focus-within:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] focus-within:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300">
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:356:              className="hidden md:inline-flex h-9 px-2.5 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 text-[12px] text-gold outline-none hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:384:              className="hidden md:inline-flex h-9 px-2.5 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 text-[12px] text-gold outline-none hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:402:              className="hidden md:inline-flex border border-gold/60 text-gold hover:text-gold hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300"
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:435:              className="group relative aspect-[4/3] text-left rounded-2xl overflow-hidden border border-gold/25 bg-gradient-to-br from-[hsl(220_40%_10%)] via-[hsl(230_40%_8%)] to-[hsl(220_50%_6%)] hover:border-gold/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(45_90%_50%/0.4),0_0_0_1px_hsl(45_90%_60%/0.18)]"
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:450:                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold to-electric grid place-items-center shadow-[0_4px_16px_-4px_hsl(45_90%_55%/0.6)]">
apps/lumina-builder/src/components/workspaces/DashboardView.tsx:538:                  className="group relative aspect-[4/3] text-left rounded-2xl glass overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)] anim-in cursor-pointer"
apps/lumina-builder/src/components/workspaces/DeveloperWorkspace.tsx:673:                <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" />
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeMetricTile.tsx:27:        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,.18)]",
apps/lumina-builder/src/components/workspaces/knowledge/overview/KnowledgeMetricTile.tsx:49:          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,.12)]">
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:466:                      ? "outline outline-2 outline-cyan shadow-[0_0_24px_-2px_hsl(var(--cyan)/0.7)]"
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:496:            className="absolute pointer-events-none rounded-md border-2 border-dashed border-cyan/80 bg-cyan/10 shadow-[0_0_24px_-6px_hsl(var(--cyan)/0.7)]"
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:508:            className="absolute pointer-events-none bg-magenta shadow-[0_0_8px_hsl(var(--magenta))]"
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:525:                <div className="absolute left-0 top-0 h-full w-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:526:                <div className="absolute right-0 top-0 h-full w-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:536:              <div className="absolute top-0 left-0 w-full h-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:537:              <div className="absolute bottom-0 left-0 w-full h-px bg-rose shadow-[0_0_6px_hsl(var(--rose))]" />
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:580:          <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]" />
apps/lumina-builder/src/components/workspaces/designer/DesignerCanvas.tsx:599:            ? "bg-button-lumina shadow-[0_0_24px_-4px_hsl(var(--magenta)/0.6)]"
apps/lumina-builder/src/components/workspaces/designer/AIAssistPanel.tsx:310:          "glass-panel rounded-2xl border border-white/10 shadow-[0_20px_60px_-20px_hsl(var(--violet)/0.55)]",
apps/lumina-builder/src/components/workspaces/designer/AIAssistPanel.tsx:317:          <div className="h-7 w-7 rounded-lg bg-button-lumina grid place-items-center shadow-[0_0_14px_-2px_hsl(var(--violet)/0.7)]">
apps/lumina-builder/src/components/workspaces/designer/AIAssistPanel.tsx:391:                  ? "ml-auto bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--violet)/0.6)]"
apps/lumina-builder/src/components/workspaces/designer/AIAssistPanel.tsx:514:                "bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--violet)/0.6)]",
apps/lumina-builder/src/components/workspaces/designer/AIAssistPanel.tsx:543:        "shadow-[0_10px_30px_-10px_hsl(var(--violet)/0.7)] hover:brightness-110",
apps/lumina-builder/src/components/workspaces/dialogs/ProjectRenameDialog.tsx:41:            <div className="h-11 w-11 rounded-2xl bg-button-lumina grid place-items-center shadow-[0_0_24px_-4px_hsl(var(--violet)/0.7)]">
apps/lumina-builder/src/components/workspaces/dev/DevAIAssistPanel.tsx:600:          "glass-panel rounded-2xl border border-white/10 shadow-[0_20px_60px_-20px_hsl(var(--cyan)/0.55)]",
apps/lumina-builder/src/components/workspaces/dev/DevAIAssistPanel.tsx:607:          <div className="h-7 w-7 rounded-lg bg-button-lumina grid place-items-center shadow-[0_0_14px_-2px_hsl(var(--cyan)/0.7)]">
apps/lumina-builder/src/components/workspaces/dev/DevAIAssistPanel.tsx:703:                  ? "ml-auto bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--cyan)/0.6)]"
apps/lumina-builder/src/components/workspaces/dev/DevAIAssistPanel.tsx:850:                "bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--cyan)/0.6)]",
apps/lumina-builder/src/components/workspaces/dev/DevAIAssistPanel.tsx:879:        "shadow-[0_10px_30px_-10px_hsl(var(--cyan)/0.7)] hover:brightness-110",
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:504:    warm: "bg-gold shadow-[0_0_8px_hsl(var(--gold))]",
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:505:    live: "bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]",
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:634:            <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 w-full md:w-64 focus-within:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] focus-within:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300">
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:730:            <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-violet to-magenta grid place-items-center mb-4 shadow-[0_4px_16px_-4px_hsl(var(--magenta)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)]">
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:758:                <div className="h-11 w-11 rounded-xl grid place-items-center mx-auto mb-3 bg-gradient-to-br from-violet to-magenta shadow-[0_4px_16px_-4px_hsl(var(--magenta)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] group-hover:scale-105 transition">
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:784:                  "group relative aspect-[4/3] text-left rounded-2xl glass overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)] anim-in cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet",
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:785:                  isSelected && "ring-2 ring-violet/60 shadow-[0_24px_60px_-24px_hsl(var(--violet)/0.5)]"
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:982:              className="fixed right-4 bottom-4 top-20 w-[340px] z-40 rounded-2xl glass-strong border border-border shadow-[0_30px_80px_-20px_hsl(230_80%_2%/0.9)] flex flex-col overflow-hidden anim-in"
apps/lumina-builder/src/components/workspaces/ImportsView.tsx:1389:          : "bg-background/20 backdrop-blur-md border-gold/60 text-gold hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)]"
apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx:193:            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold to-electric grid place-items-center shadow-[0_4px_16px_-4px_hsl(45_90%_55%/0.6)]">
apps/lumina-builder/src/components/templates/starters/LumenAI.tsx:150:            className="h-9 mb-3 rounded-lg bg-button-lumina text-primary-foreground text-[13px] font-medium inline-flex items-center justify-center gap-1.5 shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition"
apps/lumina-builder/src/components/templates/starters/LumenAI.tsx:238:                className="h-8 w-8 rounded-lg bg-button-lumina text-primary-foreground grid place-items-center shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition disabled:opacity-50 disabled:pointer-events-none"
apps/lumina-builder/src/components/templates/starters/AuroraMarketing.tsx:59:            <button className="h-10 px-5 rounded-lg bg-button-lumina text-primary-foreground text-[13px] font-medium shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition">
apps/lumina-builder/src/components/templates/starters/AuroraMarketing.tsx:138:                  t.highlight && "ring-1 ring-white/15 shadow-[0_18px_44px_-18px_hsl(265_90%_65%/0.55)]",
apps/lumina-builder/src/components/templates/starters/AuroraMarketing.tsx:168:                      ? "bg-button-lumina text-primary-foreground shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06]"
apps/lumina-builder/src/components/templates/starters/AuroraMarketing.tsx:224:          <button className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-button-lumina text-primary-foreground text-[13px] font-medium shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition">
apps/lumina-builder/src/components/templates/starters/HelixCRM.tsx:106:            className="h-8 px-3 rounded-lg bg-button-lumina text-primary-foreground text-[12px] font-medium inline-flex items-center gap-1.5 shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition"
apps/lumina-builder/src/components/preview/PreviewFrame.tsx:857:            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
apps/lumina-builder/src/components/preview/PreviewFrame.tsx:931:            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_hsl(var(--cyan))] animate-pulse" />
apps/lumina-builder/src/components/preview/UpgradeModal.tsx:120:                    ? "border-gold/50 bg-gradient-to-b from-gold/[0.08] to-transparent shadow-[0_0_40px_-12px_hsl(var(--gold)/0.4)]"
apps/lumina-builder/src/components/import/GlobalImportDropZone.tsx:178:      <div className="pointer-events-none rounded-3xl border-2 border-dashed border-violet/60 bg-surface-1/80 px-10 py-8 shadow-[0_0_60px_-10px_hsl(var(--violet)/0.4)] max-w-lg w-[90%]">
apps/lumina-builder/src/components/transform/TransformAnalyticsMount.tsx:96:          "shadow-[0_8px_24px_-12px_hsl(var(--gold)/0.6)] hover:shadow-[0_10px_32px_-10px_hsl(var(--gold)/0.8)]",
apps/lumina-builder/src/components/transform/TransformModal.tsx:459:                active && "bg-gold/15 text-gold border-gold/40 shadow-[0_0_18px_-6px_hsl(var(--gold)/0.6)]",
apps/lumina-builder/src/components/transform/TransformModal.tsx:493:                  ? "ring-2 ring-gold/60 shadow-[0_10px_30px_-12px_hsl(var(--gold)/0.55)]"
apps/lumina-builder/src/components/transform/TransformModal.tsx:501:                {active && <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_hsl(var(--gold))]" />}
apps/lumina-builder/src/components/transform/TransformModal.tsx:805:      <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-gradient-to-br from-cyan/20 via-gold/20 to-royal-blue/30 border border-gold/40 shadow-[0_10px_40px_-10px_hsl(var(--gold)/0.55)]">
apps/lumina-builder/src/components/transform/TransformButton.tsx:47:        "shadow-[0_6px_24px_-8px_hsl(var(--gold)/0.55),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
apps/lumina-builder/src/components/transform/TransformButton.tsx:48:        "hover:shadow-[0_10px_32px_-8px_hsl(var(--gold)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.22)]",
apps/lumina-builder/src/components/notifications/NotificationsCenter.tsx:19:            <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_6px_hsl(255_90%_65%/0.9)]" />
apps/lumina-builder/src/pages/PreviewPage.tsx:227:            className="relative h-full w-full rounded-2xl overflow-hidden bg-background border border-border shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)]"
apps/lumina-builder/src/pages/PreviewPage.tsx:233:                  <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_hsl(var(--cyan))]" />
```
