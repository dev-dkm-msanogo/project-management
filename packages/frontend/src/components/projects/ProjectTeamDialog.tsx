import { useEffect, useState } from 'react';
import type { ProjectCandidateDto, ProjectMethodology, ProjectRole } from '@shared/index';
import { fetchProjectTeam, saveProjectTeam } from '@/api/project-client';
import { SelectInput } from '@/components/form/controls';
import { Dialog, useAsyncAction } from '@/components/ui/Dialog';
import { useProjectResource } from '@/hooks/useProjectResource';
import { PROJECT_ROLE_LABELS } from '@/lib/admin-format';

interface ProjectTeamDialogProps {
  project: { id: string; name: string; access: ProjectRole; methodology: ProjectMethodology };
  onClose: () => void;
}

type DraftMember = ProjectCandidateDto & { role: ProjectRole };

const ROLE_OPTIONS = (Object.keys(PROJECT_ROLE_LABELS) as ProjectRole[]).map((value) => ({
  value,
  label: PROJECT_ROLE_LABELS[value],
}));

/**
 * Équipe d'un projet : consultée par ses membres, gérée par le chef de projet. Seuls les membres (et
 * les administrateurs) voient le projet. En hybride et en agile, un membre qui rédige peut être
 * désigné Product Owner : il priorise le carnet et accepte les éléments.
 */
export function ProjectTeamDialog({ project, onClose }: ProjectTeamDialogProps) {
  const team = useProjectResource(project.id, fetchProjectTeam);
  const manages = project.access === 'MANAGER';
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [adding, setAdding] = useState({ userId: '', role: 'CONTRIBUTOR' as ProjectRole });
  const [productOwnerId, setProductOwnerId] = useState<string | null>(null);
  const iterative = project.methodology !== 'PREDICTIVE';
  // Le Product Owner rédige : un membre retiré ou passé lecteur ne l'est plus.
  const owner = members.find((member) => member.userId === productOwnerId && member.role !== 'READER') ?? null;
  const [busy, error, save] = useAsyncAction(async () => {
    await saveProjectTeam(project.id, {
      members: members.map(({ userId, role }) => ({ userId, role })),
      productOwnerId: owner?.userId ?? null,
    });
    onClose();
  });

  useEffect(() => {
    if (!team.data) return;
    setMembers(team.data.members.map(({ userId, name, email, role }) => ({ userId, name, email, role })));
    setProductOwnerId(team.data.productOwnerId);
  }, [team.data]);

  const chosen = new Set(members.map((member) => member.userId));
  const candidates = [...(team.data?.candidates ?? []), ...(team.data?.members ?? [])].filter(
    (candidate, index, all) => !chosen.has(candidate.userId) && all.findIndex((other) => other.userId === candidate.userId) === index,
  );
  const add = () => {
    const candidate = candidates.find((item) => item.userId === adding.userId);
    if (!candidate) return;
    setMembers((current) => [...current, { userId: candidate.userId, name: candidate.name, email: candidate.email, role: adding.role }]);
    setAdding((value) => ({ ...value, userId: '' }));
  };
  const update = (userId: string, role: ProjectRole) =>
    setMembers((current) => current.map((member) => (member.userId === userId ? { ...member, role } : member)));

  return (
    <Dialog open title={`Équipe du projet « ${project.name} »`} variant="drawer" onClose={onClose}>
      <div className="dialog__body">
        <p className="dialog__message">
          Seuls les membres voient le projet. Le chef de projet gère l'équipe et rédige, le contributeur rédige, le
          lecteur consulte. Les administrateurs voient tous les projets.
        </p>
        {team.loading && <p className="app__status">Chargement de l'équipe…</p>}
        {team.error && <p className="app__status app__status--error">{team.error}</p>}
        {team.data && (
          <ul className="team-list">
            {members.map((member) => (
              <li key={member.userId} className="team-list__item">
                <span className="team-list__who">
                  <strong>{member.name}</strong>
                  <span>{member.email}</span>
                </span>
                {manages ? (
                  <>
                    <SelectInput value={member.role} onChange={(role) => update(member.userId, role)} options={ROLE_OPTIONS} />
                    <button
                      type="button"
                      className="btn btn--icon"
                      aria-label={`Retirer ${member.name} de l'équipe`}
                      onClick={() => setMembers((current) => current.filter((item) => item.userId !== member.userId))}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="team-list__role">{PROJECT_ROLE_LABELS[member.role]}</span>
                )}
              </li>
            ))}
            {members.length === 0 && <li className="team-list__empty">Aucun membre : seuls les administrateurs voient ce projet.</li>}
          </ul>
        )}
        {team.data && (iterative || owner) && (
          <div className="team-owner">
            <label className="field">
              <span className="field__label">Product Owner</span>
              {manages ? (
                <select
                  className="form-input"
                  value={owner?.userId ?? ''}
                  onChange={(event) => setProductOwnerId(event.target.value || null)}
                >
                  <option value="">Aucun : le chef de projet priorise et accepte</option>
                  {members
                    .filter((member) => member.role !== 'READER')
                    .map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name}
                      </option>
                    ))}
                </select>
              ) : (
                <span className="field__static">{owner?.name ?? 'Aucun : le chef de projet priorise et accepte'}</span>
              )}
              <span className="field__hint">
                Il ordonne et priorise le carnet de produit, accepte ou refuse les éléments ; l'équipe estime et fait
                avancer le travail.
              </span>
            </label>
          </div>
        )}
        {manages && team.data && (
          <div className="team-add">
            <select
              className="form-input"
              aria-label="Compte à ajouter"
              value={adding.userId}
              onChange={(event) => setAdding((value) => ({ ...value, userId: event.target.value }))}
            >
              <option value="">Ajouter un compte…</option>
              {candidates.map((candidate) => (
                <option key={candidate.userId} value={candidate.userId}>
                  {candidate.name} · {candidate.email}
                </option>
              ))}
            </select>
            <SelectInput value={adding.role} onChange={(role) => setAdding((value) => ({ ...value, role }))} options={ROLE_OPTIONS} />
            <button type="button" className="btn btn--ghost" onClick={add} disabled={!adding.userId}>
              Ajouter
            </button>
          </div>
        )}
        {error && (
          <p className="editor__error" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="dialog__footer">
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
          {manages ? 'Annuler' : 'Fermer'}
        </button>
        {manages && (
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy || !team.data}>
            {busy ? 'En cours…' : "Enregistrer l'équipe"}
          </button>
        )}
      </footer>
    </Dialog>
  );
}
