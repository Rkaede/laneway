type TouchPosition = Pick<Touch, 'clientX' | 'clientY'>;

export function getSwipeDirection(start: TouchPosition, end: TouchPosition) {
  const deltaX = end.clientX - start.clientX;
  const deltaY = end.clientY - start.clientY;

  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
  return deltaX > 0 ? 'previous' : 'next';
}
