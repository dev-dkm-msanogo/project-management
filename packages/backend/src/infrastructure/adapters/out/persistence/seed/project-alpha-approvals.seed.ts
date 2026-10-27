import { DocumentApproval, type ApprovalActor, type ApprovalSubject } from '@domain/entities/document-approval';

/**
 * Circuit de validation de démonstration « Projet Alpha », cohérent avec la simulation au
 * 28 février 2025 : le chef de projet (Mamadou Ba, compte éditeur) soumet, la sponsor (Awa Diop,
 * compte administrateur, seule valideuse désignée) approuve. Les exigences, en cours de recueil,
 * restent en brouillon.
 */
export const ALPHA_APPROVERS: Record<string, readonly string[]> = { 'project-alpha': ['u-admin'] };

const PROJECT_MANAGER: ApprovalActor = { id: 'u-editor', name: 'Mamadou Ba' };
const SPONSOR: ApprovalActor = { id: 'u-admin', name: 'Awa Diop' };

const at = (day: string, time: string): Date => new Date(`${day}T${time}:00Z`);

function approved(subject: ApprovalSubject, submittedOn: string, approvedOn: string, comment: string): DocumentApproval {
  return DocumentApproval.fromEvents('project-alpha', subject, [
    { type: 'SUBMITTED', revision: 1, at: at(submittedOn, '09:00'), by: PROJECT_MANAGER, comment: null },
    { type: 'APPROVED', revision: 1, at: at(approvedOn, '16:00'), by: SPONSOR, comment },
  ]);
}

export function buildProjectAlphaApprovals(): DocumentApproval[] {
  return [
    approved('BUSINESS_CASE', '2024-12-16', '2024-12-20', 'Option 2 retenue, financement sur le budget DSI 2025.'),
    approved('BENEFITS_PLAN', '2024-12-16', '2024-12-20', 'Indicateurs et responsables validés.'),
    approved('CHARTER', '2025-01-18', '2025-01-20', 'Projet autorisé.'),
    approved(
      'PROJECT_MANAGEMENT_PLAN',
      '2025-02-12',
      '2025-02-14',
      'Plan et références de base approuvés en comité de pilotage.',
    ),
  ];
}
