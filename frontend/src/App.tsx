import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Clock3, FileCheck2, FileText, Filter, HeartPulse, LayoutDashboard, LockKeyhole, LogOut, Menu, Search, Settings2, ShieldCheck, Stethoscope, UploadCloud, Users, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type Patient, type Visit, type MedicalDocument, type Finding } from './api'

type Role = 'doctor' | 'records_staff' | 'patient' | 'admin'
const roleNames: Record<Role,string> = { doctor:'Doctor', records_staff:'Medical Records Staff', patient:'Patient', admin:'System Administrator' }
const roleDescriptions: Record<Role,string> = { doctor:'Clinical review workspace', records_staff:'Records and document processing', patient:'Your personal health overview', admin:'Platform operations and access' }
const categoryStyles: Record<string,{color:string;bg:string;label:string}> = {
  consultation:{color:'#3478d4',bg:'#eaf2ff',label:'Consultation'},
  investigation:{color:'#8a63d2',bg:'#f1ebff',label:'Investigation'},
  medication:{color:'#c58b20',bg:'#fff4d8',label:'Medication'},
  emergency:{color:'#d64f55',bg:'#ffeaeb',label:'Emergency'},
  follow_up:{color:'#149783',bg:'#e0f7f1',label:'Follow-up'},
  record_review:{color:'#65788b',bg:'#edf1f5',label:'Record review'},
}
const fallbackVisits: Visit[] = [
  {id:1,patient_id:1,visit_date:'2026-09-12',category:'consultation',department:'General Medicine',reason:'Persistent headache',purpose:'Initial symptom assessment recorded in the encounter.',outcome:'Follow-up status to be verified from the source record.',source_document:'Consultation note — 12 Sep 2026'},
  {id:2,patient_id:1,visit_date:'2026-09-18',category:'investigation',department:'Diagnostics',reason:'Laboratory follow-up',purpose:'Review available laboratory documentation.',outcome:'No interpretation inferred from demo data.',source_document:'Laboratory report — 18 Sep 2026'},
  {id:3,patient_id:1,visit_date:'2026-09-25',category:'medication',department:'General Medicine',reason:'Medication review',purpose:'Review recorded medication list and treatment documentation.',outcome:'Medication reconciliation pending in demo.',source_document:'Medication list — 25 Sep 2026'},
  {id:4,patient_id:1,visit_date:'2026-10-02',category:'emergency',department:'Emergency',reason:'Acute symptoms',purpose:'Urgent assessment recorded in a synthetic encounter.',outcome:'See source encounter for verified outcome.',source_document:'Emergency note — 02 Oct 2026'},
  {id:5,patient_id:1,visit_date:'2026-10-06',category:'follow_up',department:'General Medicine',reason:'Follow-up consultation',purpose:'Review previous encounter documentation.',outcome:'Source review required.',source_document:'Follow-up note — 06 Oct 2026'},
  {id:6,patient_id:1,visit_date:'2026-10-08',category:'record_review',department:'Medical Records',reason:'Record reconciliation',purpose:'Compare synthetic records for potential inconsistencies.',outcome:'Potential conflicts require authorized review.',source_document:'Record review — 08 Oct 2026'},
]
const fallbackPatient: Patient = {id:1,patient_code:'MC-DEMO-001',display_name:'Aarav Demo',age:42,sex:'Not specified'}
const fallbackDocs: MedicalDocument[] = [
  {id:1,patient_id:1,title:'Consultation Note — September',document_type:'consultation',document_date:'2026-09-12',status:'processed',note:'Synthetic demo document.'},
  {id:2,patient_id:1,title:'Medication List — September',document_type:'medication_list',document_date:'2026-09-25',status:'processed',note:'Synthetic demo document.'},
  {id:3,patient_id:1,title:'Record Reconciliation Note',document_type:'record_review',document_date:'2026-10-08',status:'processed',note:'Synthetic demo document.'},
]
const fallbackFindings: Finding[] = [
  {id:1,patient_id:1,finding_type:'allergy',severity:'review',title:'Potential allergy-record conflict',explanation:'One synthetic record reports a penicillin allergy while another reports no known drug allergies. Check source dates and original documents.',source_a:'Synthetic note: penicillin allergy',source_b:'Synthetic intake: no known drug allergies',status:'new',created_at:'2026-10-08T10:00:00'},
  {id:2,patient_id:1,finding_type:'medication',severity:'review',title:'Medication status needs reconciliation',explanation:'Historical medication status differs across synthetic records. Verify the exact medication and chronology.',source_a:'Synthetic note: discontinued',source_b:'Synthetic list: active medication',status:'under_review',created_at:'2026-10-08T11:00:00'},
]
const fmtDate = (value:string) => new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
const chartData = [{date:'12 Sep',visits:1},{date:'18 Sep',visits:2},{date:'25 Sep',visits:3},{date:'02 Oct',visits:4},{date:'06 Oct',visits:5},{date:'08 Oct',visits:6}]

