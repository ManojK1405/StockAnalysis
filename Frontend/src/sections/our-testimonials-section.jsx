import SectionTitle from '../components/section-title';
import { StarIcon } from 'lucide-react';

export default function OurTestimonialSection() {
    const data = [
        {
            review: "EquiSense transformed my trading from reactive to proactive. The sentiment engine is frighteningly accurate.",
            name: "Arjun Mehta",
            about: "Intraday Scalper",
            rating: 5,
            image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
        },
        {
            review: "I used to spend hours on spreadsheets. Now, the Reverse Strategist does my 10-year goal planning in seconds.",
            name: "Priya Sharma",
            about: "Long-term Investor",
            rating: 5,
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
        },
        {
            review: "The institutional-grade data at this price point is insane. Finally, a tool that respects the retail investor.",
            name: "Siddharth Goel",
            about: "Portfolio Manager",
            rating: 5,
            image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
        },
        {
            review: "Finally, an AI that doesn't just hallucinate but actually backs its claims with technical chart patterns.",
            name: "Ananya Iyer",
            about: "Quant Enthusiast",
            rating: 5,
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop",
        },
    ];

    return (
        <section className='flex flex-col items-center justify-center mt-40'>
            <SectionTitle title='Voices of Clarity' subtitle='Hear from our community of systematic investors who moved from uncertainty to intelligence with EquiSense.' />

            <div className='mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {data.map((item, index) => (
                    <div key={index} className='w-full max-w-88 space-y-4 rounded-md border border-gray-200 bg-white p-5 text-gray-500 transition-all duration-300 hover:-translate-y-1'>
                        <div className='flex gap-1'>
                            {...Array(item.rating)
                                .fill('')
                                .map((_, index) => <StarIcon key={index} className='size-4 fill-gray-600 text-gray-600' />)}
                        </div>
                        <p className='line-clamp-3'>“{item.review}”</p>
                        <div className='flex items-center gap-2 pt-3'>
                            <img className='size-10 rounded-full' src={item.image} alt={item.name} />
                            <div>
                                <p className='font-medium text-gray-800'>{item.name}</p>
                                <p className='text-gray-500 text-xs'>{item.about}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}