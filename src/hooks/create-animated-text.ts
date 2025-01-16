import { animate } from 'motion'; // Assuming you're using popmotion for animation
import { createEffect, createSignal, onCleanup } from 'solid-js';

interface UseAnimatedTextOptions {
  duration?: number;
  delay?: number;
  characterDelay?: number;
  type?: 'character' | 'word';
}

export function createAnimatedText(text: () => string, options: UseAnimatedTextOptions = {}) {
  const [animatedText, setAnimatedText] = createSignal('');
  const [previousText, setPreviousText] = createSignal('');
  const [lastAnimatedIndex, setLastAnimatedIndex] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);

  const defaultOptions = {
    duration: 0.5,
    delay: 0,
    characterDelay: 0.02,
    type: 'character' as const,
    ...options,
  };

  const splitTextByMode = (text: string, mode: 'character' | 'word'): string[] => {
    if (mode === 'word') {
      return text.split(/(\s+)/).filter(Boolean);
    }
    return text.split('');
  };

  createEffect(() => {
    const currentText = text();
    const prevText = previousText();

    // If texts are identical, no animation needed
    if (currentText === prevText) return;

    setIsAnimating(true);

    const currentParts = splitTextByMode(currentText, defaultOptions.type);
    const prevParts = splitTextByMode(prevText, defaultOptions.type);

    // Find the common prefix length
    let commonPrefixLength = 0;
    while (
      commonPrefixLength < prevParts.length &&
      commonPrefixLength < currentParts.length &&
      prevParts[commonPrefixLength] === currentParts[commonPrefixLength]
    ) {
      commonPrefixLength++;
    }

    // Determine the starting point for the animation
    const startIndex = Math.max(commonPrefixLength, lastAnimatedIndex());

    // Keep the existing animated text
    if (startIndex > 0) {
      setAnimatedText(currentParts.slice(0, startIndex).join(''));
    }

    const newPartsCount = currentParts.length - startIndex;
    const duration = Math.min(
      defaultOptions.duration,
      newPartsCount * defaultOptions.characterDelay,
    );

    // Only animate if there are new parts to show
    if (newPartsCount > 0) {
      const animation = animate(startIndex, currentParts.length, {
        duration,
        ease: 'linear',
        onUpdate: (latest) => {
          const currentIndex = Math.floor(latest);
          setAnimatedText(currentParts.slice(0, currentIndex).join(''));
          setLastAnimatedIndex(currentIndex);
        },
        onComplete: () => {
          setAnimatedText(currentText);
          setPreviousText(currentText);
          setLastAnimatedIndex(currentParts.length);
          setIsAnimating(false);
        },
      });

      onCleanup(() => {
        animation.stop();
      });
    } else {
      // If no new parts to animate, just update the state
      setAnimatedText(currentText);
      setPreviousText(currentText);
      setLastAnimatedIndex(currentParts.length);
      setIsAnimating(false);
    }
  });

  return {
    animatedText,
    isAnimating,
  };
}

export default createAnimatedText;
