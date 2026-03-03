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
  Play,
  Hash,
  ChevronDown,
  Edit3,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries, LineSeries, LineStyle, HistogramSeries, HistogramData } from 'lightweight-charts';
import { io } from 'socket.io-client';
import MetaTraderChart from './components/MetaTraderChart';

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
  lot_size?: number;
  potential_profit?: number;
  potential_loss?: number;
  isBot?: boolean;
  timeframe?: string;
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
      <div className="flex items-center gap-2 mb-0.5">
        <h1 className="text-2xl font-bold tracking-tighter">TraderXau<span className="text-white/40">-Bot</span></h1>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Precision Terminal v2.4.0</p>
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

const CandlestickChart = ({ data, indicators, activeTool, onChartClick, fibLevels, activeOrders, timeframe, tradeHistory }: { data: any[], indicators: any, activeTool: string | null, onChartClick: (param: any) => void, fibLevels: any[], activeOrders: Signal[], timeframe: string, tradeHistory: any[] }) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const unbiasedSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const rsiChartRef = React.useRef<IChartApi | null>(null);
  const rsiSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const macdChartRef = React.useRef<IChartApi | null>(null);
  const macdSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistogramSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const fibSeriesRef = React.useRef<ISeriesApi<"Line">[]>([]);
  const rsiContainerRef = React.useRef<HTMLDivElement>(null);
  const macdContainerRef = React.useRef<HTMLDivElement>(null);
  const orderLinesRef = React.useRef<any[]>([]);

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
      if (param.point && candleSeriesRef.current && param.time) {
        const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
        if (price !== null) {
          onChartClick({ ...param, price });
        }
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
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!rsiContainerRef.current || !chartRef.current) return;

    if (indicators.rsi && !rsiChartRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'rgba(255, 255, 255, 0.4)',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        width: rsiContainerRef.current.clientWidth,
        height: 100,
        timeScale: {
          visible: false,
        },
      });

      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        title: 'RSI (14)',
      });

      // Add overbought/oversold levels
      const obLevel = rsiChart.addSeries(LineSeries, { color: 'rgba(239, 68, 68, 0.2)', lineWidth: 1, lineStyle: 2 });
      const osLevel = rsiChart.addSeries(LineSeries, { color: 'rgba(16, 185, 129, 0.2)', lineWidth: 1, lineStyle: 2 });
      
      rsiChartRef.current = rsiChart;
      rsiSeriesRef.current = rsiSeries;

      const obData = data.map(d => ({ time: d.time, value: 70 }));
      const osData = data.map(d => ({ time: d.time, value: 30 }));
      obLevel.setData(obData);
      osLevel.setData(osData);

      // Sync time scales
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((range) => {
        rsiChart.timeScale().setVisibleRange(range as any);
      });

      rsiChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        chartRef.current?.timeScale().setVisibleRange(range as any);
      });
    } else if (!indicators.rsi && rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    }

    // MACD Chart Setup
    if (indicators.macd && !macdChartRef.current && macdContainerRef.current) {
      const macdChart = createChart(macdContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'rgba(255, 255, 255, 0.4)',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        width: macdContainerRef.current.clientWidth,
        height: 100,
        timeScale: { visible: false },
      });

      macdHistogramSeriesRef.current = macdChart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });
      
      macdSeriesRef.current = macdChart.addSeries(LineSeries, {
        color: '#2962FF',
        lineWidth: 1,
        title: 'MACD',
      });

      macdSignalSeriesRef.current = macdChart.addSeries(LineSeries, {
        color: '#FF6D00',
        lineWidth: 1,
        title: 'Signal',
      });

      macdChartRef.current = macdChart;

      // Sync time scales
      chartRef.current?.timeScale().subscribeVisibleTimeRangeChange((range) => {
        macdChart.timeScale().setVisibleRange(range as any);
      });

      macdChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        chartRef.current?.timeScale().setVisibleRange(range as any);
      });
    } else if (!indicators.macd && macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistogramSeriesRef.current = null;
    }
  }, [indicators.rsi, indicators.macd, data]);

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
      const validData = data.filter(d => 
        d.time !== undefined && 
        d.open !== undefined && 
        d.high !== undefined && 
        d.low !== undefined && 
        d.close !== undefined
      );
      if (validData.length > 0) {
        candleSeriesRef.current.setData(validData);
      }
    }

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

      // Fibonacci Levels
      fibSeriesRef.current.forEach(s => chartRef.current?.removeSeries(s));
      fibSeriesRef.current = [];

      if (fibLevels && fibLevels.length > 0) {
        fibLevels.forEach(level => {
          const series = chartRef.current!.addSeries(LineSeries, {
            color: level.color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            title: level.label,
          });
          series.setData(data.map(d => ({ time: d.time, value: level.price })));
          fibSeriesRef.current.push(series);
        });
      }

      // RSI Data
      if (indicators.rsi && rsiSeriesRef.current && data.length > 14) {
        const rsiData = [];
        let gains = 0;
        let losses = 0;
        const period = 14;

        for (let i = 1; i <= period; i++) {
          const change = data[i].close - data[i - 1].close;
          if (change > 0) gains += change;
          else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < data.length; i++) {
          const change = data[i].close - data[i - 1].close;
          let gain = change > 0 ? change : 0;
          let loss = change < 0 ? -change : 0;

          avgGain = (avgGain * (period - 1) + gain) / period;
          avgLoss = (avgLoss * (period - 1) + loss) / period;

          const rs = avgGain / (avgLoss || 1);
          const rsi = 100 - 100 / (1 + rs);
          rsiData.push({ time: data[i].time, value: rsi });
        }
        rsiSeriesRef.current.setData(rsiData);
      }

      // MACD Data
      if (indicators.macd && macdSeriesRef.current && macdSignalSeriesRef.current && macdHistogramSeriesRef.current && data.length > 26) {
        const macdData = [];
        const signalData = [];
        const histogramData = [];
        
        const ema12Period = 12;
        const ema26Period = 26;
        const signalPeriod = 9;

        const calculateEMA = (data: any[], period: number) => {
          const k = 2 / (period + 1);
          let ema = data[0].close;
          const emaValues = [{ time: data[0].time, value: ema }];
          for (let i = 1; i < data.length; i++) {
            ema = (data[i].close * k) + (ema * (1 - k));
            emaValues.push({ time: data[i].time, value: ema });
          }
          return emaValues;
        };

        const ema12 = calculateEMA(data, ema12Period);
        const ema26 = calculateEMA(data, ema26Period);

        const macdValues = [];
        for (let i = 0; i < data.length; i++) {
          const val = ema12[i].value - ema26[i].value;
          macdValues.push({ time: data[i].time, value: val });
        }

        // Signal line (EMA 9 of MACD)
        const kSignal = 2 / (signalPeriod + 1);
        let signalLine = macdValues[0].value;
        const signalValues = [{ time: macdValues[0].time, value: signalLine }];
        for (let i = 1; i < macdValues.length; i++) {
          signalLine = (macdValues[i].value * kSignal) + (signalLine * (1 - kSignal));
          signalValues.push({ time: macdValues[i].time, value: signalLine });
        }

        for (let i = 0; i < macdValues.length; i++) {
          const hist = macdValues[i].value - signalValues[i].value;
          macdData.push(macdValues[i]);
          signalData.push(signalValues[i]);
          histogramData.push({
            time: macdValues[i].time,
            value: hist,
            color: hist >= 0 ? '#26a69a' : '#ef5350',
          });
        }

        macdSeriesRef.current.setData(macdData);
        macdSignalSeriesRef.current.setData(signalData);
        macdHistogramSeriesRef.current.setData(histogramData as any);
      }

      // Active Orders Visualization
      if (candleSeriesRef.current) {
        orderLinesRef.current.forEach(line => candleSeriesRef.current?.removePriceLine(line));
        orderLinesRef.current = [];

        activeOrders.forEach(order => {
          const currentPrice = data[data.length - 1]?.close || order.entry_price;
          const isBuy = order.type === 'Buy';
          const pips = isBuy ? (currentPrice - order.entry_price) : (order.entry_price - currentPrice);
          const currentPL = pips * (order.lot_size || 0.1) * 100;

          // Entry Line
          const entryLine = candleSeriesRef.current!.createPriceLine({
            price: order.entry_price,
            color: '#ffffff',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `ENTRY ${order.type.toUpperCase()} (${order.lot_size?.toFixed(2)} LOTS) | P/L: ${currentPL >= 0 ? '+' : ''}$${currentPL.toFixed(2)}`,
          });
          
          // SL Line
          const slLine = candleSeriesRef.current!.createPriceLine({
            price: order.stop_loss,
            color: '#ef4444',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `SL (-$${order.potential_loss?.toFixed(2)})`,
          });

          // TP Line
          const tpLine = candleSeriesRef.current!.createPriceLine({
            price: order.take_profit,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `TP (+$${order.potential_profit?.toFixed(2)})`,
          });

          orderLinesRef.current.push(entryLine, slLine, tpLine);
        });

        // Markers for closed trades
        const markers: any[] = [];
        tradeHistory.forEach(trade => {
          // Convert ms to seconds for lightweight charts
          const tradeTime = Math.floor(trade.close_time / 1000);
          
          markers.push({
            time: tradeTime,
            position: trade.type === 'Buy' ? 'aboveBar' : 'belowBar',
            color: trade.pl >= 0 ? '#10b981' : '#ef4444',
            shape: trade.type === 'Buy' ? 'arrowDown' : 'arrowUp',
            text: `${trade.pl >= 0 ? 'WIN' : 'LOSS'} $${Math.abs(trade.pl).toFixed(2)}`,
          });
        });
        
        if (markers.length > 0) {
          candleSeriesRef.current.setMarkers(markers);
        }
      }
    }
  }, [data, indicators, fibLevels, activeOrders, tradeHistory]);

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white/80">XAUUSD</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">{timeframe}</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
      <div ref={rsiContainerRef} className={`w-full transition-all duration-300 ${indicators.rsi ? 'h-[100px] opacity-100' : 'h-0 opacity-0 overflow-hidden'}`} />
      <div ref={macdContainerRef} className={`w-full transition-all duration-300 ${indicators.macd ? 'h-[100px] opacity-100' : 'h-0 opacity-0 overflow-hidden'}`} />
    </div>
  );
};

