import { Routes, Route } from "react-router-dom";
import Banner from "./components/banner";
import LenisScroll from "./components/lenis-scroll";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import IntradayPulse from "./pages/IntradayPulse";
import AIStrategist from "./pages/AIStrategist";
import ReverseStrategist from "./pages/ReverseStrategist";

export default function App() {
    return (
        <>
            <LenisScroll />
            <Banner />
            <Navbar />
            <main className='min-h-screen bg-white'>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/products/intraday-pulse" element={<IntradayPulse />} />
                    <Route path="/products/ai-strategist" element={<AIStrategist />} />
                    <Route path="/products/reverse-strategist" element={<ReverseStrategist />} />
                </Routes>
            </main>
            <Footer />
        </>
    );
}