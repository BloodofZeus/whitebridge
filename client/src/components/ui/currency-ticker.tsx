import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CurrencyRate {
  currency: string;
  rate: number;
  change: number;
  changePercent: number;
}

export default function CurrencyTicker() {
  const [rates, setRates] = useState<CurrencyRate[]>([
    { currency: 'EUR/USD', rate: 1.0842, change: 0.0023, changePercent: 0.21 },
    { currency: 'GBP/USD', rate: 1.2734, change: -0.0045, changePercent: -0.35 },
    { currency: 'USD/JPY', rate: 149.85, change: 0.34, changePercent: 0.23 },
    { currency: 'USD/CAD', rate: 1.3589, change: 0.0012, changePercent: 0.09 },
    { currency: 'AUD/USD', rate: 0.6523, change: -0.0018, changePercent: -0.28 },
    { currency: 'USD/CHF', rate: 0.8734, change: 0.0009, changePercent: 0.10 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => prev.map(rate => ({
        ...rate,
        rate: rate.rate + (Math.random() - 0.5) * 0.01,
        change: (Math.random() - 0.5) * 0.01,
        changePercent: (Math.random() - 0.5) * 1
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Live Exchange Rates</h3>
          <span className="text-sm text-gray-300">Real-time</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {rates.map((rate) => (
            <div key={rate.currency} className="text-center">
              <div className="text-sm font-medium text-gray-300">{rate.currency}</div>
              <div className="text-lg font-bold">{rate.rate.toFixed(4)}</div>
              <div className={`text-xs flex items-center justify-center ${
                rate.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className={`mr-1 ${rate.change >= 0 ? '↗' : '↘'}`}>
                  {rate.change >= 0 ? '↗' : '↘'}
                </span>
                {Math.abs(rate.changePercent).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}