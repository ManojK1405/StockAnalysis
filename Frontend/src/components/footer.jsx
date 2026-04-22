import { DribbbleIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {

    const data = [
        {
            title: 'Company',
            links: [
                { title: 'About us', href: '#about-us' },
                { title: 'Our vision', href: '#our-vision' },
                { title: 'Community', href: '#community' },
                { title: 'Careers', href: '#careers' },
                { title: 'Term & conditions', href: '#term-and-conditions' },
                { title: 'Privacy', href: '#privacy' },
            ],
        },
        {
            title: 'Account',
            links: [
                { title: 'Settings', href: '#settings' },
                { title: 'Refund policy', href: '#refund-policy' },
                { title: 'Affiliates', href: '#affiliates' },
                { title: 'Gift cards', href: '#gift-cards' },
            ],
        },
        {
            title: 'Contact',
            links: [
                { title: 'Contact us', href: '#contact-us' },
                { title: 'Instagram', href: '#instagram' },
                { title: 'Linkedin', href: '#linkedin' },
                { title: 'Github', href: '#github' },
            ],
        },
    ];
    return (
        <footer className="px-4 md:px-16 lg:px-24 text-[13px] mt-32 text-gray-500">
            <div className="flex flex-wrap items-start min-md:justify-between gap-10 md:gap-[60px]">
                <Link to='/' className='flex items-center gap-2 max-w-80'>
                    <span className='text-3xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-blue-600 decoration-4 underline-offset-4'>Equi<span className='text-blue-600'>Sense</span></span>
                </Link>
                {data.map((item, index) => (
                    <div key={index} className="max-w-80">
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <ul className="mt-5 space-y-2">
                            {item.links.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href} className="hover:text-indigo-500 transition">
                                        {link.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div className="max-w-80 md:ml-40">
                    <p className='font-semibold text-gray-800'>Sign up for newsletter</p>
                    <p className='mt-5 text-sm'>
                        The latest news, articles and resources, sent to your inbox weekly.
                    </p>
                    <div className='flex items-center mt-4'>
                        <input type="email" className='bg-white w-full border border-gray-300 h-9 px-3 outline-none' />
                        <button className='flex shrink-0 items-center justify-center btn text-white h-9 px-6'>
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row py-7 mt-12 border-gray-200 md:justify-between max-md:items-center border-t max-md:text-center gap-2 items-end">
                <p className="text-center">© 2026 <Link to="/">EquiSense Platforms Pvt Ltd. All rights reserved.</Link></p>
                <div className="flex items-center gap-4">
                    <a href="https://dribbble.com/prebuiltui" target="_blank" rel="noreferrer">
                        <DribbbleIcon className="size-5 text-gray-400 hover:text-indigo-500" />
                    </a>
                    <a href="https://www.linkedin.com/company/prebuiltui" target="_blank" rel="noreferrer">
                        <LinkedinIcon className="size-5 text-gray-400 hover:text-indigo-500" />
                    </a>
                    <a href="https://x.com/prebuiltui" target="_blank" rel="noreferrer">
                        <TwitterIcon className="size-5 text-gray-400 hover:text-indigo-500" />
                    </a>
                    <a href="https://www.youtube.com/@prebuiltui" target="_blank" rel="noreferrer">
                        <YoutubeIcon className="size-6 text-gray-400 hover:text-indigo-500" />
                    </a>
                </div>
            </div>
        </footer>
    );
};