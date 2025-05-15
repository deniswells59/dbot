const play = require('play-dl');
const Speaker = require('speaker');

// Test URL - you can change this to any YouTube URL you want to test
const TEST_URL = 'https://www.youtube.com/watch?v=LuCqAbrZKQ8';

async function testAudioPlayback() {
  try {
    console.log('Starting audio test...');
    console.log(`Testing URL: ${TEST_URL}`);

    // First validate the URL
    const validUrl = await play.yt_validate(TEST_URL);
    if (!validUrl) {
      throw new Error('Invalid YouTube URL provided');
    }

    // Get the stream with debug info
    console.log('Getting YouTube stream...');
    const { stream: audioStream, type } = await play.stream(TEST_URL, {
      discordPlayerCompatibility: true,
      quality: 2,
    });

    console.log('Stream type:', type);
    console.log('Stream obtained successfully');

    // Create a speaker instance
    const speaker = new Speaker({
      channels: 2, // 2 channels
      bitDepth: 16, // 16-bit samples
      sampleRate: 48000, // 48,000 Hz sample rate
    });

    // Pipe the audio to the speaker
    console.log('Piping audio to speakers...');
    audioStream.pipe(speaker);

    // Handle stream events
    audioStream.on('error', (error) => {
      console.error('Stream error:', error);
    });

    speaker.on('error', (error) => {
      console.error('Speaker error:', error);
    });

    speaker.on('finish', () => {
      console.log('Playback finished');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error occurred:', error);

    // More detailed error logging
    if (error.message?.includes('sign in') || error.message?.includes('authentication')) {
      console.error('YouTube authentication error. Check your cookie configuration.');
      console.error('Current cookie status:', await play.is_expired());
    }

    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    process.exit(1);
  }
}

// Run the test
testAudioPlayback();
