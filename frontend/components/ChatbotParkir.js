import Chatbot from "react-chatbot-kit";
import config from "frontend/chatbot/config";
import MessageParser from "./chatbot/MessageParser";
import ActionProvider from "./chatbot/ActionProvider";

export default function ChatbotParkir() {
  return (
    <div style={{ maxWidth: "300px" }}>
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
      />
    </div>
  );
}
