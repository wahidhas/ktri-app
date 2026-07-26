import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Home, ClipboardList, Map, Award, User, LogOut, Settings, Download, 
  ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Brain, 
  Target, Activity, Users, FileText, FileSpreadsheet, Check, ShieldAlert,
  Database, RefreshCw, Lock, ChevronDown, Mail
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDfee6kBJ7CeHUGKuZsneDElbwcymBgxrw",
  authDomain: "ktri-app.firebaseapp.com",
  projectId: "ktri-app",
  storageBucket: "ktri-app.firebasestorage.app",
  messagingSenderId: "589384620987",
  appId: "1:589384620987:web:7e49f878880ca80313c29e",
  measurementId: "G-YJTFYNN6SK"
};

const app = initializeApp(firebaseConfig);
let analytics;
try { analytics = getAnalytics(app); } catch (e) { console.log("Analytics init skipped"); }
const auth = getAuth(app);
const db = getFirestore(app);

const COLLECTION_NAME = 'ktri_assessments';

const COLORS = {
  emerald: '#10b981', // 81-100 Agen Perubahan
  blue: '#3b82f6',    // 61-80 Siap Bertransformasi
  yellow: '#eab308',  // 41-60 Berkembang
  orange: '#f59e0b',  // 21-40 Mulai Siap
  red: '#ef4444'      // 0-20 Belum Siap
};

