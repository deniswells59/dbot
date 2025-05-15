const ytdl = require('ytdl-core');
const Speaker = require('speaker');
const { spawn } = require('child_process');
const { Readable } = require('stream');
require('dotenv').config();

// Test URL - you can change this to any YouTube URL you want to test
const TEST_URL = 'https://www.youtube.com/watch?v=g3Xbb1XxVfc';

async function testAudioPlayback() {
  try {
    console.log('Starting audio test...');
    console.log(`Testing URL: ${TEST_URL}`);

    // Validate URL with more detailed error handling
    if (!ytdl.validateURL(TEST_URL)) {
      throw new Error('Invalid YouTube URL provided');
    }

    console.log('Getting video info...');

    // Try with specific options to avoid extraction errors
    const info = await ytdl.getInfo(TEST_URL, {
      requestOptions: {
        headers: {
          // Add user-agent to avoid some restrictions
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    });

    console.log(`Video title: ${info.videoDetails.title}`);
    console.log('Available formats:', info.formats.length);

    // Get audio-only stream with more specific options
    console.log('Getting audio stream...');
    const stream = ytdl(TEST_URL, {
      filter: 'audioonly',
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          // Add user-agent to avoid some restrictions
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      // Add more detailed debug logging
      debug: true,
    });

    // Use ffmpeg to convert the stream to raw PCM audio
    console.log('Converting audio format...');
    const ffmpeg = spawn('ffmpeg', [
      '-i',
      'pipe:0', // Input from stdin
      '-f',
      's16le', // 16-bit little-endian
      '-ar',
      '48000', // 48kHz sample rate
      '-ac',
      '2', // 2 channels (stereo)
      '-vn', // Disable video
      'pipe:1', // Output to stdout
    ]);

    // Create a speaker instance
    const speaker = new Speaker({
      channels: 2, // 2 channels
      bitDepth: 16, // 16-bit samples
      sampleRate: 48000, // 48,000 Hz sample rate
      signed: true, // Signed samples
      endianness: 'LE', // Little-endian
    });

    // Enhanced error handling
    stream.on('error', (error) => {
      console.error('YouTube stream error:', error);
      console.error('Error details:', error.stack);
    });

    stream.on('info', (info, format) => {
      console.log('Stream format selected:', format);
    });

    ffmpeg.stderr.on('data', (data) => {
      const message = data.toString();
      // Only log important FFmpeg messages
      if (message.includes('Error') || message.includes('Warning')) {
        console.log('FFmpeg:', message);
      }
    });

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg error:', error);
    });

    speaker.on('error', (error) => {
      console.error('Speaker error:', error);
    });

    // Handle completion
    speaker.on('finish', () => {
      console.log('Playback finished');
      process.exit(0);
    });

    // Pipe everything together
    console.log('Starting playback...');
    stream.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(speaker);
  } catch (error) {
    console.error('Error occurred:', error);

    // More detailed error handling
    if (error.message?.includes('Could not extract')) {
      console.error('\nPossible solutions:');
      console.error('1. Try updating ytdl-core: npm install ytdl-core@latest');
      console.error('2. Check if the video is available in your region');
      console.error('3. Try a different YouTube video');
      console.error('4. The video might be age-restricted or private');
    }

    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }

    process.exit(1);
  }
}

// Run the test
testAudioPlayback();
