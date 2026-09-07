import { PUBLIC_ASSESSMENT_SCHEMA_VERSION, publicAssessmentRecordSchema, type PublicAssessmentRecord } from "./schemas";

export const PUBLIC_ASSESSMENT_STORAGE_KEY = "securia360:public-initial-assessments:v1";

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type AssessmentStoreRead = {
  records: PublicAssessmentRecord[];
  corrupted: boolean;
};

function resolveStorage(storage?: BrowserStorage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readAssessments(storage?: BrowserStorage): AssessmentStoreRead {
  const target = resolveStorage(storage);
  if (!target) return { records: [], corrupted: false };
  const raw = target.getItem(PUBLIC_ASSESSMENT_STORAGE_KEY);
  if (!raw) return { records: [], corrupted: false };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("assessments" in parsed) || !Array.isArray(parsed.assessments)) {
      return { records: [], corrupted: true };
    }
    const records: PublicAssessmentRecord[] = [];
    let corrupted = (parsed as { schemaVersion?: unknown }).schemaVersion !== PUBLIC_ASSESSMENT_SCHEMA_VERSION;
    for (const candidate of parsed.assessments) {
      const result = publicAssessmentRecordSchema.safeParse(candidate);
      if (result.success) records.push(result.data);
      else corrupted = true;
    }
    return { records: records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), corrupted };
  } catch {
    return { records: [], corrupted: true };
  }
}

export function writeAssessments(records: PublicAssessmentRecord[], storage?: BrowserStorage) {
  const target = resolveStorage(storage);
  if (!target) return;
  target.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: PUBLIC_ASSESSMENT_SCHEMA_VERSION, assessments: records }));
}

export function saveAssessment(record: PublicAssessmentRecord, storage?: BrowserStorage) {
  const current = readAssessments(storage).records.filter((item) => item.id !== record.id);
  writeAssessments([record, ...current], storage);
}

export function findAssessment(id: string, storage?: BrowserStorage) {
  return readAssessments(storage).records.find((item) => item.id === id) ?? null;
}

export function deleteAssessment(id: string, storage?: BrowserStorage) {
  writeAssessments(readAssessments(storage).records.filter((item) => item.id !== id), storage);
}

export function clearAssessments(storage?: BrowserStorage) {
  resolveStorage(storage)?.removeItem(PUBLIC_ASSESSMENT_STORAGE_KEY);
}
