import { DomainError } from '@domain/errors/domain-errors';
import { requiredText } from '@domain/value-objects/register-rules';

export const RESOURCE_KINDS = ['INTERNAL', 'EXTERNAL'] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SKILLS = 20;

export interface DirectoryResourceProps {
  id: string;
  name: string;
  kind: ResourceKind;
  jobTitle: string;
  department: string;
  email: string | null;
  skills: readonly string[];
  userId: string | null;
  active: boolean;
}

/**
 * Ressource du référentiel de l'organisation (agent interne ou prestataire), mobilisable
 * par les projets. Coordonnées strictement professionnelles (RGPD).
 */
export class DirectoryResource {
  private constructor(readonly props: Readonly<DirectoryResourceProps>) {}

  static create(params: DirectoryResourceProps): DirectoryResource {
    const name = requiredText(params.name, 'Le nom de la ressource est requis.');
    if (!(RESOURCE_KINDS as readonly string[]).includes(params.kind)) {
      throw new DomainError(`Type de ressource invalide pour « ${name} ».`);
    }
    const email = params.email?.trim().toLowerCase() || null;
    if (email && !EMAIL_PATTERN.test(email)) {
      throw new DomainError(`Adresse e-mail invalide pour « ${name} ».`);
    }
    // Compétences sans doublon, casse ignorée (la première orthographe est conservée).
    const skills = params.skills
      .map((skill) => skill.trim())
      .filter((skill, index, all) => skill && all.findIndex((other) => other.toLowerCase() === skill.toLowerCase()) === index);
    if (skills.length > MAX_SKILLS) {
      throw new DomainError(`« ${name} » : ${MAX_SKILLS} compétences au plus.`);
    }

    return new DirectoryResource(
      Object.freeze({
        id: requiredText(params.id, "L'identifiant de la ressource est requis."),
        name,
        kind: params.kind,
        jobTitle: params.jobTitle.trim(),
        department: params.department.trim(),
        email,
        skills,
        userId: params.userId?.trim() || null,
        active: params.active,
      }),
    );
  }

  get id(): string {
    return this.props.id;
  }
}
