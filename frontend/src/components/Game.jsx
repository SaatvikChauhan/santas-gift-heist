import { socket } from "../socket";
import GameHeader from "./GameHeader";
import GameMain from "./GameMain";
import "../game.css";

export default function Game(props) {
  const { room } = props;

  const isEliminated =
    room && room.phase !== "lobby" && !room.players?.[socket.id];

  const isHost =
    room.players?.[socket.id]?.name === room.players?.[room.hostId]?.name;

  return (
    <div className={`game-wrapper ${props.role}-theme`}>
      <GameHeader
        room={room}
        roomCode={props.roomCode}
        timer={props.timer}
        isHost={isHost}
        playClick={props.playClick}
      />

      <GameMain {...props} isEliminated={isEliminated} isHost={isHost} playClick={props.playClick}/>
    </div>
  );
}
