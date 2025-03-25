class MessageParser {
  constructor(actionProvider) {
    this.actionProvider = actionProvider;
  }

  parse(message) {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes("prediksi")) {
      this.actionProvider.handlePrediksi();
    } else {
      this.actionProvider.handleUnknown();
    }
  }
}

export default MessageParser;
