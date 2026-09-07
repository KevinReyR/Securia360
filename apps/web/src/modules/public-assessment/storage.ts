import { PUBLIC_ASSESSMENT_SCHEMA_VERSION, storedPublicAssessmentRecordSchema, type StoredPublicAssessmentRecord } from "./schemas";

export const PUBLIC_ASSESSMENT_STORAGE_KEY = "securia360:public-initial-assessments:v1";

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type AssessmentStoreRead = {
  records: StoredPublicAssessmentRecord[];
  corrupted: boolean;
};

function resolveStorage(storage?: BrowserStorage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readAssessments(storage?: BrowserStorage): AssessmentStoreRead {
  const target = resolveStorage(storage);
  if (!target) return { records: [], corrupted: false };

  let raw: string | null;
  try {
    raw = target.getItem(PUBLIC_ASSESSMENT_STORAGE_KEY);
  } catch {
    return { records: [], corrupted: false };
  }

  if (!raw) return { records: [], corrupted: false };

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("assessments" in parsed) || !Array.isArray(parsed.assessments)) {
      return { records: [], corrupted: true };
    }
    const records: StoredPublicAssessmentRecord[] = [];
    let corrupted = ![1, PUBLIC_ASSESSMENT_SCHEMA_VERSION].includes(Number((parsed as { schemaVersion?: unknown }).schemaVersion));
    for (const candidate of parsed.assessments) {
      const result = storedPublicAssessmentRecordSchema.safeParse(candidate);
      if (result.success) records.push(result.data);
      else corrupted = true;
    }
    return { records: records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), corrupted };
  } catch {
    return { records: [], corrupted: true };
  }
}

export function writeAssessments(records: StoredPublicAssessmentRecord[], storage?: BrowserStorage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: PUBLIC_ASSESSMENT_SCHEMA_VERSION, assessments: records }));
    return true;
  } catch {
    return false;
  }
}

export function saveAssessment(record: StoredPublicAssessmentRecord, storage?: BrowserStorage) {
  const current = readAssessments(storage).records.filter((item) => item.id !== record.id);
  return writeAssessments([record, ...current], storage);
}

export function findAssessment(id: string, storage?: BrowserStorage) {
  return readAssessments(storage).records.find((item) => item.id === id) ?? null;
}
