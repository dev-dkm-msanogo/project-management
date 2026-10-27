# Gestion & Reporting de Projet — PMP

Application de gestion et de reporting de projet alignée sur le référentiel **PMP (PMBOK)**,
pour la DSI de Dakar Mobilité. Interface en français, montants en **FCFA**.

## Fonctionnalités

- **Multi-projet** : registre des projets (création, ouverture, suppression en cascade).
- **Business case** (Démarrage, template PMI) : besoin métier, alignement stratégique, analyse
  de la situation, alternatives (une seule retenue, avec motif), solution recommandée, synthèse
  financière sur 3 ans en FCFA (totaux et bénéfice net calculés), risques clés, recommandation.
- **Plan de gestion des bénéfices** : bénéfices visés, calendrier de réalisation et indicateurs
  (situation de départ, cible, responsable), hypothèses, risques et gouvernance de revue.
- **Matrice RACI** : participants × activités ; un seul « A » par activité, activités sans « A »
  ou sans « R » signalées.
- **Charte du projet** (Démarrage), alignée sur le template PMI « Project Charter » : date,
  sponsor, chef de projet, client, objet, description de haut niveau, périmètre inclus / exclu,
  livrables, exigences de haut niveau, risque global (niveau et domaines), objectifs par rubrique
  (périmètre, délai, coût, autre) avec critères de succès, jalons, budget pré-approuvé et sa source,
  critères de clôture, autorités du chef de projet (personnel, budget, technique, conflits) et du
  sponsor. Signatures tirées du circuit de validation (le chef de projet signe en soumettant, le
  valideur en approuvant) ; soumettre exige toutes les rubriques. Parties prenantes, contraintes et
  hypothèses sont tirées en direct des registres.
- **Hypothèses et contraintes** (template « Assumption Log ») : catégorie, responsable, échéance,
  actions, statut, commentaires ; une hypothèse invalidée se rattache à un risque existant du
  registre des risques (vérifié par le serveur).
- **Registre des parties prenantes** (template « Stakeholder Register ») : rôle, contact
  professionnel facultatif, exigences, attentes, classification pouvoir / intérêt (pouvoir élevé à
  partir de 4, intérêt à partir de 3, comme le template) et matrice d'évaluation de l'engagement.
  RGPD : jamais de coordonnées personnelles, seulement un e-mail professionnel, une boîte de
  service ou un canal. Page en trois onglets : registre compact (identité, rôle, classification,
  engagement actuel → souhaité, contact ; exigences, attentes et actions d'engagement dépliables ;
  filtre par quadrant et recherche sans accents ni casse), évaluation de l'engagement, grille
  pouvoir / intérêt.
- **Questionnaire d'identification** (template « Stakeholder Identification Questionnaire »,
  processus 2) : les 14 questions du template (catalogue partagé, contrôlé par le serveur), une
  réponse libre facultative par question, pour faire émerger les parties prenantes avant de les
  consolider dans le registre.
- **Analyse des parties prenantes** (template « Stakeholder Analysis »), en lecture seule : intérêt
  et influence de chacune, en trois niveaux tirés des échelles du registre (faible de 1 à 2, moyen à 3,
  élevé de 4 à 5, avec les libellés du template), et attitude = engagement actuel du registre ; tri
  par influence puis intérêt ; synthèse favorables / neutres / réfractaires ou non informées.
- **Cartographie des parties prenantes** (template « Stakeholder Mapping and Representation ») : pour
  chaque partie prenante du registre (vérifié par le serveur, une seule fois), urgence, légitimité et
  direction d'influence (vers le haut, latérale, vers l'extérieur, vers le bas). Le pouvoir est relu
  dans le registre (élevé à partir de 4, comme la grille) ; le serveur calcule la catégorie du modèle
  de saillance (définitive, dominante, dépendante, dangereuse, dormante, discrétionnaire, exigeante).
  Trois onglets : diagramme de saillance et tableau des catégories, directions d'influence autour du
  chef de projet, grille pouvoir / intérêt ; les parties prenantes non cartographiées sont signalées.
- **Plans de gestion du périmètre et des exigences** (Planification, templates PMI) : rédaction
  section par section (WBS, dictionnaire, référence, acceptation, intégration ; recueil, analyse,
  catégories, priorisation, indicateurs, traçabilité, suivi, validation, configuration). Les
  sections de chaque plan viennent d'un catalogue partagé, contrôlé par le serveur.
- **Exigences et traçabilité** (templates « Requirements Documentation » et « Requirements
  Traceability Matrix ») : exigences métier, parties prenantes, fonctionnelles, non fonctionnelles,
  transition et projet ; priorité MoSCoW, critères d'acceptation, vérification, statut. Trois vues :
  documentation, matrice de traçabilité (objectif métier, livrable, vérification, validation) et
  couverture des besoins par les exigences de solution. Règles serveur : une exigence vérifiée a
  des critères et une méthode de vérification ; seule une exigence de solution satisfait un besoin
  du registre. Indicateurs calculés (besoins non couverts, Must/Should sans vérification…).
