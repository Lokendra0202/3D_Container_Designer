import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from './store';
import ReactDOM from 'react-dom';
import { Box, Paper, IconButton, Tooltip, Typography, Stack, LinearProgress, Fab } from '@mui/material';
import RecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import PlayIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';

// Inner component that must be rendered inside the <Canvas /> so it can access useThree
export function CameraRecorderInner() {
  const { gl, camera } = useThree();
  const addKeyframe = useStore((s) => s.addCameraKeyframe);
  const recording = useStore((s) => s.cameraRecording);
  const setLastRecordingUrl = useStore((s) => s.setLastRecordingUrl);
  const clearKeyframes = useStore((s) => s.clearCameraKeyframes);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const lastSampleRef = useRef(0);

  // sample rate (ms)
  const sampleInterval = 1000 / 30; // 30 fps

  // sample camera each frame while recording
  useFrame(() => {
    if (!recording) return;
    const now = performance.now();
    if (now - lastSampleRef.current < sampleInterval) return;
    lastSampleRef.current = now;

    const t = now - startTimeRef.current;
    const pos = camera.position.toArray();
    const quat = camera.quaternion.toArray();

    addKeyframe({ t, position: [pos[0], pos[1], pos[2]], quaternion: [quat[0], quat[1], quat[2], quat[3]] });
  });

  // start/stop media recorder when recording toggles
  useEffect(() => {
    if (recording) {
      // Start
      clearKeyframes();
      startTimeRef.current = performance.now();
      lastSampleRef.current = startTimeRef.current;
      chunksRef.current = [];

      const canvas = gl.domElement;
      // Try captureStream with fallback to frame rate 30
      const stream = canvas.captureStream ? canvas.captureStream(30) : canvas.getContext('webgl').canvas.captureStream(30);
      try {
        const mime = 'video/webm;codecs=vp9';
        const mr = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorderRef.current = mr;

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setLastRecordingUrl(url);
        };

        mr.start();
      } catch (err) {
        console.error('MediaRecorder start error', err);
      }
    } else {
      // Stop
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        mr.stop();
      }
      mediaRecorderRef.current = null;
    }

    // cleanup on unmount
    return () => {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') mr.stop();
      mediaRecorderRef.current = null;
    };
  }, [recording, gl, camera, addKeyframe, clearKeyframes, setLastRecordingUrl]);

  // playback handling: camera playback is handled in CameraRecorderInner if store.cameraPlayback toggles
  const keyframes = useStore((s) => s.cameraKeyframes);
  const playing = useStore((s) => s.cameraPlayback);
  const setPlaying = useStore((s) => s.setCameraPlayback);

  const playbackRef = useRef({ raf: 0, start: 0, duration: 0 });

  useEffect(() => {
    if (!playing) {
      if (playbackRef.current.raf) cancelAnimationFrame(playbackRef.current.raf);
      playbackRef.current = { raf: 0, start: 0, duration: 0 };
      return;
    }

    if (keyframes.length < 2) {
      // nothing to play
      setPlaying(false);
      return;
    }

    const duration = keyframes[keyframes.length - 1].t;
    playbackRef.current.duration = duration;
    playbackRef.current.start = performance.now();

    const vPos = new THREE.Vector3();
    const qA = new THREE.Quaternion();
    const qB = new THREE.Quaternion();
    const qOut = new THREE.Quaternion();

    function step() {
      const now = performance.now();
      const elapsed = now - playbackRef.current.start;
      if (elapsed >= duration) {
        // set to final frame and stop
        const last = keyframes[keyframes.length - 1];
        camera.position.fromArray(last.position);
        camera.quaternion.fromArray(last.quaternion);
        setPlaying(false);
        return;
      }

      // find surrounding frames
      let i = 0;
      while (i < keyframes.length - 1 && keyframes[i + 1].t < elapsed) i++;
      const a = keyframes[i];
      const b = keyframes[i + 1] || a;
      const localT = (elapsed - a.t) / Math.max(1, b.t - a.t);

      // lerp pos
      vPos.fromArray(a.position).lerp(new THREE.Vector3().fromArray(b.position), localT);
      camera.position.copy(vPos);

      // slerp quat
      qA.fromArray(a.quaternion);
      qB.fromArray(b.quaternion);
      THREE.Quaternion.slerp(qA, qB, qOut, localT);
      camera.quaternion.copy(qOut);

      camera.updateMatrixWorld();
      playbackRef.current.raf = requestAnimationFrame(step);
    }

    playbackRef.current.raf = requestAnimationFrame(step);

    return () => {
      if (playbackRef.current.raf) cancelAnimationFrame(playbackRef.current.raf);
      playbackRef.current = { raf: 0, start: 0, duration: 0 };
    };
  }, [playing, keyframes, camera, setPlaying]);

  return null;
}

