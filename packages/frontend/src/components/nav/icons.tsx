/** Icônes de navigation (SVG inline, sans dépendance). Héritent de currentColor. */

const BASE = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconProjects() {
  return (
    <svg {...BASE}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconReport() {
  return (
    <svg {...BASE}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function IconWbs() {
  return (
    <svg {...BASE}>
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <rect x="3" y="15" width="6" height="4" rx="1" />
      <rect x="15" y="15" width="6" height="4" rx="1" />
      <path d="M12 7v4M6 15v-2h12v2" />
    </svg>
  );
}

export function IconGantt() {
  return (
    <svg {...BASE}>
      <line x1="3" y1="4" x2="3" y2="20" />
      <rect x="6" y="5" width="9" height="3.4" rx="1" />
      <rect x="9" y="10.3" width="10" height="3.4" rx="1" />
      <rect x="6" y="15.6" width="6" height="3.4" rx="1" />
    </svg>
  );
}

export function IconRisk() {
  return (
    <svg {...BASE}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** Output pas encore outillé (cercle en pointillés). */
export function IconPlanned() {
  return (
    <svg {...BASE} strokeDasharray="3 3">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function IconChevron() {
  return (
    <svg {...BASE} width={14} height={14}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconMenu() {
  return (
    <svg {...BASE}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/** Sélecteur (double chevron haut/bas). */
export function IconChevronsUpDown() {
  return (
    <svg {...BASE} width={14} height={14}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg {...BASE} width={16} height={16}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconLogout() {
  return (
    <svg {...BASE} width={16} height={16}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconLock() {
  return (
    <svg {...BASE} width={14} height={14}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** Charte : document scellé. */
export function IconCharter() {
  return (
    <svg {...BASE}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" />
      <path d="M14 2v5h5v4" />
      <circle cx="17" cy="17" r="3" />
      <path d="m15.5 19.5-1 2.5 2.5-1 2.5 1-1-2.5" />
    </svg>
  );
}

/** Parties prenantes : groupe de personnes. */
export function IconStakeholders() {
  return (
    <svg {...BASE}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M18.5 14.5A6.5 6.5 0 0 1 21.5 20" />
    </svg>
  );
}

/** Hypothèses et contraintes : ampoule. */
export function IconAssumptions() {
  return (
    <svg {...BASE}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </svg>
  );
}

/** Business case : mallette. */
export function IconBusinessCase() {
  return (
    <svg {...BASE}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

/** Plan des bénéfices : cible. */
export function IconBenefits() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

/** Matrice RACI : grille. */
export function IconRaci() {
  return (
    <svg {...BASE}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}

export function IconScopePlan() {
  return (
    <svg {...BASE}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <rect x="9" y="10" width="6" height="6" rx="1" />
    </svg>
  );
}

export function IconRequirementsPlan() {
  return (
    <svg {...BASE}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  );
}

export function IconRequirements() {
  return (
    <svg {...BASE}>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17" />
    </svg>
  );
}

export function IconScope() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function IconFinancialPlan() {
  return (
    <svg {...BASE}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M14 10.5c-.4-.6-1.1-1-2-1-1.1 0-2 .6-2 1.5s.9 1.3 2 1.5 2 .6 2 1.5-.9 1.5-2 1.5c-.9 0-1.6-.4-2-1M12 8.5v1M12 15.5v1" />
    </svg>
  );
}

export function IconCostEstimates() {
  return (
    <svg {...BASE}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <rect x="8" y="6" width="8" height="3.5" rx="0.8" />
      <path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01" />
    </svg>
  );
}

export function IconCostBaseline() {
  return (
    <svg {...BASE}>
      <path d="M3 20h18" />
      <path d="M4 17c4 0 5-1 7-5s4-6 9-6" />
      <path d="M17 4h3v3" />
    </svg>
  );
}

export function IconResourcePlan() {
  return (
    <svg {...BASE}>
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4M6 16v-4h12v4" />
    </svg>
  );
}

export function IconResources() {
  return (
    <svg {...BASE}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2.5 20c.5-3.5 2.6-5.5 5.5-5.5s5 2 5.5 5.5" />
      <rect x="14.5" y="10" width="7" height="7" rx="1" />
      <path d="M14.5 13.5h7" />
    </svg>
  );
}

export function IconTeamCharter() {
  return (
    <svg {...BASE}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="15" cy="13" r="1.5" />
      <path d="M6.5 18c.5-2 1.8-3 3.5-3s3 1 3.5 3M14 18c.3-1.2 1-1.8 2-1.8" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4 3.9-6.5 8-6.5s7.2 2.5 8 6.5" />
    </svg>
  );
}

export function IconUsers() {
  return (
    <svg {...BASE}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.6 3.5 5.2" />
    </svg>
  );
}

export function IconDirectory() {
  return (
    <svg {...BASE}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17c.6-2 2.1-3 4-3s3.4 1 4 3" />
    </svg>
  );
}

export function IconEngagement() {
  return (
    <svg {...BASE}>
      <circle cx="7" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M2 20c.5-3 2.4-5 5-5 1.5 0 2.8.6 3.6 1.7M22 20c-.5-3-2.4-5-5-5-1.5 0-2.8.6-3.6 1.7" />
      <path d="M10 13.5h4M12.5 12l1.5 1.5-1.5 1.5" />
    </svg>
  );
}

export function IconCommunication() {
  return (
    <svg {...BASE}>
      <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2v2.5L17 18h-4" />
    </svg>
  );
}

export function IconProcurement() {
  return (
    <svg {...BASE}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21.5 8H6.2" />
    </svg>
  );
}

export function IconStrategy() {
  return (
    <svg {...BASE}>
      <path d="M12 3v19" />
      <path d="M5 5h11l3 2.5-3 2.5H5z" />
      <path d="M19 13H8l-3 2.5 3 2.5h11z" />
    </svg>
  );
}

export function IconSelection() {
  return (
    <svg {...BASE}>
      <path d="M12 3v18M7 21h10M5 7h14" />
      <path d="M5 7l-3 6a3 3 0 0 0 6 0z" />
      <path d="M19 7l-3 6a3 3 0 0 0 6 0z" />
    </svg>
  );
}

export function IconProjectPlan() {
  return (
    <svg {...BASE}>
      <path d="M12 3 3 7.5l9 4.5 9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5" />
      <path d="m3 16.5 9 4.5 9-4.5" />
    </svg>
  );
}

export function IconSchedulePlan() {
  return (
    <svg {...BASE}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M7 14h6M7 17h9" />
    </svg>
  );
}

export function IconQualityPlan() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="9" r="6" />
      <path d="m9.5 9 1.8 1.8L14.8 7.3" />
      <path d="m8.5 14.2-1.5 7 5-2.7 5 2.7-1.5-7" />
    </svg>
  );
}

export function IconRiskPlan() {
  return (
    <svg {...BASE}>
      <path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6z" />
      <path d="M12 8v4M12 15.5v.5" />
    </svg>
  );
}

export function IconChangeLog() {
  return (
    <svg {...BASE}>
      <path d="M4 7h11l-3-3M20 17H9l3 3" />
      <path d="M20 7v3M4 17v-3" />
    </svg>
  );
}

export function IconIssueLog() {
  return (
    <svg {...BASE}>
      <path d="M10.3 4 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 16.5v.5" />
    </svg>
  );
}

export function IconLessons() {
  return (
    <svg {...BASE}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </svg>
  );
}

export function IconWbsDictionary() {
  return (
    <svg {...BASE}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  );
}

export function IconActivities() {
  return (
    <svg {...BASE}>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <rect x="3" y="4.5" width="3" height="3" rx="0.8" />
      <rect x="3" y="10.5" width="3" height="3" rx="0.8" />
      <rect x="3" y="16.5" width="3" height="3" rx="0.8" />
    </svg>
  );
}

export function IconNetwork() {
  return (
    <svg {...BASE}>
      <rect x="2" y="9.5" width="5" height="5" rx="1" />
      <rect x="17" y="3" width="5" height="5" rx="1" />
      <rect x="17" y="16" width="5" height="5" rx="1" />
      <path d="M7 12h4M11 12V5.5h6M11 12v6.5h6" />
    </svg>
  );
}

export function IconMilestones() {
  return (
    <svg {...BASE}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 12.5l2.5 2.5-2.5 2.5-2.5-2.5z" />
    </svg>
  );
}

export function IconScheduleBaseline() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5M9.5 2h5" />
    </svg>
  );
}

export function IconQuestionnaire() {
  return (
    <svg {...BASE}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 2.5h6v3H9z" />
      <path d="M10 11a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2M12 17v.5" />
    </svg>
  );
}

export function IconStakeholderMap() {
  return (
    <svg {...BASE}>
      <circle cx="9" cy="10" r="5.5" />
      <circle cx="15" cy="10" r="5.5" />
      <circle cx="12" cy="15" r="5.5" />
    </svg>
  );
}

export function IconStakeholderAnalysis() {
  return (
    <svg {...BASE}>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M15.5 15.5 21 21" />
      <circle cx="10.5" cy="8.8" r="2" />
      <path d="M7 14a3.8 3.8 0 0 1 7 0" />
    </svg>
  );
}

export function IconQualityMetrics() {
  return (
    <svg {...BASE}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4-6" />
      <path d="M7.5 13.5l-1-.8M12 9.5V8.3M16.5 13.5l1-.8" />
    </svg>
  );
}

export function IconQualityReport() {
  return (
    <svg {...BASE}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M8.5 14.5l2.2 2.2 4.8-4.8" />
    </svg>
  );
}

export function IconQualityAnalyses() {
  return (
    <svg {...BASE}>
      <path d="M2 12h16" />
      <path d="M18 9l3 3-3 3" />
      <path d="M6 5l3 7M12 5l3 7M6 19l3-7M12 19l3-7" />
    </svg>
  );
}

export function IconFundingStrategy() {
  return (
    <svg {...BASE}>
      <path d="M3 21h18M5 21V10M10 21V10M14 21V10M19 21V10" />
      <path d="M12 3 3 8h18z" />
    </svg>
  );
}

export function IconFundingRequirements() {
  return (
    <svg {...BASE}>
      <path d="M3 20h18" />
      <path d="M4 17h4v-4h4V9h4V5h4" />
      <path d="M4 19c5-1 9-4 15-10" strokeDasharray="2 2.5" />
    </svg>
  );
}

export function IconMyTasks() {
  return (
    <svg {...BASE}>
      <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
      <path d="M11 6h9M11 12h9M11 18h6" />
    </svg>
  );
}

export function IconApprovals() {
  return (
    <svg {...BASE}>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconAudit() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
      <path d="M4 4v3h3" />
    </svg>
  );
}

export function IconTaskProgress() {
  return (
    <svg {...BASE}>
      <rect x="3" y="5" width="18" height="4" rx="2" />
      <rect x="3" y="15" width="18" height="4" rx="2" />
      <path d="M5 7h9M5 17h4" strokeWidth={3} />
    </svg>
  );
}

export function IconActualCosts() {
  return (
    <svg {...BASE}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function IconEarnedValue() {
  return (
    <svg {...BASE}>
      <path d="M3 20h18M4 4v16" />
      <path d="M5 17c4-1 7-5 14-11" />
      <path d="M5 18c4 0 8-3 11-6" strokeDasharray="2 2.5" />
      <circle cx="16" cy="12" r="1.5" />
    </svg>
  );
}
