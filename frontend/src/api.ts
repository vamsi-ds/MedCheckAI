const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`)
  if (!response.ok) throw new Error(`API request failed (${response.status})`)
  return response.json()
}
export const api = {
  health: () => request<{status: string; service: string}>('/api/health'),
  dashboard: (role: string) => request<{role:string; patients:number; visits:number; documents:number; findings:number; pending_findings:number}>(`/api/dashboard?role=${role}`),
  patients: () => request<Patient[]>('/api/patients'),
  visits: (id: number) => request<Visit[]>(`/api/patients/${id}/visits`),
  documents: (id: number) => request<MedicalDocument[]>(`/api/patients/${id}/documents`),
  findings: (id: number) => request<Finding[]>(`/api/patients/${id}/findings`),
}
export type Patient = {id:number; patient_code:string; display_name:string; age:number; sex:string}
export type Visit = {id:number; patient_id:number; visit_date:string; category:string; department:string; reason:string; purpose:string; outcome:string; source_document:string|null}
export type MedicalDocument = {id:number; patient_id:number; title:string; document_type:string; document_date:string; status:string; note:string}
export type Finding = {id:number; patient_id:number; finding_type:string; severity:string; title:string; explanation:string; source_a:string; source_b:string; status:string; created_at:string}