const getCategory = (score) => {
  if (score >= 81) return { label: 'Agen Perubahan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', hex: COLORS.emerald, bgHex: '#d1fae5' };
  if (score >= 61) return { label: 'Siap Bertransformasi', color: 'bg-blue-100 text-blue-800 border-blue-200', hex: COLORS.blue, bgHex: '#dbeafe' };
  if (score >= 41) return { label: 'Berkembang', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', hex: COLORS.yellow, bgHex: '#fef08a' };
  if (score >= 21) return { label: 'Mulai Siap', color: 'bg-orange-100 text-orange-800 border-orange-200', hex: COLORS.orange, bgHex: '#ffedd5' };
  return { label: 'Belum Siap', color: 'bg-red-100 text-red-800 border-red-200', hex: COLORS.red, bgHex: '#fee2e2' };
};

const SiapLogo = ({ className = "w-10 h-10" }) => {
  const [error, setError] = useState(false);
  if (error) return <CheckCircle className={`text-emerald-600 ${className}`} />;
  return <img src="/logo-siap.png" alt="Logo SIAP" className={`object-contain ${className}`} onError={() => setError(true)} />;
};

const Card = ({ children, className = "", noPadding = false }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${noPadding ? '' : 'p-5 sm:p-6'} ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, colorClass }) => (
  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
    {children}
  </span>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon: Icon, type = "button" }) => {
  const baseStyle = "flex items-center justify-center font-semibold rounded-2xl transition-all active:scale-[0.98] min-h-[52px] px-5 w-full sm:w-auto";
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 disabled:bg-emerald-300",
    secondary: "bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:bg-gray-100",
    outline: "border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 bg-white disabled:border-gray-100",
    danger: "bg-red-50 hover:bg-red-100 text-red-700"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

const AdminDashboard = ({ data }) => {
  const totalTeachers = data.length;
  const categoriesCount = { agen: 0, siap: 0, berkembang: 0, mulai: 0, belum: 0 };
  let totals = { mindset: 0, kma: 0, pedagogical: 0, digital: 0, kflf: 0, transformation: 0 };
  let weaknessesCount = {};

  data.forEach(t => {
    if (t.scores.overall >= 81) categoriesCount.agen++;
    else if (t.scores.overall >= 61) categoriesCount.siap++;
    else if (t.scores.overall >= 41) categoriesCount.berkembang++;
    else if (t.scores.overall >= 21) categoriesCount.mulai++;
    else categoriesCount.belum++;

    totals.mindset += t.scores.mindset || 0;
    totals.kma += t.scores.kma || 0;
    totals.pedagogical += t.scores.pedagogical || 0;
    totals.digital += t.scores.digital || 0;
    totals.kflf += t.scores.kflf || 0;
    totals.transformation += t.scores.transformation || 0;

    if (t.weaknesses) {
      t.weaknesses.forEach(w => {
        weaknessesCount[w] = (weaknessesCount[w] || 0) + 1;
      });
    }
  });

  const radarData = [
    { subject: 'Mindset', A: totalTeachers ? totals.mindset / totalTeachers : 0, fullMark: 100 },
    { subject: 'KMA 1503', A: totalTeachers ? totals.kma / totalTeachers : 0, fullMark: 100 },
    { subject: 'Pedagogical', A: totalTeachers ? totals.pedagogical / totalTeachers : 0, fullMark: 100 },
    { subject: 'Digital & AI', A: totalTeachers ? totals.digital / totalTeachers : 0, fullMark: 100 },
    { subject: 'KFLF', A: totalTeachers ? totals.kflf / totalTeachers : 0, fullMark: 100 },
    { subject: 'Transformasi', A: totalTeachers ? totals.transformation / totalTeachers : 0, fullMark: 100 },
  ];

  const pieData = [
    { name: 'Agen Perubahan', value: categoriesCount.agen, color: COLORS.emerald },
    { name: 'Siap', value: categoriesCount.siap, color: COLORS.blue },
    { name: 'Berkembang', value: categoriesCount.berkembang, color: COLORS.yellow },
    { name: 'Mulai Siap', value: categoriesCount.mulai, color: COLORS.orange },
    { name: 'Belum Siap', value: categoriesCount.belum, color: COLORS.red },
  ].filter(d => d.value > 0);

  const priorityTopics = Object.keys(weaknessesCount).map(topic => {
    const issueCount = weaknessesCount[topic];
    const impactPercentage = (issueCount / totalTeachers) * 100;
    
    let type = 'Workshop';
    let icon = ClipboardList;
    if (topic.includes('KMA')) { type = 'In-House Training'; icon = Map; }
    else if (topic.includes('Pedagogik')) { type = 'Mentoring Khusus'; icon = Users; }
    else if (topic.includes('Digital')) { type = 'Pelatihan Teknis'; icon = Activity; }
    else if (topic.includes('KFLF')) { type = 'FGD Framework'; icon = Target; }
    else if (topic.includes('Mindset') || topic.includes('Transformasi')) { type = 'Sesi Motivasi'; icon = Brain; }

    return { topic, issuePercentage: impactPercentage, type, icon };
  }).sort((a, b) => b.issuePercentage - a.issuePercentage).slice(0, 3);

  if (priorityTopics.length === 0 && totalTeachers > 0) {
    priorityTopics.push({ topic: 'Peningkatan Lanjutan (Advanced)', issuePercentage: 0, type: 'Sharing Session', icon: Award });
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard SIAP</h1>
          <p className="text-gray-500 text-sm mt-1">Sistem Indeks Asesmen Pendidik - Khairul Falah</p>
        </div>
        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center">
          <Database className="w-4 h-4 mr-1.5" /> {totalTeachers} Data Guru
        </div>
      </div>

      {totalTeachers === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 border-gray-300">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Belum Ada Data Asesmen</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Silakan minta guru-guru untuk membuat akun dan mengisi asesmen SIAP. Data akan muncul di sini secara otomatis.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card noPadding className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 overflow-hidden relative">
              <div className="p-4 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-emerald-900 text-[11px] uppercase tracking-wider font-bold">Agen</h3>
                  <Award className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-extrabold text-emerald-600">{categoriesCount.agen}</p>
              </div>
              <div className="bg-emerald-100/50 px-4 py-1.5 text-[10px] font-bold text-emerald-700">Skor 81-100</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-blue-50 to-white border-blue-100 overflow-hidden relative">
              <div className="p-4 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-blue-900 text-[11px] uppercase tracking-wider font-bold">Siap</h3>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-3xl font-extrabold text-blue-600">{categoriesCount.siap}</p>
              </div>
              <div className="bg-blue-100/50 px-4 py-1.5 text-[10px] font-bold text-blue-700">Skor 61-80</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100 overflow-hidden relative">
              <div className="p-4 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-yellow-900 text-[11px] uppercase tracking-wider font-bold">Berkembang</h3>
                  <Activity className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-3xl font-extrabold text-yellow-600">{categoriesCount.berkembang}</p>
              </div>
              <div className="bg-yellow-100/50 px-4 py-1.5 text-[10px] font-bold text-yellow-700">Skor 41-60</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-orange-50 to-white border-orange-100 overflow-hidden relative">
              <div className="p-4 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-orange-900 text-[11px] uppercase tracking-wider font-bold">Mulai</h3>
                  <Users className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-3xl font-extrabold text-orange-600">{categoriesCount.mulai}</p>
              </div>
              <div className="bg-orange-100/50 px-4 py-1.5 text-[10px] font-bold text-orange-700">Skor 21-40</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-red-50 to-white border-red-100 overflow-hidden relative">
              <div className="p-4 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-red-900 text-[11px] uppercase tracking-wider font-bold">Belum</h3>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-3xl font-extrabold text-red-600">{categoriesCount.belum}</p>
              </div>
              <div className="bg-red-100/50 px-4 py-1.5 text-[10px] font-bold text-red-700">Skor 0-20</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-base font-bold text-gray-800 mb-6">Peta Kesiapan SIAP Rata-rata</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                    <Radar name="Rata-rata Madrasah" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-bold text-gray-800 mb-6">Distribusi Level SIAP</h3>
              <div className="h-[280px] w-full flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 500}}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-400 font-medium">Belum cukup data</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="bg-gray-900 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Target className="w-48 h-48" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <Brain className="w-6 h-6 text-emerald-400 mr-2" />
                <h3 className="text-xl font-bold text-white">Training Priority Engine</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6 max-w-lg">Sistem AI merekomendasikan prioritas intervensi pelatihan berdasarkan analisis area terlemah kolektif pada SIAP.</p>
              
              <div className="space-y-3">
                {priorityTopics.map((p, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${idx === 0 ? 'bg-red-500/20 text-red-400' : idx === 1 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <p.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-red-500/20 text-red-300' : idx === 1 ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {idx === 0 ? 'Prioritas Utama' : idx === 1 ? 'Prioritas Menengah' : 'Pengembangan'}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-lg">{p.topic}</h4>
                        <p className="text-gray-400 text-xs">
                          {p.issuePercentage > 0 ? `Dibutuhkan oleh ${Math.round(p.issuePercentage)}% Guru` : 'Status: Optimal'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center shrink-0 whitespace-nowrap">
                      Rekomendasi: {p.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

const ReadinessMap = ({ data }) => {
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-[50vh] text-gray-400 font-bold">Belum Ada Data Asesmen</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Readiness Map (SIAP)</h1>
          <p className="text-gray-500 text-sm mt-1">Heatmap kesiapan per individu (Skor 0-100)</p>
        </div>
      </div>

      <Card noPadding className="overflow-x-auto shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
              <th className="p-4 font-bold">Nama Guru & Mapel</th>
              <th className="p-4 font-bold text-center w-20">Mindset</th>
              <th className="p-4 font-bold text-center w-20">KMA 1503</th>
              <th className="p-4 font-bold text-center w-20">Pedagogi</th>
              <th className="p-4 font-bold text-center w-20">Digital/AI</th>
              <th className="p-4 font-bold text-center w-20">KFLF</th>
              <th className="p-4 font-bold text-center w-20">Transform</th>
              <th className="p-4 font-bold text-center bg-gray-100 w-24">Skor Akhir</th>
              <th className="p-4 font-bold w-36">Kategori</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.sort((a,b) => b.scores.overall - a.scores.overall).map(teacher => {
              const cat = getCategory(teacher.scores.overall);
              
              const ScoreCell = ({ score }) => {
                let bg = "bg-red-100 text-red-800";
                if (score >= 81) bg = "bg-emerald-100 text-emerald-800";
                else if (score >= 61) bg = "bg-blue-100 text-blue-800";
                else if (score >= 41) bg = "bg-yellow-100 text-yellow-800";
                else if (score >= 21) bg = "bg-orange-100 text-orange-800";
                
                return (
                  <td className="p-2 text-center">
                    <div className={`w-full py-2 rounded-lg font-bold ${bg} border border-white/20`}>
                      {Math.round(score || 0)}
                    </div>
                  </td>
                );
              }

              return (
                <tr key={teacher.id || teacher.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{teacher.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{teacher.subject} ({teacher.experience})</div>
                  </td>
                  <ScoreCell score={teacher.scores.mindset} />
                  <ScoreCell score={teacher.scores.kma} />
                  <ScoreCell score={teacher.scores.pedagogical} />
                  <ScoreCell score={teacher.scores.digital} />
                  <ScoreCell score={teacher.scores.kflf} />
                  <ScoreCell score={teacher.scores.transformation} />
                  <td className="p-2 text-center bg-gray-50">
                    <div className="w-full py-2 rounded-lg font-black text-gray-900 text-base">
                      {Math.round(teacher.scores.overall)}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge colorClass={cat.color}>{cat.label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      
      <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600 bg-white p-4 rounded-xl border border-gray-100">
        <span className="mr-2 font-bold">Legenda Skor:</span>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> 81-100 (Sangat Kuat)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div> 61-80 (Kuat)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> 41-60 (Menengah)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500"></div> 21-40 (Kurang)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> 0-20 (Sangat Kurang)</div>
      </div>
    </div>
  );
};

const ChampionModule = ({ data }) => {
  const validData = data.filter(t => t?.scores?.overall !== undefined);
  
  const champions = validData.filter(t => t.scores.overall >= 81).sort((a,b) => b.scores.overall - a.scores.overall);
  
  const potentialChampions = champions.length === 0 
    ? validData.filter(t => t.scores.overall >= 61 && t.scores.overall < 81).sort((a,b) => b.scores.overall - a.scores.overall).slice(0, 3)
    : [];

  const coaching = validData.filter(t => t.scores.overall < 81).sort((a,b) => a.scores.overall - b.scores.overall);

  if (validData.length === 0) return (
    <div className="flex items-center justify-center h-[50vh] text-gray-400 font-bold">Belum Ada Data Asesmen</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen SDM</h1>
        <p className="text-gray-500 text-sm mt-1">Agen Perubahan & Target Pendampingan SIAP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center mb-6 pb-4 border-b border-emerald-100">
            <div className="p-3 bg-emerald-100 rounded-2xl mr-4 shadow-sm">
              <Award className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900">Agen Perubahan</h2>
              <p className="text-emerald-700 text-xs font-medium">Siap menjadi penggerak dan mentor</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {champions.length === 0 && potentialChampions.length === 0 && (
              <p className="text-gray-500 text-center py-8">Belum ada Agen Perubahan</p>
            )}
            
            {champions.length === 0 && potentialChampions.length > 0 && (
              <div className="mb-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs p-2.5 rounded-xl font-bold text-center">
                Belum ada Agen (Skor 81+). Menampilkan Kandidat Terdekat:
              </div>
            )}

            {(champions.length > 0 ? champions : potentialChampions).map((c, i) => (
              <div key={c.userId} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-200">
                    {i+1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{c.subject}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-600 font-bold mb-1 uppercase tracking-wider">Skor SIAP</div>
                  <div className="font-black text-emerald-600 text-2xl leading-none">{Math.round(c.scores.overall)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-orange-200 bg-orange-50/30">
          <div className="flex items-center mb-6 pb-4 border-b border-orange-100">
            <div className="p-3 bg-orange-100 rounded-2xl mr-4 shadow-sm">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-orange-900">Coaching Candidates</h2>
              <p className="text-orange-700 text-xs font-medium">Prioritas pendampingan bagi yang belum mencapai Agen</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {coaching.length === 0 && <p className="text-gray-500 text-center py-8">Semua guru sudah mencapai level Agen!</p>}
            {coaching.map((c) => {
              let badgeColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
              if (c.scores.overall <= 40) badgeColor = 'bg-red-100 text-red-700 border-red-200';
              else if (c.scores.overall >= 61) badgeColor = 'bg-blue-100 text-blue-700 border-blue-200';

              return (
                <div key={c.userId} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{c.subject}</div>
                    </div>
                    <Badge colorClass={badgeColor}>
                      Skor: {Math.round(c.scores.overall)}
                    </Badge>
                  </div>
                  {c.weaknesses && c.weaknesses.length > 0 && (
                    <div className="bg-orange-50 p-2.5 rounded-xl text-xs border border-orange-100/50">
                      <span className="font-bold text-orange-800 block mb-1">Fokus Perbaikan:</span>
                      <span className="text-orange-700">{c.weaknesses.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ASSESSMENT_STEPS = [
  {
    id: 'profile', title: 'Profil Anda', description: 'Mari mulai dengan informasi dasar Anda',
    questions: [
      { id: 'name', type: 'text', label: 'Nama Lengkap' },
      { id: 'subject', type: 'select', label: 'Mata Pelajaran Utama', options: ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Agama Islam', 'Olahraga', 'Seni Budaya', 'Guru Kelas', 'Lainnya'] },
      { id: 'experience', type: 'select', label: 'Lama Mengajar', options: ['< 1 Tahun', '1-5 Tahun', '5-10 Tahun', '> 10 Tahun'] }
    ]
  },
  {
    id: 'mindset', title: 'Domain A: Mindset & Growth', description: 'Nilai dari 1 (Sangat Tidak Setuju) s.d 5 (Sangat Setuju)',
    questions: [
      { id: 'min_1', type: 'scale', label: 'Saya terbuka terhadap perubahan dalam dunia pendidikan.' },
      { id: 'min_2', type: 'scale', label: 'Saya bersedia mempelajari pendekatan pembelajaran baru.' },
      { id: 'min_3', type: 'scale', label: 'Saya melihat perubahan sebagai peluang untuk berkembang.' },
      { id: 'min_4', type: 'scale', label: 'Saya aktif mencari cara meningkatkan kualitas pembelajaran.' },
      { id: 'min_5', type: 'scale', label: 'Saya siap keluar dari zona nyaman untuk menjadi guru yang lebih baik.' }
    ]
  },
  {
    id: 'kma', title: 'Domain B: KMA 1503 Readiness', description: 'Nilai dari 1 (Sangat Tidak Setuju) s.d 5 (Sangat Setuju)',
    questions: [
      { id: 'kma_1', type: 'scale', label: 'Saya memahami arah kebijakan KMA Nomor 1503 Tahun 2025.' },
      { id: 'kma_2', type: 'scale', label: 'Saya memahami konsep Pembelajaran Mendalam (Deep Learning).' },
      { id: 'kma_3', type: 'scale', label: 'Saya memahami prinsip Kurikulum Berbasis Cinta.' },
      { id: 'kma_4', type: 'scale', label: 'Saya memahami pentingnya pembelajaran yang bermakna dan reflektif.' },
      { id: 'kma_5', type: 'scale', label: 'Saya memahami perkembangan asesmen terbaru di madrasah.' }
    ]
  },
  {
    id: 'pedagogical', title: 'Domain C: Pedagogical Readiness', description: 'Nilai dari 1 (Sangat Tidak Setuju) s.d 5 (Sangat Setuju)',
    questions: [
      { id: 'ped_1', type: 'scale', label: 'Saya mampu merancang pembelajaran yang aktif dan bermakna.' },
      { id: 'ped_2', type: 'scale', label: 'Saya mampu menggunakan berbagai strategi pembelajaran.' },
      { id: 'ped_3', type: 'scale', label: 'Saya mampu melakukan asesmen formatif selama pembelajaran.' },
      { id: 'ped_4', type: 'scale', label: 'Saya mampu memfasilitasi diskusi dan kolaborasi siswa.' },
      { id: 'ped_5', type: 'scale', label: 'Saya mampu mengelola kelas secara efektif.' }
    ]
  },
  {
    id: 'digital', title: 'Domain D: Digital & AI Readiness', description: 'Nilai dari 1 (Sangat Tidak Setuju) s.d 5 (Sangat Setuju)',
    questions: [
      { id: 'dig_1', type: 'scale', label: 'Saya menggunakan teknologi digital dalam pembelajaran.' },
      { id: 'dig_2', type: 'scale', label: 'Saya pernah menggunakan AI untuk membantu pekerjaan guru.' },
      { id: 'dig_3', type: 'scale', label: 'Saya mampu mengevaluasi hasil yang diberikan AI secara kritis.' },
      { id: 'dig_4', type: 'scale', label: 'Saya memahami etika penggunaan AI dalam pendidikan.' },
      { id: 'dig_5', type: 'scale', label: 'Saya tertarik mempelajari pemanfaatan AI untuk pembelajaran.' }
    ]
  },
  {
    id: 'kflf', title: 'Domain E: KFLF Readiness', description: 'Khairul Falah Learning Framework. Nilai 1 s.d 5',
    questions: [
      { id: 'kflf_1', type: 'scale', label: 'Saya memahami filosofi KFLF.' },
      { id: 'kflf_2', type: 'scale', label: 'Saya memahami profil Insan Khairul Falah.' },
      { id: 'kflf_3', type: 'scale', label: 'Saya memahami pentingnya life skills dalam pendidikan.' },
      { id: 'kflf_4', type: 'scale', label: 'Saya memahami pentingnya future skills bagi peserta didik.' },
      { id: 'kflf_5', type: 'scale', label: 'Saya memahami peran AI sebagai alat belajar dalam KFLF.' },
      { id: 'kflf_6', type: 'scale', label: 'Saya memahami pembelajaran berbasis proyek dan dampak.' },
      { id: 'kflf_7', type: 'scale', label: 'Saya memahami pentingnya kolaborasi antar guru dalam implementasi KFLF.' }
    ]
  },
  {
    id: 'transformation', title: 'Domain F: Transformation Readiness', description: 'Nilai dari 1 (Sangat Tidak Setuju) s.d 5 (Sangat Setuju)',
    questions: [
      { id: 'trans_1', type: 'scale', label: 'Saya siap mencoba pendekatan baru meskipun membutuhkan usaha tambahan.' },
      { id: 'trans_2', type: 'scale', label: 'Saya siap berkolaborasi dengan guru lain dalam proses transformasi.' },
      { id: 'trans_3', type: 'scale', label: 'Saya siap menerima evaluasi dan umpan balik untuk berkembang.' },
      { id: 'trans_4', type: 'scale', label: 'Saya siap mendukung implementasi KFLF di madrasah.' },
      { id: 'trans_5', type: 'scale', label: 'Saya siap menjadi bagian dari perubahan budaya belajar di Khairul Falah.' }
    ]
  },
  {
    id: 'closing', title: 'Komitmen & Refleksi', description: 'Langkah terakhir, mari refleksikan komitmen Anda terhadap transformasi.',
    questions: [
      { id: 'komitmen', type: 'scale', label: 'KOMITMEN: Saya siap menjadi bagian dari proses transformasi pendidikan di Khairul Falah.' },
      { id: 'ref_1', type: 'textarea', label: 'Menurut Anda, tantangan terbesar yang akan Anda hadapi dalam proses transformasi pendidikan di Khairul Falah adalah?' },
      { id: 'ref_2', type: 'textarea', label: 'Dukungan apa yang Anda harapkan dari yayasan dan pimpinan madrasah agar proses transformasi ini berhasil?' }
    ]
  }
];

const AssessmentWizard = ({ onComplete, isSaving }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleInputChange = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));

  const calculateResults = () => {
    const sumScale = (prefix, count) => {
      let sum = 0; let answered = 0;
      for (let i = 1; i <= count; i++) {
        if (answers[`${prefix}_${i}`]) { sum += parseInt(answers[`${prefix}_${i}`]); answered++; }
      }
      return answered === 0 ? 0 : (sum / (answered * 5)) * 100;
    };

    const scores = {
      mindset: sumScale('min', 5),
      kma: sumScale('kma', 5),
      pedagogical: sumScale('ped', 5),
      digital: sumScale('dig', 5),
      kflf: sumScale('kflf', 7),
      transformation: sumScale('trans', 5)
    };
    
    // Overall SIAP Score
    scores.overall = Object.values(scores).reduce((a,b)=>a+b,0) / 6;

    // Detect Weaknesses
    const weaknesses = [];
    if (scores.mindset < 70) weaknesses.push('Mindset & Growth');
    if (scores.kma < 70) weaknesses.push('Pemahaman KMA 1503');
    if (scores.pedagogical < 70) weaknesses.push('Kemampuan Pedagogik');
    if (scores.digital < 70) weaknesses.push('Literasi Digital & AI');
    if (scores.kflf < 70) weaknesses.push('Pemahaman KFLF');
    if (scores.transformation < 70) weaknesses.push('Kesiapan Transformasi');

    onComplete({ 
      name: answers.name || "Guru Tanpa Nama", 
      subject: answers.subject || "Belum Memilih", 
      experience: answers.experience || "Belum Memilih",
      scores,
      komitmen: answers.komitmen ? (parseInt(answers.komitmen) / 5) * 100 : 0,
      refleksi_1: answers.ref_1 || "",
      refleksi_2: answers.ref_2 || "",
      weaknesses
    });
  };

  const step = ASSESSMENT_STEPS[currentStep];
  const progress = ((currentStep) / ASSESSMENT_STEPS.length) * 100;

  let canProceed = false;
  if (currentStep === 0) canProceed = answers.name && answers.subject && answers.experience;
  else {
    canProceed = step.questions.every(q => {
      if (q.type === 'textarea') return answers[q.id] && answers[q.id].trim().length > 0;
      return answers[q.id] !== undefined && answers[q.id] !== '';
    });
  }

  return (
    <div className="max-w-xl mx-auto w-full pb-20">
      <div className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10 pt-4 pb-6">
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-xl font-bold text-gray-900">Asesmen SIAP</h2>
          <span className="text-sm font-bold text-emerald-600">{Math.round(progress)}% Selesai</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 w-full overflow-hidden shadow-inner">
          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <Card className="min-h-[400px] flex flex-col shadow-lg border-0 ring-1 ring-gray-100">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{step.title}</h3>
          {step.description && <p className="text-sm font-medium text-gray-500 mb-8">{step.description}</p>}

          <div className="space-y-8">
            {step.questions.map(q => (
              <div key={q.id} className="space-y-3">
                <label className={`block text-base font-bold text-gray-800 leading-tight ${q.id === 'komitmen' ? 'text-blue-700 bg-blue-50 p-4 rounded-xl' : ''}`}>
                  {q.label}
                </label>
                
                {q.type === 'text' && (
                  <input type="text" className="w-full p-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none transition-colors bg-gray-50 focus:bg-white" placeholder="Masukkan jawaban..." value={answers[q.id] || ''} onChange={(e) => handleInputChange(q.id, e.target.value)} />
                )}
                
                {q.type === 'textarea' && (
                  <textarea 
                    className="w-full p-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none transition-colors bg-gray-50 focus:bg-white min-h-[120px] resize-y leading-relaxed" 
                    placeholder="Ketik jawaban Anda di sini..." 
                    value={answers[q.id] || ''} 
                    onChange={(e) => handleInputChange(q.id, e.target.value)} 
                  />
                )}
                
                {q.type === 'select' && (
                  <div className="relative">
                    <select className="w-full p-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none transition-colors bg-gray-50 focus:bg-white appearance-none pr-10" value={answers[q.id] || ''} onChange={(e) => handleInputChange(q.id, e.target.value)}>
                      <option value="" disabled>Pilih salah satu...</option>
                      {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {q.type === 'scale' && (
                  <div className="flex justify-between items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button key={val} onClick={() => handleInputChange(q.id, val)}
                        className={`flex-1 h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
                          answers[q.id] === val 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-2' 
                            : 'bg-gray-50 text-gray-500 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-10 pt-6 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0 || isSaving}>
            <ChevronLeft className="w-5 h-5 mr-1" /> Kembali
          </Button>
          
          {currentStep < ASSESSMENT_STEPS.length - 1 ? (
            <Button className="flex-1" onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed || isSaving}>
              Lanjut <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={calculateResults} disabled={!canProceed || isSaving}>
              {isSaving ? (
                 <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                 <>Kirim Data SIAP <CheckCircle className="w-5 h-5 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

const IndividualReport = ({ result, onRetake }) => {
  if (!result) return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
        <ClipboardList className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Asesmen Belum Diisi</h2>
      <p className="text-gray-500 text-base mb-8 max-w-sm">Silakan mulai evaluasi SIAP Anda untuk melihat indeks kesiapan dan rekomendasi pengembangan.</p>
      <Button onClick={onRetake} className="w-full sm:w-auto text-lg h-14 px-8">Mulai Asesmen SIAP</Button>
    </div>
  );

  const category = getCategory(result.scores.overall);
  const radarData = Object.entries(result.scores).filter(([k]) => k !== 'overall').map(([k, v]) => ({
    subject: k.toUpperCase(), A: v, fullMark: 100
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10 id-report-print">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Hasil SIAP</h1>
        <p className="text-gray-500 text-sm">{result.name} • {result.subject}</p>
      </div>

      <Card className="text-center border-0 shadow-lg relative overflow-hidden" style={{ background: `linear-gradient(to bottom right, #ffffff, ${category.bgHex})` }}>
        <div className="absolute top-2 right-2 flex items-center bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-sm print:hidden">
           <CheckCircle className="w-3 h-3 mr-1"/> Tersimpan Online
        </div>
        <div className="inline-block p-4 rounded-3xl bg-white shadow-sm border border-white mb-4 mt-2">
          <Award className="w-16 h-16" style={{ color: category.hex }} />
        </div>
        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Skor Kesiapan Akhir</div>
        <h2 className="text-7xl font-black mb-4 tracking-tighter" style={{ color: category.hex }}>
          {Math.round(result.scores.overall)}
        </h2>
        <div className="mb-6">
          <span className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider border ${category.color}`}>
            Level: {category.label}
          </span>
        </div>
        <p className="text-gray-700 font-medium max-w-md mx-auto leading-relaxed">
          {result.scores.overall >= 81 ? "Luar biasa! Anda adalah Agen Perubahan. Bagikan inspirasi praktik baik Anda ke rekan sejawat." :
           result.scores.overall >= 61 ? "Hebat! Anda sudah di jalur yang tepat menuju implementasi penuh transformasi pendidikan." :
           result.scores.overall >= 41 ? "Tahap yang baik. Mari kembangkan lagi melalui kolaborasi dan pelatihan madrasah." :
           result.scores.overall >= 21 ? "Anda sudah mulai siap. Fokus pada area pengembangan Anda untuk terus bertumbuh." :
           "Jangan khawatir. Sekolah telah menyiapkan program pendampingan khusus untuk memastikan Anda siap dan percaya diri."}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" /> Peta Domain SIAP
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#f3f4f6" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} />
                <Radar dataKey="A" stroke={category.hex} strokeWidth={2} fill={category.hex} fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-md border-gray-100 bg-emerald-50/50">
            <h3 className="font-bold text-emerald-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-500 mr-2"/> Area Kuat Anda
            </h3>
            <ul className="text-sm font-medium text-emerald-800 space-y-3">
              {Object.entries(result.scores).filter(([k,v]) => k !== 'overall' && v >= 70).map(([k,v]) => (
                <li key={k} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-emerald-100">
                  <span className="capitalize">{k}</span> 
                  <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{Math.round(v)}</span>
                </li>
              ))}
              {Object.values(result.scores).filter(v => v >= 70 && v !== result.scores.overall).length === 0 && <li className="text-emerald-600 italic">Terus kembangkan potensi Anda!</li>}
            </ul>
          </Card>
          <Card className="shadow-md border-gray-100 bg-orange-50/50">
            <h3 className="font-bold text-orange-900 mb-4 flex items-center">
              <Target className="w-5 h-5 text-orange-500 mr-2"/> Fokus Pengembangan
            </h3>
            <ul className="text-sm font-medium text-orange-800 space-y-3">
              {Object.entries(result.scores).filter(([k,v]) => k !== 'overall' && v < 70).map(([k,v]) => (
                <li key={k} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                  <span className="capitalize">{k}</span> 
                  <span className="font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{Math.round(v)}</span>
                </li>
              ))}
              {Object.values(result.scores).filter(v => v < 70 && v !== result.scores.overall).length === 0 && <li className="text-emerald-600 italic">Semua area sudah di atas 70!</li>}
            </ul>
          </Card>
        </div>
      </div>
      
      <Card className="shadow-md border-gray-100 bg-blue-50/30">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-blue-500" /> Refleksi & Komitmen
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Indeks Komitmen</p>
            <div className="flex items-center gap-3">
               <div className="h-4 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${result.komitmen || 0}%`}}></div>
               </div>
               <span className="font-black text-blue-700">{result.komitmen || 0}%</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tantangan Terbesar</p>
            <p className="text-sm text-gray-800 italic leading-relaxed">"{result.refleksi_1 || '-'}"</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Harapan Dukungan</p>
            <p className="text-sm text-gray-800 italic leading-relaxed">"{result.refleksi_2 || '-'}"</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 print:hidden">
        <Button onClick={() => window.print()} className="flex-1 h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 border-none">
          <FileText className="w-5 h-5 mr-2" /> Cetak Laporan (PDF)
        </Button>
        <Button onClick={onRetake} variant="outline" className="flex-1 h-14 text-lg bg-white">
          <RefreshCw className="w-5 h-5 mr-2" /> Isi Ulang Asesmen
        </Button>
      </div>
    </div>
  );
};

const ProfileSettings = ({ appRole, userUID, onLogout, setActiveTab, teachersData }) => {
  const handleExportCSV = () => {
    if (!teachersData || teachersData.length === 0) {
      alert("Belum ada data guru yang bisa diekspor!");
      return;
    }
    const headers = [
      "Nama Guru", "Mata Pelajaran", "Pengalaman", 
      "Skor Mindset", "Skor KMA 1503", "Skor Pedagogik", "Skor Digital/AI", "Skor KFLF", "Skor Transformasi", 
      "Skor Akhir (SIAP)", "Komitmen", "Tantangan Terbesar", "Harapan Dukungan"
    ];
    const csvRows = [headers.join(",")]; 
    teachersData.forEach(t => {
      const row = [
        `"${t.name}"`, `"${t.subject}"`, `"${t.experience}"`,
        Math.round(t.scores.mindset || 0), Math.round(t.scores.kma || 0), Math.round(t.scores.pedagogical || 0),
        Math.round(t.scores.digital || 0), Math.round(t.scores.kflf || 0), Math.round(t.scores.transformation || 0),
        Math.round(t.scores.overall || 0), Math.round(t.komitmen || 0),
        `"${(t.refleksi_1 || "").replace(/"/g, '""')}"`, `"${(t.refleksi_2 || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Kesiapan_Guru_SIAP.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const adminMenuItems = [
    { icon: Users, label: 'Coaching Candidates', color: 'text-orange-500', bg: 'bg-orange-100', action: () => setActiveTab('champion') },
    { icon: Map, label: 'Readiness Map', color: 'text-purple-500', bg: 'bg-purple-100', action: () => setActiveTab('readiness') },
    { icon: Download, label: 'Export Data SIAP (CSV)', color: 'text-emerald-500', bg: 'bg-emerald-100', action: handleExportCSV },
  ];

  const guruMenuItems = [];

  const items = appRole === 'admin' ? adminMenuItems : guruMenuItems;

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Akun & Pengaturan</h1>
      <Card className="flex items-center shadow-md border-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-5 backdrop-blur-sm border border-white/30 p-2">
          <SiapLogo className="w-full h-full brightness-0 invert opacity-90" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{appRole === 'admin' ? 'Kepala Madrasah' : 'Akun Guru'}</h2>
          <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mt-1">ID: {userUID?.substring(0,8)}...</p>
        </div>
      </Card>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {items.map((item, idx) => (
          <div key={idx} onClick={item.action} className="p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex items-center justify-between transition-colors">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="font-bold text-gray-700">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        ))}
        <div className="p-4 hover:bg-red-50 active:bg-red-100 cursor-pointer flex items-center transition-colors" onClick={onLogout}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 bg-red-100">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <span className="font-bold text-red-600">Logout dari Sistem</span>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ appRole, activeTab, setActiveTab, children }) => {
  const adminNav = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'readiness', icon: Map, label: 'Readiness' },
    { id: 'champion', icon: Award, label: 'SDM' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];
  const guruNav = [
    { id: 'dashboard', icon: Home, label: 'My Report' },
    { id: 'assessment', icon: ClipboardList, label: 'Asesmen' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];
  const navItems = appRole === 'admin' ? adminNav : guruNav;

  return (
    <div className="flex h-screen bg-gray-50 font-sans print:bg-white print:block print:h-auto">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200 h-screen fixed top-0 left-0 z-40 print:hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-2xl shadow-sm">
            <SiapLogo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-2xl leading-none tracking-tight">SIAP</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 leading-none">Khairul Falah</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Main Menu</div>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3.5 rounded-2xl transition-all font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            )
          })}
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden relative print:overflow-visible print:ml-0 print:h-auto">
        <header className="hidden lg:flex bg-white/80 backdrop-blur-md h-20 border-b border-gray-200 items-center justify-between px-8 shrink-0 sticky top-0 z-30 print:hidden">
          <div className="font-bold text-xl text-gray-800 capitalize">{activeTab === 'dashboard' && appRole === 'guru' ? 'My Report' : activeTab}</div>
          <div className="flex items-center">
            <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border border-emerald-200 flex items-center">
              <Database className="w-4 h-4 mr-2" /> Live Database Aktif
            </span>
          </div>
        </header>

        <header className="lg:hidden bg-white/90 backdrop-blur-md h-16 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30 shadow-sm print:hidden">
          <div className="flex items-center">
             <div className="mr-3 p-1.5 bg-emerald-50 rounded-xl">
               <SiapLogo className="w-6 h-6" />
             </div>
             <div className="font-bold text-lg text-gray-900 tracking-tight">SIAP Mobile</div>
          </div>
          <Database className="w-5 h-5 text-emerald-500" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 lg:pb-8 w-full mx-auto max-w-7xl print:p-0 print:overflow-visible">
          {children}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 sm:h-20 flex items-center justify-around z-50 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe print:hidden">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full relative ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
            >
              {isActive && <div className="absolute top-0 w-12 h-1 bg-emerald-500 rounded-b-full"></div>}
              <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] sm:text-xs font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default function App() {
  const [authUser, setAuthUser] = useState(null); 
  const [appRole, setAppRole] = useState(null); 
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [teachersData, setTeachersData] = useState([]);
  const [myResult, setMyResult] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);

  // Auth States
  const [authMode, setAuthMode] = useState('select'); // select, login, register, admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    // Mendengarkan perubahan sesi saat user me-refresh aplikasi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (user) {
         if (!user.isAnonymous) {
            // Jika user bukan anonim (berarti guru login via email), otomatis masuk dashboard
            setAppRole('guru');
         }
      } else {
         setAppRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachersData(data);
      const userDoc = data.find(d => d.userId === authUser.uid);
      if (userDoc) setMyResult(userDoc);
    }, (error) => {
      console.error("Error fetching realtime data:", error);
    });
    return () => unsubscribe();
  }, [authUser]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAppRole('guru');
      setActiveTab('assessment');
    } catch(err) {
      console.error("Register error:", err);
      if (err.code === 'auth/email-already-in-use') setAuthError("Email sudah terdaftar. Silakan kembali dan Login.");
      else if (err.code === 'auth/weak-password') setAuthError("Password minimal harus 6 karakter.");
      else if (err.code === 'auth/operation-not-allowed') setAuthError("Fitur Login Email belum diaktifkan di Firebase Console!");
      else setAuthError(`Gagal: ${err.message}`);
    }
    setAuthLoading(false);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAppRole('guru');
      setActiveTab('dashboard'); // Akan otomatis diarahkan ke komponen Asesmen Belum Diisi jika tidak ada hasil
    } catch(err) {
      console.error("Login error:", err);
      if (err.code === 'auth/operation-not-allowed') setAuthError("Fitur Login Email belum diaktifkan di Firebase Console!");
      else setAuthError("Email tidak terdaftar atau password salah.");
    }
    setAuthLoading(false);
  }

  const processAdminLogin = async () => {
    if (pin === '123456') {
      try {
        await signInAnonymously(auth); // Admin menggunakan akun anonim untuk membaca semua data
        setAppRole('admin');
        setActiveTab('dashboard');
        setAuthMode('select');
        setAuthError('');
        setPin('');
      } catch (e) {
        setAuthError("Gagal terhubung ke server.");
      }
    } else {
      setAuthError("PIN salah! Silakan coba lagi.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppRole(null);
    setMyResult(null);
    setAuthMode('select');
    setEmail('');
    setPassword('');
  };

  const handleSaveAssessment = async (resultData) => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, authUser.uid);
      await setDoc(docRef, { ...resultData, userId: authUser.uid, timestamp: new Date().toISOString() });
      setActiveTab('dashboard');
    } catch (e) {
      console.error("Gagal menyimpan data:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (appRole === 'admin') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard data={teachersData} />;
        case 'readiness': return <ReadinessMap data={teachersData} />;
        case 'champion': return <ChampionModule data={teachersData} />;
        case 'profile': return <ProfileSettings appRole={appRole} userUID={authUser?.uid} onLogout={handleLogout} setActiveTab={setActiveTab} teachersData={teachersData}/>;
        default: return <AdminDashboard data={teachersData} />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard': return <IndividualReport result={myResult} onRetake={() => setActiveTab('assessment')} />;
        case 'assessment': return <AssessmentWizard onComplete={handleSaveAssessment} isSaving={isSaving} />;
        case 'profile': return <ProfileSettings appRole={appRole} userUID={authUser?.uid} onLogout={handleLogout} setActiveTab={setActiveTab} teachersData={teachersData}/>;
        default: return <IndividualReport result={myResult} onRetake={() => setActiveTab('assessment')} />;
      }
    }
  };

  // Layar Pilihan Login & Register
  if (!appRole || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-gray-100">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <Brain className="w-full h-full transform scale-150 -rotate-12 translate-x-10 translate-y-10" />
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/20 mb-6 p-4">
                <SiapLogo className="w-full h-full" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2 tracking-tight">SIAP</h1>
              <p className="text-emerald-100 text-sm font-medium">Sistem Indeks Asesmen Pendidik</p>
              <p className="text-emerald-200/90 text-[10px] uppercase tracking-widest mt-3 font-bold mx-auto leading-relaxed border-t border-emerald-500/30 pt-3">
                Mengukur Kesiapan Guru untuk Bertumbuh, Beradaptasi, dan Bertransformasi
              </p>
            </div>
          </div>
          
          <div className="p-8 space-y-4 relative min-h-[300px]">
            {authMode === 'select' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <p className="text-center text-gray-500 font-medium text-sm mb-6">Pilih Opsi Masuk</p>
                 <Button className="w-full h-14 text-base" onClick={() => { setAuthMode('login'); setAuthError(''); }}>
                   <User className="w-5 h-5 mr-2" /> Login Guru
                 </Button>
                 <Button variant="outline" className="w-full h-14 text-base" onClick={() => { setAuthMode('register'); setAuthError(''); }}>
                   Buat Akun Baru
                 </Button>
                 <div className="pt-4 border-t border-gray-100 text-center">
                    <button onClick={() => { setAuthMode('admin'); setAuthError(''); }} className="text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors flex items-center justify-center w-full">
                      <ShieldAlert className="w-4 h-4 mr-1.5" /> Masuk sebagai Admin / Pimpinan
                    </button>
                 </div>
               </div>
            )}

            {(authMode === 'login' || authMode === 'register') && (
               <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-gray-900">{authMode === 'login' ? 'Login ke Akun Anda' : 'Buat Akun Baru'}</h3>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" required placeholder="Alamat Email" 
                             className="w-full pl-12 pr-4 py-3.5 text-base font-medium border-2 border-gray-200 rounded-2xl focus:border-emerald-500 bg-gray-50 focus:bg-white outline-none transition-colors"
                             value={email} onChange={e=>setEmail(e.target.value)} />
                   </div>
                   <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="password" required minLength="6" placeholder="Password (Minimal 6 karakter)" 
                             className="w-full pl-12 pr-4 py-3.5 text-base font-medium border-2 border-gray-200 rounded-2xl focus:border-emerald-500 bg-gray-50 focus:bg-white outline-none transition-colors"
                             value={password} onChange={e=>setPassword(e.target.value)} />
                   </div>
                 </div>

                 {authError && <p className="text-red-500 text-xs text-center font-bold">{authError}</p>}
                 
                 <Button type="submit" disabled={authLoading} className="w-full h-14 text-base mt-2">
                   {authLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
                 </Button>
                 
                 <div className="text-center mt-2">
                   <button type="button" onClick={() => setAuthMode('select')} className="text-sm font-semibold text-gray-500 hover:text-gray-900">
                     Kembali
                   </button>
                 </div>
               </form>
            )}

            {authMode === 'admin' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-gray-900">Masukkan PIN Admin</h3>
                   <button onClick={() => { setAuthMode('select'); setAuthError(''); setPin(''); }} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Batal</button>
                 </div>
                 <input 
                   type="password" 
                   inputMode="numeric"
                   maxLength="6"
                   placeholder="••••••" 
                   className={`w-full p-4 text-center text-3xl tracking-widest font-black border-2 rounded-2xl outline-none transition-colors ${authError ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 focus:border-emerald-500 bg-gray-50 focus:bg-white'}`}
                   value={pin}
                   onChange={(e) => { 
                     setPin(e.target.value.replace(/[^0-9]/g, '')); 
                     setAuthError(''); 
                   }}
                   onKeyDown={(e) => e.key === 'Enter' && processAdminLogin()}
                 />
                 {authError && <p className="text-red-500 text-xs text-center font-bold">{authError}</p>}
                 <Button className="w-full h-14 text-base mt-2" onClick={processAdminLogin}>
                   <Lock className="w-5 h-5 mr-2" /> Masuk Dashboard
                 </Button>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout appRole={appRole} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {renderContent()}
      </div>
    </Layout>
  );
}
