import { ChangeLog } from '@domain/entities/change-log';
import type { DeliverablesRegister } from '@domain/entities/deliverables-register';
import type { ProjectPlan } from '@domain/entities/project-plan';
import { compareWbs, type WbsDictionary } from '@domain/entities/wbs-dictionary';
import { DomainError } from '@domain/errors/domain-errors';
import { deliverablesToInput } from '@application/mappers/deliverables.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import { loadOrEmpty } from '@application/use-cases/load-or-empty';
import type { DeliverableDto, DeliverableStage, DeliverablesDto, ProjectPlanDto, TaskDto } from '@shared/index';

interface DeliverablesSources {
  plans: ProjectPlanRepository;
  /** Lecture de la WBS avec l'avancement saisi (pourcentages agrégés). */
  planDto: (plan: ProjectPlan) => Promise<ProjectPlanDto>;
  dictionaries: ProjectDocumentRepository<WbsDictionary>;
  changeLogs: ProjectDocumentRepository<ChangeLog>;
}

function stageOf(task: TaskDto | undefined, record: DeliverableDto['verification'] | null, decision: DeliverableDto['acceptance']): DeliverableStage {
  if (decision) return decision.decision;
  if (record) return 'VERIFIED';
  if (!task) return 'PLANNED';
  if (task.status === 'COMPLETE' || task.percentComplete >= 100) return 'COMPLETED';
  return task.status === 'NOT_STARTED' && task.percentComplete === 0 ? 'PLANNED' : 'IN_PROGRESS';
}

/**
 * Registre des livrables : les livrables sont les éléments de la WBS dont la fiche du dictionnaire
 * désigne un livrable clé ; leur production se lit dans l'avancement de la WBS, le registre ne
 * consigne que la vérification et la décision d'acceptation.
 */
export function deliverablesServices(sources: DeliverablesSources) {
  return {
    toDto: async (register: DeliverablesRegister): Promise<DeliverablesDto> => {
      const [plan, dictionary] = await Promise.all([
        sources.plans.findByProjectId(register.projectId),
        sources.dictionaries.findByProjectId(register.projectId),
      ]);
      const tasks = new Map((plan ? (await sources.planDto(plan)).tasks : []).map((task) => [task.wbs, task]));
      const designated = (dictionary?.entries ?? []).filter((entry) => entry.keyDeliverable.trim());
      const codes = [...new Set([...designated.map((entry) => entry.wbsCode), ...register.records.map((record) => record.wbsCode)])];
      const records = new Map(deliverablesToInput(register).records.map((record) => [record.wbsCode, record]));

      const deliverables = codes.sort(compareWbs).map((wbsCode): DeliverableDto => {
        const task = tasks.get(wbsCode);
        const entry = designated.find((item) => item.wbsCode === wbsCode);
        const record = records.get(wbsCode) ?? { wbsCode, verification: null, acceptance: null };
        return {
          ...record,
          name: task?.name ?? wbsCode,
          deliverable: entry?.keyDeliverable ?? '',
          acceptanceCriteria: entry?.acceptanceCriteria ?? '',
          responsibleId: entry?.responsibleId ?? null,
          plannedFinish: task?.end ?? null,
          status: task?.status ?? 'NOT_STARTED',
          percentComplete: task?.percentComplete ?? 0,
          stage: stageOf(task, record.verification, record.acceptance),
        };
      });
      const count = (...stages: DeliverableStage[]) => deliverables.filter((item) => stages.includes(item.stage)).length;
      return {
        projectId: register.projectId,
        deliverables,
        summary: {
          total: deliverables.length,
          inProduction: count('PLANNED', 'IN_PROGRESS'),
          toVerify: count('COMPLETED'),
          awaitingAcceptance: count('VERIFIED'),
          accepted: count('ACCEPTED'),
          rejected: count('REJECTED'),
        },
      };
    },

    beforeSave: async (register: DeliverablesRegister): Promise<void> => {
      const [plan, changeLog] = await Promise.all([
        sources.plans.findByProjectId(register.projectId),
        loadOrEmpty(sources.changeLogs, register.projectId, ChangeLog.empty),
      ]);
      const known = new Set((plan?.tasks ?? []).map((task) => task.wbs.value));
      const unknownWbs = register.records.map((record) => record.wbsCode).filter((code) => !known.has(code));
      if (unknownWbs.length > 0) {
        throw new DomainError(`Livrable(s) absent(s) de la WBS de l'échéancier : ${unknownWbs.join(', ')}.`);
      }
      const unknownChanges = register.unknownChangeCodes(changeLog.requests.map((request) => request.code));
      if (unknownChanges.length > 0) {
        throw new DomainError(`Demande(s) absente(s) du registre des modifications : ${unknownChanges.join(', ')}.`);
      }
    },
  };
}
