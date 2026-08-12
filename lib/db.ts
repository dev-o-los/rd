import fs from 'fs';
import path from 'path';
import { RoadTender, MatchResult } from './tenderMatcher';
import { PriorityAssessmentResult } from './priorityEngine';

export interface DefectReport {
  id: string;
  createdAt: string;
  imageName?: string;
  imageUrl?: string;
  hasGps: boolean;
  latitude: number;
  longitude: number;
  userNotes?: string;
  defectDepthCm?: number;
  defectWidthCm?: number;
  matchResult: MatchResult;
  priorityAssessment: PriorityAssessmentResult;
  status: 'REPORTED' | 'NOTICE_ISSUED' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface ComplaintRecord {
  id: string;
  tenderId: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  citizenRemark?: string;
}

export const COMPLAINT_THRESHOLD = 3; // 3 complaints trigger High Priority Government Escalation Notice

const TENDERS_FILE_PATH = path.join(process.cwd(), 'data', 'tenders.json');

// Memory store for complaints & complaint counters per tender ID
let complaintCountsStore: Record<string, number> = {
  '2026_LDAUP_1175656_1': 4, // Pre-seeded with 4 complaints (already escalated)
  '2026_LDAUP_1175282_1': 2, // Pre-seeded with 2 complaints (1 away from escalation)
};

let complaintsLogStore: ComplaintRecord[] = [
  {
    id: 'CMP-101',
    tenderId: '2026_LDAUP_1175656_1',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    latitude: 26.8468,
    longitude: 81.0105,
    citizenRemark: 'Severe road surface damage near Shaheed Path service road.',
  },
  {
    id: 'CMP-102',
    tenderId: '2026_LDAUP_1175656_1',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    latitude: 26.8469,
    longitude: 81.0104,
    citizenRemark: 'Pothole causing vehicle damage.',
  },
  {
    id: 'CMP-103',
    tenderId: '2026_LDAUP_1175656_1',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    latitude: 26.8467,
    longitude: 81.0106,
    citizenRemark: 'Third complaint for this stretch!',
  },
  {
    id: 'CMP-104',
    tenderId: '2026_LDAUP_1175656_1',
    createdAt: new Date().toISOString(),
    latitude: 26.8468,
    longitude: 81.0105,
    citizenRemark: 'Dangerous crater on turn.',
  },
  {
    id: 'CMP-105',
    tenderId: '2026_LDAUP_1175282_1',
    createdAt: new Date().toISOString(),
    latitude: 26.7768,
    longitude: 80.8845,
    citizenRemark: 'Kanpur road pothole near Mragshira gate.',
  },
];

let reportsStore: DefectReport[] = [];

export function getAllTenders(): RoadTender[] {
  try {
    if (fs.existsSync(TENDERS_FILE_PATH)) {
      const fileData = fs.readFileSync(TENDERS_FILE_PATH, 'utf-8');
      const json = JSON.parse(fileData);
      const rawTenders: RoadTender[] = json.road_tenders || [];

      // Merge complaint count & escalation status
      return rawTenders.map((tender) => {
        const count = complaintCountsStore[tender.tender_id] || 0;
        const isEscalated = count >= COMPLAINT_THRESHOLD;
        return {
          ...tender,
          complaint_count: count,
          is_escalated: isEscalated,
          status: isEscalated ? 'HIGH PRIORITY ESCALATED (Notice Issued)' : tender.status,
        };
      });
    }
  } catch (err) {
    console.error('Error reading tenders.json:', err);
  }
  return [];
}

export function saveTender(tender: RoadTender): RoadTender {
  const tenders = getAllTenders();
  tenders.unshift(tender);
  fs.writeFileSync(TENDERS_FILE_PATH, JSON.stringify({ road_tenders: tenders }, null, 2), 'utf-8');
  return tender;
}

export function registerComplaint(
  tenderId: string,
  latitude: number,
  longitude: number,
  citizenRemark?: string
) {
  const currentCount = (complaintCountsStore[tenderId] || 0) + 1;
  complaintCountsStore[tenderId] = currentCount;

  const newComplaint: ComplaintRecord = {
    id: `CMP-${Date.now().toString().slice(-5)}`,
    tenderId,
    createdAt: new Date().toISOString(),
    latitude,
    longitude,
    citizenRemark,
  };

  complaintsLogStore.unshift(newComplaint);

  const isEscalated = currentCount >= COMPLAINT_THRESHOLD;
  const tenders = getAllTenders();
  const matchedTender = tenders.find((t) => t.tender_id === tenderId) || null;

  return {
    success: true,
    tenderId,
    complaintCount: currentCount,
    threshold: COMPLAINT_THRESHOLD,
    isEscalated,
    matchedTender,
    escalationNotice: isEscalated
      ? `OFFICIAL GOVERNMENT NOTICE: Tender ${tenderId} (${matchedTender?.title}) has exceeded the complaint threshold (${currentCount}/${COMPLAINT_THRESHOLD} citizen complaints). Escalated to HIGH PRIORITY for immediate intervention by ${matchedTender?.organisation} & contractor ${matchedTender?.contractor_name}.`
      : null,
  };
}

export function getEscalatedTenders(): RoadTender[] {
  const all = getAllTenders();
  return all
    .filter((t) => (t.complaint_count || 0) > 0)
    .sort((a, b) => (b.complaint_count || 0) - (a.complaint_count || 0));
}

export function saveReport(report: DefectReport): DefectReport {
  reportsStore.unshift(report);
  return report;
}

export function getAllReports(): DefectReport[] {
  return reportsStore;
}