- **Énoncé du périmètre** (template « Project Scope Statement ») : description, livrables
  détaillés, critères d'acceptation du produit, exclusions ; prérempli depuis la charte à la
  création ; contraintes et hypothèses tirées en direct du registre.
- **Plan de gestion de l'échéancier** (template PMI, même catalogue que les plans de périmètre,
  d'exigences et financier) : méthode d'ordonnancement, outils, exactitude, unités, seuils d'écart,
  reporting, procédures, mises à jour.
- **Dictionnaire de la WBS** (template « WBS Dictionary », processus 6) : une fiche par élément de
  la WBS de l'échéancier (vérifié par le serveur, une seule fiche par élément) : travail, responsable,
  livrable clé, hypothèses, jalons datés, exigences de qualité, critères d'acceptation, informations
  techniques et contractuelles. Intitulé, effort (activités du modèle d'ordonnancement rattachées à
  l'élément ou à ses descendants) et coûts (estimations des coûts) sont relus à chaque lecture.
- **Modèle d'ordonnancement** (templates « Activity List », « Activity Attributes », « Duration
  Estimates », « Duration Estimating Worksheet », « Milestone List », « Project Calendar », « Project
  Schedule Network Diagram » et « Schedule Baseline », processus 9), en quatre pages qui partagent un
  même document. **Échéancier unifié** : le réseau d'activités fixe les dates de la WBS (voir « Plan de
  projet »).
  - *Activités et durées* : liste (élément de la WBS existant, responsable, effort, durée retenue,
    prédécesseurs), attributs (ressources, compétences, type d'effort, lieu, contraintes,
    hypothèses), estimations des durées et feuille d'estimation par méthode (analogue : référence ×
    coefficient ; paramétrique : effort ÷ ressources × heures × disponibilité × facteur ; trois
    points : (O + 4M + P) ÷ 6, avec O ≤ M ≤ P), durée calculée affichée en direct à l'édition.
  - *Réseau du projet* : relations fin-début, début-début, fin-fin et début-fin avec avance ou
    décalage ; le serveur rejette les boucles (en nommant les activités en cause) et calcule, en
    jours ouvrés du calendrier, dates au plus tôt et au plus tard, marge totale et chemin critique.
    Diagramme en colonnes par rang, chemin critique en rouge.
  - *Jalons et calendrier* : jalons majeurs et revues de phase (signalés s'ils tombent un jour non
    ouvré), jours ouvrés de la semaine, jours fériés (uniques), notes.
  - *Référence de l'échéancier* : objet, composants, début et fin du réseau, approbations datées (le
    chef de projet après la préparation, le sponsor après le chef de projet). Le plan de management
    du projet y renvoie.
- **Plan de gestion de la qualité** (template « Quality Management Plan », processus 26) : normes,
  objectifs qualité mesurables (objectif et mesure obligatoires), rôles uniques, livrables (repris de
  l'énoncé du périmètre en un clic) et processus soumis à revue, assurance et contrôle, procédures.
- **Métriques qualité** (template « Quality Metrics », processus 26) : élément mesuré, métrique,
  méthode de mesure et cible ; codes uniques.
- **Rapport qualité** (template « Quality Report ») : période, statut de chaque métrique (conforme, à
  risque, hors cible, non démarrée ; la métrique doit exister, intitulé et cible relus à chaque
  lecture ; métriques sans statut signalées), synthèse des anomalies (les ouvertes par sévérité doivent
  égaler les enregistrées moins les résolues, contrôle affiché en direct à l'édition), recommandations,
  constats d'audit. Création préremplie avec une ligne par métrique.
- **Outils d'analyse qualité** (templates « Affinity Diagram », « Cause and Effect Diagram »,
  « Flowchart »), une page en trois onglets qui partagent un document, chaque onglet éditant son outil :
  diagramme d'affinités (thèmes et idées uniques), analyses des causes et effets en arête de poisson
  (catégories des 6 M proposées), logigrammes (un début, une fin, décisions dont le « Non » mène à une
  autre étape, dessinée en boucle, ou à une issue décrite ; étapes réordonnables).
- **Plan de gestion des risques** (template « Risk Management Plan », processus 16) : stratégie,
  méthodologie, rôles, structure de découpage des risques bâtie sur les catégories du registre (avec
  le nombre de risques de chacune), financement et règles de la réserve, calendrier, tolérances,
  suivi, définitions des 5 niveaux de probabilité et d'impact (périmètre, qualité, délai, coût),
  matrice probabilité × impact du registre.
- **Plan de gestion financière** (template PMI) : unités, précision, exactitude, financement,
  seuils de contrôle, mesure de la performance, reporting, réserves, conformité, procédures.
- **Stratégie de financement** (template « Funding Strategy », processus 10) : source des fonds et
  autorité, financement approuvé (montant = budget de la charte, relu à chaque lecture), tranches
  datées (une par date, rangées par date, montants entiers en FCFA, part du budget), mécanisme de
  déblocage, catégories de coûts (part du budget), risques de financement et parades.
- **Besoins de financement** (template « Project Funding Requirements », processus 12), calculés et en
  lecture seule : chaque tranche de la stratégie face à la dépense cumulée prévue par la référence des
  coûts jusqu'au déblocage suivant (au mois près ; la dernière couvre tous les coûts directs), avec
  l'excédent et les tranches insuffisantes signalées ; réserve de management sur demande ; financement
  total requis (référence des coûts + réserve). Graphique en escalier (fonds disponibles) face à la
  courbe de dépense, avec la référence des coûts et le total requis en repères.
- **Estimations des coûts** (templates « Activity Cost Estimates » et « Basis of Estimates ») :
  coût de chaque activité (main-d'œuvre, coûts physiques), méthode (analogue, paramétrique, trois
  points, ascendante), fourchette et confiance ; base de l'estimation détaillée par méthode avec
  montant calculé par le serveur ; synthèse narrative. Cascade : coûts directs + réserve pour aléas =
  référence des coûts (BAC) ; + réserve de management = financement total requis, comparé au budget
  de la charte.
- **Référence des coûts** (template « Cost Baseline »), calculée et en lecture seule : chaque activité
  est répartie par mois selon les dates de sa tâche dans l'échéancier (code WBS, ou son plus proche
  ancêtre daté), d'où la valeur planifiée mensuelle, le cumul et la courbe en S ; les activités sans
  tâche datée sont signalées « non réparties ».
