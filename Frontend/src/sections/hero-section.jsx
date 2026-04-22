import { ArrowRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
    const installCommand = 'npm install prebuiltui@latest';
    const [isCopied, setIsCopied] = useState(false);

    const logos = [
        '/assets/companies-logo/instagram.svg',
        '/assets/companies-logo/framer.svg',
        '/assets/companies-logo/microsoft.svg',
        '/assets/companies-logo/huawei.svg',
        '/assets/companies-logo/walmart.svg',
    ]

    const handleCopy = () => {
        setIsCopied(true);
        navigator.clipboard.writeText(installCommand);
        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
    }

    return (
        <section className="flex flex-col items-center justify-center relative h-svh overflow-hidden">
            <svg className="absolute inset-0 -z-10" width="1440" height="1018" viewBox="0 0 1440 1018" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#a)">
                    <ellipse cx="271.282" cy="200.379" rx="271.282" ry="200.379" fill="#FBFFE1" />
                </g>
                <g filter="url(#b)">
                    <ellipse cx="993.487" cy="451.53" rx="359.487" ry="265.53" fill="url(#c)" fillOpacity=".1" />
                </g>
                <defs>
                    <filter id="a" x="-300" y="-300" width="1142.56" height="1000.76" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_8119_961" />
                    </filter>
                    <filter id="b" x="333.9" y="-114.1" width="1319.18" height="1131.26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="150.05" result="effect1_foregroundBlur_8119_961" />
                        <feTurbulence type="fractalNoise" baseFrequency="0.01" stitchTiles="stitch" numOctaves="3" result="noise" seed="9943" />
                        <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
                        <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0" />
                        </feComponentTransfer>
                        <feComposite operator="in" in2="effect1_foregroundBlur_8119_961" in="coloredNoise1" result="noise1Clipped" />
                        <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
                        <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
                        <feMerge result="effect2_noise_8119_961">
                            <feMergeNode in="effect1_foregroundBlur_8119_961" />
                            <feMergeNode in="color1" />
                        </feMerge>
                    </filter>
                    <linearGradient id="c" x1="550.41" y1="500.394" x2="1343.15" y2="82.986" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F6DFF4" />
                        <stop offset=".196" stopColor="#FF6E00" />
                        <stop offset=".407" stopColor="#F8C04D" />
                        <stop offset=".586" stopColor="#EF3EC2" />
                        <stop offset=".816" stopColor="#4700EC" />
                        <stop offset=".949" stopColor="#5100BA" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="flex flex-wrap items-center justify-center p-1.5 rounded-full border border-indigo-100 italic">
                <p className="pl-2 pr-3 text-gray-400 font-bold text-[10px] uppercase tracking-widest leading-none">A Smarter Way to Invest</p>
            </div>

            <h1
                className="text-4xl md:text-6xl/18 text-center font-bold max-w-4xl mt-5 bg-gradient-to-r from-black to-[#748298] text-transparent bg-clip-text tracking-tighter">
                Systematic Wealth Engine for{" "}
                <span className="bg-gradient-to-b from-blue-500 to-blue-800 bg-clip-text text-transparent">Intelligent Investors</span>.
            </h1>
            <p className="text-slate-500 md:text-lg max-md:px-4 text-center max-w-2xl mt-6 leading-relaxed">
                Cut through the market noise. EquiSense brings together real-time data, AI sentiment, and technical clarity into one actionable view.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
                <button
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full transition shadow-xl shadow-blue-200 font-bold uppercase text-xs tracking-widest">
                    <span>Analyze the Market</span>
                    <ArrowRightIcon className='size-4' />
                </button>
                <button
                    className="bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-full transition hover:bg-slate-50 font-bold uppercase text-xs tracking-widest">
                    Explore Strategy
                </button>
            </div>
            <p className="py-6 text-slate-600 mt-14">Trusting by leading brands, including —</p>

            <div className="flex flex-wrap justify-between max-sm:justify-center gap-10 max-w-4xl w-full mx-auto py-4" id="logo-container">
                {logos.map((logo, index) => <img key={index} src={logo} alt="logo" className="h-7 w-auto max-w-xs" />)}
            </div>
        </section >
    );
}