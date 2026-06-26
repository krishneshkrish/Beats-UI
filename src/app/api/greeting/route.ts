import { NextResponse } from 'next/server';

export async function GET() {
  const hour = new Date().getHours();
  let message = 'Good Evening';
  let submessage = 'Elevate your frequency with curated AI mixes.';

  if (hour >= 5 && hour < 12) {
    message = 'Good Morning';
    submessage = 'Start your day with crystal clear soundwaves.';
  } else if (hour >= 12 && hour < 17) {
    message = 'Good Afternoon';
    submessage = 'Stay in focus mode with our ambient flows.';
  } else if (hour >= 17 && hour < 22) {
    message = 'Good Evening';
    submessage = 'Unwind your mind. The night is yours.';
  } else {
    message = 'Good Night';
    submessage = 'Deep synth dreams await. Soft acoustics queued.';
  }

  return NextResponse.json({ message, submessage });
}
