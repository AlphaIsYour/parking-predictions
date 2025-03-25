class ActionProvider {
  constructor(createChatBotMessage, setStateFunc) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  handlePrediksi = () => {
    const message = this.createChatBotMessage("Masukkan ID Lokasi Parkir:", {
      widget: "prediksiParkir",
    });
    this.updateChatbotState(message);
  };

  handleUnknown = () => {
    const message = this.createChatBotMessage(
      "Maaf, saya hanya bisa membantu prediksi parkir. Ketik 'prediksi' untuk mulai."
    );
    this.updateChatbotState(message);
  };

  updateChatbotState = (message) => {
    this.setState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, message],
    }));
  };
}

export default ActionProvider;
