import React, { useState, useEffect } from "react";
import Gif from "../atoms/Gif";
import fight from "../../../public/images/stamp/fight.gif";
import nicePlay from "../../../public/images/stamp/niceplay.gif";
import osii from "../../../public/images/stamp/osii.gif";
import genius from "../../../public/images/stamp/genius.gif";
import { Button } from "@material-ui/core";
import router from "next/router";
import { db } from "../../firebase/firebase";
import { useSelector } from "react-redux";
import { getUser } from "../../../redux/slices/userSlice";

const Stamp = () => {
  const user = useSelector(getUser).user;
  const roomId: any = router.query["roomId"];
  const [isCreater, setIsCreater] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [createrName, setCreaterName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [createrSelected, setCreaterSelected] = useState<null | number>(null);
  const [participantSelected, setParticipantSelected] = useState<null | number>(
    null
  );

  //   自分のスタンプを相手に送る
  useEffect(() => {
    console.log("useEffect1");
    db.collection("rooms")
      .doc(roomId)
      .update({ createrSelected: createrSelected });
    //   .onSnapshot((snapshot) => {
    //     const data: any = snapshot.data();
    //     console.log(data);
    //     return () => mySelectedStamp();
    //   });
  }, [createrSelected]);

  //   相手のスタンプを取得する
  useEffect(() => {
    console.log("useEffect2");
    db.collection("rooms")
      .doc(roomId)
      .update({ participantSelected: participantSelected });
    //   .onSnapshot((snapshot) => {
    //     const data: any = snapshot.data();
    //     console.log(data);
    //     return () => mySelectedStamp();
    //   });
  }, [participantSelected]);

  useEffect(() => {
    console.log("useEffect3");
    const nowUser = db
      .collection("rooms")
      .doc(roomId)
      .onSnapshot((snapshot) => {
        const data: any = snapshot.data();
        if (data.creator == user.uid) {
          setCreaterName(data.createrName);
          setIsCreater(true);
          setParticipantSelected(data.participantSelected);
        }
        if (data.participant == user.uid) {
          setParticipantName(data.participantName);
          setIsParticipant(true);
          setCreaterSelected(data.createrSelected);
        }
        return () => nowUser();
      });
  }, []);

  const clickAction = (index: null | number) => {
    isCreater == true
      ? setCreaterSelected(index)
      : setParticipantSelected(index);
    setTimeout(toNull, 5000);
  };

  const toNull = () => {
    isCreater == true ? setCreaterSelected(null) : setParticipantSelected(null);
  };

  const gifName = ["ファイト", "ナイスプレイ", "おしい", "天才か？"];
  const gifSorce = [fight, nicePlay, osii, genius];

  return (
    <div className="w-full">
      {gifName.map((name, index) => (
        <div key={name} className="text-center">
          <Button onClick={() => clickAction(index)}>{name}</Button>
        </div>
      ))}

      <div>
        <div className="text-right">
          <div className={` ${createrSelected !== null ? "block" : "hidden"}`}>
            {isCreater == true ? (
              <p>{createrName}</p>
            ) : (
              <p>{participantName}</p>
            )}
            {createrSelected === null ? (
              <></>
            ) : (
              <Gif gifSorce={gifSorce[createrSelected]} />
            )}
          </div>
        </div>
        <div className="text-left">
          <div
            className={` ${participantSelected !== null ? "block" : "hidden"}`}
          >
            {isParticipant == true ? (
              <p>{participantName}</p>
            ) : (
              <p>{createrName}</p>
            )}
            {participantSelected === null ? (
              <></>
            ) : (
              <Gif gifSorce={gifSorce[participantSelected]} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stamp;
function useMount(arg0: () => void, arg1: never[]) {
  throw new Error("Function not implemented.");
}