- **Besoins en ressources** (templates « Resource Requirements », « Resource Breakdown Structure »,
  « Resource Basis of Estimates ») : personnes et ressources physiques par catégorie (quantité, niveau ou
  qualité, hypothèses) ; la structure de découpage des ressources (RBS) en est déduite ; base des
  estimations rédigée.
- **Plan de gestion des ressources** (template PMI) : rôles, responsabilités et autorité, organigramme
  déduit des rattachements (rôle existant, sans boucle, vérifié par le serveur), acquisition, libération,
  formation, reconnaissance, développement de l'équipe, gestion des ressources physiques ; l'équipe et les
  ressources physiques sont lues en direct dans les besoins en ressources.
- **Charte de l'équipe** (template « Team Charter ») : valeurs, règles de réunion et de communication,
  prise de décision, résolution des conflits, autres accords, signatures (jamais avant la préparation).
- **Plan d'engagement des parties prenantes** (templates « Stakeholder Engagement Plan » et
  « Engagement Assessment Matrix ») : la matrice actuel / souhaité est lue en direct dans le registre
  des parties prenantes ; pour chacune, approche, besoins d'information, fréquence, moyen et méthode
  (diffusion, mise à disposition, échange interactif) ; évolutions attendues et relations. Les
  approches visent une partie prenante du registre (vérifié par le serveur) ; celles à faire
  progresser sans approche sont signalées ; à la création, le plan reprend la stratégie du registre.
- **Plan de communication** (template « Communications Management Plan ») : destinataire,
  information, moyen, fréquence, émetteur (suggestions issues du registre et du référentiel des
  ressources) ; hypothèses, contraintes et glossaire (terme unique).
- **Plan de gestion des approvisionnements** (template « Procurement Management Plan ») : calendrier
  des activités d'achat (rangé par date), intégration au périmètre, à l'échéancier, à la
  documentation, aux risques et aux rapports ; rôles (uniques), indicateurs de performance des
  fournisseurs, juridiction, estimations indépendantes, gestion des risques, fournisseurs
  présélectionnés (uniques). Ses contraintes et hypothèses sont lues en direct dans le registre
  (catégorie « Approvisionnements »).
