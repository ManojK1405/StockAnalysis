import HeroSection from "../sections/hero-section";
import WhatWeDoSection from "../sections/what-we-do-section";
import OurLatestCreations from "../sections/our-latest-creations";
import OurTestimonialSection from "../sections/our-testimonials-section";
import FaqSection from "../sections/faq-section";
import Newsletter from "../sections/newsletter";

export default function Home() {
    return (
        <div className='px-4'>
            <HeroSection />
            <WhatWeDoSection />
            <OurLatestCreations />
            <OurTestimonialSection />
            <FaqSection />
            <Newsletter />
        </div>
    );
}