// UI overlay component (renders DOM buttons) - can be placed outside the Canvas
export default function CameraRecorderUI() {
  const recording = useStore((s) => s.cameraRecording);
  const setRecording = useStore((s) => s.setCameraRecording);
  const keyframes = useStore((s) => s.cameraKeyframes);
  const clearKeyframes = useStore((s) => s.clearCameraKeyframes);
  const playing = useStore((s) => s.cameraPlayback);
  const setPlaying = useStore((s) => s.setCameraPlayback);
  const lastRecordingUrl = useStore((s) => s.lastRecordingUrl);
  // simple event handlers
  const onRecord = () => {
    clearKeyframes();
    setRecording(true);
  };

  const onStop = () => {
    setRecording(false);
  };

  const onPlay = () => {
    if (keyframes.length < 2) return;
    setRecording(false);
    setPlaying(true);
  };

  const onDownload = () => {
    if (!lastRecordingUrl) return;
    const a = document.createElement('a');
    a.href = lastRecordingUrl;
    a.download = 'camera-recording.webm';
    a.click();
  };

  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  // Compute duration from keyframes
  const duration = keyframes.length > 0 ? keyframes[keyframes.length - 1].t : 0;

  // Update progress while playing
  useEffect(() => {
    let raf = 0;
    let start = 0;
    if (playing && duration > 0) {
      start = performance.now();
      const step = () => {
        const elapsed = performance.now() - start;
        const p = Math.min(1, elapsed / duration);
        setProgress(p);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    } else {
      setProgress(0);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [playing, duration]);

  // Format ms to mm:ss
  const formatMs = (ms) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // compact toggle button when closed; panel when open
  return ReactDOM.createPortal(
    <>
      {!open && (
        <Box sx={{ position: 'fixed', right: 16, top: 16, zIndex: 1400 }}>
          <Tooltip title="Camera">
            <Fab color="primary" size="small" onClick={() => setOpen(true)} aria-label="open camera panel">
              <CameraAltIcon />
            </Fab>
          </Tooltip>
        </Box>
      )}

      {open && (
        <Paper elevation={6} sx={{ position: 'fixed', right: 16, top: 16, zIndex: 1400, p: 1, width: 260 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Camera</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {recording ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <RecordIcon sx={{ color: 'error.main' }} fontSize="small" />
                    <Typography variant="caption">REC</Typography>
                  </Box>
                ) : null}
                <IconButton size="small" onClick={() => setOpen(false)} aria-label="close camera panel">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Tooltip title="Record">
                <span>
                  <IconButton color="error" onClick={onRecord} disabled={recording} aria-label="record">
                    <RecordIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Stop">
                <span>
                  <IconButton onClick={onStop} disabled={!recording} aria-label="stop">
                    <StopIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Play">
                <span>
                  <IconButton onClick={onPlay} disabled={playing || keyframes.length < 2} aria-label="play">
                    <PlayIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Download">
                <span>
                  <IconButton onClick={onDownload} disabled={!lastRecordingUrl} aria-label="download">
                    <DownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <Box sx={{ px: 1 }}>
              <Typography variant="caption">Duration: {formatMs(duration)}</Typography>
            </Box>

            <Box sx={{ width: '100%' }}>
              <LinearProgress variant="determinate" value={progress * 100} sx={{ height: 6, borderRadius: 1 }} />
            </Box>
          </Stack>
        </Paper>
      )}
    </>,
    document.body
  );
}
