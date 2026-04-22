import { MenuIcon, XIcon, ChevronDown, Activity, Brain, Target, LayoutDashboard, Briefcase, History } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);

    const links = [
        { name: 'Home', href: '/' },
        {
            name: 'Products',
            subLinks: [
                { name: 'Stock Analysis', href: '/dashboard', icon: LayoutDashboard, description: 'Deep quantitative research' },
                { name: 'Portfolio Hub', href: '/portfolio', icon: Briefcase, description: 'Live tracking & paper trading' },
                { name: 'Intraday Pulse', href: '/products/intraday-pulse', icon: Activity, description: 'Real-time market momentum' },
                { name: 'AI Strategist', href: '/products/ai-strategist', icon: Brain, description: 'AI-driven custom logic' },
                { name: 'Reverse Strategist', href: '/products/reverse-strategist', icon: History, description: 'Goal-based wealth backcasting' },
            ],
        },
        { name: 'Stories', href: '/stories' },
    ];

    return (
        <>
            <nav className='sticky top-0 z-50 flex w-full items-center justify-between bg-white/50 px-4 py-3.5 backdrop-blur-md md:px-16 lg:px-24'>
                <Link to='/' className='flex items-center gap-2'>
                    <span className='text-2xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-blue-600 decoration-4 underline-offset-4'>Equi<span className='text-blue-600'>Sense</span></span>
                </Link>

                <div className='hidden items-center space-x-7 text-gray-700 md:flex'>
                    {links.map((link) => link.subLinks ? (
                        <div key={link.name} className='group relative' onMouseEnter={() => setOpenDropdown(link.name)} onMouseLeave={() => setOpenDropdown(null)}>
                            <div className='flex cursor-pointer items-center gap-1 hover:text-black'>
                                {link.name}
                                <ChevronDown className={`mt-px size-4 transition-transform duration-200 ${openDropdown === link.name ? 'rotate-180' : ''}`} />
                            </div>

                            <div className={`absolute top-6 left-0 z-40 w-lg rounded-md border border-gray-100 bg-white p-3 shadow-lg transition-all duration-200 ease-in-out ${openDropdown === link.name ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}>
                                <p>Explore our AI tools</p>
                                <div className='mt-3 grid grid-cols-2 gap-2'>
                                    {link.subLinks.map((sub) => (
                                        <Link to={sub.href} key={sub.name} className='group/link flex items-center gap-2 rounded-md p-2 transition hover:bg-gray-100'>
                                            <div className='w-max gap-1 rounded-md btn p-2'>
                                                <sub.icon className='size-4.5 text-white transition duration-300 group-hover/link:scale-110' />
                                            </div>
                                            <div>
                                                <p className='font-medium'>{sub.name}</p>
                                                <p className='font-light text-gray-400'>{sub.description}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link key={link.name} to={link.href} className='transition hover:text-black'>
                            {link.name}
                        </Link>
                    ))}
                </div>

                <Link to='/' className='hidden rounded-full btn px-8 py-2.5 font-medium text-white transition hover:opacity-90 md:inline-block'>
                    Sign Up
                </Link>

                <button onClick={() => setIsOpen(true)} className='transition active:scale-90 md:hidden'>
                    <MenuIcon className='size-6.5' />
                </button>
            </nav>

            <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/20 text-lg font-medium backdrop-blur-2xl transition duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {links.map((link) => (
                    <div key={link.name} className='text-center'>
                        {link.subLinks ? (
                            <>
                                <button onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)} className='flex items-center justify-center gap-1 text-gray-800'>
                                    {link.name}
                                    <ChevronDown className={`size-4 transition-transform ${openDropdown === link.name ? 'rotate-180' : ''}`} />
                                </button>
                                {openDropdown === link.name && (
                                    <div className='mt-2 flex flex-col gap-2 text-left text-sm'>
                                        {link.subLinks.map((sub) => (
                                            <Link key={sub.name} to={sub.href} className='block text-gray-600 transition hover:text-black' onClick={() => setIsOpen(false)}>
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link to={link.href} className='block text-gray-800 transition hover:text-black' onClick={() => setIsOpen(false)}>
                                {link.name}
                            </Link>
                        )}
                    </div>
                ))}

                <Link to='/' className='rounded-full btn px-8 py-2.5 font-medium text-white transition hover:opacity-90' onClick={() => setIsOpen(false)}>
                    Sign Up
                </Link>

                <button onClick={() => setIsOpen(false)} className='rounded-md btn p-2 text-white ring-white active:ring-2'>
                    <XIcon />
                </button>
            </div>
        </>
    );
}
