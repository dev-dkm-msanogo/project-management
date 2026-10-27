import type { Role } from '@domain/value-objects/role';
import type {
  ApprovalAction,
  ApprovalSnapshotDto,
  ApprovalSubject,
  ChangeDecisionInput,
  ChangeLogDto,
  PendingApprovalDto,
  ProjectApprovalsDto,
  ProjectApproverDto,
  SourceSelectionAwardInput,
  SourceSelectionsDto,
} from '@shared/index';

/** Ports ENTRANTS du circuit de validation. */

export interface ApprovalActor {
  id: string;
  role: Role;
}

/** États de validation des documents du projet et actions permises à l'utilisateur. */
export interface GetProjectApprovalsUseCase {
  execute(query: { projectId: string; actor: ApprovalActor }): Promise<ProjectApprovalsDto>;
}

/** Soumettre, retirer, approuver, rejeter ou réviser un document. */
export interface ActOnApprovalUseCase {
  execute(command: {
    projectId: string;
    subject: ApprovalSubject;
    action: ApprovalAction;
    comment: string | null;
    /** Révision du plan de management : demande de modification approuvée qui la justifie. */
    changeRequest?: string | null;
    actor: ApprovalActor;
  }): Promise<ProjectApprovalsDto>;
}

export interface GetApprovalSnapshotUseCase {
  execute(query: { projectId: string; subject: ApprovalSubject; revision: number }): Promise<ApprovalSnapshotDto>;
}

/** Désigner les valideurs d'un projet (administrateurs). */
export interface SetProjectApproversUseCase {
  execute(command: { projectId: string; userIds: string[] }): Promise<ProjectApproverDto[]>;
}

/** Ce qui attend une décision de l'utilisateur, tous projets confondus. */
export interface GetMyApprovalsUseCase {
  execute(query: { actor: ApprovalActor }): Promise<PendingApprovalDto[]>;
}

export interface DecideChangeRequestUseCase {
  execute(command: {
    projectId: string;
    code: string;
    input: ChangeDecisionInput;
    actor: ApprovalActor;
  }): Promise<ChangeLogDto>;
}

export interface AwardSourceSelectionUseCase {
  execute(command: { projectId: string; input: SourceSelectionAwardInput; actor: ApprovalActor }): Promise<SourceSelectionsDto>;
}
