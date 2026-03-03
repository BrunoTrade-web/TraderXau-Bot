import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface MetaTraderChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
}

const MetaTraderChart: React.FC<MetaTraderChartProps> = ({ 
  symbol = "FX_IDC:XAUUSD", 
  theme = "dark" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        new window.TradingView.widget({
          "width": "100%",
          "height": 400,
          "symbol": symbol,
          "interval": "15",
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": containerRef.current.id,
          "details": true,
          "hotlist": true,
          "calendar": true,
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
          "backgroundColor": "#0A0A0B",
          "gridColor": "rgba(255, 255, 255, 0.05)",
          "studies": [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies"
          ],
          "overrides": {
            "mainSeriesProperties.candleStyle.upColor": "#10b981",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "mainSeriesProperties.candleStyle.drawWick": true,
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
            "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          }
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, theme]);

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-[#0A0A0B] shadow-2xl">
      <div id="tradingview_mt5_chart" ref={containerRef} className="w-full h-[400px]" />
      <div className="p-3 bg-white/5 border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">MT5 Live Feed • Real-time</span>
        </div>
        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
          Market Hours: 24/5
        </div>
      </div>
    </div>
  );
};

export default MetaTraderChart;
