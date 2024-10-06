import React, { useContext, useEffect, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets.js";
import { AppContext } from "../../context/AppContext.jsx";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import upload from "../../lib/Upload.js";
import { db } from "../../config/firebase.js";

const ChatBox = () => {
  const {
    userData,
    messageId,
    chatUser,
    message,
    setMessage,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);

  const [input, setInput] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      if (input && messageId) {
        await updateDoc(doc(db, "messages", messageId), {
          message: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date(),
          }),
        });
        const userIDs = [chatUser.rId, userData.id];

        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (e) => e.messageId === messageId
            );
            userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
            userChatData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error);
    }
    setInput("");
  };

  const sendImage = async (e) => {
    try {
      const fileUrl = await upload(e.target.files[0]);

      if (fileUrl && messageId) {
        await updateDoc(doc(db, "messages", messageId), {
          message: arrayUnion({
            sId: userData.id,
            image: fileUrl,
            createdAt: new Date(),
          }),
        });
        const userIDs = [chatUser.rId, userData.id];

        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex(
              (e) => e.messageId === messageId
            );
            userChatData.chatsData[chatIndex].lastMessage = "Image";
            userChatData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error sending image:", error);
      toast.error(error);
    }
  };

  const convertTimeStamp = (timestamp) => {
    let date = timestamp.toDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (hour > 12) return hour - 12 + ":" + minute + " PM";
    else return hour + ":" + minute + " AM";
  };

  useEffect(() => {
    if (messageId) {
      const messageRef = doc(db, "messages", messageId);
      const unsub = onSnapshot(messageRef, (res) => {
        setMessage(res.data().message.reverse());
      });
      return () => {
        unsub();
      };
    }
  }, [messageId]);

  useEffect(() => {
    console.log("Current messageId:", messageId);
    console.log("Current chatUser:", chatUser);
  }, [messageId, chatUser]);

  return (
    <>
      {chatUser ? (
        <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
          <div className="chat-user">
            <img src={chatUser.userData.avatar} alt="" />
            <p>
              {chatUser.userData.name}
              {Date.now() - chatUser.userData.lastSeen <= 70000 ? (
                <img className="dot" src={assets.green_dot} alt="" />
              ) : null}
            </p>
            <img src={assets.help_icon} className="help" alt="" />
            <img
              onClick={() => setChatVisible(false)}
              src={assets.arrow_icon}
              className="arrow"
              alt=""
            />
          </div>

          <div className="chat-msg">
            {message.map((msg, index) => (
              <div
                key={index}
                className={msg.sId === userData.id ? "s-msg" : "r-msg"}
              >
                {msg["image"] ? (
                  <img
                    onClick={() => window.open(url)}
                    src={msg.image}
                    alt=""
                    className="msg-img"
                  />
                ) : (
                  <p className="msg">{msg.text}</p>
                )}
                <div>
                  <img
                    src={
                      msg.sId === userData.id
                        ? userData.avatar
                        : chatUser.userData.avatar
                    }
                    alt=""
                  />
                  <p>{convertTimeStamp(msg.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="Send a message"
            />
            <input
              onChange={sendImage}
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              hidden
            />
            <label htmlFor="image">
              <img src={assets.gallery_icon} alt="" />
            </label>
            <img onClick={sendMessage} src={assets.send_button} alt="" />
          </div>
        </div>
      ) : (
        <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
          <img src={assets.logo_icon} alt="" />
          <p>Chat anytime, anywhere</p>
        </div>
      )}
    </>
  );
};

export default ChatBox;
