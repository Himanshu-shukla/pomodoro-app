import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';
import './App.css';

const beepSound = new Howl({
  src: ['beeps.mp3']
});

const longBeepSound = new Howl({
  src: ['beepl.mp3']
});

const formatTime = (time) => {
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

function Pomodoro() {
  const PRE_WORK_DURATION = 3 * 60;
  const WORK_DURATION = 24 * 60;
  const REVISION_DURATION = 3 * 60;
  const TOTAL_POMODOROS = 20;

  const [secondsLeft, setSecondsLeft] = useState(PRE_WORK_DURATION);
  const [phase, setPhase] = useState('prework');
  const [pomodoroCount, setPomodoroCount] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [colorStatus, setColorStatus] = useState(Array(TOTAL_POMODOROS).fill([]).map(() => ['', '', '']));
  const [checkStatus, setCheckStatus] = useState(Array(TOTAL_POMODOROS).fill([]).map(() => [false, false, false]));

  // Editable Table State
  const initialEditableTable = Array(2).fill('').map(() => ['', '', '', '']);
  const [editableTable, setEditableTable] = useState(initialEditableTable);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    document.title = `${formatTime(secondsLeft)} - ${phase.charAt(0).toUpperCase() + phase.slice(1)}`;
    let timer = null;
    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft((prevSeconds) => prevSeconds - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, secondsLeft]);

  useEffect(() => {
    if (secondsLeft < 0) {
      let newColorStatus = [...colorStatus];
      switch (phase) {
        case 'prework':
          setPhase('work');
          setSecondsLeft(WORK_DURATION);
          longBeepSound.play();
          newColorStatus[pomodoroCount - 1][0] = 'red';
          break;
        case 'work':
          setPhase('revision');
          setSecondsLeft(REVISION_DURATION);
          longBeepSound.play();
          newColorStatus[pomodoroCount - 1][1] = 'red';
          break;
        case 'revision':
          newColorStatus[pomodoroCount - 1][2] = 'red';
          longBeepSound.play();
          if (pomodoroCount < TOTAL_POMODOROS) {
            setPomodoroCount(pomodoroCount + 1);
            setPhase('prework');
            setSecondsLeft(PRE_WORK_DURATION);
          } else {
            setPhase('complete');
          }
          break;
        default:
          break;
      }
      setColorStatus(newColorStatus);
    }

    if (phase === 'work' && secondsLeft % 60 === 59) {
      beepSound.play();
    }
  }, [secondsLeft, phase, pomodoroCount]);

  const pauseTimer = () => setIsActive(false);

  const resumeTimer = () => setIsActive(true);

  const handleCheckboxChange = (row, col) => {
    if (row < pomodoroCount) {
      let updatedCheckStatus = [...checkStatus];
      updatedCheckStatus[row][col] = !updatedCheckStatus[row][col];
      setCheckStatus(updatedCheckStatus);

      let updatedColorStatus = [...colorStatus];
      updatedColorStatus[row][col] = updatedCheckStatus[row][col] ? 'green' : 'red';
      setColorStatus(updatedColorStatus);
    }
  };

  const handleDoubleClick = (row, col) => {
    setEditingCell({ row, col });
  };

  const handleChange = (e, row, col) => {
    const value = e.target.value;
    const updatedTable = [...editableTable];
    updatedTable[row][col] = value;
    setEditableTable(updatedTable);
  };

  const handleKeyDown = (e, row, col) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        const lines = editableTable[row][col].split('\n');
        const lastLine = lines[lines.length - 1];
        const match = lastLine.match(/^(\d+)\./);
        const newNumber = match ? parseInt(match[1], 10) + 1 : 1;
        const newContent = `${editableTable[row][col].trim()}\n${newNumber}. `;
        setEditableTable((prev) => {
          const updated = [...prev];
          updated[row][col] = newContent;
          return updated;
        });
      } else {
        handleBlur();
      }
    }
  };

  const handleBlur = () => {
    setEditingCell(null);
  };

  return (
    <div className="App">
      <div className="split left">
        <header className="App-header">
          <h2 style={{color:"black"}}>Pomodoro Timer</h2>
          <div className="timer">
            <h2>{formatTime(secondsLeft)}</h2>
            <p style={{color:"black"}}>Phase: {phase.charAt(0).toUpperCase() + phase.slice(1)}</p>
            <p style={{color:"black"}}>Pomodoro Count: {pomodoroCount} / {TOTAL_POMODOROS}</p>

          </div>
          {phase !== 'complete' && (
            <div>
              {isActive ? (
                <button onClick={pauseTimer}>Pause</button>
              ) : (
                <button onClick={resumeTimer}>Resume</button>
              )}
            </div>
          )}
          {phase === 'complete' && <p>All pomodoros completed!</p>}
        </header>
      </div>
      <div className="split right">
        {/* Editable Table */}
        <table className="editable-table">
          <tbody>
            {editableTable.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} onDoubleClick={() => handleDoubleClick(rowIndex, colIndex)}>
                    {editingCell && editingCell.row === rowIndex && editingCell.col === colIndex ? (
                      <textarea
                        value={cell}
                        onChange={(e) => handleChange(e, rowIndex, colIndex)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        className="editable-cell"
                        autoFocus
                      />
                    ) : (
                      <span>{cell.split('\n').map((line, index) => (
                        <React.Fragment key={index}>{line}<br /></React.Fragment>
                      ))}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Prework</th>
              <th>Work</th>
              <th>Revision</th>
            </tr>
          </thead>
          <tbody>
            {colorStatus.map((rowStatus, rowIndex) => (
              <tr key={rowIndex}>
                <td>{rowIndex + 1}</td>
                {rowStatus.map((cellColor, colIndex) => (
                  <td key={colIndex} style={{ backgroundColor: colorStatus[rowIndex][colIndex] }}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checkStatus[rowIndex][colIndex]}
                      onChange={() => handleCheckboxChange(rowIndex, colIndex)}
                      disabled={rowIndex >= pomodoroCount}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pomodoro;