export default function App() {
  const [role,setRole] = useState<Role>('doctor')
  const [patient,setPatient] = useState<Patient>(fallbackPatient)
  const [patients,setPatients] = useState<Patient[]>([fallbackPatient])
  const [visits,setVisits] = useState<Visit[]>(fallbackVisits)
  const [documents,setDocuments] = useState<MedicalDocument[]>(fallbackDocs)
  const [findings,setFindings] = useState<Finding[]>(fallbackFindings)
  const [selectedVisit,setSelectedVisit] = useState<number>(6)
  const [activePage,setActivePage] = useState('Overview')
  const [search,setSearch] = useState('')
  const [apiOnline,setApiOnline] = useState(false)
  const [mobileNav,setMobileNav] = useState(false)
  const [showRolePicker,setShowRolePicker] = useState(false)
  const [notice,setNotice] = useState('')
  const [demoText,setDemoText] = useState('penicillin allergy; no known drug allergies')
  const [analysisResult,setAnalysisResult] = useState<string | null>(null)

  useEffect(() => {
    api.health().then(()=>setApiOnline(true)).catch(()=>setApiOnline(false))
    api.patients().then(p=>{if(p.length){setPatients(p);setPatient(p[0])}}).catch(()=>{})
  },[])
  useEffect(() => {
    if(!patient.id) return
    api.visits(patient.id).then(v=>{if(v.length){setVisits(v);setSelectedVisit(v[v.length-1].id)}}).catch(()=>{})
    api.documents(patient.id).then(d=>{if(d.length)setDocuments(d)}).catch(()=>{})
    api.findings(patient.id).then(f=>{if(f.length)setFindings(f)}).catch(()=>{})
  },[patient.id])
  const visibleVisits = useMemo(()=>visits.filter(v=>`${v.reason} ${v.department} ${v.category}`.toLowerCase().includes(search.toLowerCase())),[visits,search])
  const currentVisit = visits.find(v=>v.id===selectedVisit) || visits[visits.length-1]
  const nav = role==='doctor'
    ? [{name:'Overview',icon:LayoutDashboard},{name:'Patients',icon:Users},{name:'Visit timeline',icon:CalendarDays},{name:'Contradictions',icon:AlertTriangle},{name:'Documents',icon:FileText},{name:'Reports',icon:ClipboardList}]
    : role==='records_staff'
    ? [{name:'Overview',icon:LayoutDashboard},{name:'Patients',icon:Users},{name:'Visit timeline',icon:CalendarDays},{name:'Documents',icon:FileText},{name:'Processing queue',icon:Activity}]
    : role==='patient'
    ? [{name:'Overview',icon:LayoutDashboard},{name:'My visits',icon:CalendarDays},{name:'My documents',icon:FileText},{name:'Record requests',icon:ClipboardList}]
    : [{name:'Overview',icon:LayoutDashboard},{name:'Users & roles',icon:Users},{name:'System health',icon:Activity},{name:'Audit logs',icon:ShieldCheck},{name:'Settings',icon:Settings2}]
  const choosePage = (name:string) => {setActivePage(name);setMobileNav(false)}
  const runDemoAnalysis = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analyze-demo`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:demoText})})
      const data = await response.json()
      setAnalysisResult(data.findings?.length ? data.findings.map((f:any)=>f.title+': '+f.explanation).join('\n\n') : 'No demo rule matched. This does not prove records are consistent.')
    } catch { setAnalysisResult('Backend is offline. Start the backend to run the demo detector.') }
  }
  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav?'sidebar-open':''}`}>
      <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><div className="brand-name">MedCheck<span> AI</span></div><div className="brand-caption">CLINICAL INTELLIGENCE</div></div><button className="icon-btn mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="workspace-switch" onClick={()=>setShowRolePicker(!showRolePicker)}><div className="workspace-avatar">{roleNames[role].slice(0,1)}</div><div className="workspace-copy"><strong>{roleNames[role]}</strong><span>{roleDescriptions[role]}</span></div><ChevronDown size={16}/></button>
      {showRolePicker && <div className="role-menu">{(Object.keys(roleNames) as Role[]).map(r=><button key={r} onClick={()=>{setRole(r);setActivePage('Overview');setShowRolePicker(false)}}>{roleNames[r]} {r===role?'✓':''}</button>)}</div>}
      <div className="nav-label">MENU</div>
      <nav className="side-nav">{nav.map(item=><button key={item.name} className={`nav-item ${activePage===item.name?'active':''}`} onClick={()=>choosePage(item.name)}><item.icon size={18}/><span>{item.name}</span>{item.name==='Contradictions'&&<b className="nav-count">{findings.length}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-card"><ShieldCheck size={19}/><div><strong>Privacy-first workspace</strong><span>Demo data only</span></div></div><div className="user-mini"><div className="avatar">MC</div><div><strong>Demo User</strong><span>{roleNames[role]}</span></div><button className="icon-btn" title="Demo sign out" onClick={()=>setNotice('This starter uses demo role switching, not production authentication.')}><LogOut size={16}/></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn menu-toggle" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{activePage}</strong></div></div><div className="topbar-actions"><div className={`connection ${apiOnline?'online':'offline'}`}><span/>{apiOnline?'API connected':'Demo preview'}</div><button className="icon-btn notification" onClick={()=>setNotice('Notifications are a placeholder in this starter.')}><Bell size={19}/><i/></button><div className="top-avatar">MC</div></div></header>
      <div className="page-content">
        {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={16}/></button></div>}
        <div className="page-heading"><div><div className="eyebrow">HEALTHCARE RECORD INTELLIGENCE</div><h1>{activePage==='Overview'?'Good morning, Demo User':activePage}</h1><p>{roleDescriptions[role]} · {fmtDate('2026-10-09')}</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={()=>choosePage(role==='patient'?'My visits':'Visit timeline')}><CalendarDays size={16}/> View visit history</button>{role==='records_staff'&&<button className="btn btn-primary" onClick={()=>setNotice('Document upload is the next backend milestone. This starter uses seeded sample documents.')}><UploadCloud size={16}/> Upload record</button>}</div></div>
        {activePage==='Overview' && <>
          <section className="stat-grid">
            <Stat icon={<Users size={19}/>} label={role==='patient'?'My recorded visits':'Patients in workspace'} value={role==='patient'?String(visits.length):String(patients.length)} trend="Synthetic demo data" tone="teal"/>
            <Stat icon={<CalendarDays size={19}/>} label="Recorded visits" value={String(visits.length)} trend="Chronological history" tone="blue"/>
            <Stat icon={<FileText size={19}/>} label="Documents processed" value={String(documents.length)} trend="Source-linked records" tone="purple"/>
            <Stat icon={<AlertTriangle size={19}/>} label="Potential findings" value={String(findings.length)} trend="Require professional review" tone="amber"/>
          </section>
          <section className="content-grid">
            <div className="panel chart-panel"><div className="panel-heading"><div><h2>Patient visit activity</h2><p>Recorded encounters over time</p></div><span className="small-select">Last 30 days <ChevronDown size={14}/></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:8,right:8,left:-20,bottom:0}}><defs><linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#169b8b" stopOpacity={0.22}/><stop offset="95%" stopColor="#169b8b" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#edf2f2" vertical={false}/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#7d9197'}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#7d9197'}}/><Tooltip/><Area type="monotone" dataKey="visits" name="Cumulative visits" stroke="#159b8b" strokeWidth={2.5} fill="url(#visitFill)" activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div><div className="chart-foot"><span><i className="legend-dot teal-dot"/>Visits documented</span><span>Demo timeline · not clinical advice</span></div></div>
            <div className="panel priority-panel"><div className="panel-heading"><div><h2>Needs attention</h2><p>Potential inconsistencies</p></div><span className="priority-icon"><AlertTriangle size={18}/></span></div>{findings.slice(0,3).map(f=><div className="priority-item" key={f.id}><div className="priority-bullet"/><div><strong>{f.title}</strong><p>{f.finding_type} · {f.status.replace('_',' ')}</p></div><ChevronRight size={16}/></div>)}<button className="text-link" onClick={()=>choosePage(role==='patient'?'Record requests':'Contradictions')}>Review findings <ArrowUpRight size={15}/></button></div>
          </section>
          <section className="panel timeline-panel"><div className="panel-heading"><div><h2>Patient visit timeline</h2><p>Each visit is color-coded by encounter type. Select a visit to see why the patient came in.</p></div><button className="text-link" onClick={()=>choosePage(role==='patient'?'My visits':'Visit timeline')}>View all <ArrowUpRight size={15}/></button></div><Timeline visits={visits.slice().sort((a,b)=>a.visit_date.localeCompare(b.visit_date))} selected={selectedVisit} onSelect={setSelectedVisit}/></section>
          <section className="bottom-grid"><div className="panel table-panel"><div className="panel-heading"><div><h2>Recent documents</h2><p>Latest records linked to this patient</p></div><button className="text-link" onClick={()=>choosePage(role==='patient'?'My documents':'Documents')}>View all <ArrowUpRight size={15}/></button></div><div className="document-list">{documents.slice(0,4).map(d=><div className="document-row" key={d.id}><div className="doc-icon"><FileText size={18}/></div><div className="doc-copy"><strong>{d.title}</strong><span>{d.document_type.replace('_',' ')} · {fmtDate(d.document_date)}</span></div><span className="status status-good"><CheckCircle2 size={13}/>{d.status}</span></div>)}</div></div><div className="panel patient-panel"><div className="panel-heading"><div><h2>Patient overview</h2><p>Selected synthetic patient</p></div><div className="patient-avatar"><HeartPulse size={21}/></div></div><h3>{patient.display_name}</h3><div className="patient-code">{patient.patient_code}</div><div className="patient-meta"><span>Age</span><strong>{patient.age}</strong><span>Sex</span><strong>{patient.sex}</strong><span>Recorded visits</span><strong>{visits.length}</strong></div><button className="btn btn-secondary full-width" onClick={()=>choosePage('Patients')}>Open patient record <ChevronRight size={16}/></button></div></section>
          <section className="panel detector-panel"><div className="panel-heading"><div><h2>Try the demo detector</h2><p>Use synthetic text to demonstrate a potential contradiction rule.</p></div><div className="detector-mark"><Activity size={19}/></div></div><textarea value={demoText} onChange={e=>setDemoText(e.target.value)} aria-label="Synthetic demo text"/><div className="detector-actions"><span>Demo only · Do not enter real patient data</span><button className="btn btn-primary" onClick={runDemoAnalysis}><Activity size={16}/> Analyze sample text</button></div>{analysisResult&&<pre className="analysis-result">{analysisResult}</pre>}</section>
        </>}
        {activePage==='Visit timeline'||activePage==='My visits' ? <section className="panel timeline-panel"><div className="panel-heading"><div><h2>{role==='patient'?'My visit history':'Complete patient visit history'}</h2><p>Chronological encounters with source-linked context</p></div><span className="pill" style={{background:'#e0f7f1',color:'#117b6d'}}>{visits.length} visits</span></div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by reason, department, or type..."/><Filter size={16}/></div><Timeline visits={visibleVisits.slice().sort((a,b)=>a.visit_date.localeCompare(b.visit_date))} selected={selectedVisit} onSelect={setSelectedVisit}/></section>:null}
        {activePage==='Patients' && <section className="panel table-panel"><div className="panel-heading"><div><h2>Patient registry</h2><p>Authorized synthetic patient records</p></div><span className="pill" style={{background:'#e0f7f1',color:'#117b6d'}}>{patients.length} patients</span></div>{patients.map(p=><button className={`patient-list-row ${p.id===patient.id?'selected':''}`} key={p.id} onClick={()=>{setPatient(p);setActivePage('Overview')}}><div className="patient-avatar small"><HeartPulse size={18}/></div><div className="patient-list-copy"><strong>{p.display_name}</strong><span>{p.patient_code} · {p.age} years</span></div><ChevronRight size={17}/></button>)}</section>}
        {(activePage==='Documents'||activePage==='My documents') && <section className="panel table-panel"><div className="panel-heading"><div><h2>{activePage}</h2><p>Documents currently linked to the selected demo patient</p></div><button className="btn btn-secondary" onClick={()=>setNotice('Upload API is not implemented in this first starter. Next milestone: secure PDF/TXT upload and extraction.')}><UploadCloud size={16}/> Upload document</button></div><div className="document-list">{documents.map(d=><div className="document-row" key={d.id}><div className="doc-icon"><FileText size={18}/></div><div className="doc-copy"><strong>{d.title}</strong><span>{d.document_type} · {fmtDate(d.document_date)} · {d.note}</span></div><span className="status status-good"><CheckCircle2 size={13}/>{d.status}</span></div>)}</div></section>}
        {(activePage==='Contradictions'||activePage==='Record requests') && <section className="finding-list">{findings.map(f=><div className="panel finding-card" key={f.id}><div className="finding-top"><span className="pill" style={{background:'#fff4d8',color:'#9b6a10'}}><AlertTriangle size={13}/>{f.finding_type} · {f.status.replace('_',' ')}</span><span className="finding-id">MC-F{String(f.id).padStart(3,'0')}</span></div><h3>{f.title}</h3><p>{f.explanation}</p><div className="evidence-grid"><div><span>Source A</span><p>{f.source_a}</p></div><div><span>Source B</span><p>{f.source_b}</p></div></div>{role==='doctor'&&<button className="btn btn-secondary" onClick={()=>setNotice('Review workflow is planned for the next milestone. No clinical decision has been recorded.')}>Open review workflow <ChevronRight size={15}/></button>}</div>)}</section>}
        {activePage==='Reports' && <section className="panel placeholder-panel"><ClipboardList size={28}/><h2>Clinical review reports</h2><p>Report exports will summarize source-linked findings and review status. Export generation is a planned next milestone.</p></section>}
        {activePage==='Processing queue' && <section className="panel placeholder-panel"><Activity size={28}/><h2>Document processing queue</h2><p>Seeded documents are marked processed. Background jobs and extraction-error handling are planned next.</p></section>}
        {['Users & roles','System health','Audit logs','Settings'].includes(activePage) && <section className="panel placeholder-panel"><ShieldCheck size={28}/><h2>{activePage}</h2><p>This section is a UI placeholder. Production user management, access controls, and audit events must be implemented server-side before public deployment.</p></section>}
        <footer className="app-footer"><span>MedCheck AI · Hackathon MVP</span><span><LockKeyhole size={13}/> Synthetic demo data · Not for clinical use</span></footer>
      </div>
    </main>
  </div>
}
function Stat({icon,label,value,trend,tone}:{icon:React.ReactNode;label:string;value:string;trend:string;tone:string}) {
  return <div className="panel stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-trend"><span><ArrowUpRight size={13}/></span>{trend}</div></div>
}
function Timeline({visits,selected,onSelect}:{visits:Visit[];selected:number;onSelect:(id:number)=>void}) {
  if(!visits.length) return <div className="empty-state">No visits match this search.</div>
  return <div className="timeline-list">{visits.map((v,i)=>{const style=categoryStyles[v.category]||categoryStyles.record_review;return <div className="timeline-row" key={v.id}><div className="timeline-date">{fmtDate(v.visit_date)}<span>{v.department}</span></div><div className="timeline-rail"><div className="timeline-line" style={{background:i===visits.length-1?'transparent':'#e1e9e9'}}/><button aria-label={`Select visit ${v.visit_date}`} className="timeline-dot" style={{background:style.color,boxShadow:selected===v.id?`0 0 0 5px ${style.bg}`:undefined}} onClick={()=>onSelect(v.id)}/></div><button className={`visit-card ${selected===v.id?'visit-selected':''}`} onClick={()=>onSelect(v.id)}><div className="visit-card-top"><span className="pill" style={{background:style.bg,color:style.color}}>{style.label}</span><span className="visit-date-short"><Clock3 size={13}/>{fmtDate(v.visit_date)}</span></div><h3>{v.reason}</h3><p>{v.purpose}</p>{selected===v.id&&<div className="visit-expanded"><div><span>Recorded outcome</span><p>{v.outcome||'Not documented'}</p></div><div><span>Source record</span><p><FileCheck2 size={13}/>{v.source_document||'Source not linked'}</p></div></div>}<div className="visit-card-footer"><span>Visit details</span><ChevronDown size={15}/></div></button></div>})}</div>
}
