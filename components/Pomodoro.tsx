'use client';
import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationControls from 'components/NotificationControls';
import { TextMorph } from './TextMorph';
import * as Switch from '@radix-ui/react-switch';
import * as Toast from '@radix-ui/react-toast';
import * as Slider from '@radix-ui/react-slider';
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import { useTheme } from 'next-themes';
import IconButton from './IconButton';
import { useOpenPanel } from '@openpanel/nextjs';
import { Toaster, toast } from 'sonner';

export default function Pomodoro() {
  let timer = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 30,
    longBreakInterval: 6,
    // pomodoro: 0,
    // shortBreak: 0,
    // longBreak: 1,
    // longBreakInterval: 6,
  };

  const [minutes, setMinutes] = useState(timer.pomodoro);
  const [seconds, setSeconds] = useState(0);
  const [pmdrCount, setpmdrCount] = useState(1);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [sessionType, setSessionType] = useState('work');
  const [timerRunning, setTimerRunning] = useState(false);
  const [sound, setSound] = useState(true);
  const [prevSessionType, setPrevSessionType] = useState('work');
  const [newSession, setNewSession] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState<boolean>(true);
  const [toastContent, setToastContent] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [brownNoise, setBrownNoise] = useState(false);
  const [bnVolume, setBnVolume] = useState(-20); // The initial volume in decibels
  const noiseVolume = useRef<Tone.Volume | null>(null);

  const { theme, setTheme } = useTheme();
  // Map the current theme to one of the expected values
  const toasterTheme = ['light', 'dark', 'system'].includes(theme || '')
    ? theme
    : undefined;
  type ToasterTheme = 'light' | 'dark' | 'system';

  const timerWorkerRef = useRef<Worker | null>();
  const toastTimeRef = useRef(0);

  // const plausible = usePlausible();
  const op = useOpenPanel();

  function handleStart() {
    if (!timerRunning) {
      setTimerRunning(true);
      timerWorkerRef.current?.postMessage({
        action: 'start',
        minutes: minutes,
        seconds: seconds,
      });
      if (newSession) {
        // update dial styles immediately on new session. This is to prevent the first dial not showing in progress until the first 'tick' is recieved from the worker a second later.
        updateDials(pmdrCount, 0);
        op.track('new_session_started');
      }
    } else {
      setTimerRunning(false);
      timerWorkerRef.current?.postMessage({ action: 'pause' });
    }
  }

  const handleSkip = () => {
    timerWorkerRef.current?.postMessage({
      action: 'skip',
      isRunning: timerRunning,
    });
    if (sessionType === 'work') {
      op.track('skip');
    }
  };

  const handleReset = () => {
    timerWorkerRef.current?.postMessage({ action: 'reset' });
    op.track('reset');
  };

  const handleSubtract = () => {
    if (minutes > 0) {
      timerWorkerRef.current?.postMessage({ action: 'subtract' });

      // Update the minutes immediately
      setMinutes((prevMinutes) => prevMinutes - 1);
      op.track('subtract');
    }
  };

  const handleAdd = () => {
    timerWorkerRef.current?.postMessage({ action: 'add' });

    // Update the minutes immediately
    setMinutes((prevMinutes) => prevMinutes + 1);
    op.track('add');
  };

  function spawnNotification(body: string, title: string) {
    if (notifEnabled) {
      const notification = new Notification(title, { body });
    } else {
      return;
    }
  }

  // const showToast = (title: any) => {
  //   setToastContent(title);
  //   setToastOpen(true);
  //   window.clearTimeout(toastTimeRef.current);
  //   toastTimeRef.current = window.setTimeout(() => {
  //     setToastOpen(true);
  //     // setToastContent('');
  //   }, 100);
  // };

  const updateDials = (pmdrCount: number, progress: number) => {
    if (
      // This code checks if the pmdrCount is a multiple of the longBreakInterval.
      // If it is a multiple, it will return true.
      // This is used to determine if the user has completed the long break interval.
      pmdrCount % timer.longBreakInterval ===
      0
    ) {
      for (let i = 1; i <= 4; i++) {
        const dial = document.getElementById(`dial${i}`);
        if (dial) {
          dial.setAttribute('data-active', 'false');
          dial.style.background = `conic-gradient(var(--gray3) 0%, var(--gray3) 100%)`;
        }
      }
    } else {
      const dialIndex = Math.ceil(pmdrCount / 2);
      const dial = document.getElementById(`dial${dialIndex}`);

      if (dial) {
        dial.setAttribute('data-active', 'true');
        dial.style.background = `conic-gradient(var(--gray100) ${progress}%, var(--grayA0) ${progress}%)`;
      }
    }
  };

  const resetDials = () => {
    for (let i = 1; i <= 4; i++) {
      const dial = document.getElementById(`dial${i}`);
      if (dial) {
        dial.setAttribute('data-active', 'false');
        dial.style.background = `conic-gradient(var(--gray3) 0%, var(--gray3) 100%)`;
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(event.code); // Add this line to log the events

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handleStart();
          if (timerRunning) {
            toast('Timer Paused');
          } else {
            toast('Timer Started');
          }
          break;
        case 'KeyP':
          handleStart();
          if (timerRunning) {
            toast('Timer Paused');
          } else {
            toast('Timer Started');
          }
          break;
        case 'ArrowRight':
          handleSkip();
          toast('Skipped');
          break;
        case 'KeyS':
          handleSkip();
          toast('Skipped');
          break;
        case 'ArrowLeft':
          handleReset();
          toast('Reset');
          break;
        case 'KeyR':
          handleReset();
          toast('Reset');
          break;
        case 'ArrowUp':
          handleAdd();
          toast('Minute added');
          break;
        case 'ArrowDown':
          handleSubtract();
          toast('Minute Subtracted');
          break;
        case 'KeyB':
          setBrownNoise(!brownNoise);
          if (brownNoise) {
            toast('Brown noise stopped');
          } else {
            toast('Brown noise started');
          }
          break;
        case 'KeyV':
          setSound(!sound);
          if (sound) {
            toast('Notification sounds off');
          } else {
            toast('Notification sounds on');
          }
          break;
        case 'KeyN':
          setNotifEnabled(!notifEnabled);
          if (notifEnabled) {
            toast('Notifications off');
          } else {
            toast('Notifications on');
          }
          break;
        default:
          break;
      }

      // clear toastTime
      return () => clearTimeout(toastTimeRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleStart,
    handleSkip,
    handleReset,
    handleAdd,
    handleSubtract,
    toastOpen,
  ]);

  useEffect(() => {
    // sound and notificasion functions
    //create a synth and connect it to the main output (your speakers)
    const synth = new Tone.Synth().toDestination();
    //  play passed sound parameters if sound is enabled
    const playSound = async (note: string, duration: string, when: any) => {
      if (sound) {
        await Tone.start();
        synth.triggerAttackRelease(note, duration, when);
      }
    };

    const playSoundForSessionType = (sessionType: String) => {
      if (sessionType === 'work') {
        // playSound('C4', '8n', Tone.now());
        // playSound('F4', '8n', Tone.now() + 0.15);
        // playSound('E4', '8n', Tone.now() + 0.3);
        const player = new Tone.Player('/sounds/Alert 5.m4a').toDestination();
        // play as soon as the buffer is loaded
        player.autostart = true;
      } else if (sessionType === 'shortBreak') {
        // playSound('C4', '8n', Tone.now());
        // playSound('A4', '8n', Tone.now() + 0.15);
        // playSound('B4', '8n', Tone.now() + 0.3);
        const player = new Tone.Player('/sounds/Alert 1.m4a').toDestination();
        // play as soon as the buffer is loaded
        player.autostart = true;
      } else if (sessionType === 'longBreak') {
        // playSound('C4', '8n', Tone.now());
        // playSound('E4', '8n', Tone.now() + 0.15);
        // playSound('G4', '8n', Tone.now() + 0.3);
        // playSound('B4', '8n', Tone.now() + 0.45);
        const player = new Tone.Player('/sounds/Success 2.m4a').toDestination();
        // play as soon as the buffer is loaded
        player.autostart = true;
      }
    };

    const notifyForSessionType = (sessionType: String) => {
      if (sessionType === 'work') {
        spawnNotification('Pomodo', 'Work time');
      } else if (sessionType === 'shortBreak') {
        spawnNotification('Pomodo', 'Break time');
      } else if (sessionType === 'longBreak') {
        spawnNotification('Pomodo', 'Long break time');
      }
    };

    if (sessionType !== prevSessionType) {
      playSoundForSessionType(sessionType);
      notifyForSessionType(sessionType);
      setPrevSessionType(sessionType);
    }
  }, [sound, sessionType, prevSessionType]);

  useEffect(() => {
    // timer functions
    const timerWorker = new Worker('./timerWorker.js');
    timerWorkerRef.current = timerWorker;
    timerWorker.postMessage({
      action: 'init',
      data: { sessionType: sessionType, minutes: timer.pomodoro, seconds: 0 },
    });

    timerWorker.onmessage = (event) => {
      if (event.data.type === 'tick') {
        // console.log(event.data);
        setMinutes(event.data.minutes);
        setSeconds(event.data.seconds);
        setpmdrCount(event.data.pmdrCount);
        setSessionType(event.data.sessionType);
        setNewSession(event.data.newSession);
        setTotalPomodoros(event.data.totalPomodoros);

        const timerMinutes: string =
          event.data.minutes < 10
            ? `0${event.data.minutes}`
            : event.data.minutes;
        const timerSeconds: string =
          event.data.seconds < 10
            ? `0${event.data.seconds}`
            : event.data.seconds;
        document.title = `${timerMinutes}:${timerSeconds} - ${sessionType}`;
      } else if (event.data.type === 'reset') {
        setMinutes(timer.pomodoro);
        setSeconds(0);
        setTimerRunning(false);
        setpmdrCount(1);
        setTotalPomodoros(event.data.totalPomodoros);
        setNewSession(event.data.newSession);
        resetDials();

        document.title = `25:00 - work`;
      }
      if (event.data.type === 'tick' && event.data.sessionType === 'work') {
        const progress =
          100 -
          ((event.data.minutes * 60 + event.data.seconds) /
            (timer.pomodoro * 60)) *
            100;
        updateDials(event.data.pmdrCount, progress);
      }
      if (event.data.newSession) {
        resetDials();
      }
    };

    // Clean up the timerWorker when the component is unmounted
    return () => {
      timerWorker.terminate();
    };
  }, []); // Remove 'seconds' and 'timerRunning' from the dependency array

  useEffect(() => {
    // update container on while timer is running
    const container = document.getElementById('container');
    if (timerRunning) {
      if (container) {
        // if (sessionType === 'work') {
        //   container.style.background = 'var(--gray100)';
        // } else if (sessionType === 'shortBreak') {
        //   container.style.background = 'var(--green100)';
        // } else if (sessionType === 'longBreak') {
        //   container.style.background = 'var(--blue100)';
        // }

        container.classList.add('active');
      }
    } else {
      if (container) {
        container.classList.remove('active');
      }
    }
  }, [timerRunning]);

  useEffect(() => {
    const noise = new Tone.Noise('brown');
    noiseVolume.current = new Tone.Volume(bnVolume).toDestination();
    noise.connect(noiseVolume.current);

    async function startNoise() {
      await Tone.start();
      noise.start();
    }

    if (brownNoise) {
      startNoise();
    } else {
      noise.stop();
    }

    return () => {
      noise.stop();
    };
  }, [brownNoise, noiseVolume]);

  function handleVolumeChange(newVolume: number) {
    setBnVolume(newVolume);
    if (noiseVolume.current) {
      noiseVolume.current.volume.value = newVolume;
    }
  }

  //   add 0 to minutes and seconds if less than 10
  // const timerMinutes = minutes < 10 ? `0${minutes}` : minutes;
  // const timerSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const timerMinutes: string =
    minutes < 10 ? `0${minutes}` : minutes.toString();
  const timerSeconds: string =
    seconds < 10 ? `0${seconds}` : seconds.toString();

  //generate array of digits
  // const getDigitsArray = (num: string | number) =>
  //   String(num).split('').map(Number);
  // const timerMinutesArray = getDigitsArray(timerMinutes);
  // const timerSecondsArray = getDigitsArray(timerSeconds);

  //framer
  const dialRow = {
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        when: 'afterChildren',
      },
    },
  };

  //digit animation

  function usePrevious(value: any) {
    const ref = useRef();

    useEffect(() => {
      ref.current = value;
    });

    return ref.current;
  }

  const prevTimerMinutes = usePrevious(timerMinutes);
  const prevTimerSeconds = usePrevious(timerSeconds);

  const changingMinuteIndex =
    prevTimerMinutes &&
    timerMinutes
      .split('')
      .findIndex((digit, i) => digit !== prevTimerMinutes[i]);
  const changingSecondIndex =
    prevTimerSeconds &&
    timerSeconds
      .split('')
      .findIndex((digit, i) => digit !== prevTimerSeconds[i]);

  const slideVariants = {
    hidden: { opacity: 1, y: `100%` },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', duration: 0.25, bounce: 0.25 },
    },
    exit: {
      opacity: 1,
      y: `-100%`,
      transition: { type: 'spring', duration: 0.25, bounce: 0 },
    },
  };

  const dialItems = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 20 },
  };

  return (
    <div className="pomodoro">
      <div className="top">
        <motion.div
          className="container-outer"
          id="container"
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="container-inner">
            <div className="session">
              <div className="time">
                <IconButton
                  onClick={handleSubtract}
                  disabled={minutes === 0 ? true : false}
                  title="Subtract"
                  icon={
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6 12C6 11.4477 6.44772 11 7 11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H7C6.44772 13 6 12.5523 6 12Z"
                        fill="currentColor"
                      />
                    </svg>
                  }
                />

                {/* <h1 className="timer">
                  {timerMinutes}:{timerSeconds}
                </h1> */}

                <h1 className="timer">
                  <div className="digit-group">
                    {timerMinutes.split('').map((digit, index) => (
                      <div key={index} className="digit-container">
                        <AnimatePresence mode="sync">
                          {prevTimerMinutes &&
                            prevTimerMinutes[index] !== digit && (
                              <motion.span
                                key={prevTimerMinutes[index]}
                                variants={slideVariants}
                                initial="visible"
                                animate="exit"
                              >
                                {prevTimerMinutes[index]}
                              </motion.span>
                            )}
                          <motion.span
                            key={digit}
                            variants={slideVariants}
                            initial={
                              prevTimerMinutes &&
                              prevTimerMinutes[index] !== digit
                                ? 'hidden'
                                : 'visible'
                            }
                            animate="visible"
                          >
                            {digit}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  :
                  <div className="digit-group">
                    {timerSeconds.split('').map((digit, index) => (
                      <div key={index} className="digit-container">
                        <AnimatePresence mode="sync">
                          {prevTimerSeconds &&
                            prevTimerSeconds[index] !== digit && (
                              <motion.span
                                key={prevTimerSeconds[index]}
                                variants={slideVariants}
                                initial="visible"
                                animate="exit"
                              >
                                {prevTimerSeconds[index]}
                              </motion.span>
                            )}
                          <motion.span
                            key={digit}
                            variants={slideVariants}
                            initial={
                              prevTimerSeconds &&
                              prevTimerSeconds[index] !== digit
                                ? 'hidden'
                                : 'visible'
                            }
                            animate="visible"
                          >
                            {digit}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </h1>

                <IconButton
                  onClick={handleAdd}
                  title="Add"
                  icon={
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 6C12.5523 6 13 6.44772 13 7V11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H13V17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17V13H7C6.44772 13 6 12.5523 6 12C6 11.4477 6.44772 11 7 11H11V7C11 6.44772 11.4477 6 12 6Z"
                        fill="currentColor"
                      />
                    </svg>
                  }
                />
              </div>

              <div className="messageContainter">
                <AnimatePresence mode="wait">
                  {sessionType === 'work' && (
                    <motion.span
                      key="work"
                      initial={{ scale: 0.8, filter: 'blur(4px)', opacity: 0 }}
                      animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                      exit={{ scale: 1.1, filter: 'blur(4px)', opacity: 0 }}
                      className="message"
                    >
                      Work
                    </motion.span>
                  )}

                  {sessionType === 'shortBreak' && (
                    <motion.span
                      key="break"
                      initial={{ scale: 0.8, filter: 'blur(4px)', opacity: 0 }}
                      animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                      exit={{ scale: 1.1, filter: 'blur(4px)', opacity: 0 }}
                      className="message"
                    >
                      Break
                    </motion.span>
                  )}

                  {sessionType === 'longBreak' && (
                    <motion.span
                      key="longBreak"
                      initial={{ scale: 0.8, filter: 'blur(4px)', opacity: 0 }}
                      animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                      exit={{ scale: 1.1, filter: 'blur(4px)', opacity: 0 }}
                      className="message"
                    >
                      Long Break
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="controls">
              <IconButton
                onClick={handleReset}
                title="Reset"
                icon={
                  <svg
                    width="16"
                    height="15"
                    viewBox="0 0 16 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.49023 9.09971C4.14917 10.964 5.92715 12.2997 8.01711 12.2997C10.6681 12.2997 12.8171 10.1507 12.8171 7.49971C12.8171 4.84874 10.6681 2.69971 8.01711 2.69971C6.28691 2.69971 5.1624 3.48051 4.04663 4.79971M3.80011 2.69971V4.49971C3.80011 4.83108 4.06874 5.09971 4.40011 5.09971H6.20011"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <div>
                <IconButton
                  onClick={handleStart}
                  title={timerRunning ? 'Pause' : 'Start'}
                  icon={
                    timerRunning ? (
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 25 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.7002 3.5C5.31948 3.5 4.2002 4.61929 4.2002 6V19C4.2002 20.3807 5.31948 21.5 6.7002 21.5H7.7002C9.08091 21.5 10.2002 20.3807 10.2002 19V6C10.2002 4.61929 9.08091 3.5 7.7002 3.5H6.7002Z"
                          fill="currentColor"
                        />
                        <path
                          d="M16.7002 3.5C15.3195 3.5 14.2002 4.61929 14.2002 6V19C14.2002 20.3807 15.3195 21.5 16.7002 21.5H17.7002C19.0809 21.5 20.2002 20.3807 20.2002 19V6C20.2002 4.61929 19.0809 3.5 17.7002 3.5H16.7002Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 24 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_402_101)">
                          <path
                            d="M21.7781 11.2156L8.27813 2.97497C8.05326 2.83247 7.79356 2.75448 7.52738 2.74952C7.26121 2.74456 6.99878 2.81282 6.76876 2.94684C6.53533 3.07491 6.34074 3.26353 6.20545 3.49285C6.07017 3.72217 5.9992 3.98372 6.00001 4.24997V20.75C5.9992 21.0162 6.07017 21.2778 6.20545 21.5071C6.34074 21.7364 6.53533 21.925 6.76876 22.0531C6.99878 22.1871 7.26121 22.2554 7.52738 22.2504C7.79356 22.2455 8.05326 22.1675 8.27813 22.025L21.7781 13.7843C21.9994 13.6509 22.1824 13.4625 22.3095 13.2374C22.4365 13.0124 22.5033 12.7584 22.5033 12.5C22.5033 12.2416 22.4365 11.9875 22.3095 11.7625C22.1824 11.5375 21.9994 11.3491 21.7781 11.2156Z"
                            fill="currentColor"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_402_101">
                            <rect
                              width="24"
                              height="24"
                              fill="currentColo"
                              transform="translate(0 0.5)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                    )
                  }
                />
              </div>
              <IconButton
                onClick={handleSkip}
                title="Skip"
                icon={
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.2002 16.5L17.1395 13.5607C17.7253 12.9749 17.7253 12.0251 17.1395 11.4393L14.2002 8.5M7.2002 16.5L10.1395 13.5607C10.7253 12.9749 10.7253 12.0251 10.1395 11.4393L7.2002 8.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="dials-container"
          initial="hidden"
          animate="visible"
          variants={dialRow}
        >
          <motion.div
            className="dial"
            id="dial1"
            variants={dialItems}
          ></motion.div>
          <motion.div
            className="dial"
            id="dial2"
            variants={dialItems}
          ></motion.div>
          <motion.div
            className="dial"
            id="dial3"
            variants={dialItems}
          ></motion.div>
          <motion.div
            className="dial"
            id="dial4"
            variants={dialItems}
          ></motion.div>
        </motion.div>
      </div>

      <div className="bottom">
        <Popover.Root onOpenChange={() => setSettingsOpen(!settingsOpen)}>
          <Popover.Trigger asChild>
            <motion.button
              className="settingsButton"
              // onClick={() => setSettingsOpen(!settingsOpen)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.5, delay: 0.5 }}
            >
              {!settingsOpen && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g opacity="0.5">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M9.99618 2.86888C10.3581 2.32605 10.9673 2 11.6197 2H12.3803C13.0327 2 13.6419 2.32605 14.0038 2.86888L15.145 4.58067L16.894 4.17706C17.5495 4.02578 18.2367 4.22288 18.7125 4.69859L19.3014 5.28754C19.7771 5.76326 19.9742 6.45048 19.8229 7.10601L19.4193 8.85498L21.1311 9.99618C21.674 10.3581 22 10.9673 22 11.6197V12.3803C22 13.0327 21.674 13.6419 21.1311 14.0038L19.4193 15.145L19.8229 16.894C19.9742 17.5495 19.7771 18.2367 19.3014 18.7125L18.7125 19.3014C18.2367 19.7771 17.5495 19.9742 16.894 19.8229L15.145 19.4193L14.0038 21.1311C13.6419 21.674 13.0327 22 12.3803 22H11.6197C10.9673 22 10.3581 21.674 9.99618 21.1311L8.85498 19.4193L7.10601 19.8229C6.45048 19.9742 5.76326 19.7771 5.28754 19.3014L4.69859 18.7125C4.22288 18.2367 4.02578 17.5495 4.17706 16.894L4.58067 15.145L2.86888 14.0038C2.32605 13.6419 2 13.0327 2 12.3803V11.6197C2 10.9673 2.32605 10.3581 2.86888 9.99618L4.58067 8.85498L4.17706 7.10601C4.02578 6.45048 4.22288 5.76326 4.69859 5.28754L5.28754 4.69859C5.76326 4.22288 6.45048 4.02578 7.10601 4.17706L8.85498 4.58067L9.99618 2.86888ZM8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12Z"
                      fill="currentColor"
                    />
                  </g>
                </svg>
              )}
              <TextMorph>{settingsOpen ? ' Close' : ' Settings'}</TextMorph>

              {settingsOpen && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.5"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM9.70711 8.29289C9.31658 7.90237 8.68342 7.90237 8.29289 8.29289C7.90237 8.68342 7.90237 9.31658 8.29289 9.70711L10.5858 12L8.29289 14.2929C7.90237 14.6834 7.90237 15.3166 8.29289 15.7071C8.68342 16.0976 9.31658 16.0976 9.70711 15.7071L12 13.4142L14.2929 15.7071C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929L13.4142 12L15.7071 9.70711C16.0976 9.31658 16.0976 8.68342 15.7071 8.29289C15.3166 7.90237 14.6834 7.90237 14.2929 8.29289L12 10.5858L9.70711 8.29289Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </motion.button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="top" align="center" sideOffset={16} asChild>
              <motion.div
                className="settings"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 16, opacity: 0 }}
              >
                <div className="soundAndNotif">
                  <div className="notif">
                    <h4>Notifications</h4>
                    <div className="soundAndNotifItems">
                      <NotificationControls
                        notifEnabled={notifEnabled}
                        setNotifEnabled={setNotifEnabled}
                      />
                      <form>
                        <div className="switch">
                          <label className="Label" htmlFor="sound">
                            Notification Sound
                          </label>
                          <Switch.Root
                            className="SwitchRoot"
                            id="sound"
                            checked={sound}
                            onCheckedChange={() => setSound(!sound)}
                          >
                            <Switch.Thumb className="SwitchThumb" />
                          </Switch.Root>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="sound">
                    <h4>Background Noise</h4>
                    <form>
                      <div className="switch">
                        <label className="Label" htmlFor="brown">
                          Brown Noise
                        </label>
                        <Switch.Root
                          className="SwitchRoot"
                          id="sound"
                          checked={brownNoise}
                          onCheckedChange={() => setBrownNoise(!brownNoise)}
                        >
                          <Switch.Thumb className="SwitchThumb" />
                        </Switch.Root>
                      </div>
                      <div className="volume-control">
                        <label htmlFor="volume">Noise Volume</label>
                        <Slider.Root
                          className="SliderRoot"
                          id="volume"
                          defaultValue={[-20]}
                          min={-50}
                          max={0}
                          step={1}
                          onValueChange={(values) => {
                            const newVolume = values[0];
                            handleVolumeChange(newVolume);
                          }}
                          aria-label="Volume"
                        >
                          <Slider.Track className="SliderTrack">
                            <Slider.Range className="SliderRange" />
                          </Slider.Track>
                          <Slider.Thumb className="SliderThumb" />
                        </Slider.Root>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="settingsRight">
                  <div className="theme">
                    <h4>Appearance</h4>

                    <Select.Root
                      defaultValue={theme}
                      onValueChange={(value) => setTheme(value)}
                    >
                      <Select.Trigger className="SelectTrigger">
                        <Select.Value />
                        <Select.Icon className="SelectIcon">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </Select.Icon>
                      </Select.Trigger>

                      <Select.Portal>
                        <Select.Content className="SelectContent">
                          <Select.ScrollUpButton />
                          <Select.Viewport className="SelectViewPort">
                            <Select.Item value="system" className="SelectItem">
                              <Select.ItemText>System</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="light" className="SelectItem">
                              <Select.ItemText>Light</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="dark" className="SelectItem">
                              <Select.ItemText>Dark</Select.ItemText>
                            </Select.Item>
                            {/* <Select.Item value="arc" className="SelectItem">
                              <Select.ItemText>Arc</Select.ItemText>
                            </Select.Item> */}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                          <Select.Arrow />
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <div className="shortcuts">
                    <h4>Keyboard shortcuts</h4>
                    <p>
                      <span>
                        Start/Pause: space or p <br />
                        Reset: ← or r <br />
                        Skip: → or s <br />
                      </span>
                      <span>
                        Add minute: ↑<br />
                        Subtract minute: ↓
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* <Popover.Close />
              <Popover.Arrow /> */}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* <div
        className="pmdrCount"
        style={{ fontSize: 12, opacity: 0.5, marginTop: 16 }}
      >
        running: {timerRunning && 'yes'}
        {!timerRunning && 'no'}, <br /> pmdrCount: {pmdrCount} <br />
        total pomodoros: {totalPomodoros}
      </div> */}
        {/*
        <Toast.Provider duration={1000}>
          <Toast.Root
            className="ToastRoot"
            open={toastOpen}
            onOpenChange={setToastOpen}
          >
            <Toast.Title>{toastContent}</Toast.Title>
          </Toast.Root>
          <Toast.Viewport />
        </Toast.Provider> */}

        <Toaster
          theme={toasterTheme as ToasterTheme}
          dir="rtl"
          toastOptions={{
            duration: 2000,
            style: {
              color: 'var(--toast-text)',
              fontFamily: 'Inter',
              width: 'auto',
              borderRadius: 16,
              boxShadow: 'none',
            },
            // className: 'class',
          }}
        />
      </div>
    </div>
  );
}
