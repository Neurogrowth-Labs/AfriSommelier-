import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { ThemeProvider } from '../../lib/theme';
import { describeOAuthError, startGoogleSignIn } from '../../lib/oauth';
import Navbar from './Navbar';
import Hero from './Hero';
import SocialProof from './SocialProof';
import HowItWorks from './HowItWorks';
import FeatureShowcase from './FeatureShowcase';
import Testimonials from './Testimonials';
import Pricing from './Pricing';
import Footer from './Footer';

export default function LandingPage() {
  const { signIn, isLoaded } = useSignIn();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn || isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      await startGoogleSignIn(signIn);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setErrorMsg(describeOAuthError(error).message);
      setIsLoggingIn(false);
    }
  };

  const handleExploreWines = () => {
    const target = document.getElementById('how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ThemeProvider initialTheme="light">
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <Navbar onPrimaryCta={handleGoogleSignIn} isLoadingCta={isLoggingIn} />
        <main className="flex-1">
          <Hero
            onContinueWithGoogle={handleGoogleSignIn}
            onExploreWines={handleExploreWines}
            isLoadingPrimary={isLoggingIn}
            errorMessage={errorMsg}
          />
          <SocialProof />
          <HowItWorks />
          <FeatureShowcase />
          <Testimonials />
          <Pricing onChoose={handleGoogleSignIn} />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
