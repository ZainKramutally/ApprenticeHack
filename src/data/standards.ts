import type { Apprentice, Ksb, KsbType, Standard, StandardCode } from '../types';

// KSB wording is shortened from the Skills England standards. ST0411 and ST0472 codes follow
// the order in the Skills England API. ST0119 (DTSP) has no published codes in the API, so its
// codes are demo labels; check all codes against your provider's KSB matrix before real use.

const k = (std: string, code: string, text: string, pathway?: string): Ksb => ({
  id: `${std}-${code}`,
  code,
  type: code[0] as KsbType,
  text,
  pathway,
});

export const STANDARDS: Standard[] = [
  {
    code: 'ST0119',
    title: 'Digital and technology solutions professional',
    shortName: 'DTSP',
    level: 6,
    minOtjHours: 1022,
    typicalDurationMonths: 48,
    pathways: [
      'Software engineering professional',
      'IT consultant professional',
      'Business analyst professional',
      'Cyber security professional',
      'Computing data analyst professional',
      'Network engineering professional',
    ],
    ksbs: [
      k('ST0119', 'K1', 'How organisations use digital technology for competitive advantage'),
      k('ST0119', 'K2', 'Strategic decisions on buying or building solutions'),
      k('ST0119', 'K3', 'Estimating risks and opportunities'),
      k('ST0119', 'K4', 'Business case techniques'),
      k('ST0119', 'K5', 'Solution development techniques and tools'),
      k('ST0119', 'K11', 'Common vulnerabilities in digital solutions'),
      k('ST0119', 'K13', 'Data analysis principles'),
      k('ST0119', 'S1', 'Analyse a business problem to find the role of digital solutions'),
      k('ST0119', 'S3', 'Specify the right digital solution for a business problem'),
      k('ST0119', 'S5', 'Manage digital and technology projects'),
      k('ST0119', 'S6', 'Work in teams, leading where appropriate'),
      k('ST0119', 'S8', 'Apply security and resilience techniques'),
      k('ST0119', 'S9', 'Report effectively to colleagues and stakeholders'),
      k('ST0119', 'B5', 'Interact professionally with technical and non-technical people'),
      k('ST0119', 'B6', 'Share best practice in the organisation and community'),
    ],
  },
  {
    code: 'ST0411',
    title: 'Project manager (integrated degree)',
    shortName: 'Project Management',
    level: 6,
    minOtjHours: 974,
    typicalDurationMonths: 48,
    pathways: ['Core'],
    ksbs: [
      k('ST0411', 'K1', 'Governance and financial control of projects'),
      k('ST0411', 'K2', 'The business environment'),
      k('ST0411', 'K3', 'Stakeholder and communications management'),
      k('ST0411', 'K4', 'Organisational change management'),
      k('ST0411', 'K5', 'Estimating, planning and scheduling'),
      k('ST0411', 'K6', 'Project justification and benefits'),
      k('ST0411', 'K7', 'Quality management'),
      k('ST0411', 'K8', 'Procurement and contract management'),
      k('ST0411', 'K9', 'Risk management'),
      k('ST0411', 'K10', 'Project change control'),
      k('ST0411', 'K11', 'Organisational strategy'),
      k('ST0411', 'S1', 'Lead governance frameworks and project plans'),
      k('ST0411', 'S2', 'Analyse the business environment'),
      k('ST0411', 'S3', 'Lead stakeholder and communications management'),
      k('ST0411', 'S4', 'Control projects on time, cost and quality'),
      k('ST0411', 'S5', 'Manage risks, opportunities and issues'),
      k('ST0411', 'S6', 'Choose commercial and contract options'),
      k('ST0411', 'S7', 'Apply project change control'),
      k('ST0411', 'S8', 'Manage schedules and resources'),
      k('ST0411', 'B1', 'Leadership'),
      k('ST0411', 'B2', 'Collaboration and teamwork'),
      k('ST0411', 'B3', 'Personal and professional responsibility'),
      k('ST0411', 'B4', 'Integrity, ethics and professionalism'),
      k('ST0411', 'B5', 'Inclusive'),
      k('ST0411', 'B6', 'Innovation and resourcefulness'),
    ],
  },
  {
    code: 'ST0472',
    title: 'Financial services professional',
    shortName: 'Finance',
    level: 6,
    minOtjHours: 696,
    typicalDurationMonths: 42,
    pathways: [
      'Retail banking',
      'Commercial/business banking',
      'Investment banking',
      'Investment management',
      'Operations',
      'Workplace pensions',
    ],
    ksbs: [
      k('ST0472', 'K1', 'Financial services industry structure and environment'),
      k('ST0472', 'K2', 'Legal, regulatory, compliance and risk frameworks'),
      k('ST0472', 'K3', 'Financial products and services'),
      k('ST0472', 'K4', 'Client segments, channels and fair customer outcomes'),
      k('ST0472', 'K5', 'Organisational policies, systems and tools'),
      k('ST0472', 'K18', 'Process and project management principles', 'Operations'),
      k('ST0472', 'K19', 'Controls in own area of work', 'Operations'),
      k('ST0472', 'K20', 'Operational risk and control methods', 'Operations'),
      k('ST0472', 'K21', 'Market practices affecting own area', 'Operations'),
      k('ST0472', 'S1', 'Build ethical, trusted client relationships'),
      k('ST0472', 'S2', 'Use systems and processes within policy and regulation'),
      k('ST0472', 'S3', 'Contribute to planning and manage progress'),
      k('ST0472', 'S4', 'Evaluate information and make effective decisions'),
      k('ST0472', 'S5', 'Communicate complex information clearly'),
      k('ST0472', 'S6', 'Build working relationships and collaborate'),
      k('ST0472', 'S7', 'Find and lead performance improvements'),
      k('ST0472', 'S8', 'Keep up with legal and regulatory change; support others'),
      k('ST0472', 'S22', 'Lead small teams delivering regulated service', 'Operations'),
      k('ST0472', 'S23', 'Apply project management and control frameworks', 'Operations'),
      k('ST0472', 'B1', 'Honesty, integrity and confidentiality'),
      k('ST0472', 'B2', 'Adaptable to changing priorities'),
      k('ST0472', 'B3', 'Energy, determination and resilience'),
      k('ST0472', 'B4', 'Curiosity and innovation within regulation'),
      k('ST0472', 'B5', 'Thorough, accurate, owns the quality of work'),
    ],
  },
];

const KSB_INDEX = new Map<string, Ksb>(STANDARDS.flatMap((s) => s.ksbs.map((x) => [x.id, x] as const)));

export function getStandard(code: StandardCode): Standard {
  return STANDARDS.find((s) => s.code === code)!;
}

export function getKsb(id: string): Ksb | undefined {
  return KSB_INDEX.get(id);
}

export function standardOfKsb(id: string): StandardCode {
  return id.split('-')[0] as StandardCode;
}

/** KSBs that apply to a learner: core KSBs plus those for their pathway. */
export function ksbsForPathway(code: StandardCode, pathway: string): Ksb[] {
  return getStandard(code).ksbs.filter((x) => !x.pathway || x.pathway === pathway);
}

export function userKsbs(u: Apprentice): Ksb[] {
  return ksbsForPathway(u.standardCode, u.pathway);
}

export const KSB_TYPE_LABEL: Record<KsbType, string> = {
  K: 'Knowledge',
  S: 'Skills',
  B: 'Behaviours',
};
