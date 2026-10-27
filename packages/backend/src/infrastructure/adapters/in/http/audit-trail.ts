import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RecordAuditEventUseCase } from '@application/ports/in/governance.use-cases';

/**
 * Journal d'audit : chaque écriture réussie (et chaque tentative de connexion) est tracée après la
 * réponse — qui, quoi, quand, sur quel projet. Les corps de requête ne sont jamais recopiés (au plus un
 * nom, un e-mail, un code ou le motif d'un rejet).
 */

const DOCUMENTS: Record<string, string> = {
  plan: 'Structure (WBS)',
  'executive-reports': 'Rapport exécutif',
  risks: 'Registre des risques',
  charter: 'Charte du projet',
  stakeholders: 'Registre des parties prenantes',
  assumptions: 'Registre des hypothèses et contraintes',
  'business-case': 'Business case',
  'benefits-plan': 'Plan de gestion des bénéfices',
  raci: 'Matrice RACI',
  'management-plans': 'Plans de gestion',
  requirements: 'Registre des exigences',
  'scope-statement': 'Énoncé du périmètre',
  'cost-estimates': 'Estimations des coûts',
  'funding-strategy': 'Stratégie de financement',
  'actual-costs': 'Dépenses réelles',
  'resource-requirements': 'Besoins en ressources',
  'resource-plan': 'Plan de gestion des ressources',
  'team-charter': "Charte de l'équipe",
  'engagement-plan': "Plan d'engagement des parties prenantes",
  'communication-plan': 'Plan de communication',
  'procurement-plan': 'Plan de gestion des approvisionnements',
  'procurement-strategy': "Stratégie d'approvisionnement",
  'source-selections': 'Sélection des fournisseurs',
  'project-management-plan': 'Plan de management du projet',
  'quality-plan': 'Plan de gestion de la qualité',
  'risk-plan': 'Plan de gestion des risques',
  'change-log': 'Registre des modifications',
  'issue-log': 'Journal des problèmes',
  'lessons-learned': 'Registre des leçons apprises',
  'schedule-model': "Modèle d'ordonnancement",
  'wbs-dictionary': 'Dictionnaire de la WBS',
  'stakeholder-questionnaire': "Questionnaire d'identification",
  'stakeholder-mapping': 'Cartographie des parties prenantes',
  'quality-metrics': 'Métriques qualité',
  'quality-report': 'Rapport qualité',
  'quality-analyses': "Outils d'analyse qualité",
};

const APPROVAL_SUBJECTS: Record<string, string> = {
  BUSINESS_CASE: 'Business case',
  CHARTER: 'Charte du projet',
  BENEFITS_PLAN: 'Plan de gestion des bénéfices',
  PROJECT_MANAGEMENT_PLAN: 'Plan de management du projet',
  REQUIREMENTS: 'Registre des exigences',
};

const APPROVAL_ACTIONS: Record<string, string> = {
  submit: 'soumission',
  withdraw: 'retrait de la soumission',
  approve: 'approbation',
  reject: 'rejet',
  revise: 'révision',
};

interface Described {
  action: string;
  detail?: string | null;
  /** E-mail saisi à la connexion (le compte n'a pas encore de session). */
  email?: string;
}

const text = (value: unknown, max = 200): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;

