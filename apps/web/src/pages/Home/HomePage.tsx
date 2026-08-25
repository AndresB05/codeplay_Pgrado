import { Footer } from '../../components/home/Footer';
import { HeroSection } from '../../components/home/HeroSection';
import { LearningSection } from '../../components/home/LearningSection';
import { Navbar } from '../../components/home/Navbar';
import { TutorSection } from '../../components/home/TutorSection';
import { WorldsSection } from '../../components/home/WorldsSection';

export const HomePage = () => {
  return (
    <div className="min-h-screen text-ink">
      <Navbar />
      <main className="pt-[84px]">
        <HeroSection />
        <WorldsSection />
        <TutorSection />
        <LearningSection />
      </main>
      <Footer />
    </div>
  );
};
