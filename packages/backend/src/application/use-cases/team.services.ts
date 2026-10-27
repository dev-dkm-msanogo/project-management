import type { ProjectCharter } from '@domain/entities/project-charter';
import type { ProjectPlan } from '@domain/entities/project-plan';
import type { ResourceManagementPlan } from '@domain/entities/resource-management-plan';
import type { ResponsibilityMatrix } from '@domain/entities/responsibility-matrix';
import type { TeamAssessment } from '@domain/entities/team-assessment';
import { teamAssessmentToInput } from '@application/mappers/team.mappers';
import type { ProjectDocumentRepository } from '@application/ports/out/project-document.repository';
import type { ProjectPlanRepository } from '@application/ports/out/project-plan.repository';
import type { ProjectPlanDto, TeamDto, TeamMemberDto } from '@shared/index';

interface TeamSources {
  plans: ProjectPlanRepository;
  /** Lecture de la WBS avec l'avancement saisi. */
  planDto: (plan: ProjectPlan) => Promise<ProjectPlanDto>;
  charters: ProjectDocumentRepository<ProjectCharter>;
  resourcePlans: ProjectDocumentRepository<ResourceManagementPlan>;
  responsibilityMatrices: ProjectDocumentRepository<ResponsibilityMatrix>;
}

const earliest = (dates: (string | null)[]) => dates.filter((date): date is string => date !== null).sort()[0] ?? null;
const latest = (dates: (string | null)[]) => dates.filter((date): date is string => date !== null).sort().at(-1) ?? null;

/**
 * Équipe du projet : relue dans les documents qui désignent des personnes (charte, plan des
 * ressources, RACI) et dans les affectations de la WBS, jamais ressaisie. Seule l'évaluation de la
 * performance de l'équipe est rédigée.
 */
export function teamServices(sources: TeamSources) {
  return {
    toDto: async (assessment: TeamAssessment): Promise<TeamDto> => {
      const { projectId } = assessment;
      const [plan, charter, resourcePlan, matrix] = await Promise.all([
        sources.plans.findByProjectId(projectId),
        sources.charters.findByProjectId(projectId),
        sources.resourcePlans.findByProjectId(projectId),
        sources.responsibilityMatrices.findByProjectId(projectId),
      ]);
      const roles = new Map<string, string[]>();
      const addRole = (resourceId: string | null | undefined, role: string) => {
        if (!resourceId) return;
        const held = roles.get(resourceId) ?? [];
        if (role && !held.some((item) => item.toLowerCase() === role.toLowerCase())) held.push(role);
        roles.set(resourceId, held);
      };
      // La charte nomme le chef de projet ; la WBS ne le désigne qu'en son absence.
      addRole(charter ? charter.props.projectManager.resourceId : plan?.managerId, 'Chef de projet');
      addRole(charter?.props.sponsor.resourceId, 'Sponsor');
      for (const item of resourcePlan?.props.roles ?? []) addRole(item.holderId, item.role);
      for (const participant of matrix?.props.participants ?? []) addRole(participant.resourceId, participant.role);

      const tasks = plan ? (await sources.planDto(plan)).tasks.filter((task) => task.isLeaf && task.assigneeId) : [];
      for (const task of tasks) addRole(task.assigneeId, '');

      const members = [...roles].map(([resourceId, held]): TeamMemberDto => {
        const assigned = tasks.filter((task) => task.assigneeId === resourceId);
        return {
          resourceId,
          roles: held,
          assignments: assigned.map(({ wbs, name, start, end, status, percentComplete, overdue }) => ({
            wbs,
            name,
            start,
            end,
            status,
            percentComplete,
            overdue,
          })),
          start: earliest(assigned.map((task) => task.start)),
          end: latest(assigned.map((task) => task.end)),
          workloadDays: assigned.reduce((sum, task) => sum + (task.durationDays ?? 0), 0),
          openTasks: assigned.filter((task) => task.status !== 'COMPLETE').length,
          overdueTasks: assigned.filter((task) => task.overdue).length,
        };
      });
      return { projectId, ...teamAssessmentToInput(assessment), members };
    },
  };
}
