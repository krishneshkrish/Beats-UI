import { Song, AnalyticsSummary, TimelineItem } from '../types';

export const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Neon Horizons',
    artist: 'Aether Vortex',
    album: 'Liquid Dreams',
    artwork: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
    duration: 372,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    lyrics: [
      'Tracing lines across the dark',
      'Waiting for the first neon spark',
      'In the grid we lose our name',
      'Nothing ever stays the same',
      'Speeding down the empty streets',
      'Feeling where the shadow meets',
      'The neon light will guide us home',
      'In this city, we never walk alone',
      'Waves of sound begin to rise',
      'Underneath these artificial skies',
      'Close your eyes and let it fade',
      'In the dreams that we have made'
    ]
  },
  {
    id: '2',
    title: 'Midnight Cruise',
    artist: 'Glitch Runner',
    album: 'Outrun the Grid',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
    duration: 423,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    lyrics: [
      'Headlights cutting through the mist',
      'A feeling that we can\'t resist',
      'Engine hums a low refrain',
      'Washing off the summer rain',
      'Eighty-four is on the dial',
      'Drive another thousand miles',
      'The synth is loud, the night is young',
      'Secrets spoken on the tongue',
      'Fading into midnight skies',
      'Mirrored in your retro eyes',
      'Time is slowing to a crawl',
      'Before we have to face it all'
    ]
  },
  {
    id: '3',
    title: 'Solar Wind',
    artist: 'Elysian Field',
    album: 'Cosmic Calm',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80',
    duration: 302,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    lyrics: [
      'Drifting in a sea of stars',
      'Looking down on dusty Mars',
      'Quiet storm of golden light',
      'Carrying us through the night',
      'Weightless state of pure release',
      'Here the noise will finally cease',
      'Breathe in deep the solar wind',
      'Where the boundaries start to bend',
      'Solar sails are opened wide',
      'Floating on a silent tide',
      'Leave the heavy earth behind',
      'Peace is what we came to find'
    ]
  },
  {
    id: '4',
    title: 'Hyperdrive',
    artist: 'Zenith Vector',
    album: 'Velocity Core',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
    duration: 502,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    lyrics: [
      'Power levels critical, system override',
      'We are leaving gravity, nowhere left to hide',
      'Charging up the thrusters, wait for the ignition',
      'Accelerating forward, executing our mission',
      'Hyperdrive engaged!',
      'Through the space and time!',
      'Breaking every barrier, reason, and design',
      'Stars become a streak of light, a white-hot stream',
      'Living in the center of a hyper-velocity dream',
      'Warning sirens blaring, but we do not slow',
      'Into the horizon, that is where we go'
    ]
  },
  {
    id: '5',
    title: 'Summer Glow',
    artist: 'Luna Coast',
    album: 'Tidal Waves',
    artwork: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
    duration: 335,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    lyrics: [
      'Golden sand beneath our feet',
      'Ocean breeze is warm and sweet',
      'Sun is dipping in the sea',
      'Right where we are meant to be',
      'Laughing in the fading light',
      'Dancing all through the night',
      'Summer glow upon your skin',
      'Where the endless waves begin',
      'No more worries, no more pain',
      'Wash it out with summer rain',
      'Hold onto this fleeting grace',
      'Time can never touch this place'
    ]
  },
  {
    id: '6',
    title: 'Rainy Cafe',
    artist: 'Lofi Cafe',
    album: 'Cozy Afternoons',
    artwork: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80',
    duration: 298,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    lyrics: [
      'Raindrops tap the window pane',
      'Steaming mug of coffee again',
      'Pages turn of dusty books',
      'Warmth in quiet, hidden nooks',
      'Muffled sounds of city life',
      'Muting out the daily strife',
      'Soft piano chords collide',
      'While the storm is fierce outside',
      'Cozy shadows on the wall',
      'Watching all the droplets fall',
      'Just a moment, let it stay',
      'Let the rainy hour play'
    ]
  },
  {
    id: '7',
    title: 'Quantum Pulse',
    artist: 'Sub-Zero',
    album: 'Subatomic Beats',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
    duration: 310,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    lyrics: [
      'Down below the visible',
      'Frequencies invisible',
      'Particles in motion spin',
      'Where does the wave begin?',
      'Quantum pulse, alignment starts',
      'Beating in atomic hearts',
      'Bass is deep, the structure shakes',
      'Every single bond it breaks',
      'Vibrations in the empty space',
      'Accelerating at a steady pace',
      'Entangled states of energy',
      'Resonating in perfect harmony'
    ]
  },
  {
    id: '8',
    title: 'Ethereal Echoes',
    artist: 'Aura Bloom',
    album: 'Lost in Reverie',
    artwork: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&q=80',
    duration: 415,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    lyrics: [
      'Whispers in the morning haze',
      'Lost inside a silent maze',
      'Floating on an empty breath',
      'Past the realms of life and death',
      'Ethereal echoes start to call',
      'Like a soft and gentle fall',
      'Hear them echoing in your mind',
      'Leaving all the dust behind',
      'Chords of silver, strings of gold',
      'A story that is never told',
      'Fading into endless space',
      'Vanishing without a trace'
    ]
  }
];

