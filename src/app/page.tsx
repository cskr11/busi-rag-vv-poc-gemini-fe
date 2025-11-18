import React from 'react';
import RiskChat from './components/RiskChat';

// Optional initial response (can remove or set to undefined)
const initialResponse = {
  query: 'Which companies are having the high priority risk?',
  status: 'Success',
  count: 5,
  context: [
    {
      content:
        'Risk Finding for **IBM** (File: ibm).\nCategory: Government Restrictions / CONTESTED INDUSTRY: Presence in a contested industry\nPriority: 4\nFinding: Organization is listed as a member of Semi.org, a semiconductor global industry association that facilitates collaboration and IP sharing across the semiconductor industry. Membership includes western and Chinese entities across the semiconductor industry. The company incurs risk from operations within a contested industry.\nSource: BSD\nDUNS: N/A',
      metadata: {
        company_name: 'IBM',
        risk_category: 'Government Restrictions',
        risk_subcategory:
          'CONTESTED INDUSTRY: Presence in a contested industry',
        priority: 4,
        doc_type: 'RiskFinding',
        source_name: 'BSD',
        duns_id: 'N/A',
        file_source_tag: 'ibm',
        business_id: '95c71582-c539-4089-8a2f-9592ebefabf2',
      },
    },
    {
      content:
        'Risk Finding for **IBM** (File: ibm).\nCategory: Subversion, Exploitation, Espionage / US SBIR grant applicant, public discoverability\nPriority: 4\nFinding: Company is listed as a past or present applicant for a US SBIR grant.\nSource: BSD\nDUNS: N/A',
      metadata: {
        company_name: 'IBM',
        risk_category: 'Subversion, Exploitation, Espionage',
        risk_subcategory: 'US SBIR grant applicant, public discoverability',
        priority: 4,
        doc_type: 'RiskFinding',
        source_name: 'BSD',
        duns_id: 'N/A',
        file_source_tag: 'ibm',
        business_id: '95c71582-c539-4089-8a2f-9592ebefabf2',
      },
    },
  ],
};

export default function Page() {
  return (
    <main style={{ padding: 20 }}>
      <RiskChat initialResponse={initialResponse} />
    </main>
  );
}
