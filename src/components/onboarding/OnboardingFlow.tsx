import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useUser } from '@clerk/clerk-react';
import { ThemeProvider } from '../../lib/theme';
import {
  readOnboarding,
  saveOnboarding,
  type PalateAnswers,
} from '../../lib/onboarding';
import WelcomeStep from './WelcomeStep';
import PalateQuiz from './PalateQuiz';
import RecommendationStep from './RecommendationStep';
import CompletionStep from './CompletionStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type StepId = 'welcome' | 'quiz' | 'recommend' | 'done';

const ORDER: StepId[] = ['welcome', 'quiz', 'recommend', 'done'];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useUser();
  const initialPalate = readOnboarding(user).palate ?? {};
  const [step, setStep] = useState<StepId>('welcome');
  const [palate, setPalate] = useState<PalateAnswers>(initialPalate);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSaving, setIsSaving] = useState(false);

  const goNext = useCallback(
    (next: StepId) => {
      const currentIdx = ORDER.indexOf(step);
      const nextIdx = ORDER.indexOf(next);
      setDirection(nextIdx >= currentIdx ? 1 : -1);
      setStep(next);
    },
    [step]
  );

  const handleQuizComplete = useCallback(
    async (answers: PalateAnswers) => {
      setPalate(answers);
      if (user) {
        try {
          setIsSaving(true);
          await saveOnboarding(user, { palate: answers });
        } catch (err) {
          // Non-fatal — user can still proceed; we log for visibility.
          console.error('Failed to save palate answers', err);
        } finally {
          setIsSaving(false);
        }
      }
      goNext('recommend');
    },
    [user, goNext]
  );

  const handleFinish = useCallback(async () => {
    if (user) {
      try {
        setIsSaving(true);
        await saveOnboarding(user, { onboarded: true, palate });
      } catch (err) {
        console.error('Failed to mark onboarding complete', err);
      } finally {
        setIsSaving(false);
      }
    }
    onComplete();
  }, [user, palate, onComplete]);

  const variants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: 60 * dir }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: -60 * dir }),
  };

  return (
    <ThemeProvider initialTheme="dark">
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 30% 10%, rgba(201, 147, 58, 0.18), transparent 55%), radial-gradient(circle at 80% 90%, rgba(139, 58, 47, 0.18), transparent 55%)',
          }}
        />
        <div className="grain-overlay" aria-hidden="true" />

        <main className="mx-auto max-w-3xl px-6 sm:px-8 min-h-screen flex flex-col">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {step === 'welcome' && (
                <WelcomeStep
                  firstName={user?.firstName ?? null}
                  onContinue={() => goNext('quiz')}
                />
              )}
              {step === 'quiz' && (
                <PalateQuiz
                  initialAnswers={palate}
                  isSaving={isSaving}
                  onComplete={handleQuizComplete}
                  onBack={() => goNext('welcome')}
                />
              )}
              {step === 'recommend' && (
                <RecommendationStep
                  palate={palate}
                  onBack={() => goNext('quiz')}
                  onContinue={() => goNext('done')}
                />
              )}
              {step === 'done' && (
                <CompletionStep
                  firstName={user?.firstName ?? null}
                  isSaving={isSaving}
                  onFinish={handleFinish}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ThemeProvider>
  );
}
