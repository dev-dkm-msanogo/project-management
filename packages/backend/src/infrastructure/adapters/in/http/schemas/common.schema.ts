import { z } from 'zod';

/** Briques de validation partagées par les corps de requête (DRY). */

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format YYYY-MM-DD');
export const scale = z.number().int().min(1).max(5);
export const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max);
export const optionalText = (max: number) => z.string().trim().max(max).nullable();
export const entryCode = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^[A-Za-z0-9-]+$/, 'Code invalide (lettres, chiffres, tirets).');
export const text = (max: number) => z.string().trim().max(max);
/** Ressource du référentiel, désignée par son identifiant (choisie, jamais saisie). */
export const resourceId = (message: string) => requiredText(100, message);
/** Ressource facultative : « » quand elle n'est pas précisée. */
export const optionalResourceId = z.string().trim().max(100);
/** Liste à puces : un élément par ligne. */
export const lines = z.array(z.string().trim().max(500)).max(50);
