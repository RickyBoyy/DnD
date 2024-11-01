console.log("Chat script loaded");
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send_btn"); // Ensure this matches the ID in your JSX

let userText = null;

const handleOutgoingChat = () => {
  userText = chatInput.value.trim(); // Fix the typo from valuue to value
  console.log(userText); // This should log the input from the textarea
};

if (sendButton) {
  // Check if the button is found
  sendButton.addEventListener("click", handleOutgoingChat);
} else {
  console.error("Send button not found"); // Log an error if the button isn't found
}