- **Stratégie d'approvisionnement** (template « Procurement Strategy ») : méthode de livraison,
  faire ou acheter, types de contrat retenus (FFP, FPIF, FP-EPA, CPFF, CPIF, CPAF, régie, autre :
  chacun une fois, justifié, avec qui porte le risque), intéressement et pénalités, cycle d'achat
  (phases uniques, critères d'entrée et de sortie, livrables), transfert de connaissances.
- **Sélection des fournisseurs** (template « Source Selection Criteria ») : une grille par achat ;
  critères pondérés (entiers, total 100 %), chaque candidat noté de 1 à 5 ; le serveur calcule le
  score pondéré (sur 500) et le ou les candidats en tête. Candidats suggérés depuis les fournisseurs
  présélectionnés du plan.
- **Plan de management du projet** (modèle de plan intégré) : version, statut et date d'approbation
  tirés du circuit de validation, chef de projet et sponsor lus dans la charte.
  Synthèse des 18 composants avec leur état lu en direct (plans de gestion, références de base) et un
  accès direct ; références du périmètre, de l'échéancier et des coûts, et référence de mesure de la
  performance calculée (budget des activités par élément de 1er niveau de la WBS, dates de
  l'échéancier, réserve pour aléas, BAC ; réserve de management hors référence). Rédigés dans le plan :
  cycle de vie (phases uniques et revues de passage), approche de développement (prédictive,
  adaptative, hybride), gestion des modifications, gestion de la configuration.
- **Registre des leçons apprises** (templates « Lessons Learned Register » et « … – Final », processus
  28, alimenté par 40) : catégorie (phase ou domaine), date, situation, leçon formulée comme une
  pratique, explication, porteur, commentaires ; pratiques récurrentes qui regroupent des leçons du
  registre (vérifié) ; date de transfert au référentiel de l'organisation à la clôture, jamais avant
  la dernière leçon. Filtre par catégorie.
- **Journal des problèmes** (template « Issue Log », processus 27, alimenté par 30) : type, description,
  priorité, impact sur les objectifs, responsable, date de signalement, statut (ouvert, en cours,
  escaladé, résolu), résolution datée (obligatoire une fois résolu, jamais avant le signalement),
  commentaires ; lien facultatif vers le risque concrétisé et la demande de modification, vérifiés
  dans leurs registres (intitulés relus à chaque lecture). Synthèse : à traiter, prioritaires,
  escaladés, résolus, délai moyen de résolution ; onglets « À traiter » et « Résolus ».
- **Livrables** (processus 27, alimenté par 32) : les éléments de la WBS dont la fiche du dictionnaire
  nomme un livrable clé, avec leurs critères d'acceptation, leur fin prévue et leur avancement relus
  dans la WBS ; le registre consigne la vérification (date, vérificateur, contrôles) puis la décision
  d'acceptation (acceptée ou refusée, datée, par une ressource du référentiel ; motif obligatoire pour
  un refus, demande de modification facultative vérifiée dans son registre). On ne décide que sur un
  livrable vérifié, jamais avant sa vérification. Étapes : prévu, en production, à vérifier, en
  attente d'acceptation, accepté, refusé. Un élément de la WBS ou une demande cités ne se retirent pas.
- **Équipe et affectations** (processus 22, alimenté par 23) : l'équipe relue dans le projet, jamais
  ressaisie — chef de projet et sponsor (charte), rôles (plan des ressources, RACI), tâches affectées
  dans la WBS avec leur avancement, période d'affectation, charge et retards. Évaluation de la
  performance de l'équipe (template « Team Performance Assessment ») : neuf critères notés et commentés
  (périmètre, qualité, délais, coûts, communication, collaboration, conflits, décision, moral), axes de
  progression ; évaluations successives dans l'historique des versions. Pas d'évaluation individuelle
  (donnée RH personnelle, hors de l'outil projet).
- **Rapport de clôture** (templates « Final Report » et « Final Product / Service / Result
  Transition », processus 40) : description, bilan des objectifs, écarts de délai et de coût (relus :
  fin de la référence, fin réelle ou prévue, coût réel, budget, estimation à l'achèvement, réserves),
  bénéfices à la clôture (repris du plan de gestion des bénéfices), risques et problèmes encore ouverts
  et leur disposition, livrables acceptés, leçons apprises ; transition vers l'exploitation
  (destinataires, éléments remis, formations, support, éléments reportés) et son acceptation datée.
  Soumis au circuit de validation : la version approuvée fige ces faits et **clôt le projet**.
- **Méthodologie du projet** : choisie à la création (prédictive, hybride ou agile) et modifiable par le
  chef de projet ; elle adapte le menu. Prédictive : WBS, dictionnaire, activités, réseau, Gantt,
  références de l'échéancier et des coûts, avancement des tâches, valeur acquise, livrables. Agile :
  carnet de produit, itérations, tableau de suivi, vélocité et burndown. Hybride : les deux. Tout le
  reste (démarrage, parties prenantes, exigences, risques, finances, qualité, gouvernance, clôture) est
  commun. Changer de méthodologie masque des menus sans rien supprimer. L'approche de développement du
  plan de management lit cette méthodologie (elle ne s'y saisit plus).
- **Module agile** : carnet de produit (épopées, récits, anomalies, éléments techniques ; priorité
  MoSCoW, estimation en points de Fibonacci, critères d'acceptation, exigence satisfaite, ordre de
  priorité modifiable), itérations sans chevauchement (objectif, capacité, revue, rétrospective et
  actions), tableau de suivi (À faire, En cours, En revue, Terminé ; glisser-déposer ou flèches ; « Terminé »
  date l'achèvement), indicateurs (burndown par jour ouvré, vélocité des itérations terminées et
  moyenne des trois dernières, burnup, prévision du nombre d'itérations restantes). La définition de
  « terminé » est celle du plan de management. **Lien hybride** : un élément rattaché à un lot de la
  WBS en fait avancer le travail (points terminés sur points estimés) ; le lot ne se saisit plus à la
  main et la valeur acquise, le portefeuille, les livrables et le rapport de clôture en tiennent compte.
- **Registre des modifications** (templates « Change Log », « Change Request » et « Change Request
  Assessment », processus 39) : chaque demande porte ses catégories, sa description, sa
  justification, ses impacts par domaine (périmètre, qualité, exigences, coût, délai), le risque pour
  les parties prenantes, un coût (FCFA) et un délai chiffrés, les documents à mettre à jour ; une
  évaluation facultative (alternatives, analyse multicritère pondérée, alternative recommandée qui
  doit être évaluée) ; un circuit soumise → en analyse → décidée → mise en œuvre → close. La décision
  (approuver, reporter, rejeter, motivée) est prise par un valideur du projet depuis la fiche de la
  demande, datée du jour et signée de son nom ; elle ne se saisit pas dans le registre, et une demande
  décidée n'y change plus (seuls son statut et ses commentaires évoluent ; seule une demande approuvée
  est mise en œuvre). Synthèse : décisions, délai moyen de décision, coût et délai
  approuvés, réserve pour aléas des estimations des coûts consommée et restante. Page en trois
  écrans : registre, demande, édition d'une demande.
- **Rapport exécutif** : rapport de statut une page (12 sections : RAG, jalons, périmètre,
  planning, coût, risques, décisions, changements, KPIs, prévision), alimenté par le projet et
  recalculé à chaque lecture, à la date du rapport :
  - **Jalons** : jalons de l'échéancier (atteint le, en retard, prochain, à venir).
  - **Périmètre** : registre des exigences (dans le périmètre, à risque, hors périmètre).
  - **Planning** : avancement des tâches élémentaires (dans les délais, à risque, en retard) et SPI.
  - **Coût** : budget de la charte (à défaut, référence des coûts), dépenses réelles, CPI et EAC.
  - **Risques majeurs** : risques ouverts de criticité élevée ou critique (5 au plus).
  - **Décisions** : demandes de modification à décider et problèmes escaladés, puis décisions saisies.
  - **Changements** : demandes connues à la date du rapport ; impact des seules demandes approuvées.
  - **KPIs** : 8 indicateurs calculés (réalisé, SPI, CPI, EAC, tâches en retard, risques critiques,
    problèmes ouverts, exigences vérifiées), puis les indicateurs propres au projet.
  - **Prévision** : fin prévue de la WBS corrigée par le SPI ; la confiance reste saisie.
  - **Statut global** : la pire des dimensions périmètre, délai et coût (seuils d'indice : vert
    ≥ 0,95, ambre ≥ 0,90). Le chef de projet peut l'ajuster, avec une justification (10 caractères
    au moins) publiée dans le rapport à côté du statut calculé.
  Restent saisis : période, déclaration, résumé, décisions et indicateurs hors registres, priorités,
  confiance. L'en-tête signale une période sans mesure d'avancement. Les rapports enregistrés dans
  l'ancien format sont convertis à la lecture.
- **Plan de projet et échéancier unifié** : structure de découpage (WBS) éditable et diagramme de
  Gantt. Les durées, dépendances et contraintes « début au plus tôt » des activités calculent les dates
  (méthode du chemin critique, jours ouvrés du calendrier) ; chaque élément de la WBS qui porte des
  activités en prend les dates (du début de la première à la fin de la dernière), les autres gardent
  leurs dates saisies. Une date saisie qui ne diffère de celle du réseau que par des jours non ouvrés
  (une fin le samedi pour le vendredi) est conservée. Le **Gantt modifiable** montre la WBS, ses
  activités, les jalons, les dépendances et le chemin critique : glisser une activité fixe son début au
  plus tôt, étirer sa fin change sa durée (au clavier : flèches, Maj + flèches) ; le réseau se recalcule
  à l'écran (`POST …/schedule-model/preview`, sans enregistrer) et « Enregistrer l'échéancier » crée une
  seule version. Figé avec le plan de management approuvé (révision nécessaire).
- **Registre des risques** (template « Risk Register », processus 17 à 19, alimenté par 29 et 38) :
  identification ; analyse avec un impact par objectif (périmètre, qualité, délai, coût, échelles du
  plan de gestion des risques), score = probabilité × impact le plus fort, matrice 5 × 5 ; stratégie
  selon le type (menace / opportunité), plan de réponse, déclencheur, risque résiduel (probabilité et
  impact, renseignés ensemble, score résiduel calculé) ; suivi (statut, tendance, échéance, dernière
  revue, commentaires). Page en onglets comme les deux pages du template : identification et analyse,
  réponses et suivi, matrice. Les registres enregistrés avec un impact unique sont convertis à la
  lecture (impact reporté sur les quatre objectifs : score et criticité inchangés).
- **Pilotage du réel** (le projet tel qu'il se déroule, pas seulement tel qu'il est planifié) :
  - **Affectations** : chaque tâche de la WBS est affectée à une personne du référentiel des ressources.
  - **Avancement des tâches** : statut, % réalisé, dates réelles et date de situation de chaque tâche
    élémentaire, saisis par la personne affectée (même avec le rôle Lecteur) ou par un éditeur ; le
    serveur vérifie l'affectation et la cohérence (jamais dans le futur, terminé = 100 % avec dates
    réelles…). Les éléments parents s'agrègent (pondération par les durées) ; WBS et Gantt affichent
    l'avancement, les retards sont signalés.
  - **Mes tâches** : les tâches de l'utilisateur connecté, tous projets confondus, à mettre à jour sur place.
  - **Dépenses réelles** : registre daté des dépenses (main-d'œuvre, coûts physiques) imputées à la WBS.
  - **Valeur acquise** : PV, EV, AC à une date d'état (par défaut la dernière mesure), SPI, CPI, EAC,
    ETC, VAC, TCPI, courbes cumulées et détail par élément de premier niveau ; réserves hors mesure.
  - **Tableau de bord du portefeuille** : santé (statut publié du rapport exécutif), % réalisé (EV / BAC), SPI, CPI,
    budget consommé, tâches en retard, risques critiques, problèmes ouverts et prochain jalon de
    chaque projet.
- **Circuit de validation** : le business case, la charte, le plan de gestion des bénéfices, le
  registre des exigences et le plan de management du projet (validé avec ses plans de gestion et ses
  références de base : énoncé du périmètre, WBS et dictionnaire, modèle d'ordonnancement, estimations
  des coûts, stratégie de financement), ainsi que le rapport de clôture (dont l'approbation clôt le
  projet), passent par brouillon → soumis → approuvé. Le chef de projet
  (éditeur) soumet, retire sa soumission ou ouvre la révision suivante ; un valideur désigné pour le
  projet par un administrateur (même un compte en lecture seule) approuve ou rejette (motif d'au
  moins 10 caractères), jamais sa propre soumission. Une version soumise ou approuvée est figée côté
  serveur (409) ; le suivi reste libre : affectations et statut des tâches de la WBS, jalons atteints,
  avancement et recette des exigences. À l'approbation, les documents sont archivés tels quels : la
  version de référence reste consultable pendant qu'on prépare la suivante. Bandeau de validation sur
  chaque page concernée (état, étapes, historique) ; page « Validations » : ce qui attend votre
  décision (versions soumises, demandes de modification, achats à attribuer), l'état des documents du
  projet et ses valideurs. Les valideurs décident aussi des demandes de modification et attribuent
  les achats (grille alors figée).
- **Saisie protégée** : deux utilisateurs qui modifient le même document ne s'écrasent plus.
  Chaque document porte une version (`ETag` à la lecture, rappelée en `If-Match` à l'enregistrement) :
  un enregistrement fondé sur une version périmée est refusé (409) avec un message invitant à
  recharger. Quitter un éditeur qui contient des saisies non enregistrées (changement de page ou de
  projet, Annuler, déconnexion, fermeture de l'onglet) demande confirmation.
- **Références protégées** : on ne peut pas retirer (ni renommer) une entrée encore citée par un
  autre document du projet — risque cité par les hypothèses ou le journal des problèmes, partie
  prenante citée par le plan d'engagement ou la cartographie, demande citée par le journal des
  problèmes, métrique citée par le rapport qualité, élément de WBS cité par le modèle
  d'ordonnancement ou le dictionnaire. Le refus (409) nomme les entrées qui citent.
- **Registres entrée par entrée** : chaque ligne d'un registre a son bouton « Modifier » (éditeur de
  cette seule entrée, avec « Supprimer »), « + Nouvelle entrée » ouvre une entrée vierge ;
  « Éditer le registre » reste pour les retouches d'ensemble.
- **Suppressions** : un document rédigé (plan, charte, business case…) se supprime en entier ; un
  plan de gestion se supprime sans toucher aux autres. Toute suppression de données enregistrées
  passe par la même confirmation ; retirer une ligne d'un formulaire en cours de saisie reste
  immédiat (rien n'est enregistré avant « Enregistrer »).
- **Projets modifiables** : nom, description et statut (l'identifiant, repris par les documents, ne
  change pas).
- **Authentification et rôles (RBAC)** : le rôle du compte vaut hors projet ; dans un projet, ce
  sont les droits de son rôle dans l'équipe du projet qui s'appliquent.

  | Rôle du compte  | Créer un projet | Tous les projets, supprimer un projet, gérer comptes et référentiel |
  | --------------- | :-------------: | :-----------------------------------------------------------------: |
  | `VIEWER`        |                 |                                                                     |
  | `EDITOR`        |        ✓        |                                                                     |
  | `ADMIN`         |        ✓        |                                  ✓                                  |

- **Membres et rôles par projet** : un projet n'est visible que de ses membres (et des
  administrateurs) ; ailleurs il répond 404, sans révéler son existence. Le chef de projet gère
  l'équipe, modifie le projet, publie les rapports et consulte le journal du projet ; le contributeur
  rédige ; le lecteur consulte. Le créateur d'un projet en devient le chef de projet ; un valideur
  désigné consulte le projet. Bouton « Équipe » du tableau de bord du portefeuille.
- **Historique des versions** : chaque enregistrement d'un document conserve la version (auteur,
  date). « Historique » liste les versions ; « Restaurer » reprend une version dans l'éditeur, rétablie
  à l'enregistrement comme nouvelle version (contrôles appliqués, refusée si la version en vigueur est
  figée). Une suppression garde l'historique. API : `GET …/<document>/versions`, `GET …/<document>?version=N`.
- **Journal d'audit** (sécurité et conformité, pas un livrable de gestion de projet) : connexions,
  enregistrements (avec la version), suppressions, validations, équipes, comptes et référentiel — qui,
  quoi, quand, sur toute la plateforme ; réservé aux administrateurs (menu « Administration »). Côté
  projet, la traçabilité est celle de la gestion de configuration : historique des versions de
  chaque document, historique de validation, registre des modifications.
- **Menu** : « Portefeuille » (tableau de bord, mes tâches, validations), « Organisation »
  (référentiel des ressources, lisible de tous), « Administration » (utilisateurs, journal d'audit ;
  administrateurs), puis les livrables du projet par groupe de processus.
- **Références de base figées** : l'approbation du plan de management fige la WBS datée et les
  estimations des coûts ; la valeur acquise, le rapport et le portefeuille mesurent contre la dernière
  version approuvée, même pendant une révision. Réviser le plan de management exige de citer une
  demande de modification approuvée.
- **Rapports exécutifs mensuels** : un rapport par mois et par projet. Le brouillon du mois est
  recalculé à chaque lecture ; publié par le chef de projet, il est figé (chiffres du jour de la
  publication) et rejoint l'historique, sans modification ni suppression possibles.

- **Administration des comptes** (administrateurs) : création (mot de passe provisoire généré,
  affiché une seule fois, à remplacer à la première connexion), changement de rôle, désactivation,
  réinitialisation du mot de passe, dernière connexion. Garde-fous : on ne modifie ni son propre
  rôle ni son propre statut, et il reste toujours au moins un administrateur actif.
- **Mon compte** : profil, ressource rattachée et changement de son mot de passe.
- **Référentiel des ressources** de l'organisation (agents internes et prestataires) : fonction,
  service ou entreprise, compétences,
  compte utilisateur rattaché, archivage. Recherche sans accents ni casse.
- **Personnes choisies, jamais saisies** : toute personne désignée dans un document est une
  ressource du référentiel, choisie dans une liste et enregistrée par son identifiant (sponsor et
  chef de projet de la charte et de la WBS, affectations des tâches, responsables des risques, des
  hypothèses, des problèmes, des leçons, des bénéfices, des activités et du dictionnaire de la WBS,
  titulaires des rôles, signataires de la charte d'équipe, participants RACI, ressource d'une
  estimation de coût, émetteur d'une communication, évaluateur d'une demande de modification). Le
  serveur refuse une personne absente du référentiel (422) ; un nom saisi avant ce choix reste lisible,
  signalé « à rattacher » jusqu'à ce qu'on choisisse la ressource. Une ressource désignée dans un
  projet ne se supprime pas (409) : on l'archive. Le demandeur d'une modification et le public d'une
  communication restent en texte libre (souvent hors de l'organisation).

## Principes

- **DRY / KISS / YAGNI / SOLID**, qualité intégrée dès la conception (ISO 25010).
- **Architecture hexagonale (Ports & Adapters)** : le cœur métier (`domain`) et les cas d'usage
  (`application`) ne dépendent d'aucun détail technique. HTTP, PostgreSQL, bcrypt, JWT sont des
  **adaptateurs** branchés aux **ports**.
- **Sécurité (OWASP Top 10)** : voir ci-dessous.
- **Identité visuelle** : charte graphique Dakar Mobilité (août 2023). Les jetons sont dans
  `packages/frontend/src/styles/theme.css` : vert P 140-7 C (`#00884B`) pour les actions, jaune
  P 7-8 C (`#FFCF00`) en accent, gris P 179-14 C (`#3F3F3E`) pour le texte, couleurs complémentaires
  pour l'information et les graphiques (palette validée : contraste et daltonismes). Logo vectoriel
  extrait de la charte (`components/brand/BrandLogo.tsx`), en couleur sur fond blanc ; ne pas le
  modifier ni l'afficher à moins de 20 mm de large (d'où l'absence d'icône d'onglet). Police : Gotham
  si elle est installée sur le poste, sinon Montserrat, embarquée avec l'application (aucun appel à
  un service externe).

## Structure (monorepo npm workspaces)

```
packages/
├── shared/      Contrats (DTO) partagés backend ⇄ frontend — source de vérité unique
├── backend/     API Fastify en architecture hexagonale
│   └── src/
│       ├── domain/          Cœur métier (entités, objets-valeur) — ZÉRO dépendance externe
│       ├── application/     Cas d'usage, ports (in/out), mappers
│       └── infrastructure/  Adaptateurs (HTTP, PostgreSQL, sécurité), config, composition root
└── frontend/    Application React (Vite)
```

Règle de dépendance (vers l'intérieur) : `infrastructure → application → domain`.

## Démarrage

Prérequis : **Node.js ≥ 20** et **Docker** (pour PostgreSQL).

```bash
npm install
docker compose up -d
cp packages/backend/.env.example packages/backend/.env
npm run dev
```

Dans `packages/backend/.env`, générer un `JWT_SECRET` fort (commande indiquée dans le fichier).
Sans `DATABASE_URL`, l'API bascule sur une persistance **en mémoire** (données volatiles).

- Frontend : http://localhost:5173
- API : http://localhost:3001 (santé : `GET /health`)
- PostgreSQL : `localhost:5433` (port 5433 pour éviter un conflit avec un PostgreSQL local)

Au premier démarrage, la base est migrée puis alimentée avec des données de démonstration
(projets Alpha / Beta / Gamma) et trois comptes de démonstration — `admin@dkm.sn`,
`editor@dkm.sn`, `viewer@dkm.sn` — dont les mots de passe figurent dans
`packages/backend/src/infrastructure/adapters/out/persistence/seed/users.seed.ts`.
**Ces comptes sont destinés au développement uniquement.**

## Sécurité

- Mots de passe hachés avec **bcrypt** (coût 12) ; le hash n'est jamais exposé par l'API.
- Session : **JWT dans un cookie `HttpOnly`, `SameSite=Lax`**, `Secure` en production, 8 h.
  Le jeton n'est jamais accessible en JavaScript (protection XSS).
- **Autorisation vérifiée côté serveur** sur chaque route (401 sans session, 403 si rôle
  insuffisant). L'interface masque seulement ce qui serait refusé.
- Message d'échec de connexion **générique** (pas d'énumération des comptes) et
  **limitation à 10 tentatives / 15 min** par IP sur la connexion.
- Entrées validées (Zod) puis revalidées par le domaine ; requêtes SQL **paramétrées**.
- **Projet inexistant ou hors de l'équipe** : toute route `/projects/:projectId/…` répond 404 avant
  tout traitement (après l'authentification), sans révéler l'existence du projet ; aucune écriture ne
  crée de document orphelin. Le rôle appliqué y est celui du compte dans l'équipe du projet.
- **Traçabilité** : journal d'audit en ajout seul (connexions, échecs de connexion, toutes les
  écritures) ; chaque version de document garde son auteur.
- En-têtes de sécurité (helmet), CORS restreint à l'origine du frontend, rate-limiting global.
- `JWT_SECRET` **obligatoire en production** (le serveur refuse de démarrer sans).
- **Session revérifiée à chaque requête** : compte actif, rôle courant (un changement de rôle
  s'applique aussitôt), jeton émis après la dernière révocation. Changer ou réinitialiser un mot de
  passe, ou désactiver un compte, ferme les sessions ouvertes.
- **Mots de passe** : 12 caractères au minimum, sans règle de composition (OWASP ASVS) ; mot de passe
  provisoire tiré d'un aléa cryptographique, jamais stocké en clair ni mis en cache
  (`Cache-Control: no-store`) ; tant qu'il n'est pas remplacé, le serveur refuse tout le reste de
  l'API. Compte désactivé : même message d'échec qu'un identifiant inconnu (anti-énumération).

## Scripts

| Commande            | Effet                                            |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Lance l'API et le frontend en parallèle          |
| `npm run build`     | Build de production (backend + frontend)         |
| `npm run typecheck` | Vérification des types sur tout le monorepo      |

## Prochaines étapes

Feuille de route vers un système d'information de gestion de projet complet (les étapes « Piloter le
réel » et « Gouverner » sont livrées, le rapport exécutif est alimenté par le projet et le circuit de
validation fige les versions approuvées) :

- **Gouverner** (livré : membres et rôles par projet, journal d'audit, historique des versions et
  restauration, références de base figées à l'approbation, rapports exécutifs mensuels figés à la
  publication) : reste l'historique des mesures d'avancement (courbe de la valeur acquise dans le temps).
- **Diffuser et collaborer** : exports PDF des documents et Excel des registres, notifications
  (échéances, affectations, risques à revoir), commentaires sur les entrées, pièces jointes,
  recherche globale.
- **Exploiter en production** : connexion avec les comptes Dakar Mobilité (SSO / Active Directory),
  migrations versionnées, sauvegardes, déploiement HTTPS, supervision.
