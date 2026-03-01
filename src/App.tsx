import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  LayoutDashboard, 
  Zap, 
  History, 
  Settings, 
  Bell,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Wallet,
  Globe,
  Link2,
  Plus,
  CheckCircle2,
  Crosshair,
  Type,
  Square,
  Clock,
  MousePointer2,
  Maximize2,
  ArrowUpRight,
  Settings2,
  Minus,
  Coins,
  ArrowRightLeft,
  Download,
  Smartphone,
  Apple,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { io } from 'socket.io-client';

// --- Types ---
interface Signal {
  id: number;
  symbol: string;
  type: 'Buy' | 'Sell';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  score: number;
  confirmed: boolean;
  created_at: string;
}

interface HeatmapItem {
  asset: string;
  score: number;
  trend: string;
  volume_strength: string;
  volatility: string;
  timeframe: string;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
    <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-white' : 'text-white/40'}`}>
      <LayoutDashboard size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Dash</span>
    </button>
    <button onClick={() => setActiveTab('quotes')} className={`flex flex-col items-center gap-1 ${activeTab === 'quotes' ? 'text-white' : 'text-white/40'}`}>
      <Coins size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Quotes</span>
    </button>
    <button onClick={() => setActiveTab('signals')} className={`flex flex-col items-center gap-1 ${activeTab === 'signals' ? 'text-white' : 'text-white/40'}`}>
      <Zap size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Signals</span>
    </button>
    <button onClick={() => setActiveTab('heatmap')} className={`flex flex-col items-center gap-1 ${activeTab === 'heatmap' ? 'text-white' : 'text-white/40'}`}>
      <Activity size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Heat</span>
    </button>
    <button onClick={() => setActiveTab('broker')} className={`flex flex-col items-center gap-1 ${activeTab === 'broker' ? 'text-white' : 'text-white/40'}`}>
      <Globe size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Broker</span>
    </button>
    <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-white' : 'text-white/40'}`}>
      <History size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">History</span>
    </button>
    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-white' : 'text-white/40'}`}>
      <Settings size={20} />
      <span className="text-[10px] uppercase tracking-widest font-bold">Menu</span>
    </button>
  </nav>
);

const Header = () => (
  <header className="px-6 pt-8 pb-4 flex justify-between items-center">
    <div>
      <h1 className="text-2xl font-bold tracking-tighter">QUANTIVA<span className="text-white/40">AI</span></h1>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Precision Terminal</p>
    </div>
    <div className="flex gap-4">
      <button className="w-10 h-10 rounded-full glass flex items-center justify-center relative">
        <Bell size={18} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0B]"></span>
      </button>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 p-[1px]">
        <div className="w-full h-full rounded-full bg-[#0A0A0B] flex items-center justify-center overflow-hidden">
          <img src="https://picsum.photos/seed/trader/100/100" alt="Profile" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  </header>
);

const CandlestickChart = ({ data, indicators, activeTool, onChartClick }: { data: any[], indicators: any, activeTool: string | null, onChartClick: (param: any) => void }) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const unbiasedSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const horizontalLinesRef = React.useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.4)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: activeTool === 'crosshair' ? 0 : 1, // 0 = Normal, 1 = Magnet/Hidden
        vertLine: { labelBackgroundColor: '#10b981' },
        horzLine: { labelBackgroundColor: '#10b981' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    chart.subscribeClick((param: any) => {
      if (param.point) {
        onChartClick(param);
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        crosshair: {
          mode: activeTool === 'crosshair' ? 0 : 1,
        }
      });
    }
  }, [activeTool]);

  useEffect(() => {
    if (candleSeriesRef.current && data.length > 0) {
      candleSeriesRef.current.setData(data);
    }
    // ... rest of indicator logic ...

    if (chartRef.current) {
      // SMA Indicator
      if (indicators.sma && data.length > 5) {
        if (!smaSeriesRef.current) {
          smaSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1 });
        }
        const smaData = data.map((d, i) => {
          if (i < 5) return null;
          const slice = data.slice(i - 5, i);
          const sum = slice.reduce((acc, curr) => acc + (curr.close || 0), 0);
          const avg = sum / 5;
          if (isNaN(avg)) return null;
          return { time: d.time, value: avg };
        }).filter(d => d !== null) as any[];
        smaSeriesRef.current.setData(smaData);
      } else if (smaSeriesRef.current) {
        chartRef.current.removeSeries(smaSeriesRef.current);
        smaSeriesRef.current = null;
      }

      // EMA Indicator
      if (indicators.ema && data.length > 21) {
        if (!emaSeriesRef.current) {
          emaSeriesRef.current = chartRef.current.addSeries(LineSeries, { color: '#10b981', lineWidth: 1 });
        }
        const emaData = data.map((d, i) => {
          if (i < 21) return null;
          const slice = data.slice(i - 21, i);
          const sum = slice.reduce((acc, curr) => acc + (curr.close || 0), 0);
          const avg = sum / 21;
          if (isNaN(avg)) return null;
          return { time: d.time, value: avg };
        }).filter(d => d !== null) as any[];
        emaSeriesRef.current.setData(emaData);
      } else if (emaSeriesRef.current) {
        chartRef.current.removeSeries(emaSeriesRef.current);
        emaSeriesRef.current = null;
      }

      // Unbiased Level Pro (Custom logic: sophisticated trend level)
      if (indicators.unbiased && data.length > 10) {
        if (!unbiasedSeriesRef.current) {
          unbiasedSeriesRef.current = chartRef.current.addSeries(LineSeries, { 
            color: '#f59e0b', 
            lineWidth: 2,
            lineStyle: 2, // Dashed
            title: 'Unbiased Level Pro'
          });
        }
        const unbiasedData = data.map((d, i) => {
          if (i < 10) return null;
          const slice = data.slice(i - 10, i);
          const high = Math.max(...slice.map(s => s.high || 0));
          const low = Math.min(...slice.map(s => s.low || 0));
          const value = (high + low + (d.close || 0)) / 3;
          if (isNaN(value)) return null;
          return { time: d.time, value };
        }).filter(d => d !== null) as any[];
        unbiasedSeriesRef.current.setData(unbiasedData);
      } else if (unbiasedSeriesRef.current) {
        chartRef.current.removeSeries(unbiasedSeriesRef.current);
        unbiasedSeriesRef.current = null;
      }
    }
  }, [data, indicators]);

  return <div ref={chartContainerRef} className="w-full" />;
};

