import { createChatBotMessage } from "react-chatbot-kit";

const config = {
  initialMessages: [
    createChatBotMessage("Halo! Mau cek prediksi parkir dimana?"),
  ],
  botName: "ParkBot UB",
  customStyles: {
    botMessageBox: { backgroundColor: "#376B7E" },
    chatButton: { backgroundColor: "#376B7E" },
  },
};

export default config;