export const MOOD_SONG_MAP: Record<string, string[]> = {
  Happy: ['5', '1'],
  Chill: ['1', '3', '6', '8'],
  Focus: ['3', '6', '8'],
  Workout: ['4', '7'],
  Night: ['1', '2', '8'],
  Sad: ['3', '6', '8'],
  Party: ['4', '5', '7'],
  Travel: ['2', '5', '1']
};

export const MOCK_ANALYTICS: AnalyticsSummary = {
  totalTime: 4280,
  weeklyTime: 345,
  streak: 12,
  topArtist: 'Aether Vortex',
  topGenre: 'Ambient Lofi',
  topSong: 'Neon Horizons',
  circularProgress: [
    { label: 'Today Goal', value: 85, color: '#FF3B30' },
    { label: 'Weekly Sync', value: 68, color: '#F5F5F7' },
    { label: 'Focus Level', value: 92, color: 'rgba(255, 255, 255, 0.4)' }
  ],
  genreData: [
    { name: 'Ambient Lofi', value: 42 },
    { name: 'Synthwave', value: 28 },
    { name: 'Future Bass', value: 15 },
    { name: 'Acoustic Jazz', value: 10 },
    { name: 'Electro Pop', value: 5 }
  ],
  heatmapData: [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 3 },
    { day: 'Thu', count: 8 },
    { day: 'Fri', count: 12 },
    { day: 'Sat', count: 10 },
    { day: 'Sun', count: 6 }
  ]
};

export const MOCK_JOURNEY: TimelineItem[] = [
  {
    id: 'j1',
    timestamp: '2026-06-06T09:30:00Z',
    song: MOCK_SONGS[5], // Rainy Cafe
    moodTag: 'Focus',
    timeLabel: 'Morning Sessions',
    isMilestone: true,
    milestoneText: '100 hours of Lo-Fi unlocked'
  },
  {
    id: 'j2',
    timestamp: '2026-06-06T14:15:00Z',
    song: MOCK_SONGS[4], // Summer Glow
    moodTag: 'Happy',
    timeLabel: 'Afternoon Focus'
  },
  {
    id: 'j3',
    timestamp: '2026-06-06T18:45:00Z',
    song: MOCK_SONGS[0], // Neon Horizons
    moodTag: 'Chill',
    timeLabel: 'Evening Vibes'
  },
  {
    id: 'j4',
    timestamp: '2026-06-05T23:30:00Z',
    song: MOCK_SONGS[1], // Midnight Cruise
    moodTag: 'Night',
    timeLabel: 'Late Night',
    isMilestone: true,
    milestoneText: 'Longest streak: 12 Days reached!'
  },
  {
    id: 'j5',
    timestamp: '2026-06-05T08:15:00Z',
    song: MOCK_SONGS[2], // Solar Wind
    moodTag: 'Focus',
    timeLabel: 'Morning Sessions'
  },
  {
    id: 'j6',
    timestamp: '2026-06-04T15:20:00Z',
    song: MOCK_SONGS[6], // Quantum Pulse
    moodTag: 'Workout',
    timeLabel: 'Afternoon Focus',
    isMilestone: true,
    milestoneText: 'New artist Zenith Vector discovered'
  }
];

export const SEARCH_CATALOG = {
  songs: MOCK_SONGS,
  artists: ['Aether Vortex', 'Glitch Runner', 'Elysian Field', 'Zenith Vector', 'Luna Coast', 'Lofi Cafe', 'Sub-Zero', 'Aura Bloom'],
  albums: ['Liquid Dreams', 'Outrun the Grid', 'Cosmic Calm', 'Velocity Core', 'Tidal Waves', 'Cozy Afternoons', 'Subatomic Beats', 'Lost in Reverie'],
  playlists: [
    { id: 'p1', name: 'Late Night Synthesis', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', songCount: 14 },
    { id: 'p2', name: 'Deep Focus Flow', artwork: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80', songCount: 22 },
    { id: 'p3', name: 'Cardio Core Synth', artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80', songCount: 18 }
  ]
};
