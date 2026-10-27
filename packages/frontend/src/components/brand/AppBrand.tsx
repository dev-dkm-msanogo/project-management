import { BrandLogo } from '@/components/brand/BrandLogo';

interface AppBrandProps {
  /** Bloc BEM : ses éléments s'appellent `<className>-logo` et `<className>-app`. */
  className: string;
}

/** Logo de l'entreprise suivi du nom de l'application (menu latéral, écrans de connexion). */
export function AppBrand({ className }: AppBrandProps) {
  return (
    <div className={className}>
      <BrandLogo className={`${className}-logo`} />
      <span className={`${className}-app`}>Gestion de projet</span>
    </div>
  );
}
