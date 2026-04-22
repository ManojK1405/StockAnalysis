import SectionTitle from "../components/section-title";

export default function OurLatestCreations() {

    const data = [
        {
            title: 'Sentiment Engine',
            description: 'Analyzes millions of news data points to gauge market mood and emotional volatility.',
            image: 'https://images.unsplash.com/photo-1551288049-bbbda536639a?q=80&w=400&h=250&auto=format&fit=crop',
        },
        {
            title: 'Technical Terminal',
            description: 'Institutional-grade indicators and chart patterns tracked with millisecond precision.',
            image: 'https://images.unsplash.com/photo-1611974714652-478f6927520e?q=80&w=400&h=250&auto=format&fit=crop',
        },
        {
            title: 'Portfolio Vault',
            description: 'Seamlessly switch between Live tracking and Paper trading with real-time WebSocket sync.',
            image: 'https://images.unsplash.com/photo-1526303323684-f358f9791f1d?q=80&w=400&h=250&auto=format&fit=crop',
        },
    ];
    return (
        <section className="flex flex-col items-center justify-center mt-40">
            <SectionTitle title="Quant Intelligence" subtitle="A suite of proprietary algorithms designed to strip away market noise and reveal institutional-grade insights." />
            <div className="flex flex-wrap items-center justify-center gap-10 mt-16">
                {data.map((item, index) => (
                    <div key={index} className="max-w-80 hover:-translate-y-0.5 transition duration-300">
                        <img className="rounded-xl" src={item.image} alt={item.title} />
                        <h3 className="text-base font-semibold text-slate-700 mt-4">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}