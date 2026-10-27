import { createContext, useContext } from 'react';
import type { ProjectRecordDto } from '@shared/index';

/** Projet courant (méthodologie comprise), fourni par l'application aux pages du projet. */
export const CurrentProjectContext = createContext<ProjectRecordDto | null>(null);

/** Projet courant ; `null` hors projet ou pendant le chargement de la liste. */
export const useCurrentProject = () => useContext(CurrentProjectContext);
