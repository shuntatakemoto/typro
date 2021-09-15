import { useCallback } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TextInput } from "../../components/atoms";

import { useEffect } from "react";
import {
  fetchAnswersFromRoom,
  getAnswers,
} from "../../../redux/slices/answersSlice";
import {
  fetchQuestonsFromRoom,
  getQuestions,
  updateQuestionsState,
} from "../../../redux/slices/questionsSlice";
import Router, { createRouter, useRouter } from "next/router";
import Keybord from "../../../public/audios/keybord.mp3";
import DisplayQ from "../../../public/audios/displayquestion1.mp3";
import Miss from "../../../public/audios/miss.mp3";
import Success from "../../../public/audios/success.mp3";
import { CountdownBar } from "../../components/atoms";
import { getUser } from "../../../redux/slices/userSlice";
import {
  addAnswersToRoom,
  addMissAnswersToRoom,
  changeCode,
  changeTurn,
} from "../../../redux/slices/roomsSlice";
import { db } from "../../firebase/firebase";

const CoopPlay = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector(getUser).user;
  const answers = useSelector(getAnswers).answers;
  const questions = useSelector(getQuestions).questions;

  const language: any = router.query["language"];
  const level: any = router.query["level"];
  const count: string | string[] | undefined = router.query["count"];
  const roomId: any = router.query["roomId"];

  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");
  const [currentId, setCurrentId] = useState(1);
  const [alertText, setAlertText] = useState("");
  const [missCount, setMissCount] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [anothorCode, setAnothorCode] = useState("");
  const [turn, setTurn] = useState("");

  const [audioKeybord, setAudioKeybord] = useState<HTMLAudioElement | null>(
    null
  );
  const [audioDisplayQ, setAudioDisplayQ] = useState<HTMLAudioElement | null>(
    null
  );
  const [audioMiss, setAudioMiss] = useState<HTMLAudioElement | null>(null);
  const [audioSuccess, setAudioSuccess] = useState<HTMLAudioElement | null>(
    null
  );

  const InputCode = useCallback(
    (event) => {
      setAlertText("");
      if (event.target.value.match(/  /)) {
        event.target.value = event.target.value.replace(/  /g, " ");
      }
      setCode(event.target.value);
      dispatch(changeCode({ roomId: roomId, code: event.target.value }));
    },
    [setCode]
  );

  const settingAudio = () => {
    setAudioKeybord(new Audio(Keybord));
    setAudioDisplayQ(new Audio(DisplayQ));
    setAudioMiss(new Audio(Miss));
    setAudioSuccess(new Audio(Success));
  };

  useEffect(() => {
    settingAudio();

    if (Number(count) === 1) {
      displayNextQuestion(currentId); // 最初の問題を表示
      performance.mark("question:start");
      performance.mark("question1:start");
    }

    if (Number(count) === 2) {
      displayNextQuestion(currentId); // 最初の問題を表示
      performance.mark("question2:start");
    }

    window.addEventListener("beforeunload", onUnload);

    return () => {
      // イベントの設定解除
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  useEffect(() => {
    const unsubscribeRoom = db
      .collection("rooms")
      .doc(roomId)
      .onSnapshot((snapshot) => {
        const data: any = snapshot.data();
        console.log(data);

        if (data.nextQuestionId > currentId) {
          displayNextQuestion(data.nextQuestionId);
        }

        if (data.answers.miss.length > answers.miss.length) {
          dispatch(fetchAnswersFromRoom(roomId));
          // dbのroomからstoreのanswerに反映させる
        }

        if (data.nextTurn == "creator") {
          // creatorが入力する番で
          setTurn("creator");
          if (data.creator == user.uid) {
            // 自分がcreatorならば
            setIsMyTurn(true);
          }
        }
        if (data.nextTurn == "participant") {
          // participantが入力する番で
          setTurn("participant");
          if (data.participant == user.uid) {
            // 自分がparticipantならば
            setIsMyTurn(true);
          }
        }

        setAnothorCode(data.code); // 相手が入力しているコード
      });

    return () => unsubscribeRoom();
  }, []);

  const onUnload = (e: any) => {
    e.preventDefault();
    e.returnValue = "";
  };

  const displayNextQuestion = (nextQuestionId: number) => {
    if (nextQuestionId > Object.keys(questions[Number(count)]["src"]).length) {
      Router.push({
        pathname: "/users/coopoutput",
        query: {
          language: language,
          level: level,
          count: Number(count),
          roomId: roomId,
        },
      });
    }
    setQuestion(questions[Number(count)]["src"][nextQuestionId]);
    setCurrentId(nextQuestionId);
  };

  const Judge = (e: any, code: string) => {
    if (e.key === "Enter") {
      if (code.match(/'/)) {
        code = code.replace(/'/g, '"');
      }
      if (code === question) {
        audioSuccess?.play();

        if (Number(count) === 1) {
          dispatch(
            addAnswersToRoom({
              roomId: roomId,
              code: code,
              count: Number(count),
              isSrc: "src",
            })
          );
          // dbのroomにanswersを追加する
        } else if (Number(count) === 2) {
          dispatch(
            addAnswersToRoom({
              roomId: roomId,
              code: code,
              count: Number(count),
              isSrc: "src",
            })
          );
        }
        setCode("");
        setAlertText("正解です。");
        dispatch(
          addMissAnswersToRoom({
            roomId: roomId,
            missCount: missCount,
          })
        );
        // missの回数をdbのroomに追加する
        setIsMyTurn(false);
        if (turn === "creator") {
          dispatch(
            changeTurn({
              roomId: roomId,
              nextTurn: "participant",
              nextQuestionId: currentId + 1,
              code: "",
              count: Number(count),
            })
          );
        }
        if (turn === "participant") {
          dispatch(
            changeTurn({
              roomId: roomId,
              nextTurn: "creator",
              nextQuestionId: currentId + 1,
              code: "",
              count: Number(count),
            })
          );
        }
      } else {
        audioMiss?.play();

        setMissCount((prevState) => prevState + 1);
        setAlertText("コードが違います。");
      }
    }
  };

  return (
    <body className="w-full h-screen items-center justify-center">
      <div className="pt-24 py-12 flex justify-center">
        <CountdownBar />
      </div>
      <div className="flex justify-center items-center">
        <div className="w-1/4  text-lg"></div>
        <div className="w-2/4">
          <h1 className="text-center font-mono text-2xl">{question}</h1>
          {isMyTurn ? (
            <div>
              <TextInput
                fullWidth={true}
                autoFocus={true}
                margin="dense"
                multiline={false}
                required={true}
                rows={1}
                value={code}
                type={"text"}
                variant={"outlined"}
                onChange={InputCode}
                onKeyDown={(e) => Judge(e, code)}
              />
              <div className="text-center text-red-500">
                あなたが入力する番です
              </div>
            </div>
          ) : (
            <div>
              <TextInput
                fullWidth={true}
                autoFocus={true}
                margin="dense"
                multiline={false}
                required={true}
                rows={1}
                value={anothorCode}
                type={"text"}
                variant={"outlined"}
              />
              <div className="text-center text-red-500">
                相手が入力する番です
              </div>
            </div>
          )}
          {isMyTurn && (
            <>
              <div className="text-center text-red-500">{alertText}</div>
              <div className="text-center text-red-500">
                {"miss:" + missCount}
              </div>
            </>
          )}
        </div>
        <div className="w-1/4  text-lg">
          {answers[Number(count)]["src"].length > 0 &&
            answers[Number(count)]["src"].map(
              (answer: string, index: number) => (
                <div className="ml-24" key={index}>
                  {index + 1} : {answer}
                </div>
              )
            )}
        </div>
      </div>
    </body>
  );
};
export default CoopPlay;