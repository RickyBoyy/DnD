const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");

let userText = null;

const handleOutgoingChat = () => {
  userText = chatInput.valuue.trim();
  console.log(userText);
};

sendButton.addEventListener("click", handleOutgoingChat);
