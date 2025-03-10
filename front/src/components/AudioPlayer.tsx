import {CSSProperties, FC, useEffect, useRef, useState} from 'react'
import Hls from 'hls.js'
import ConfettiExplosion from 'react-confetti-explosion';

export interface AudioPlayerProps {
  url: string
}

const styles: {[key: string]: CSSProperties} = {
  playerContainer: {
    width: '100%',
    maxWidth: '600px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
  },
  video: {
    width: '100%',
    borderRadius: '8px',
    display: 'block',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '10px',
  },
  playPauseButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
  },
  progressContainer: {
    flex: 1,
    height: '23px',
    backgroundColor: '#282828',
    borderRadius: '23px',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'relative',
    height: '100%',
    backgroundColor: '#789aba',
    borderRadius: '23px',
  },
};


export const AudioPlayer: FC<AudioPlayerProps> = ({url}) => {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let hls: Hls | null = null
    if (Hls.isSupported() && audio.current) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(audio.current);
    } else if (audio.current?.canPlayType('application/vnd.apple.mpegurl')) {
      audio.current.src = url;
    }

    return () => hls?.destroy()
  }, [url, audio])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!audio.current) return
      if ((audio.current.duration || 0) - (audio.current.currentTime || 0) < 0.1 && isPlaying) {
        audio.current.pause();
        setIsExploding(true)
      }

      setProgress((audio.current.currentTime / audio.current.duration) * 100);
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying])


  const handlePlayPause = () => {
    if (audio.current) {
      if (audio.current.paused) {
        audio.current.play();
        setIsPlaying(true);
      } else {
        audio.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div style={styles.playerContainer}>
      <audio ref={audio} style={styles.video} controls={false}/>
      <div style={styles.controls}>
        <button onClick={handlePlayPause} style={styles.playPauseButton}>
          <div style={{fontSize: 45}}> {isPlaying ? '⏸️' : '▶️'} </div>
        </button>
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progress}%`}}/>
        </div>
        {isExploding && <ConfettiExplosion />}
      </div>
    </div>
  );
}

