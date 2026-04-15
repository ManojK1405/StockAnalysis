import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const StockChart = ({ data, colors: {
    backgroundColor = 'transparent',
    lineColor = '#60a5fa',
    textColor = '#94a3b8',
    areaTopColor = 'rgba(96, 165, 250, 0.25)',
    areaBottomColor = 'rgba(96, 165, 250, 0.01)',
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
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 350,
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                fixRightEdge: true,
                fixLeftEdge: true,
                rightOffset: 0,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }
        });

        const newSeries = chart.addAreaSeries({
            lineColor,
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineWidth: 3,
            priceLineVisible: false,
        });

        // Sort data by time and filter invalid/duplicate entries
        const uniqueDates = new Set();
        const sortedData = [...data]
            .filter(item => item.close != null && !isNaN(item.close))
            .map(item => ({
                time: item.date.split('T')[0],
                value: item.close
            }))
            .filter(item => {
                if (uniqueDates.has(item.time)) return false;
                uniqueDates.add(item.time);
                return true;
            })
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
