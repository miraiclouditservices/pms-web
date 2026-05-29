"use client";
import Link from "next/link";
import React from "react";

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color, sub, trend }: any) {
  return (
    <div style={{ background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"16px 18px",
      display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",transition:"all 0.2s ease-in-out",cursor:"default" }}
      onMouseEnter={e=>{
        e.currentTarget.style.transform="translateY(-2px)";
        e.currentTarget.style.borderColor="#014aad";
        e.currentTarget.style.boxShadow="0 8px 24px rgba(1, 74, 173, 0.12)";
      }}
      onMouseLeave={e=>{
        e.currentTarget.style.transform="none";
        e.currentTarget.style.borderColor="#e2e8f0";
        e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.06)";
      }}>
      <div style={{ width:44,height:44,borderRadius:10,background:color+"1a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <i className={`bi ${icon}`} style={{ color,fontSize:"1.2rem" }} />
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:"0.62rem",fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em" }}>{label}</div>
        <div style={{ fontSize:"1.4rem",fontWeight:800,color:"#1e293b",lineHeight:1.1,marginTop:1 }}>{value??0}</div>
        {sub && <div style={{ fontSize:"0.68rem",color:"#64748b",marginTop:2 }}>{sub}</div>}
      </div>
      {trend !== undefined && (
        <span style={{ fontSize:"0.7rem",fontWeight:700,color:trend>=0?"#16a34a":"#dc2626" }}>
          <i className={`bi bi-arrow-${trend>=0?"up":"down"}-short`} />{Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ label, val, max, color="#014aad", showVal=true }: any) {
  const pct = max > 0 ? Math.min(100, Math.round((val/max)*100)) : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.74rem",fontWeight:600,color:"#475569",marginBottom:4 }}>
        <span>{label}</span>
        {showVal && <span style={{ color }}>{pct}%</span>}
      </div>
      <div style={{ background:"#f1f5f9",borderRadius:8,height:8,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",borderRadius:8,background:color,transition:"width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

// ── Bar Chart (SVG-free, CSS-based) ──────────────────────────────────────────
export function BarChart({ items, height=100, color="#014aad" }: { items:{label:string;value:number}[];height?:number;color?:string }) {
  const max = Math.max(...items.map(i=>i.value), 1);
  return (
    <div>
      <div style={{ display:"flex",alignItems:"flex-end",gap:6,height,paddingTop:8 }}>
        {items.map((item,i)=>(
          <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
            <div style={{ fontSize:"0.58rem",color:"#94a3b8",fontWeight:700,minHeight:14 }}>
              {item.value>0?item.value:""}</div>
            <div style={{ width:"100%",borderRadius:"4px 4px 0 0",
              background:i===items.length-1?color:color+"66",
              height:`${Math.max(4,(item.value/max)*(height-22))}px`,
              transition:"height 0.6s ease" }} />
            <div style={{ fontSize:"0.58rem",color:"#64748b",fontWeight:600,textAlign:"center",whiteSpace:"nowrap" }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line Sparkline (pure SVG) ─────────────────────────────────────────────────
export function LineChart({ items, color="#014aad", height=80 }: { items:{label:string;value:number}[];color?:string;height?:number }) {
  const W=300,H=height,pad=12;
  const max = Math.max(...items.map(i=>i.value),1);
  const pts = items.map((item,i)=>{
    const x=pad+(i/(items.length-1||1))*(W-2*pad);
    const y=pad+(1-item.value/max)*(H-2*pad);
    return [x,y];
  });
  const d  = pts.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  const fill = pts.map(p=>p.join(",")).join(" ")+` ${pts[pts.length-1][0]},${H} ${pts[0][0]},${H}`;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
        <polygon points={fill} fill={color} opacity={0.12} />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.5" fill={color} />)}
      </svg>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}>
        {items.map((item,i)=>(
          <div key={i} style={{ fontSize:"0.58rem",color:"#94a3b8",fontWeight:600,textAlign:"center",flex:1 }}>{item.label}</div>
        ))}
      </div>
    </div>
  );
}

// ── Donut Chart (CSS) ─────────────────────────────────────────────────────────
export function DonutGauge({ pct, color="#014aad", label, size=100 }: any) {
  const r=36,circ=2*Math.PI*r,dash=(pct/100)*circ;
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition:"stroke-dasharray 0.8s ease" }} />
        <text x="50" y="50" textAnchor="middle" dy="0.35em" fontSize="16" fontWeight="800" fill="#1e293b">{pct}%</text>
      </svg>
      {label && <div style={{ fontSize:"0.7rem",color:"#94a3b8",fontWeight:600,textAlign:"center" }}>{label}</div>}
    </div>
  );
}

// ── Panel Wrapper ─────────────────────────────────────────────────────────────
export function Panel({ title, icon, iconColor="#60a5fa", link, linkLabel="View All", children, accent="#1e293b" }: any) {
  return (
    <div style={{ background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ background:accent,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <h6 style={{ color:"#fff",margin:0,fontSize:"0.8rem",fontWeight:700,display:"flex",alignItems:"center",gap:8 }}>
          {icon && <i className={`bi ${icon}`} style={{ color:iconColor }} />}{title}
        </h6>
        {link && <Link href={link} style={{ fontSize:"0.68rem",color:"#60a5fa",textDecoration:"none",fontWeight:700 }}>{linkLabel} →</Link>}
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );
}

// ── Quick Action Grid ─────────────────────────────────────────────────────────
export function QuickActions({ actions }: { actions:{label:string;icon:string;href:string;color?:string}[] }) {
  return (
    <div style={{ display:"grid",gridTemplateColumns:`repeat(${Math.min(actions.length,6)},1fr)`,gap:10 }}>
      {actions.map((a,i)=>(
        <Link key={i} href={a.href} style={{
          display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 8px",
          borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",textDecoration:"none",
          color:"#1e293b",transition:"all 0.15s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background=a.color||"#014aad";e.currentTarget.style.borderColor=a.color||"#014aad";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#1e293b";}}>
          <div style={{ width:38,height:38,borderRadius:9,background:(a.color||"#014aad")+"18",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <i className={`bi ${a.icon}`} style={{ fontSize:"1.1rem",color:a.color||"#014aad" }} />
          </div>
          <span style={{ fontSize:"0.65rem",fontWeight:700,textAlign:"center",lineHeight:1.3 }}>{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────────────────
const PILL_CFG: Record<string,{bg:string;cl:string}> = {
  Pending:{bg:"#fef9c3",cl:"#854d0e"},Approved:{bg:"#dcfce7",cl:"#166534"},
  Rejected:{bg:"#fee2e2",cl:"#991b1b"},"Checked-In":{bg:"#dbeafe",cl:"#1e40af"},
  "Checked-Out":{bg:"#f1f5f9",cl:"#475569"},Active:{bg:"#dcfce7",cl:"#166534"},
  Expired:{bg:"#fee2e2",cl:"#991b1b"},Cleared:{bg:"#dbeafe",cl:"#1e40af"},
};
export function StatusPill({ status }: { status:string }) {
  const s = PILL_CFG[status]||{bg:"#f1f5f9",cl:"#475569"};
  return <span style={{ fontSize:"0.68rem",fontWeight:700,padding:"2px 9px",borderRadius:20,background:s.bg,color:s.cl }}>{status}</span>;
}

// ── Dash Header ───────────────────────────────────────────────────────────────
export function DashHeader({ title, subtitle, user, accentColor="#014aad", gradientFrom="#1e293b", gradientTo="#0f172a", children }: any) {
  return (
    <div style={{ background:`linear-gradient(135deg,${gradientFrom} 0%,${gradientTo} 100%)`,
      borderRadius:16,padding:"22px 28px",marginBottom:22,
      display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16 }}>
      <div style={{ flex:1,minWidth:"280px" }}>
        <div style={{ fontSize:"0.62rem",fontWeight:800,letterSpacing:"0.1em",color:accentColor,textTransform:"uppercase",marginBottom:4 }}>
          {user?.role||"Dashboard"}
        </div>
        <h2 style={{ color:"#fff",fontWeight:800,fontSize:"1.5rem",margin:0 }}>{title}</h2>
        <p style={{ color:"#94a3b8",fontSize:"0.78rem",margin:"4px 0 0" }}>{subtitle}</p>
        {children}
      </div>
      <div style={{ display:"flex",gap:10,alignItems:"center" }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#fff",fontWeight:700,fontSize:"0.9rem" }}>{user?.name||"User"}</div>
          <div style={{ fontSize:"0.68rem",fontWeight:600,color:accentColor }}>{user?.role}</div>
        </div>
        <div style={{ width:42,height:42,borderRadius:"50%",background:accentColor,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <i className="bi bi-person-fill" style={{ color:"#fff",fontSize:"1.2rem" }} />
        </div>
      </div>
    </div>
  );
}

// ── Alert Item ────────────────────────────────────────────────────────────────
export function AlertItem({ icon, iconColor, title, sub, time }: any) {
  return (
    <div style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 0",borderBottom:"1px solid #f1f5f9" }}>
      <div style={{ width:32,height:32,borderRadius:8,background:iconColor+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <i className={`bi ${icon}`} style={{ color:iconColor,fontSize:"0.85rem" }} />
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:"0.78rem",fontWeight:700,color:"#1e293b" }}>{title}</div>
        <div style={{ fontSize:"0.68rem",color:"#94a3b8" }}>{sub}</div>
      </div>
      {time && <div style={{ fontSize:"0.62rem",color:"#94a3b8",flexShrink:0 }}>{time}</div>}
    </div>
  );
}

// ── Grid helpers ──────────────────────────────────────────────────────────────
export const DASH_STYLES = `
  .d-g2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  .d-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .d-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .d-g5{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
  .d-mb{margin-bottom:20px}
  @media(max-width:900px){.d-g4,.d-g5{grid-template-columns:repeat(2,1fr)}.d-g3{grid-template-columns:1fr 1fr}.d-g2{grid-template-columns:1fr}}
`;
