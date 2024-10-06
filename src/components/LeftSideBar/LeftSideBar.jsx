import React, { useContext, useEffect, useState } from "react";
import "./LeftSideBar.css";
import assets from "../../assets/assets.js";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { AppContext } from "../../context/AppContext.jsx";
import { db } from "../../config/firebase.js";
import { toast } from "react-toastify";

const LeftSideBar = () => {
  const navigate = useNavigate();
  const {
    userData,
    chatData,
    setChatData,
    chatUser,
    setChatUser,
    setMessageId,
    messageId,
    chatVisible,
    setChatVisible,
  } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const inputHandler = async (e) => {
    try {
      const input = e.target.value;
      if (input) {
        setShowSearch(true);
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
          console.log(querySnap.docs[0].data());
          let userExist = false;
          chatData.map((user) => {
            if (user.rId === querySnap.docs[0].data().id) {
              userExist = true;
            }
          });
          if (!userExist) {
            setUser(querySnap.docs[0].data());
          }
        } else {
          setUser(null);
        }
      } else {
        setShowSearch(false);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const addChat = async () => {
    const messageRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");
    try {
      const newMessageRef = doc(messageRef);

      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        message: [],
      });

      // Check if the chat document exists for the user first
      const userChatRef = doc(chatsRef, user.id);
      const userChatSnap = await getDoc(userChatRef);

      if (userChatSnap.exists()) {
        await updateDoc(userChatRef, {
          chatsData: arrayUnion({
            messageId: newMessageRef.id,
            lastMessage: "",
            rId: userData.id,
            updatedAt: Date.now(),
            messageSeen: true,
          }),
        });
      } else {
        // Create the document if it doesn't exist
        await setDoc(userChatRef, {
          chatsData: [
            {
              messageId: newMessageRef.id,
              lastMessage: "",
              rId: userData.id,
              updatedAt: Date.now(),
              messageSeen: true,
            },
          ],
        });
      }

      // Repeat for current user
      const currentUserChatRef = doc(chatsRef, userData.id);
      const currentUserChatSnap = await getDoc(currentUserChatRef);

      if (currentUserChatSnap.exists()) {
        await updateDoc(currentUserChatRef, {
          chatsData: arrayUnion({
            messageId: newMessageRef.id,
            lastMessage: "",
            rId: user.id,
            updatedAt: Date.now(),
            messageSeen: true,
          }),
        });
      } else {
        await setDoc(currentUserChatRef, {
          chatsData: [
            {
              messageId: newMessageRef.id,
              lastMessage: "",
              rId: user.id,
              updatedAt: Date.now(),
              messageSeen: true,
            },
          ],
        });
      }

      const uSnap = await getDoc(doc(db, "users", user.id));
      const uData = uSnap.data();
      setChat({
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: user.id,
        updatedAt: Date.now(),
        messageSeen: true,
        userData: uData,
      });
      setShowSearch(false);
      setChatVisible(true);
    } catch (error) {
      console.error("Error adding chat:", error);
      toast.error(error.code.split("/")[1].split("-").join(" "));
    }
  };

  const setChat = async (item) => {
    try {
      setChatUser(item);
      setMessageId(item.messageId);

      // Check if chat data exists for user
      const userChatsRef = doc(db, "chats", userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatData = userChatsSnapshot.data();

      if (userChatData && userChatData.chatsData) {
        const chatIndex = userChatData.chatsData.findIndex(
          (e) => e.messageId === item.messageId
        );

        if (chatIndex !== -1) {
          userChatData.chatsData[chatIndex].messageSeen = true;
          await updateDoc(userChatsRef, {
            chatsData: userChatData.chatsData,
          });
        }
      }

      setChatVisible(true);
    } catch (error) {
      console.error("Error setting chat:", error);
      toast.error(error.code.split("/")[1].split("-").join(" "));
    }
  };

  useEffect(() => {
    const updateChatUserData = async () => {
      if (chatUser) {
        const userRef = doc(db, "users", chatUser.userData.id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        setChatUser((prev) => ({ ...prev, userData }));
      }
    };
    updateChatUserData();
  }, [chatData]);

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="logo" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate("/profile")}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input
            onChange={inputHandler}
            type="text"
            placeholder="Search here..."
          />
        </div>
      </div>
      <div className="ls-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img src={user.avatar} alt="" />
            <p>{user.name}</p>
          </div>
        ) : chatData && chatData.length > 0 ? (
          chatData.map((item, index) => (
            <div
              onClick={() => setChat(item)}
              key={index}
              className={`friends ${
                item.messageSeen || item.messageId === messageId ? "" : "border"
              }`}
            >
              <img src={item.userData.avatar} alt="" />
              <div>
                <p>{item.userData.name}</p>
                <span>{item.lastMessage}</span>
              </div>
            </div>
          ))
        ) : (
          <p>No chats available</p>
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