const SignalCard = ({ signal, onConfirm, currentLotSize, onLotChange }: any) => {
  const lot = signal.lot_size || currentLotSize || 0.1;
  const isBuy = signal.type === 'Buy';
  
  // XAUUSD: 1 lot = 100 oz. Profit = (Diff) * Lot * 100
  const contractSize = 100;
  const potentialProfit = Math.abs(signal.take_profit - signal.entry_price) * lot * contractSize;
  const potentialLoss = Math.abs(signal.entry_price - signal.stop_loss) * lot * contractSize;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 mb-4 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold">{signal.symbol}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {signal.type}
            </span>
            {signal.isBot && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">BOT</span>
            )}
          </div>
          <p className="text-xs text-white/40">M15 Timeframe • AI Score: <span className={signal.score > 75 ? 'text-emerald-400' : 'text-white/60'}>{signal.score}%</span></p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Entry</p>
          <p className="text-lg font-mono font-bold">{signal.entry_price}</p>
        </div>
      </div>

      {/* Lot Size Selector */}
      {!signal.confirmed && (
        <div className="flex items-center justify-between mb-4 bg-white/5 p-3 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Lot Size</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onLotChange(Math.max(0.01, lot - 0.01))}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="font-mono font-bold text-sm w-12 text-center">{lot.toFixed(2)}</span>
            <button 
              onClick={() => onLotChange(lot + 0.01)}
              className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Stop Loss</p>
            <p className="text-[9px] font-bold text-red-400">-${potentialLoss.toFixed(2)}</p>
          </div>
          <p className="font-mono text-red-400 font-bold">{signal.stop_loss}</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Take Profit</p>
            <p className="text-[9px] font-bold text-emerald-400">+${potentialProfit.toFixed(2)}</p>
          </div>
          <p className="font-mono text-emerald-400 font-bold">{signal.take_profit}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => onConfirm(signal.id, lot, potentialProfit, potentialLoss)}
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
};

