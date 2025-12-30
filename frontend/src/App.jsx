import { useState, useEffect, useRef, useMemo } from "react";
import { socket } from "./socket";
import Game from "./components/Game";
import EndScreen from "./components/EndScreen";
import "./index.css";

function App() {
  const [room, setRoom] = useState(null);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState(null);
  const [timer, setTimer] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [sabotage, setSabotage] = useState(null);
  const [grinchCooldown, setGrinchCooldown] = useState(0);
  const [winner, setWinner] = useState(null);
  const [step, setStep] = useState("choose");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [musicConsent, setMusicConsent] = useState(null);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [showRoomError, setShowRoomError] = useState(false);

  const clickSfx = new Audio("/music/clicksfx.mp3");
  clickSfx.volume = 0.2;

  const tracks = useMemo(
    () => ({
      home: new Audio("/music/bgm.mp3"),
      gameplay: new Audio("/music/game_bgm.mp3"),
      end: new Audio("/music/victory.mp3"),
    }),
    []
  ); 

  useEffect(() => {
    tracks.home.loop = true;
    tracks.gameplay.loop = true;
  }, [tracks]);

  const MUSIC_MAX_VOLUME = 0.05;
  const activeTrackRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  useEffect(() => {
    if (!musicConsent) {
      Object.values(tracks).forEach((t) => {
        t.pause();
        t.currentTime = 0;
      });
      activeTrackRef.current = null;
      return;
    }

    let nextTrack;
    if (winner) nextTrack = tracks.end;
    else if (room && room.phase !== "lobby") nextTrack = tracks.gameplay;
    else nextTrack = tracks.home;

    if (activeTrackRef.current === nextTrack) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    if (activeTrackRef.current) {
      activeTrackRef.current.pause();
      activeTrackRef.current.currentTime = 0;
    }

    activeTrackRef.current = nextTrack;
    nextTrack.volume = 0;

    let playPromise = nextTrack.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          let vol = 0;
          fadeIntervalRef.current = setInterval(() => {
            vol += 0.005;
            if (vol >= MUSIC_MAX_VOLUME) {
              nextTrack.volume = MUSIC_MAX_VOLUME;
              clearInterval(fadeIntervalRef.current);
            } else {
              nextTrack.volume = vol;
            }
          }, 50);
        })
        .catch((e) => console.error("Playback blocked", e));
    }

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [room?.phase, winner, musicConsent, tracks]);

  const playClick = () => {
    clickSfx.currentTime = 0;
    clickSfx.playbackRate = 0.95 + Math.random() * 0.1;
    clickSfx.play().catch(() => {});
  };

  useEffect(() => {
    const savedRoom = localStorage.getItem("roomCode");
    const savedName = localStorage.getItem("name");

    if (savedRoom && savedName) {
      setRoomCode(savedRoom);
      setName(savedName);
      setStep("created");
      socket.emit("rejoin-room", { roomCode: savedRoom, name: savedName });
    }

    socket.on("room-created", ({ roomCode }) => {
      setRoomCode(roomCode);
      setStep("created");
      setShowRoomCode(true);
    });

    socket.on("room-update", (data) => setRoom(data));
    socket.on("join-error", () => setShowRoomError(true));
    socket.on("role-assigned", ({ role }) => setRole(role));
    socket.on("timer-update", (t) => setTimer(t));
    socket.on("sabotage", (data) => setSabotage(data));
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("game-over", ({ winner }) => {
      setWinner(winner);
      localStorage.removeItem("roomCode");
      localStorage.removeItem("name");
    });

    return () => {
      socket.off("room-created");
      socket.off("room-update");
      socket.off("join-error");
      socket.off("role-assigned");
      socket.off("timer-update");
      socket.off("sabotage");
      socket.off("chat-message");
      socket.off("game-over");
    };
  }, []);

  useEffect(() => {
    if (grinchCooldown <= 0) return;
    const interval = setInterval(() => setGrinchCooldown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [grinchCooldown]);

  useEffect(() => {
    if (roomCode && name) {
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("name", name);
    }
  }, [roomCode, name]);

  const handleTaskComplete = () => socket.emit("complete-task", { roomCode });
  const triggerSabotage = (task) => {
    if (grinchCooldown > 0) return;
    socket.emit("trigger-sabotage", { roomCode, task });
    setGrinchCooldown(10);
  };
  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket.emit("send-chat", { roomCode, message: chatInput });
    setChatInput("");
  };

  if (!room) {
    return (
      <div className="home-wrapper">
        <div className="frost-overlay"></div>
        <div
          className={`home-bg ${musicConsent === null ? "blurred" : ""}`}
        ></div>

        {showRoomError && (
          <div className="roomcode-overlay">
            <div className="roomcode-card">
              <h2>❌ Heist doesn't exists!</h2>

              <button
                className="roomcode-btn"
                onClick={() => {
                  playClick();
                  setShowRoomError(false);
                }}
              >
                🎁 Try Another Heist
              </button>
            </div>
          </div>
        )}

        {musicConsent !== null && (
          <div className="home-ui">
            <div className="home-card">
              <h1>
                <span className="emoji">🎅</span>{" "}
                <span className="home-title">Santa’s Gift Heist</span>
              </h1>
              <p className="home-subtitle">
                A cozy Christmas game of cheerful chaos, clever lies, secret
                roles, and mischievous holiday betrayal.
              </p>

              <input
                className="home-input"
                placeholder="✍️ Write your name on Santa’s list..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {step === "choose" && (
                <>
                  <div className="btn-container">
                    <button
                      className="home-btn green"
                      onClick={() => {
                        playClick();
                        socket.emit("create-room", { name });
                      }}
                      disabled={!name}
                    >
                      🎄 Host a Heist
                    </button>

                    <button
                      className="home-btn red"
                      onClick={() => {
                        playClick();
                        setStep("join");
                      }}
                      disabled={!name}
                    >
                      🔑 Join a Heist
                    </button>
                  </div>
                </>
              )}

              {step === "join" && (
                <>
                  <input
                    className="home-input"
                    placeholder="🎁 Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  />

                  <button
                    className="home-btn green"
                    onClick={() => {
                      playClick();
                      socket.emit("join-room", { roomCode, name });
                    }}
                    disabled={!name || !roomCode}
                  >
                    🎄 Enter Workshop
                  </button>

                  <button
                    className="home-back"
                    onClick={() => {
                      playClick();
                      setStep("choose");
                    }}
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {musicConsent === null && (
          <div className="music-popup">
            <div className="music-popup-card">
              <h2>🎶 Cozy Background Music</h2>
              <p>Do you want soft Christmas music while playing?</p>
              <div className="music-buttons">
                <button
                  onClick={() => {
                    playClick();
                    setMusicConsent(true);
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setMusicConsent(false);
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (winner) return <EndScreen winner={winner} room={room} />;

  return (
    <>
      {showRoomCode && (
        <div className="roomcode-overlay">
          <div className="roomcode-card">
            <h2>🎄 Your Heist Is Ready!</h2>
            <p className="roomcode-label">Share this Room Code</p>

            <div className="roomcode-box">{roomCode}</div>

            <button
              className="roomcode-btn"
              onClick={() => {
                playClick();
                navigator.clipboard.writeText(roomCode);
                setShowRoomCode(false);
              }}
            >
              📋 Copy & Enter Lobby
            </button>

            <p className="roomcode-hint">
              Send this code to your friends so they can join your heist.
            </p>
          </div>
        </div>
      )}
      <Game
        room={room}
        role={role}
        timer={timer}
        activeTask={activeTask}
        setActiveTask={setActiveTask}
        sabotage={sabotage}
        grinchCooldown={grinchCooldown}
        handleTaskComplete={handleTaskComplete}
        triggerSabotage={triggerSabotage}
        chatInput={chatInput}
        setChatInput={setChatInput}
        messages={messages}
        sendMessage={sendMessage}
        roomCode={roomCode}
        playClick={playClick}
      />
    </>
  );
}

export default App;