function describe(request: FastifyRequest, reply: FastifyReply): Described | null {
  const url = request.routeOptions.url ?? '';
  const method = request.method;
  const ok = reply.statusCode < 400;
  const body = (request.body ?? {}) as Record<string, unknown>;
  const params = (request.params ?? {}) as Record<string, string>;

  if (url === '/api/v1/auth/login') {
    const email = text(body.email, 254) ?? undefined;
    if (ok) return { action: 'Connexion', email };
    return reply.statusCode === 401 ? { action: 'Échec de connexion', detail: email ?? null, email } : null;
  }
  if (!ok || method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;

  const routes: Record<string, () => Described | null> = {
    'POST /api/v1/auth/logout': () => ({ action: 'Déconnexion' }),
    'POST /api/v1/auth/password': () => ({ action: 'Mot de passe changé' }),
    'POST /api/v1/projects': () => ({ action: 'Projet créé', detail: text(body.name) }),
    'PUT /api/v1/projects/:projectId': () => ({ action: 'Projet modifié', detail: text(body.name) }),
    'DELETE /api/v1/projects/:projectId': () => ({ action: 'Projet supprimé', detail: params.projectId ?? null }),
    'PUT /api/v1/projects/:projectId/members': () => ({ action: 'Équipe du projet modifiée' }),
    'PUT /api/v1/projects/:projectId/approvers': () => ({ action: 'Valideurs du projet modifiés' }),
    'POST /api/v1/projects/:projectId/approvals/:subject/:action': () => ({
      action: `${APPROVAL_SUBJECTS[params.subject ?? ''] ?? 'Document'} — ${APPROVAL_ACTIONS[params.action ?? ''] ?? 'validation'}`,
      detail: text(body.comment, 500),
    }),
    'POST /api/v1/projects/:projectId/change-log/:code/decision': () => ({
      action: `Décision sur la demande de modification ${params.code ?? ''}`.trim(),
    }),
    'POST /api/v1/projects/:projectId/source-selections/award': () => ({ action: "Attribution d'un achat", detail: text(body.procurement) }),
    'PUT /api/v1/projects/:projectId/tasks/:wbs/progress': () => ({ action: `Avancement de la tâche ${params.wbs ?? ''}`.trim() }),
    'POST /api/v1/admin/users': () => ({ action: 'Compte créé', detail: text(body.email, 254) }),
    'PUT /api/v1/admin/users/:userId': () => ({ action: 'Compte modifié', detail: text(body.email, 254) }),
    'POST /api/v1/admin/users/:userId/reset-password': () => ({ action: 'Mot de passe réinitialisé', detail: params.userId ?? null }),
    'POST /api/v1/admin/resources': () => ({ action: 'Ressource ajoutée au référentiel', detail: text(body.name) }),
    'PUT /api/v1/admin/resources/:resourceId': () => ({ action: 'Ressource du référentiel modifiée', detail: text(body.name) }),
    'DELETE /api/v1/admin/resources/:resourceId': () => ({ action: 'Ressource retirée du référentiel', detail: params.resourceId ?? null }),
  };
  const known = routes[`${method} ${url}`];
  if (known) return known();

  // Documents d'un projet : /api/v1/projects/:projectId/<segment>[/:period…]
  const segment = /^\/api\/v1\/projects\/:projectId\/([a-z-]+)/.exec(url)?.[1];
  const label = segment ? DOCUMENTS[segment] : undefined;
  if (!label) return { action: `${method} ${url}` };
  const version = reply.getHeader('etag');
  // Version renvoyée = version lue par le client : l'enregistrement n'a rien changé, rien à tracer.
  if (method === 'PUT' && version && request.headers['if-match'] === version) return null;
  const period = params.period ? ` ${params.period}` : '';
  if (method === 'DELETE') return { action: `${label}${period} — suppression` };
  if (url.endsWith('/publish')) return { action: `${label}${period} — publication` };
  return { action: `${label}${period} — enregistrement`, detail: version ? `version ${String(version).replace(/\D/g, '')}` : null };
}

/** Trace les écritures réussies et les connexions, sans jamais bloquer la réponse. */
export function registerAuditTrail(app: FastifyInstance, recorder: RecordAuditEventUseCase): void {
  app.addHook('onResponse', async (request, reply) => {
    const described = describe(request, reply);
    if (!described) return;
    const { projectId } = (request.params ?? {}) as { projectId?: string };
    try {
      await recorder.execute({
        actor: { userId: request.user?.id ?? null, email: described.email ?? null },
        projectId: projectId ?? null,
        action: described.action,
        detail: described.detail ?? null,
        ip: request.ip ?? null,
      });
    } catch (error) {
      request.log.error({ err: error }, "Journal d'audit : enregistrement impossible.");
    }
  });
}
