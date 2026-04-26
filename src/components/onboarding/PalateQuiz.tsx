import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import type {
  ExperienceLevel,
  FoodPreference,
  Goal,
  PalateAnswers,
  RedPreference,
} from '../../lib/onboarding';

interface PalateQuizProps {
  initialAnswers: PalateAnswers;
  isSaving?: boolean;
  onComplete: (answers: PalateAnswers) => void;
  onBack: () => void;
}

interface Question<TValue extends string> {
  id: keyof PalateAnswers;
  prompt: string;
  options: { value: TValue; label: string; hint?: string }[];
}

const QUESTIONS: [
  Question<RedPreference>,
  Question<FoodPreference>,
  Question<ExperienceLevel>,
  Question<Goal>,
] = [
  {
    id: 'red',
    prompt: 'How do you take your red?',
    options: [
      { value: 'light', label: 'Light & fruity', hint: 'Pinot, Gamay, lighter Pinotage' },
      { value: 'medium', label: 'Medium & earthy', hint: 'Cinsault, Grenache, Mourvèdre' },
      { value: 'bold', label: 'Bold & tannic', hint: 'Cabernet, Syrah, Reserve Pinotage' },
      { value: 'exploring', label: "I'm exploring", hint: 'Surprise me with something honest' },
    ],
  },
  {
    id: 'food',
    prompt: 'Your favourite food?',
    options: [
      { value: 'braai', label: 'Braai / BBQ' },
      { value: 'seafood', label: 'Seafood' },
      { value: 'fine-dining', label: 'Fine dining' },
      { value: 'vegan', label: 'Vegan' },
    ],
  },
  {
    id: 'experience',
    prompt: 'Wine experience level?',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'casual', label: 'Casual' },
      { value: 'enthusiast', label: 'Enthusiast' },
      { value: 'collector', label: 'Collector' },
    ],
  },
  {
    id: 'goal',
    prompt: 'Your goal with AfriSommelier?',
    options: [
      { value: 'discover', label: 'Discover new wines' },
      { value: 'cellar', label: 'Track my cellar' },
      { value: 'terroir', label: 'Learn about African terroir' },
      { value: 'impress', label: 'Impress at dinner' },
    ],
  },
];

export default function PalateQuiz({
  initialAnswers,
  isSaving,
  onComplete,
  onBack,
}: PalateQuizProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<PalateAnswers>(initialAnswers ?? {});

  const total = QUESTIONS.length;
  const question = QUESTIONS[index];
  const currentValue = answers[question.id];
  const progress = ((index + (currentValue ? 1 : 0)) / total) * 100;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value as never }));
  };

  const handleNext = () => {
    if (!currentValue) return;
    if (index === total - 1) {
      onComplete(answers);
      return;
    }
    setIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (index === 0) {
      onBack();
      return;
    }
    setIndex((i) => i - 1);
  };

  return (
    <section
      className="flex-1 flex flex-col py-12"
      aria-labelledby="quiz-heading"
    >
      <div className="flex items-center justify-between mb-10">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium opacity-80 hover:opacity-100 focus:outline-none focus-visible:underline"
          style={{ color: 'var(--text)' }}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <span
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          {index + 1} of {total}
        </span>
      </div>

      <div
        className="h-1.5 w-full rounded-full overflow-hidden mb-12"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ background: 'var(--bg-muted)' }}
      >
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background:
              'linear-gradient(90deg, var(--color-terracotta), var(--color-gold))',
          }}
        />
      </div>

      <h1
        id="quiz-heading"
        className="font-serif text-4xl md:text-5xl tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        {question.prompt}
      </h1>

      <fieldset className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 border-0 p-0 m-0">
        <legend className="sr-only">{question.prompt}</legend>
        {question.options.map((opt) => {
          const selected = currentValue === opt.value;
          return (
            <label
              key={opt.value}
              className="cursor-pointer block rounded-2xl p-5 border transition-colors focus-within:ring-2"
              style={{
                background: selected ? 'var(--color-terracotta)' : 'var(--bg-elevated)',
                borderColor: selected ? 'var(--color-terracotta)' : 'var(--border)',
                color: selected ? 'var(--color-warm-ivory)' : 'var(--text)',
              }}
            >
              <input
                type="radio"
                name={String(question.id)}
                value={opt.value}
                checked={selected}
                onChange={() => handleSelect(opt.value)}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base md:text-lg font-semibold">{opt.label}</div>
                  {opt.hint && (
                    <div
                      className="text-sm mt-1"
                      style={{
                        color: selected
                          ? 'rgba(255,255,255,0.85)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {opt.hint}
                    </div>
                  )}
                </div>
                {selected && (
                  <Check size={18} aria-hidden="true" className="shrink-0 mt-1" />
                )}
              </div>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-12 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!currentValue || isSaving}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold transition-transform hover:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2"
          style={{
            background: 'var(--color-terracotta)',
            color: 'var(--color-warm-ivory)',
          }}
        >
          {isSaving && index === total - 1 ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              {index === total - 1 ? 'See my recommendations' : 'Next'}
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
