import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [messageId, setMessageId] = useState(null);
  const [message, setMessage] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const navigate = useNavigate();

  const loadUserData = async (uid) => {
    try {
      const useRef = doc(db, "users", uid);
      const userSnap = await getDoc(useRef);
      const userData = userSnap.data();
      setUserData(userData);

      if (userData.avatar && userData.name) {
        navigate("/chat");
      } else {
        navigate("/profile");
      }

      await updateDoc(useRef, {
        lastSeen: Date.now(),
      });

      setInterval(async () => {
        if (auth.currentUser) {
          await updateDoc(useRef, {
            lastSeen: Date.now(),
          });
        }
      }, 60000);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    if (userData) {
      console.log("User Data:", userData);

      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (res) => {
        console.log("Snapshot received:", res.data());
        const chatItems = res.data()?.chatsData || [];

        // Fetch chat users in parallel using Promise.all
        const tempData = await Promise.all(
          chatItems.map(async (item) => {
            const userRef = doc(db, "users", item.rId);
            const userSnap = await getDoc(userRef);
            return { ...item, userData: userSnap.data() }; // Properly combine user data with chat item
          })
        );

        setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt)); // Sort by last update
      });

      return () => {
        unSub();
      };
    }
  }, [userData]);

  const value = {
    userData,
    setUserData,
    chatData,
    setChatData,
    loadUserData,
    messageId,
    setMessageId,
    message,
    setMessage,
    chatUser,
    setChatUser,
    chatVisible,
    setChatVisible,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
