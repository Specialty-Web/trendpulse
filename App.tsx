
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BarChart3, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  FileText, 
  FileSpreadsheet, 
  ExternalLink,
  Store,
  RefreshCw,
  Clock,
  FileDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import { AppState, MarketReport } from './types';
import { getMarketAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [profession, setProfession] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [report, setReport] = useState<MarketReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUnload = () => {
      setReport(null);
      setProfession('');
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profession.trim() || status === AppState.LOADING) return;

    setStatus(AppState.LOADING);
    setError(null);

    try {
      const data = await getMarketAnalysis(profession);
      setReport(data);
      setStatus(AppState.RESULTS);
    } catch (err: any) {
      console.error("App Search Error:", err);
      setError(err.message || "We encountered an issue analyzing the market data.");
      setStatus(AppState.ERROR);
    }
  };

  const exportData = (format: 'csv' | 'txt' | 'json' | 'pdf') => {
    if (!report) return;

    let fileName = `Market_Report_${profession.replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
      const doc = new jsPDF();
      let yPos = 20;
      doc.setFontSize(22);
      doc.setTextColor(0, 160, 233);
      doc.text(`Market Insights: ${report.profession}`, 20, yPos);
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${report.generatedAt}`, 20, yPos);
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Executive Summary", 20, yPos);
      yPos += 10;
      doc.setFontSize(11);
      const splitSummary = doc.splitTextToSize(report.summary, 170);
      doc.text(splitSummary, 20, yPos);
      yPos += (splitSummary.length * 6) + 10;
      doc.setFontSize(14);
      doc.text("Top Trending Keywords", 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      report.topKeywords.forEach((k, i) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${i + 1}. ${k.keyword} - Volume: ${k.volume.toLocaleString()} (${k.trend})`, 25, yPos);
        yPos += 6;
      });
      doc.save(`${fileName}.pdf`);
      return;
    }

    let content = '';
    let mimeType = 'text/plain';
    if (format === 'csv') {
      content = "Keyword,Monthly Volume,Trend,YoY Change%\n" + 
                report.topKeywords.map(k => `"${k.keyword}",${k.volume},${k.trend},${k.changePercentage}%`).join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    } else if (format === 'txt') {
      content = `MARKET ANALYSIS: ${report.profession}\n` +
                `Generated on: ${report.generatedAt}\n\n` +
                `EXECUTIVE SUMMARY:\n${report.summary}\n\n` +
                `TOP KEYWORDS:\n` +
                report.topKeywords.map((k, i) => `${i+1}. ${k.keyword} - Volume: ${k.volume} (${k.trend})`).join('\n');
      fileName += '.txt';
    } else {
      content = JSON.stringify(report, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-500/30">
      <nav className="sticky top-0 z-50 border-b border-sky-900/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white neon-text">TrendPulse</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Real-time Data</span>
            <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Secure Clearing</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Level Up Your <span className="text-sky-400 underline decoration-sky-500/30">Small Business</span> Strategy
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Get instant, AI-powered insights into what your customers are searching for. Enter your profession to uncover trending keywords and market volumes.
          </p>

          <form onSubmit={handleSearch} className="relative group max-w-xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="e.g. Coffee Shop Owner, Freelance Designer, Plumber..."
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-600"
              />
              <Search className="absolute left-4 w-5 h-5 text-slate-500" />
              <button 
                disabled={status === AppState.LOADING}
                className="absolute right-2 px-6 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-semibold transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === AppState.LOADING ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : "Analyze"}
              </button>
            </div>
          </form>
        </div>

        {status === AppState.LOADING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
              <Store className="absolute inset-0 m-auto w-8 h-8 text-sky-400 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Analyzing the Market...</h3>
              <p className="text-slate-400 max-w-xs mx-auto">Gemini AI is currently processing trending search volumes and gathering insights for your business.</p>
            </div>
          </div>
        )}

        {status === AppState.ERROR && (
          <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-1">Analysis Failed</h3>
              <p className="text-red-400/80 mb-4">{error}</p>
              <button 
                onClick={() => setStatus(AppState.IDLE)}
                className="text-sm font-semibold text-white underline underline-offset-4 hover:text-red-300 transition"
              >
                Try a different keyword or check API settings
              </button>
            </div>
          </div>
        )}

        {status === AppState.IDLE && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: TrendingUp, title: "Market Trends", desc: "See what's gaining popularity in your industry right now." },
              { icon: BarChart3, title: "Search Volume", desc: "Understand the size of your potential customer base." },
              { icon: FileText, title: "Instant Reports", desc: "Download professional analysis to guide your business decisions." }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-sky-500/50 transition-colors duration-300">
                <feature.icon className="w-10 h-10 text-sky-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        )}

        {status === AppState.RESULTS && report && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 neon-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-sky-400 text-sm font-bold tracking-widest uppercase">Analysis Complete</span>
                  <h2 className="text-3xl font-bold text-white mt-1 capitalize">{report.profession} Insights</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => exportData('pdf')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition active:scale-95">
                    <FileDown className="w-4 h-4 text-rose-400" /> PDF Report
                  </button>
                  <button onClick={() => exportData('csv')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition active:scale-95">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel (CSV)
                  </button>
                  <button onClick={() => exportData('txt')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition active:scale-95">
                    <FileText className="w-4 h-4 text-sky-400" /> Report (TXT)
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 text-lg leading-relaxed">{report.summary}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-slate-800 pt-8">
                <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Keywords Found</div>
                  <div className="text-2xl font-black text-white">{report.topKeywords.length}</div>
                </div>
                <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Avg. Monthly Vol</div>
                  <div className="text-2xl font-black text-white">
                    {Math.round(report.topKeywords.reduce((acc, k) => acc + k.volume, 0) / report.topKeywords.length).toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Market Sentiment</div>
                  <div className="text-2xl font-black text-sky-400">Stable-Up</div>
                </div>
                <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Generated On</div>
                  <div className="text-sm font-bold text-slate-300 mt-2">{report.generatedAt.split(',')[0]}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <BarChart3 className="text-sky-500 w-6 h-6" />
                Top 15 Keywords by Search Volume
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.topKeywords.slice(0, 15)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis 
                      dataKey="keyword" 
                      stroke="#475569" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      interval={0}
                      tick={{ fill: '#94a3b8' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      tick={{ fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                      {report.topKeywords.slice(0, 15).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : '#0ea5e9'} fillOpacity={1 - index * 0.05} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Top 50 Ranking Keywords</h3>
                <span className="text-xs font-mono text-slate-500 uppercase">Descending Order</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Search Term</th>
                      <th className="px-6 py-4">Volume (Est.)</th>
                      <th className="px-6 py-4">Trend</th>
                      <th className="px-6 py-4">YoY Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {report.topKeywords.map((k, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 text-slate-500 text-sm font-mono">{i + 1}</td>
                        <td className="px-6 py-4 font-semibold text-white group-hover:text-sky-400 transition-colors capitalize">{k.keyword}</td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300 font-medium">{k.volume.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          {k.trend === 'up' && <div className="flex items-center gap-1 text-emerald-400 text-sm"><TrendingUp className="w-4 h-4" /> Rising</div>}
                          {k.trend === 'down' && <div className="flex items-center gap-1 text-red-400 text-sm"><TrendingDown className="w-4 h-4" /> Falling</div>}
                          {k.trend === 'stable' && <div className="flex items-center gap-1 text-slate-400 text-sm"><Minus className="w-4 h-4" /> Stable</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${k.changePercentage >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                            {k.changePercentage > 0 ? '+' : ''}{k.changePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {report.sources && report.sources.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Verification Sources</h4>
                <div className="flex flex-wrap gap-4">
                  {report.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 bg-sky-950/30 border border-sky-800/30 px-3 py-1.5 rounded-full transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-white text-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>TrendPulse Insights Platform &copy; {new Date().getFullYear()}</span>
          </div>
          <p className="max-w-md text-center md:text-right leading-relaxed text-slate-500">
            Data provided for research purposes. This app does not store your search queries; all data is cleared when you close the browser tab.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
