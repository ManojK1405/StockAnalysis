import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const StockChart = ({ data, colors: {
    backgroundColor = '#ffffff',
    lineColor = '#4f46e5',
    textColor = '#64748b',
    areaTopColor = 'rgba(79, 70, 229, 0.15)',
    areaBottomColor = 'rgba(79, 70, 229, 0.02)',
} = {} }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { color: '#f1f5f9' },
                horzLines: { color: '#f1f5f9' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            timeScale: {
                borderColor: '#e2e8f0',
                fixRightEdge: true,
                fixLeftEdge: true,
                rightOffset: 0,
            },
            rightPriceScale: {
                borderColor: '#e2e8f0',
            }
        });

        const newSeries = chart.addAreaSeries({
            lineColor,
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineWidth: 3,
            priceLineVisible: false,
        });

        // Sort data by time
        const sortedData = [...data]
            .map(item => ({
                time: item.date.split('T')[0],
                value: item.close
            }))
            .sort((a, b) => new Date(a.time) - new Date(b.time));

        newSeries.setData(sortedData);
        
        const totalPoints = sortedData.length;
        if (totalPoints > 100) {
            // Show recent ~4-5 months by default, user can zoom out to 2 years
            chart.timeScale().setVisibleLogicalRange({
                from: totalPoints - 100,
                to: totalPoints - 1
            });
        } else {
            chart.timeScale().fitContent();
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

    return (
        <div ref={chartContainerRef} className="w-full h-full" />
    );
};

export default StockChart;