const SignalCard = ({ signal, onConfirm }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-3xl p-6 mb-4 relative overflow-hidden"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold">{signal.symbol}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${signal.type === 'Buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {signal.type}
          </span>
        </div>
        <p className="text-xs text-white/40">M15 Timeframe • AI Score: <span className={signal.score > 75 ? 'text-emerald-400' : 'text-white/60'}>{signal.score}%</span></p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Entry</p>
        <p className="text-lg font-mono font-bold">{signal.entry_price}</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Stop Loss</p>
        <p className="font-mono text-red-400 font-bold">{signal.stop_loss}</p>
      </div>
      <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Take Profit</p>
        <p className="font-mono text-emerald-400 font-bold">{signal.take_profit}</p>
      </div>
    </div>

    <div className="flex gap-3">
      <button 
        onClick={() => onConfirm(signal.id)}
        disabled={signal.confirmed}
        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${signal.confirmed ? 'bg-white/10 text-white/40' : 'bg-white text-black active:scale-95'}`}
      >
        {signal.confirmed ? 'EXECUTED' : 'CONFIRM ORDER'}
      </button>
      <button className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
        <AlertCircle size={20} className="text-white/40" />
      </button>
    </div>

    {/* Progress bar for score */}
    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/30" style={{ width: `${signal.score}%` }}></div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState<Signal[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(true); // Activated Pro
  const [activeAccount, setActiveAccount] = useState<any>({ broker_name: 'Quantiva Demo', account_type: 'Demo', balance: 10000 });
  const [brokerAccounts, setBrokerAccounts] = useState<any[]>([]);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('M15');
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    unbiased: true,
    rsi: false
  });

  useEffect(() => {
    const socket = io();
    socket.on('price_update', (newPrices) => {
      if (!newPrices || !newPrices['XAUUSD']) return;
      
      setPrices(newPrices);
      setChartData(prev => {
        const lastData = prev[prev.length - 1];
        const newDataPoint = newPrices['XAUUSD'];
        
        if (lastData && lastData.time === newDataPoint.time) {
          const updated = [...prev];
          updated[updated.length - 1] = newDataPoint;
          return updated;
        }
        
        const newData = [...prev, newDataPoint];
        return newData.slice(-100);
      });
    });

    fetchSignals();
    fetchHeatmap();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSignals = async () => {
    // Mock signals for demo if API fails
    const mockSignals: Signal[] = [
      { id: 1, symbol: 'XAUUSD', type: 'Buy', entry_price: 2035.20, stop_loss: 2030.50, take_profit: 2044.80, score: 82, confirmed: false, created_at: new Date().toISOString() },
      { id: 2, symbol: 'EURUSD', type: 'Sell', entry_price: 1.0845, stop_loss: 1.0870, take_profit: 1.0810, score: 68, confirmed: false, created_at: new Date().toISOString() },
    ];
    setSignals(mockSignals);
  };

  const fetchHeatmap = async () => {
    try {
      const res = await fetch('/api/market/heatmap');
      const data = await res.json();
      setHeatmap(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = (id: number) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, confirmed: true } : s));
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-[#0A0A0B]">
      <Header />

      <main className="px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet size={14} className="text-white/40" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                      {activeAccount.account_type} Balance
                    </span>
                  </div>
                  <p className="text-xl font-bold">${activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-1">
                    {activeAccount.broker_name}
                  </p>
                </div>
                <div className="glass rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-white/40" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Risk Limit</span>
                  </div>
                  <p className="text-xl font-bold">1.0%</p>
                  <p className="text-[10px] text-white/40 font-bold mt-1">Per Trade</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('quotes')}
                className="w-full glass rounded-2xl p-4 mb-6 flex items-center justify-between group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Coins size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Market Quotes</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Live Currency Prices</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
              </button>

              <div className="glass rounded-3xl p-4 mb-6 relative overflow-hidden">
                {/* One-Click Trading Panel */}
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">XAUUSD</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase">LIVE</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-red-500/30">SELL {prices['XAUUSD']?.close}</button>
                    <button className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30">BUY {prices['XAUUSD']?.close}</button>
                  </div>
                </div>

                {/* MT5 Toolbar */}
                <div className="flex items-center gap-1 mb-4 bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveTool(activeTool === 'crosshair' ? null : 'crosshair')}
                    className={`p-2 rounded-lg transition-all ${activeTool === 'crosshair' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <Crosshair size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTool('hline')}
                    className={`p-2 rounded-lg transition-all ${activeTool === 'hline' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <Minus size={16} className="rotate-90" />
                  </button>
                  <button 
                    onClick={() => setActiveTool('tline')}
                    className={`p-2 rounded-lg transition-all ${activeTool === 'tline' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                  <button className="p-2 rounded-lg text-white/40 hover:text-white"><Square size={16} /></button>
                  <button className="p-2 rounded-lg text-white/40 hover:text-white"><Type size={16} /></button>
                  <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                  {['M1', 'M5', 'M15', 'H1', 'H4', 'D1'].map(tf => (
                    <button 
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${timeframe === tf ? 'text-white bg-white/10' : 'text-white/20'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                
                <CandlestickChart 
                  data={chartData} 
                  indicators={indicators} 
                  activeTool={activeTool}
                  onChartClick={(param) => {
                    if (activeTool === 'hline') {
                      // Logic to add horizontal line would go here
                      // For now we just reset tool
                      setActiveTool(null);
                    }
                  }}
                />

                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                  <button 
                    onClick={() => setIndicators(prev => ({ ...prev, sma: !prev.sma }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${indicators.sma ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    SMA 5
                  </button>
                  <button 
                    onClick={() => setIndicators(prev => ({ ...prev, ema: !prev.ema }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${indicators.ema ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    EMA 21
                  </button>
                  <button 
                    onClick={() => setIndicators(prev => ({ ...prev, unbiased: !prev.unbiased }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${indicators.unbiased ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    UNBIASED LEVEL PRO
                  </button>
                  <button 
                    onClick={() => setIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${indicators.rsi ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    RSI
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold tracking-tight">Active Signals</h2>
                <button className="text-[10px] uppercase tracking-widest font-bold text-white/40">View All</button>
              </div>

              {signals.filter(s => !s.confirmed).map(signal => (
                <SignalCard key={signal.id} signal={signal} onConfirm={handleConfirm} />
              ))}
            </motion.div>
          )}

          {activeTab === 'quotes' && (
            <motion.div 
              key="quotes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Market Quotes</h2>
                <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
                  <Activity size={18} className="text-emerald-400" />
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(prices).map(([symbol, data]: [string, any]) => (
                  <div key={symbol} className="glass rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <ArrowRightLeft size={18} className="text-white/40" />
                      </div>
                      <div>
                        <p className="font-bold">{symbol}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Forex • Live</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-400">{data.close}</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <TrendingUp size={10} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">+0.12%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Fallback if no prices yet */}
                {Object.keys(prices).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Clock size={24} className="text-white/20 animate-pulse" />
                    </div>
                    <p className="text-white/40 text-sm">Connecting to live feed...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'signals' && (
            <motion.div 
              key="signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold tracking-tight mb-6">AI Signal Feed</h2>
              {signals.map(signal => (
                <SignalCard key={signal.id} signal={signal} onConfirm={handleConfirm} />
              ))}
            </motion.div>
          )}

          {activeTab === 'heatmap' && (
            <motion.div 
              key="heatmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">Market Heatmap</h2>
              <p className="text-xs text-white/40 mb-8">Real-time sentiment analysis based on Volume + Indicators</p>
              
              <div className="grid grid-cols-1 gap-4">
                {heatmap.map((item, i) => (
                  <div key={i} className="glass rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${item.score > 75 ? 'bg-emerald-500/20 text-emerald-400' : item.score < 40 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60'}`}>
                        {item.score}%
                      </div>
                      <div>
                        <p className="font-bold">{item.asset}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{item.trend}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Volume</p>
                      <p className={`text-xs font-bold ${item.volume_strength === 'High' ? 'text-emerald-400' : 'text-white/60'}`}>{item.volume_strength}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'broker' && (
            <motion.div 
              key="broker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Broker Gateway</h2>
                <button 
                  onClick={() => setShowConnectForm(true)}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">Active Accounts</p>
                
                {/* Default Demo Account */}
                <div 
                  onClick={() => setActiveAccount({ broker_name: 'Quantiva Demo', account_type: 'Demo', balance: 10000 })}
                  className={`glass rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${activeAccount.broker_name === 'Quantiva Demo' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-bold">Quantiva Demo</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Demo Account</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">$10,000.00</p>
                    {activeAccount.broker_name === 'Quantiva Demo' && <CheckCircle2 size={16} className="text-emerald-400 ml-auto mt-1" />}
                  </div>
                </div>

                {brokerAccounts.map((acc, i) => (
                  <div 
                    key={i}
                    onClick={() => setActiveAccount(acc)}
                    className={`glass rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${activeAccount.id === acc.id ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.account_type === 'Real' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <Globe size={20} />
                      </div>
                      <div>
                        <p className="font-bold">{acc.broker_name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{acc.account_type} Account</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${acc.balance.toLocaleString()}</p>
                      {activeAccount.id === acc.id && <CheckCircle2 size={16} className="text-emerald-400 ml-auto mt-1" />}
                    </div>
                  </div>
                ))}
              </div>

              {showConnectForm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-3xl p-6 border-white/20"
                >
                  <h3 className="text-lg font-bold mb-4">Connect Broker API</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1 block">Broker Name</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30">
                        <option>MetaTrader 5 (MT5)</option>
                        <option>OANDA</option>
                        <option>IC Markets</option>
                        <option>Binance API</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1 block">Account Type</label>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 rounded-lg bg-white/10 text-xs font-bold border border-white/20">DEMO</button>
                        <button className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">REAL</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1 block">API Key</label>
                      <input type="password" placeholder="••••••••••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setShowConnectForm(false)}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold"
                      >
                        CANCEL
                      </button>
                      <button 
                        onClick={() => {
                          // Mock connect
                          const newAcc = { id: Date.now(), broker_name: 'MT5 Live', account_type: 'Real', balance: 5240.50 };
                          setBrokerAccounts([...brokerAccounts, newAcc]);
                          setActiveAccount(newAcc);
                          setShowConnectForm(false);
                        }}
                        className="flex-1 py-3 rounded-xl bg-white text-black text-xs font-bold"
                      >
                        CONNECT
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mt-8 p-6 glass rounded-3xl border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <Link2 size={20} className="text-white/40" />
                  <h4 className="font-bold">API Security</h4>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  Your API keys are encrypted using AES-256 standards. Quantiva AI never executes trades without your manual confirmation unless "Auto-Trade" is enabled in settings.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
                <History size={32} className="text-white/20" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Trade History</h3>
              <p className="text-sm text-white/40 px-12">Your executed trades will appear here once you confirm a signal.</p>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold tracking-tight mb-8">Terminal Settings</h2>
              
              <div className="space-y-4">
                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <BarChart3 size={20} />
                    </div>
                    <p className="font-bold">Broker Connection</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase">Connected</span>
                </div>

                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="font-bold">Risk Management</p>
                  </div>
                  <ChevronRight size={20} className="text-white/20" />
                </div>

                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Bell size={20} />
                    </div>
                    <p className="font-bold">Notifications</p>
                  </div>
                  <ChevronRight size={20} className="text-white/20" />
                </div>

                <div className="pt-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4 px-2">Mobile Experience</p>
                  
                  <div className="glass rounded-3xl p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">Download App</h4>
                        <p className="text-xs text-white/40">Trade anywhere, anytime.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <Apple size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">App Store</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <Play size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Play Store</span>
                      </button>
                    </div>

                    <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-dashed border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Download size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Web App (PWA)</span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        To install as a Web App: Tap <span className="text-white">Share</span> then <span className="text-white">"Add to Home Screen"</span> in your browser menu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 glass rounded-3xl border-emerald-500/20">
                <h4 className="text-emerald-400 font-bold mb-2">Quantiva Pro</h4>
                <p className="text-xs text-white/60 mb-4">Unlock advanced AI signals and multi-timeframe heatmap analysis.</p>
                <button className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl text-sm">UPGRADE NOW</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