const PendingOrderModal = ({ isOpen, onClose, type, setType, price, setPrice, onConfirm, lotSize, setLotSize }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-t-[32px] p-6 shadow-2xl"
        >
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-6">New Pending Order</h3>
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2 block">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Buy Limit', 'Sell Limit', 'Buy Stop', 'Sell Stop'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${type === t ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2 block">Lot Size</label>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <button onClick={() => setLotSize(Math.max(0.01, lotSize - 0.01))} className="text-white/40"><Minus size={14} /></button>
                  <span className="flex-1 text-center font-mono font-bold">{lotSize.toFixed(2)}</span>
                  <button onClick={() => setLotSize(lotSize + 0.01)} className="text-white/40"><Plus size={14} /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2 block">Price</label>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <button onClick={() => setPrice(price - 0.1)} className="text-white/40"><Minus size={14} /></button>
                  <input 
                    type="number" 
                    value={price.toFixed(2)} 
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="flex-1 bg-transparent text-center font-mono font-bold outline-none w-full"
                  />
                  <button onClick={() => setPrice(price + 0.1)} className="text-white/40"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-bold text-sm"
            >
              CANCEL
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
            >
              PLACE ORDER
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [riskLimit, setRiskLimit] = useState(1.0);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState<Signal[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [fibLevels, setFibLevels] = useState<any[]>([]);
  const [fibPoints, setFibPoints] = useState<{ start: any, end: any } | null>(null);
  const [botSignal, setBotSignal] = useState<Signal | null>(null);
  const [botAnalysis, setBotAnalysis] = useState<any>(null);
  const [tpFeedback, setTpFeedback] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<Signal[]>([]);
  const [tradeHistory, setTradeHistory] = useState<(Signal & { close_price: number; close_time: number; pl: number })[]>([]);
  const [lotSize, setLotSize] = useState(0.1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(true); // Activated Pro
  const [activeAccount, setActiveAccount] = useState<any>({ broker_name: 'TraderXau Demo', account_type: 'Demo', balance: 10000 });
  const [brokerAccounts, setBrokerAccounts] = useState<any[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<any[]>([
    { time: '12:45:12', type: 'SYSTEM', message: 'AI Engine synchronized with OANDA liquidity...' },
    { time: '12:44:05', type: 'SIGNAL', message: 'New Bullish divergence detected on M15 timeframe.' },
    { time: '12:42:30', type: 'INFO', message: 'Risk parameters updated to 1.5% per trade.' }
  ]);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showTradingPanel, setShowTradingPanel] = useState(true);
  const [showPendingOrder, setShowPendingOrder] = useState(false);
  const [pendingOrderType, setPendingOrderType] = useState<'Buy Limit' | 'Sell Limit' | 'Buy Stop' | 'Sell Stop'>('Buy Limit');
  const [pendingPrice, setPendingPrice] = useState(0);
  const [timeframe, setTimeframe] = useState('M15');
  const [isChangingTimeframe, setIsChangingTimeframe] = useState(false);
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    unbiased: true,
    rsi: false,
    macd: false
  });
  const [chartType, setChartType] = useState<'ai' | 'mt5'>('mt5');

  useEffect(() => {
    setIsChangingTimeframe(true);
    setChartData([]); // Clear data to simulate timeframe switch
    const timer = setTimeout(() => setIsChangingTimeframe(false), 800);
    return () => clearTimeout(timer);
  }, [timeframe]);

  const calculatePL = (order: Signal) => {
    const currentPrice = prices['XAUUSD']?.close || order.entry_price;
    const diff = order.type === 'Buy' ? currentPrice - order.entry_price : order.entry_price - currentPrice;
    return diff * (order.lot_size || 0.1) * 100;
  };

  useEffect(() => {
    const currentPrice = prices['XAUUSD']?.close;
    if (!currentPrice || activeOrders.length === 0) return;

    const ordersToClose: number[] = [];
    activeOrders.forEach(order => {
      if (order.symbol !== 'XAUUSD') return;

      const isBuy = order.type === 'Buy';
      const hitTP = isBuy ? currentPrice >= order.take_profit : currentPrice <= order.take_profit;
      const hitSL = isBuy ? currentPrice <= order.stop_loss : currentPrice >= order.stop_loss;

      if (hitTP || hitSL) {
        ordersToClose.push(order.id);
        
        const pl = calculatePL(order);
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setTerminalLogs(prev => [
          { 
            time: timeStr, 
            type: hitTP ? 'PROFIT' : 'LOSS', 
            message: `Order closed at ${currentPrice.toFixed(2)} (${hitTP ? 'TP' : 'SL'} hit). P/L: ${pl >= 0 ? '+' : ''}${pl.toFixed(2)}` 
          },
          ...prev.slice(0, 9)
        ]);
      }
    });

    if (ordersToClose.length > 0) {
      setActiveOrders(prev => prev.filter(o => !ordersToClose.includes(o.id)));
      
      // Update balance
      ordersToClose.forEach(id => {
        const order = activeOrders.find(o => o.id === id);
        if (order) {
          const pl = calculatePL(order);
          setActiveAccount((prev: any) => ({ ...prev, balance: prev.balance + pl }));
        }
      });
    }
  }, [prices, activeOrders]);

  useEffect(() => {
    const socket = io();
    socket.on('price_update', (newPrices) => {
      if (!newPrices || !newPrices['XAUUSD']) return;
      
      const newDataPoint = newPrices['XAUUSD'];
      if (
        newDataPoint.time === undefined || 
        newDataPoint.open === undefined || 
        newDataPoint.high === undefined || 
        newDataPoint.low === undefined || 
        newDataPoint.close === undefined
      ) return;

      setPrices(newPrices);
      setChartData(prev => {
        const lastData = prev[prev.length - 1];
        
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

  useEffect(() => {
    if (chartData.length < 30) return;

    const runBotAnalysis = () => {
      const data = chartData;
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      
      // 1. SMA (5)
      const sma5 = data.slice(-5).reduce((a, b) => a + b.close, 0) / 5;
      const smaSignal = last.close > sma5 ? 'Buy' : 'Sell';

      // 2. EMA (21) - Simplified
      const ema21 = data.slice(-21).reduce((a, b) => a + b.close, 0) / 21;
      const emaSignal = last.close > ema21 ? 'Buy' : 'Sell';

      // 3. RSI (14) - Simplified logic
      const gains = [];
      const losses = [];
      for (let i = data.length - 14; i < data.length; i++) {
        const diff = data[i].close - data[i-1].close;
        if (diff >= 0) gains.push(diff);
        else losses.push(Math.abs(diff));
      }
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      const rs = avgGain / (avgLoss || 1);
      const rsi = 100 - (100 / (1 + rs));
      const rsiSignal = rsi < 45 ? 'Buy' : rsi > 55 ? 'Sell' : 'Neutral';

      // 4. Unbiased Level
      const unbiased = (last.high + last.low + last.close) / 3;
      const unbiasedSignal = last.close > unbiased ? 'Buy' : 'Sell';

      // 5. Price Action (Last 3 candles)
      const paSignal = (last.close > prev.close && prev.close > data[data.length-3].close) ? 'Buy' : 
                       (last.close < prev.close && prev.close < data[data.length-3].close) ? 'Sell' : 'Neutral';

      const signals = [smaSignal, emaSignal, rsiSignal, unbiasedSignal, paSignal];
      const buyCount = signals.filter(s => s === 'Buy').length;
      const sellCount = signals.filter(s => s === 'Sell').length;

      let finalType: 'Buy' | 'Sell' | null = null;
      let confidence = 0;

      if (buyCount >= 3) {
        finalType = 'Buy';
        confidence = 70 + (buyCount - 3) * 10;
      } else if (sellCount >= 3) {
        finalType = 'Sell';
        confidence = 70 + (sellCount - 3) * 10;
      }

      setBotAnalysis({
        indicators: {
          sma: smaSignal,
          ema: emaSignal,
          rsi: rsiSignal,
          unbiased: unbiasedSignal,
          priceAction: paSignal
        },
        buyCount,
        sellCount,
        confidence
      });

      if (finalType && confidence >= 70) {
        const newBotSignal: Signal = {
          id: 999,
          symbol: 'XAUUSD',
          type: finalType,
          entry_price: last.close,
          stop_loss: finalType === 'Buy' ? last.close - 5 : last.close + 5,
          take_profit: finalType === 'Buy' ? last.close + 10 : last.close - 10,
          score: confidence,
          confirmed: false,
          created_at: new Date().toISOString(),
          isBot: true
        };
        setBotSignal(newBotSignal);
      } else {
        setBotSignal(null);
      }
    };

    runBotAnalysis();
  }, [chartData]);

  const fetchSignals = async () => {
    // Mock signals for demo if API fails
    const mockSignals: Signal[] = [
      { id: 1, symbol: 'XAUUSD', type: 'Buy', entry_price: 2035.20, stop_loss: 2030.50, take_profit: 2044.80, score: 82, confirmed: false, created_at: new Date().toISOString() },
      { id: 2, symbol: 'EURUSD', type: 'Sell', entry_price: 1.0845, stop_loss: 1.0870, take_profit: 1.0810, score: 68, confirmed: false, created_at: new Date().toISOString() },
    ];
    setSignals(mockSignals);
  };

  const fetchHeatmap = async (retries = 3) => {
    try {
      const res = await fetch('/api/market/heatmap');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setHeatmap(data);
    } catch (e) {
      console.error('Heatmap fetch failed:', e);
      if (retries > 0) {
        setTimeout(() => fetchHeatmap(retries - 1), 2000);
      }
    }
  };

  const totalPL = activeOrders.reduce((acc, order) => acc + calculatePL(order), 0);
  const equity = activeAccount.balance + totalPL;

  const handleConfirm = (id: number, lot?: number, profit?: number, loss?: number) => {
    setSignals(prev => prev.map(s => s.id === id ? { ...s, confirmed: true, lot_size: lot, potential_profit: profit, potential_loss: loss } : s));
    
    // Find the signal and add to active orders
    const signalToConfirm = signals.find(s => s.id === id) || (botSignal?.id === id ? botSignal : null);
    if (signalToConfirm) {
      const confirmedOrder = { 
        ...signalToConfirm, 
        id: Date.now(), // Ensure unique ID for the active order
        confirmed: true, 
        lot_size: lot || lotSize,
        potential_profit: profit || (Math.abs(signalToConfirm.take_profit - signalToConfirm.entry_price) * (lot || lotSize) * 100),
        potential_loss: loss || (Math.abs(signalToConfirm.entry_price - signalToConfirm.stop_loss) * (lot || lotSize) * 100)
      };
      setActiveOrders(prev => [...prev, confirmedOrder]);
      
      // If it was the bot signal, clear it
      if (botSignal?.id === id) {
        setBotSignal(null);
      }
    }
  };

  const handleMarketOrder = (type: 'Buy' | 'Sell', lot: number) => {
    const currentPrice = prices['XAUUSD']?.close || 2035.50;
    const sl = type === 'Buy' ? currentPrice - 5 : currentPrice + 5;
    const tp = type === 'Buy' ? currentPrice + 10 : currentPrice - 10;
    
    const newOrder: Signal = {
      id: Date.now(),
      symbol: 'XAUUSD',
      type: type,
      entry_price: currentPrice,
      stop_loss: sl,
      take_profit: tp,
      timeframe: timeframe,
      score: 100,
      created_at: new Date().toISOString(),
      confirmed: true,
      lot_size: lot,
      potential_profit: Math.abs(tp - currentPrice) * lot * 100,
      potential_loss: Math.abs(currentPrice - sl) * lot * 100
    };
    
    setActiveOrders(prev => [...prev, newOrder]);
    
    setTerminalLogs(prev => [{
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'SIGNAL',
      message: `Market ${type} order executed at ${currentPrice.toFixed(2)}`
    }, ...prev]);
  };

  const handleCloseOrder = (id: number) => {
    const orderToClose = activeOrders.find(o => o.id === id);
    if (orderToClose) {
      const pl = calculatePL(orderToClose);
      const currentPrice = prices[orderToClose.symbol]?.close || orderToClose.entry_price;
      
      setTradeHistory(prev => [{
        ...orderToClose,
        close_price: currentPrice,
        close_time: Date.now(),
        pl: pl
      }, ...prev]);

      setActiveAccount(prev => ({
        ...prev,
        balance: prev.balance + pl
      }));
    }
    setActiveOrders(prev => prev.filter(order => order.id !== id));
    if (expandedOrderId === id) setExpandedOrderId(null);
  };

  const handleEditOnChart = (order: Signal) => {
    setActiveTab('dashboard');
    // In a real app, we'd scroll to the chart or highlight the lines
  };

  const setTakeProfitFromFib = (price: number, label: string) => {
    if (botSignal) {
      setBotSignal({ ...botSignal, take_profit: parseFloat(price.toFixed(2)) });
      setTpFeedback(`TP set to ${label} (${price.toFixed(2)})`);
      setTimeout(() => setTpFeedback(null), 3000);
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-[#0A0A0B]">
      <Header />
      
      <PendingOrderModal 
        isOpen={showPendingOrder}
        onClose={() => setShowPendingOrder(false)}
        type={pendingOrderType}
        setType={setPendingOrderType}
        price={pendingPrice}
        setPrice={setPendingPrice}
        lotSize={lotSize}
        setLotSize={setLotSize}
        onConfirm={() => {
          const newOrder: Signal = {
            id: Date.now(),
            symbol: 'XAUUSD',
            type: pendingOrderType.includes('Buy') ? 'Buy' : 'Sell',
            entry_price: pendingPrice,
            stop_loss: pendingOrderType.includes('Buy') ? pendingPrice - 5 : pendingPrice + 5,
            take_profit: pendingOrderType.includes('Buy') ? pendingPrice + 10 : pendingPrice - 10,
            score: 100,
            confirmed: true,
            created_at: new Date().toISOString(),
            lot_size: lotSize,
            potential_profit: 1000 * lotSize,
            potential_loss: 500 * lotSize
          };
          setActiveOrders(prev => [...prev, newOrder]);
        }}
      />

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
                    <Activity size={14} className="text-white/40" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Equity</span>
                  </div>
                  <p className={`text-xl font-bold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[10px] font-bold mt-1 ${totalPL >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                    {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)} Net P/L
                  </p>
                </div>
              </div>

              {/* Market Sentiment */}
              <div className="glass rounded-3xl p-6 mb-6 border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-white/40" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Market Sentiment</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Bullish</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex mb-2">
                  <div className="h-full bg-emerald-500 w-[68%] transition-all duration-1000"></div>
                  <div className="h-full bg-red-500 w-[32%] transition-all duration-1000"></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest">
                  <span className="text-emerald-400">68% Buy</span>
                  <span className="text-red-400">32% Sell</span>
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
                <AnimatePresence>
                  {showTradingPanel && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-4 px-2 pt-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">XAUUSD</h3>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase">LIVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 mr-2">
                            <button onClick={() => setLotSize(Math.max(0.01, lotSize - 0.01))} className="text-white/40 hover:text-white"><Minus size={10} /></button>
                            <span className="text-[10px] font-mono font-bold w-8 text-center">{lotSize.toFixed(2)}</span>
                            <button onClick={() => setLotSize(lotSize + 0.01)} className="text-white/40 hover:text-white"><Plus size={10} /></button>
                          </div>
                          <button 
                            onClick={() => handleMarketOrder('Sell', lotSize)}
                            className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-red-500/30 active:scale-95 transition-all"
                          >
                            SELL {prices['XAUUSD']?.close}
                          </button>
                          <button 
                            onClick={() => handleMarketOrder('Buy', lotSize)}
                            className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 active:scale-95 transition-all"
                          >
                            BUY {prices['XAUUSD']?.close}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* One-Click Trading Panel Toggle & Pending Order Button */}
                <div className="flex items-center gap-1 mb-4 bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setShowTradingPanel(!showTradingPanel)}
                    className={`p-2 rounded-lg transition-all ${showTradingPanel ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}
                    title="Toggle Trading Panel"
                  >
                    <Zap size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setPendingPrice(prices['XAUUSD']?.close || 0);
                      setShowPendingOrder(true);
                    }}
                    className={`p-2 rounded-lg transition-all text-white/40 hover:text-white`}
                    title="Pending Order"
                  >
                    <Clock size={16} />
                  </button>
                  <div className="w-[1px] h-4 bg-white/10 mx-1" />
                  <div className="flex bg-white/5 rounded-lg p-1 mr-2">
                    <button 
                      onClick={() => setChartType('ai')}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${chartType === 'ai' ? 'bg-white text-black' : 'text-white/40'}`}
                    >
                      AI
                    </button>
                    <button 
                      onClick={() => setChartType('mt5')}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${chartType === 'mt5' ? 'bg-white text-black' : 'text-white/40'}`}
                    >
                      MT5
                    </button>
                  </div>
                  <div className="w-[1px] h-4 bg-white/10 mx-1" />
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
                    onClick={() => setActiveTool(activeTool === 'tline' ? null : 'tline')}
                    className={`p-2 rounded-lg transition-all ${activeTool === 'tline' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTool(activeTool === 'fib' ? null : 'fib');
                      setFibPoints(null);
                    }}
                    className={`p-2 rounded-lg transition-all ${activeTool === 'fib' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <Hash size={16} />
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
                
                <div className="relative">
                  {chartType === 'ai' ? (
                    <>
                      <CandlestickChart 
                        data={chartData} 
                        indicators={indicators} 
                        activeTool={activeTool}
                        fibLevels={fibLevels}
                        activeOrders={activeOrders}
                        tradeHistory={tradeHistory}
                        timeframe={timeframe}
                        onChartClick={(param) => {
                          if (!param || param.price === undefined || param.time === undefined) return;
                          if (activeTool === 'hline') {
                            setActiveTool(null);
                          } else if (activeTool === 'fib') {
                            if (!fibPoints || (fibPoints.start && fibPoints.end)) {
                              setFibPoints({ start: { price: param.price, time: param.time }, end: null });
                              setFibLevels([]);
                            } else {
                              const startPrice = fibPoints.start.price;
                              const endPrice = param.price;
                              const diff = startPrice - endPrice;
                              
                              const ratios = [
                                { r: 0, label: '0.0%', color: '#ef4444' },
                                { r: 0.236, label: '23.6%', color: '#f59e0b' },
                                { r: 0.382, label: '38.2%', color: '#10b981' },
                                { r: 0.5, label: '50.0%', color: '#3b82f6' },
                                { r: 0.618, label: '61.8%', color: '#8b5cf6' },
                                { r: 0.786, label: '78.6%', color: '#ec4899' },
                                { r: 1, label: '100.0%', color: '#ffffff' },
                              ];

                              const levels = ratios.map(ratio => ({
                                price: startPrice - (diff * ratio.r),
                                label: ratio.label,
                                color: ratio.color
                              }));

                              setFibLevels(levels);
                              setFibPoints({ ...fibPoints, end: { price: param.price, time: param.time } });
                              setActiveTool(null);
                            }
                          }
                        }}
                      />
                      {activeOrders.length > 0 && (
                        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 max-h-[200px] overflow-y-auto no-scrollbar">
                          {activeOrders.map(order => {
                            const pl = calculatePL(order);
                            return (
                              <motion.div 
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                key={order.id} 
                                className="glass px-3 py-2 rounded-xl flex items-center gap-3 border-white/5 shadow-xl backdrop-blur-md"
                              >
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-white/40 uppercase">{order.type} {order.symbol}</span>
                                  <span className="text-[10px] font-mono font-bold">{order.entry_price.toFixed(2)}</span>
                                </div>
                                <div className={`text-xs font-mono font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <MetaTraderChart />
                  )}
                  {isChangingTimeframe && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-3xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Loading {timeframe} Data</span>
                      </div>
                    </div>
                  )}
                </div>

                {fibLevels.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Fibonacci Levels</span>
                      <button 
                        onClick={() => { setFibLevels([]); setFibPoints(null); }}
                        className="text-[10px] text-red-400/60 hover:text-red-400 font-bold"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {fibLevels.map((level, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTakeProfitFromFib(level.price, level.label)}
                          className="flex flex-col items-center gap-1 min-w-[60px] glass p-2 rounded-xl hover:bg-white/5 transition-all active:scale-95"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }}></div>
                          <span className="text-[9px] font-bold">{level.label}</span>
                          <span className="text-[8px] text-white/40">{level.price.toFixed(2)}</span>
                          <span className="text-[7px] uppercase tracking-tighter text-emerald-400 font-bold mt-1">Set TP</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                  <button 
                    onClick={() => setIndicators(prev => ({ ...prev, macd: !prev.macd }))}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${indicators.macd ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    MACD
                  </button>
                </div>
              </div>

              {/* Active Signals */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold tracking-tight">Active Signals</h2>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Bot Active</span>
                </div>
              </div>

              {botSignal && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Live Bot Analysis</span>
                  </div>
                  <SignalCard 
                    signal={botSignal} 
                    onConfirm={handleConfirm} 
                    currentLotSize={lotSize}
                    onLotChange={setLotSize}
                  />
                  
                  {botAnalysis && (
                    <div className="px-4 py-3 glass rounded-2xl border-white/5 mt-[-12px] mx-2 relative z-0 bg-black/40">
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(botAnalysis.indicators).map(([name, sig]: any) => (
                          <div key={name} className="flex flex-col items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${sig === botSignal.type ? 'bg-emerald-500' : sig === 'Neutral' ? 'bg-white/20' : 'bg-red-500'}`}></div>
                            <span className="text-[7px] uppercase text-white/40 font-bold truncate w-full text-center">{name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-[8px] text-white/30 italic">
                          Bot requires 3+ matching indicators.
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold text-emerald-400">{botAnalysis.confidence}% Match</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <AnimatePresence>
                    {tpFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit mx-auto"
                      >
                        {tpFeedback}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {signals.filter(s => !s.confirmed).map(signal => (
                <SignalCard 
                  key={signal.id} 
                  signal={signal} 
                  onConfirm={handleConfirm} 
                  currentLotSize={lotSize}
                  onLotChange={setLotSize}
                />
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
                <SignalCard 
                  key={signal.id} 
                  signal={signal} 
                  onConfirm={handleConfirm} 
                  currentLotSize={lotSize}
                  onLotChange={setLotSize}
                />
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
                  onClick={() => setActiveAccount({ broker_name: 'TraderXau Demo', account_type: 'Demo', balance: 10000 })}
                  className={`glass rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${activeAccount.broker_name === 'TraderXau Demo' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-bold">TraderXau Demo</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Demo Account</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">$10,000.00</p>
                    {activeAccount.broker_name === 'TraderXau Demo' && <CheckCircle2 size={16} className="text-emerald-400 ml-auto mt-1" />}
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
                  Your API keys are encrypted using AES-256 standards. TraderXau-Bot never executes trades without your manual confirmation unless "Auto-Trade" is enabled in settings.
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
              className="py-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Trade History</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{activeOrders.length} Active</span>
                </div>
              </div>

              {activeOrders.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="glass rounded-2xl p-4 border-white/5">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-white/40 mb-1">Win Rate</p>
                    <p className="text-lg font-bold text-emerald-400">72%</p>
                  </div>
                  <div className="glass rounded-2xl p-4 border-white/5">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-white/40 mb-1">Total P/L</p>
                    <p className={`text-lg font-bold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
                    </p>
                  </div>
                  <div className="glass rounded-2xl p-4 border-white/5">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-white/40 mb-1">Avg R:R</p>
                    <p className="text-lg font-bold text-amber-400">1:2.4</p>
                  </div>
                </div>
              )}

              {activeOrders.length === 0 && tradeHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
                    <History size={32} className="text-white/20" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No Trade History</h3>
                  <p className="text-sm text-white/40 px-12">Your executed trades will appear here once you confirm a signal.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeOrders.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Active Positions</p>
                      {activeOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`glass rounded-2xl border-white/5 relative overflow-hidden transition-all duration-300 ${expandedOrderId === order.id ? 'p-6 bg-white/5' : 'p-4'}`}
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{order.symbol}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase ${order.type === 'Buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {order.type}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-white/5 text-white/60">
                            {order.lot_size?.toFixed(2)} LOTS
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40 font-mono">{new Date(order.created_at).toLocaleTimeString()}</span>
                          <ChevronDown size={14} className={`text-white/20 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <p className="text-[8px] uppercase text-white/40 font-bold">Entry</p>
                          <p className="text-xs font-mono font-bold">{order.entry_price}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase text-white/40 font-bold">SL</p>
                          <p className="text-xs font-mono font-bold text-red-400">{order.stop_loss}</p>
                          <p className="text-[7px] text-red-400/60">-${order.potential_loss?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase text-white/40 font-bold">TP</p>
                          <p className="text-xs font-mono font-bold text-emerald-400">{order.take_profit}</p>
                          <p className="text-[7px] text-emerald-400/60">+${order.potential_profit?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase text-white/40 font-bold">Net P/L</p>
                          <p className={`text-xs font-mono font-bold ${calculatePL(order) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {calculatePL(order) >= 0 ? '+' : ''}${calculatePL(order).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedOrderId === order.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-6 pt-6 border-t border-white/5 flex gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              onClick={() => handleEditOnChart(order)}
                              className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                            >
                              <Edit3 size={14} />
                              EDIT ON CHART
                            </button>
                            <button 
                              onClick={() => handleCloseOrder(order.id)}
                              className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                            >
                              <XCircle size={14} />
                              CLOSE ORDER
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/20 w-full"></div>
                    </div>
                  ))}
                </div>
              )}

                  {tradeHistory.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Closed Trades</p>
                      {tradeHistory.map((trade) => (
                        <div 
                          key={trade.id} 
                          className="glass rounded-2xl border-white/5 p-4 bg-white/2"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{trade.symbol}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase ${trade.type === 'Buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {trade.type}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-white/5 text-white/40">
                                {trade.lot_size?.toFixed(2)} LOTS
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/20 font-mono">{new Date(trade.close_time).toLocaleTimeString()}</span>
                              <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${trade.pl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {trade.pl >= 0 ? 'PROFIT' : 'LOSS'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-[8px] uppercase text-white/40 font-bold">Entry</p>
                              <p className="text-xs font-mono">{trade.entry_price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[8px] uppercase text-white/40 font-bold">Exit</p>
                              <p className="text-xs font-mono">{trade.close_price.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] uppercase text-white/40 font-bold">Result</p>
                              <p className={`text-xs font-mono font-bold ${trade.pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.pl >= 0 ? '+' : ''}${trade.pl.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
              
              <div className="space-y-6">
                {/* Terminal Log */}
                <div className="glass rounded-3xl p-6 border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Hash size={14} className="text-white/40" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">Terminal Log</span>
                  </div>
                  <div className="space-y-3 font-mono text-[9px]">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-white/20">{log.time}</span>
                        <span className={
                          log.type === 'SYSTEM' ? 'text-emerald-400' : 
                          log.type === 'SIGNAL' ? 'text-amber-400' : 
                          log.type === 'PROFIT' ? 'text-emerald-400' :
                          log.type === 'LOSS' ? 'text-red-400' :
                          'text-white/40'
                        }>[{log.type}]</span>
                        <span className="text-white/60">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Switcher */}
                <div className="glass rounded-3xl p-6 border-white/5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-4">Active Account</p>
                  <div className="flex p-1 bg-white/5 rounded-2xl mb-4">
                    <button 
                      onClick={() => setActiveAccount({ broker_name: 'TraderXau Demo', account_type: 'Demo', balance: 10000 })}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeAccount.account_type === 'Demo' ? 'bg-emerald-500 text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      DEMO
                    </button>
                    <button 
                      onClick={() => setActiveAccount({ broker_name: 'TraderXau Real', account_type: 'Real', balance: 2540.50 })}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeAccount.account_type === 'Real' ? 'bg-emerald-500 text-black' : 'text-white/40 hover:text-white'}`}
                    >
                      REAL
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <div>
                      <p className="text-xs font-bold">{activeAccount.broker_name}</p>
                      <p className="text-[10px] text-white/40">ID: 88294012</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold">${activeAccount.balance.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active</p>
                    </div>
                  </div>
                </div>

                {/* Risk Management */}
                <div className="glass rounded-3xl p-6 border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Global Risk Limit</p>
                      <h4 className="font-bold">Risk Per Trade</h4>
                    </div>
                    <span className="text-xl font-bold text-emerald-400">{riskLimit.toFixed(1)}%</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5" 
                    step="0.1" 
                    value={riskLimit}
                    onChange={(e) => setRiskLimit(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] uppercase text-white/40 font-bold mb-1">Max Drawdown</p>
                      <p className="text-xs font-bold">15.0%</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[8px] uppercase text-white/40 font-bold mb-1">Daily Loss Limit</p>
                      <p className="text-xs font-bold">3.5%</p>
                    </div>
                  </div>
                </div>

                {/* Terminal Preferences */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 px-2">Preferences</p>
                  
                  <div className="glass rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Zap size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">One-Click Trading</p>
                        <p className="text-[10px] text-white/40">Instant order execution</p>
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-emerald-500 rounded-full relative p-1">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Bell size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Signal Alerts</p>
                        <p className="text-[10px] text-white/40">Push notifications for AI signals</p>
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-emerald-500 rounded-full relative p-1">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                    </div>
                  </div>
                </div>

                {/* Mobile Experience */}
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

                <div className="mt-6 p-6 glass rounded-3xl border-emerald-500/20">
                  <h4 className="text-emerald-400 font-bold mb-2">TraderXau Pro</h4>
                  <p className="text-xs text-white/60 mb-4">Unlock advanced AI signals and multi-timeframe heatmap analysis.</p>
                  <button className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl text-sm">UPGRADE NOW</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
