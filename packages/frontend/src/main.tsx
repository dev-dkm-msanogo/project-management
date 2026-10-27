import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { AuthProvider } from '@/auth/AuthContext';
import '@/styles/theme.css';
import '@/styles/index.css';
import '@/styles/layout.css';
import '@/styles/header.css';
import '@/styles/report.css';
import '@/styles/editor.css';
import '@/styles/plan.css';
import '@/styles/projects.css';
import '@/styles/registers.css';
import '@/styles/risks.css';
import '@/styles/stakeholders.css';
import '@/styles/documents.css';
import '@/styles/charter.css';
import '@/styles/initiating.css';
import '@/styles/scope.css';
import '@/styles/finance.css';
import '@/styles/resources.css';
import '@/styles/admin.css';
import '@/styles/communication.css';
import '@/styles/procurement.css';
import '@/styles/pm-plan.css';
import '@/styles/quality-risk.css';
import '@/styles/changes.css';
import '@/styles/issues.css';
import '@/styles/lessons.css';
import '@/styles/schedule.css';
import '@/styles/stakeholder-tools.css';
import '@/styles/quality-tools.css';
import '@/styles/performance.css';
import '@/styles/approvals.css';
import '@/styles/governance.css';
import '@/styles/closing.css';
import '@/styles/agile.css';
import '@/styles/auth.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Élément racine #root introuvable.');
}

createRoot(container).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
