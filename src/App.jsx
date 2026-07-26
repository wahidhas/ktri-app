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
  Database, RefreshCw, Lock, ChevronDown
} from 'lucide-react';

// Firebase Integrations
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// Konfigurasi Firebase Anda
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
  emerald: '#10b981', // 81-100 Champion
  blue: '#3b82f6',    // 61-80 Siap
  orange: '#f59e0b',  // 41-60 Perlu Pendampingan
  red: '#ef4444'      // 0-40 Pendampingan Intensif
};

const getCategory = (score) => {
  if (score >= 81) return { label: 'Champion Teacher', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', hex: COLORS.emerald, bgHex: '#d1fae5' };
  if (score >= 61) return { label: 'Siap Implementasi', color: 'bg-blue-100 text-blue-800 border-blue-200', hex: COLORS.blue, bgHex: '#dbeafe' };
  if (score >= 41) return { label: 'Perlu Pendampingan', color: 'bg-orange-100 text-orange-800 border-orange-200', hex: COLORS.orange, bgHex: '#fef3c7' };
  return { label: 'Pendampingan Intensif', color: 'bg-red-100 text-red-800 border-red-200', hex: COLORS.red, bgHex: '#fee2e2' };
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

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, icon: Icon }) => {
  const baseStyle = "flex items-center justify-center font-semibold rounded-2xl transition-all active:scale-[0.98] min-h-[52px] px-5 w-full sm:w-auto";
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 disabled:bg-emerald-300",
    secondary: "bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:bg-gray-100",
    outline: "border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 bg-white disabled:border-gray-100",
    danger: "bg-red-50 hover:bg-red-100 text-red-700"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

const AdminDashboard = ({ data }) => {
  const totalTeachers = data.length;
  const categoriesCount = { champion: 0, ready: 0, coaching: 0, intensive: 0 };
  let totals = { kma: 0, kbc: 0, practice: 0, mindset: 0, readiness: 0 };
  let weaknessesCount = {};

  data.forEach(t => {
    if (t.scores.overall >= 81) categoriesCount.champion++;
    else if (t.scores.overall >= 61) categoriesCount.ready++;
    else if (t.scores.overall >= 41) categoriesCount.coaching++;
    else categoriesCount.intensive++;

    totals.kma += t.scores.kma;
    totals.kbc += t.scores.kbc;
    totals.practice += t.scores.practice;
    totals.mindset += t.scores.mindset;
    totals.readiness += t.scores.readiness;

    if (t.weaknesses) {
      t.weaknesses.forEach(w => {
        weaknessesCount[w] = (weaknessesCount[w] || 0) + 1;
      });
    }
  });

  const radarData = [
    { subject: 'KMA 1503', A: totalTeachers ? totals.kma / totalTeachers : 0, fullMark: 100 },
    { subject: 'Kurikulum KBC', A: totalTeachers ? totals.kbc / totalTeachers : 0, fullMark: 100 },
    { subject: 'Praktik Belajar', A: totalTeachers ? totals.practice / totalTeachers : 0, fullMark: 100 },
    { subject: 'Mindset', A: totalTeachers ? totals.mindset / totalTeachers : 0, fullMark: 100 },
    { subject: 'Kesiapan', A: totalTeachers ? totals.readiness / totalTeachers : 0, fullMark: 100 },
  ];

  const pieData = [
    { name: 'Champion', value: categoriesCount.champion, color: COLORS.emerald },
    { name: 'Siap', value: categoriesCount.ready, color: COLORS.blue },
    { name: 'Coaching', value: categoriesCount.coaching, color: COLORS.orange },
    { name: 'Intensif', value: categoriesCount.intensive, color: COLORS.red },
  ].filter(d => d.value > 0);

  const priorityTopics = Object.keys(weaknessesCount).map(topic => {
    const issueCount = weaknessesCount[topic];
    const impactPercentage = (issueCount / totalTeachers) * 100;
    
    let type = 'Workshop';
    let icon = ClipboardList;
    if (topic.includes('KMA')) { type = 'In-House Training'; icon = Map; }
    else if (topic.includes('KBC')) { type = 'Mentoring Khusus'; icon = Users; }
    else if (topic.includes('Praktik')) { type = 'Peer Coaching'; icon = Activity; }

    return { topic, issuePercentage: impactPercentage, type, icon };
  }).sort((a, b) => b.issuePercentage - a.issuePercentage).slice(0, 3);

  if (priorityTopics.length === 0 && totalTeachers > 0) {
    priorityTopics.push({ topic: 'Peningkatan Lanjutan (Advanced)', issuePercentage: 0, type: 'Sharing Session', icon: Award });
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Transformasi</h1>
          <p className="text-gray-500 text-sm mt-1">Status Kesiapan Implementasi KMA 1503 & KBC</p>
        </div>
        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center">
          <Database className="w-4 h-4 mr-1.5" /> {totalTeachers} Data Guru
        </div>
      </div>

      {totalTeachers === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 border-gray-300">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Belum Ada Data Asesmen</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Silakan minta guru-guru untuk login dan mengisi asesmen mandiri. Data akan muncul di sini secara otomatis.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card noPadding className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 overflow-hidden relative">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-emerald-900 text-sm font-bold">Champion</h3>
                  <Award className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-4xl font-extrabold text-emerald-600">{categoriesCount.champion}</p>
              </div>
              <div className="bg-emerald-100/50 px-4 py-2 text-xs font-semibold text-emerald-700">Skor 81-100</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-blue-50 to-white border-blue-100 overflow-hidden relative">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-blue-900 text-sm font-bold">Siap</h3>
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-4xl font-extrabold text-blue-600">{categoriesCount.ready}</p>
              </div>
              <div className="bg-blue-100/50 px-4 py-2 text-xs font-semibold text-blue-700">Skor 61-80</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-orange-50 to-white border-orange-100 overflow-hidden relative">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-orange-900 text-sm font-bold">Coaching</h3>
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-4xl font-extrabold text-orange-600">{categoriesCount.coaching}</p>
              </div>
              <div className="bg-orange-100/50 px-4 py-2 text-xs font-semibold text-orange-700">Skor 41-60</div>
            </Card>
            <Card noPadding className="bg-gradient-to-br from-red-50 to-white border-red-100 overflow-hidden relative">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-red-900 text-sm font-bold">Intensif</h3>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-4xl font-extrabold text-red-600">{categoriesCount.intensive}</p>
              </div>
              <div className="bg-red-100/50 px-4 py-2 text-xs font-semibold text-red-700">Skor 0-40</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-base font-bold text-gray-800 mb-6">Peta Kompetensi Rata-rata</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                    <Radar name="Rata-rata Sekolah" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-bold text-gray-800 mb-6">Distribusi Kesiapan Guru</h3>
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
              <p className="text-gray-400 text-sm mb-6 max-w-lg">Sistem AI merekomendasikan prioritas intervensi pelatihan berdasarkan analisis area terlemah kolektif.</p>
              
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
          <h1 className="text-2xl font-bold text-gray-900">Readiness Map</h1>
          <p className="text-gray-500 text-sm mt-1">Heatmap kesiapan per individu (Skor 0-100)</p>
        </div>
      </div>

      <Card noPadding className="overflow-x-auto shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
              <th className="p-4 font-bold">Nama Guru & Mapel</th>
              <th className="p-4 font-bold text-center w-24">KMA 1503</th>
              <th className="p-4 font-bold text-center w-24">Kurik. KBC</th>
              <th className="p-4 font-bold text-center w-24">Praktik</th>
              <th className="p-4 font-bold text-center w-24">Mindset</th>
              <th className="p-4 font-bold text-center w-24">Kesiapan</th>
              <th className="p-4 font-bold text-center bg-gray-100 w-28">Skor Akhir</th>
              <th className="p-4 font-bold">Kategori</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.sort((a,b) => b.scores.overall - a.scores.overall).map(teacher => {
              const cat = getCategory(teacher.scores.overall);
              
              const ScoreCell = ({ score }) => {
                let bg = "bg-red-100 text-red-800";
                if (score >= 81) bg = "bg-emerald-100 text-emerald-800";
                else if (score >= 61) bg = "bg-blue-100 text-blue-800";
                else if (score >= 41) bg = "bg-orange-100 text-orange-800";
                
                return (
                  <td className="p-2 text-center">
                    <div className={`w-full py-2 rounded-lg font-bold ${bg} border border-white/20`}>
                      {Math.round(score)}
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
                  <ScoreCell score={teacher.scores.kma} />
                  <ScoreCell score={teacher.scores.kbc} />
                  <ScoreCell score={teacher.scores.practice} />
                  <ScoreCell score={teacher.scores.mindset} />
                  <ScoreCell score={teacher.scores.readiness} />
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
        <span className="mr-2 font-bold">Legenda Heatmap:</span>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> 81-100 (Sangat Kuat)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div> 61-80 (Kuat)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500"></div> 41-60 (Cukup)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> 0-40 (Kurang)</div>
      </div>
    </div>
  );
};

const ChampionModule = ({ data }) => {
  const champions = data.filter(t => t.scores.overall >= 81).sort((a,b) => b.scores.overall - a.scores.overall);
  const coaching = data.filter(t => t.scores.overall < 61).sort((a,b) => a.scores.overall - b.scores.overall);

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-[50vh] text-gray-400 font-bold">Belum Ada Data Asesmen</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen SDM</h1>
        <p className="text-gray-500 text-sm mt-1">Kandidat Champion & Target Pendampingan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center mb-6 pb-4 border-b border-emerald-100">
            <div className="p-3 bg-emerald-100 rounded-2xl mr-4 shadow-sm">
              <Award className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900">Champion Teachers</h2>
              <p className="text-emerald-700 text-xs font-medium">Siap menjadi penggerak dan mentor</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {champions.length === 0 && <p className="text-gray-500 text-center py-8">Belum ada Champion</p>}
            {champions.map((c, i) => (
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
                  <div className="text-xs text-emerald-600 font-bold mb-1 uppercase tracking-wider">Skor</div>
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
              <p className="text-orange-700 text-xs font-medium">Prioritas pendampingan intensif & khusus</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {coaching.length === 0 && <p className="text-gray-500 text-center py-8">Semua guru sudah memadai</p>}
            {coaching.map((c) => (
              <div key={c.userId} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{c.subject}</div>
                  </div>
                  <Badge colorClass={c.scores.overall <= 40 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                    Skor: {Math.round(c.scores.overall)}
                  </Badge>
                </div>
                {c.weaknesses && c.weaknesses.length > 0 && (
                  <div className="bg-orange-50 p-2 rounded-lg text-xs">
                    <span className="font-bold text-orange-800 block mb-1">Fokus Perbaikan:</span>
                    <span className="text-orange-700">{c.weaknesses.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
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
      { id: 'subject', type: 'select', label: 'Mata Pelajaran Utama', options: ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Agama Islam', 'Olahraga', 'Seni Budaya', 'Lainnya'] },
      { id: 'experience', type: 'select', label: 'Lama Mengajar', options: ['< 1 Tahun', '1-5 Tahun', '5-10 Tahun', '> 10 Tahun'] }
    ]
  },
  {
    id: 'kma', title: 'Pemahaman KMA 1503', description: 'Nilai dari 1 (Sangat Tidak Paham) s.d 5 (Sangat Paham)',
    questions: [
      { id: 'kma_1', type: 'scale', label: 'Saya memahami tujuan KMA 1503 Tahun 2025' },
      { id: 'kma_2', type: 'scale', label: 'Saya memahami perubahan struktur kurikulum' },
      { id: 'kma_3', type: 'scale', label: 'Saya memahami profil lulusan yang diharapkan' },
      { id: 'kma_4', type: 'scale', label: 'Saya memahami konsep Pembelajaran Mendalam (Deep Learning)' },
      { id: 'kma_5', type: 'scale', label: 'Saya memahami implementasi kokurikuler' }
    ]
  },
  {
    id: 'kbc', title: 'Kurikulum Berbasis Cinta', description: 'Nilai dari 1 (Sangat Tidak Paham) s.d 5 (Sangat Paham)',
    questions: [
      { id: 'kbc_1', type: 'scale', label: 'Saya memahami filosofi cinta dalam pendidikan' },
      { id: 'kbc_2', type: 'scale', label: 'Saya memahami peran guru sebagai murabbi' },
      { id: 'kbc_3', type: 'scale', label: 'Saya memahami pentingnya relasi empatik guru dan siswa' },
      { id: 'kbc_4', type: 'scale', label: 'Saya mampu merancang pembelajaran bermakna' },
      { id: 'kbc_5', type: 'scale', label: 'Saya rutin melakukan refleksi pembelajaran bersama siswa' }
    ]
  },
  {
    id: 'practice', title: 'Praktik Pembelajaran', description: 'Pilih praktik yang sudah rutin Anda terapkan (Bisa lebih dari satu)',
    questions: [
      { id: 'prac_list', type: 'checkboxGroup', options: [
        'Project Based Learning (PBL)', 
        'Refleksi Siswa Berkala', 
        'Portfolio Siswa', 
        'Asesmen Non-Tes / Observasi', 
        'Kolaborasi Aktif dengan Orang Tua', 
        'Pembelajaran Kontekstual', 
        'Presentasi Siswa'
      ]}
    ]
  },
  {
    id: 'mindset', title: 'Keyakinan Guru (Mindset)', description: 'Nilai 1 (Sangat Tidak Setuju) s.d 5 (Sangat Setuju)',
    questions: [
      { id: 'min_1', type: 'scale', label: 'Pendidikan karakter sama pentingnya dengan akademik' },
      { id: 'min_2', type: 'scale', label: 'Orang tua harus dilibatkan sebagai mitra' },
      { id: 'min_3', type: 'scale', label: 'Belajar harus relevan dengan kehidupan nyata' },
      { id: 'min_4', type: 'scale', label: 'Siswa butuh lebih banyak pengalaman nyata' },
      { id: 'min_5', type: 'scale', label: 'Proyek lebih efektif dibanding ujian hafalan' }
    ]
  },
  {
    id: 'readiness', title: 'Kesiapan Implementasi', description: 'Nilai 1 (Sangat Tidak Siap) s.d 5 (Sangat Siap)',
    questions: [
      { id: 'ready_1', type: 'scale', label: 'Saya siap mengubah gaya mengajar' },
      { id: 'ready_2', type: 'scale', label: 'Saya siap mencoba metode asesmen baru' },
      { id: 'ready_3', type: 'scale', label: 'Saya siap merancang proyek kokurikuler' },
      { id: 'ready_4', type: 'scale', label: 'Saya siap menjalankan program Home Mission' },
      { id: 'ready_5', type: 'scale', label: 'Secara keseluruhan, saya siap mengimplementasikan KAFA Framework' }
    ]
  }
];

const AssessmentWizard = ({ onComplete, isSaving }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleInputChange = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));
  const handleCheckboxChange = (option) => {
    setAnswers(prev => {
      const list = prev.prac_list || [];
      return { ...prev, prac_list: list.includes(option) ? list.filter(i => i !== option) : [...list, option] };
    });
  };

  const calculateResults = () => {
    const sumScale = (prefix) => {
      let sum = 0; let count = 0;
      for (let i = 1; i <= 5; i++) {
        if (answers[`${prefix}_${i}`]) { sum += parseInt(answers[`${prefix}_${i}`]); count++; }
      }
      return count === 0 ? 0 : (sum / (count * 5)) * 100;
    };

    const scores = {
      kma: sumScale('kma'),
      kbc: sumScale('kbc'),
      mindset: sumScale('min'),
      readiness: sumScale('ready'),
      practice: ((answers.prac_list || []).length / 7) * 100
    };
    scores.overall = Object.values(scores).reduce((a,b)=>a+b,0) / 5;

    const weaknesses = [];
    if (scores.kma < 70) weaknesses.push('Pemahaman KMA');
    if (scores.kbc < 70) weaknesses.push('Kurikulum KBC');
    if (scores.practice < 70) weaknesses.push('Praktik Mengajar');
    if (scores.mindset < 70) weaknesses.push('Mindset Guru');

    onComplete({ 
      name: answers.name || "Guru Tanpa Nama", 
      subject: answers.subject || "Belum Memilih", 
      experience: answers.experience || "Belum Memilih",
      scores,
      weaknesses
    });
  };

  const step = ASSESSMENT_STEPS[currentStep];
  const progress = ((currentStep) / ASSESSMENT_STEPS.length) * 100;

  let canProceed = false;
  if (currentStep === 0) canProceed = answers.name && answers.subject && answers.experience;
  else if (step.id === 'practice') canProceed = true; 
  else {
    canProceed = step.questions.every(q => answers[q.id]);
  }

  return (
    <div className="max-w-xl mx-auto w-full pb-20">
      <div className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10 pt-4 pb-6">
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-xl font-bold text-gray-900">Asesmen Mandiri</h2>
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
                {q.type !== 'checkboxGroup' && <label className="block text-base font-bold text-gray-800 leading-tight">{q.label}</label>}
                
                {q.type === 'text' && (
                  <input type="text" className="w-full p-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none transition-colors bg-gray-50 focus:bg-white" placeholder="Masukkan jawaban..." value={answers[q.id] || ''} onChange={(e) => handleInputChange(q.id, e.target.value)} />
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

                {q.type === 'checkboxGroup' && (
                  <div className="space-y-3">
                    {q.options.map(opt => {
                      const isChecked = (answers.prac_list || []).includes(opt);
                      return (
                        <label key={opt} className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${isChecked ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-emerald-300'}`}>
                          <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleCheckboxChange(opt)} />
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center mr-4 transition-colors ${isChecked ? 'bg-emerald-500' : 'border-2 border-gray-300 bg-white'}`}>
                            {isChecked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-base ${isChecked ? 'text-emerald-900 font-bold' : 'text-gray-700 font-medium'}`}>{opt}</span>
                        </label>
                      )
                    })}
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
                 <>Simpan Data <CheckCircle className="w-5 h-5 ml-1" /></>
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
      <p className="text-gray-500 text-base mb-8 max-w-sm">Evaluasi kesiapan Anda dalam mengimplementasikan KMA 1503 dan KBC secara mandiri, dan hasilkan laporan pribadi.</p>
      <Button onClick={onRetake} className="w-full sm:w-auto text-lg h-14 px-8">Mulai Asesmen Sekarang</Button>
    </div>
  );

  const category = getCategory(result.scores.overall);
  const radarData = Object.entries(result.scores).filter(([k]) => k !== 'overall').map(([k, v]) => ({
    subject: k.toUpperCase(), A: v, fullMark: 100
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10 id-report-print">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Kesiapan Anda</h1>
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
            {category.label}
          </span>
        </div>
        <p className="text-gray-700 font-medium max-w-md mx-auto leading-relaxed">
          {result.scores.overall >= 81 ? "Luar biasa! Anda adalah Champion. Bagikan inspirasi praktik baik Anda ke rekan sejawat." :
           result.scores.overall >= 61 ? "Hebat! Anda sudah di jalur yang tepat menuju implementasi penuh KMA 1503 dan KBC." :
           result.scores.overall >= 41 ? "Tahap awal yang baik. Mari kembangkan lagi melalui kolaborasi dan pelatihan madrasah." :
           "Jangan khawatir. Sekolah telah menyiapkan program pendampingan khusus untuk memastikan Anda siap dan percaya diri."}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" /> Peta Kompetensi
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
                  <span className="capitalize">{k === 'kma' ? 'Pemahaman KMA' : k === 'kbc' ? 'Kurikulum KBC' : k}</span> 
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
                  <span className="capitalize">{k === 'kma' ? 'Pemahaman KMA' : k === 'kbc' ? 'Kurikulum KBC' : k}</span> 
                  <span className="font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{Math.round(v)}</span>
                </li>
              ))}
              {Object.values(result.scores).filter(v => v < 70 && v !== result.scores.overall).length === 0 && <li className="text-emerald-600 italic">Semua area sudah di atas 70!</li>}
            </ul>
          </Card>
        </div>
      </div>
      <Button onClick={onRetake} variant="outline" className="w-full h-14 text-lg mt-4 print:hidden">Isi Ulang Asesmen</Button>
    </div>
  );
};

const ProfileSettings = ({ appRole, userUID, onLogout, setActiveTab, teachersData }) => {
  
  const handleExportCSV = () => {
    if (!teachersData || teachersData.length === 0) {
      alert("Belum ada data guru yang bisa diekspor!");
      return;
    }
    
    const headers = ["Nama Guru", "Mata Pelajaran", "Pengalaman", "KMA 1503", "Kurikulum KBC", "Praktik Belajar", "Mindset", "Kesiapan", "Skor Akhir"];
    const csvRows = [headers.join(",")]; 
    
    teachersData.forEach(t => {
      const row = [
        `"${t.name}"`, 
        `"${t.subject}"`,
        `"${t.experience}"`,
        Math.round(t.scores.kma),
        Math.round(t.scores.kbc),
        Math.round(t.scores.practice),
        Math.round(t.scores.mindset),
        Math.round(t.scores.readiness),
        Math.round(t.scores.overall)
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Kesiapan_Guru_KTRI.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const adminMenuItems = [
    { icon: Users, label: 'Coaching Candidates', color: 'text-orange-500', bg: 'bg-orange-100', action: () => setActiveTab('champion') },
    { icon: Map, label: 'Readiness Map', color: 'text-purple-500', bg: 'bg-purple-100', action: () => setActiveTab('readiness') },
    { icon: Download, label: 'Export Data (Excel/CSV)', color: 'text-emerald-500', bg: 'bg-emerald-100', action: handleExportCSV },
  ];

  const guruMenuItems = [
    { icon: FileText, label: 'Cetak Laporan Saya (PDF)', color: 'text-blue-500', bg: 'bg-blue-100', action: () => { window.print(); } },
  ];

  const items = appRole === 'admin' ? adminMenuItems : guruMenuItems;

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Akun & Pengaturan</h1>
      
      <Card className="flex items-center shadow-md border-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-5 backdrop-blur-sm border border-white/30">
          <User className="w-8 h-8 text-white" />
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
          <span className="font-bold text-red-600">Ganti Role (Logout)</span>
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
          <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-md shadow-emerald-200">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-xl leading-tight">KTRI</h1>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">KAFA Framework</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Main Menu</div>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3.5 rounded-2xl transition-all font-semibold ${
                  isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-600 hover:bg-gray-100'
                }`}
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
             <div className="bg-emerald-600 p-1.5 rounded-xl mr-3">
               <Brain className="w-5 h-5 text-white" />
             </div>
             <div className="font-bold text-lg text-gray-900">KTRI Mobile</div>
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

  const [showAdminPin, setShowAdminPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (e) { console.error("Auth error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setAuthUser);
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

  const handleSaveAssessment = async (resultData) => {
    if (!authUser) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, authUser.uid);
      await setDoc(docRef, {
        ...resultData,
        userId: authUser.uid,
        timestamp: new Date().toISOString()
      });
      setActiveTab('dashboard');
    } catch (e) {
      console.error("Gagal menyimpan data:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setAppRole(null);
    setMyResult(null);
    setShowAdminPin(false);
    setPin('');
  };

  const processAdminLogin = () => {
    if (pin === '123456') {
      setAppRole('admin');
      setActiveTab('dashboard');
      setShowAdminPin(false);
      setPinError(false);
      setPin('');
    } else {
      setPinError(true);
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
        case 'dashboard': 
          return <IndividualReport result={myResult} onRetake={() => setActiveTab('assessment')} />;
        case 'assessment': 
          return <AssessmentWizard onComplete={handleSaveAssessment} isSaving={isSaving} />;
        case 'profile': 
          return <ProfileSettings appRole={appRole} userUID={authUser?.uid} onLogout={handleLogout} setActiveTab={setActiveTab} teachersData={teachersData}/>;
        default: 
          return <IndividualReport result={myResult} onRetake={() => setActiveTab('assessment')} />;
      }
    }
  };

  if (!appRole || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-gray-100">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <Brain className="w-full h-full transform scale-150 -rotate-12 translate-x-10 translate-y-10" />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/20 mb-6">
                <Brain className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">KTRI Cloud</h1>
              <p className="text-emerald-100 text-sm font-medium">KAFA Teacher Readiness Index</p>
            </div>
          </div>
          
          <div className="p-8 space-y-4">
            {!authUser ? (
               <div className="text-center text-gray-500 py-4 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-2"/>
                  Menghubungkan ke Database...
               </div>
            ) : showAdminPin ? (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-gray-900">Masukkan PIN Admin</h3>
                   <button onClick={() => { setShowAdminPin(false); setPinError(false); setPin(''); }} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Batal</button>
                 </div>
                 <input 
                   type="password" 
                   inputMode="numeric"
                   maxLength="6"
                   placeholder="••••••" 
                   className={`w-full p-4 text-center text-3xl tracking-widest font-black border-2 rounded-2xl outline-none transition-colors ${pinError ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 focus:border-emerald-500 bg-gray-50 focus:bg-white'}`}
                   value={pin}
                   onChange={(e) => { 
                     // Hanya izinkan angka yang masuk
                     const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
                     setPin(onlyNumbers); 
                     setPinError(false); 
                   }}
                   onKeyDown={(e) => e.key === 'Enter' && processAdminLogin()}
                 />
                 {pinError && <p className="text-red-500 text-xs text-center font-semibold">PIN salah! Silakan coba lagi.</p>}
                 <Button className="w-full h-14 text-base mt-2" onClick={processAdminLogin}>
                   <Lock className="w-5 h-5 mr-2" /> Masuk Dashboard
                 </Button>
               </div>
            ) : (
               <>
                 <p className="text-center text-gray-500 font-medium text-sm mb-6">Pilih Role Akses Sistem</p>
                 <Button className="w-full h-14 text-base" onClick={() => setShowAdminPin(true)}>
                   <ShieldAlert className="w-5 h-5 mr-2" /> Login Kepala Madrasah
                 </Button>
                 <Button variant="outline" className="w-full h-14 text-base" onClick={() => { setAppRole('guru'); setActiveTab(myResult ? 'dashboard' : 'assessment'); }}>
                   <User className="w-5 h-5 mr-2" /> Login Guru
                 </Button>
               </>
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