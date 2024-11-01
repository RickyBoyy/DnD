(function () {
  console.log("Chat script loaded");

  const chatInput = document.querySelector("#chat-input");
  const sendButton = document.querySelector("#send_btn");

  if (!chatInput || !sendButton) {
    console.error("Chat input or send button not found.");
    return;
  }

  const createChatElement = (message, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);

    const chatContent = document.createElement("div");
    chatContent.classList.add("chat-content");

    const chatDetails = document.createElement("div");
    chatDetails.classList.add("chat-details");

    const userImg = document.createElement("img");
    userImg.src = "";
    userImg.alt = "user-img";

    const messagePara = document.createElement("p");
    messagePara.textContent = message;

    chatDetails.appendChild(userImg);
    chatDetails.appendChild(messagePara);
    chatContent.appendChild(chatDetails);
    chatDiv.appendChild(chatContent);

    const chatContainer = document.querySelector(".chat-container");
    chatContainer.appendChild(chatDiv);
  };

  const handleOutgoingChat = () => {
    const userText = chatInput.value.trim();
    if (userText) {
      createChatElement(userText, "outgoing");
      chatInput.value = "";
      showTypingAnimation();
    }
  };

  const showTypingAnimation = () => {
    const typingChatDiv = document.createElement("div");
    typingChatDiv.classList.add("chat", "incoming");

    const chatContent = document.createElement("div");
    chatContent.classList.add("chat-content");

    const chatDetails = document.createElement("div");
    chatDetails.classList.add("chat-details");

    const logoImg = document.createElement("img");
    logoImg.src = "";
    logoImg.alt = "logo-img";

    const typingAnimationDiv = document.createElement("div");
    typingAnimationDiv.classList.add("typing-animation");

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.classList.add("typing-dot");
      dot.style.setProperty("--delay", `${0.2 + i * 0.1}s`);
      typingAnimationDiv.appendChild(dot);
    }

    chatDetails.appendChild(logoImg);
    chatDetails.appendChild(typingAnimationDiv);
    chatContent.appendChild(chatDetails);
    typingChatDiv.appendChild(chatContent);

    const chatContainer = document.querySelector(".chat-container");
    chatContainer.appendChild(typingChatDiv);

    setTimeout(() => {
      chatContainer.removeChild(typingChatDiv);
    }, 2000);
  };

  sendButton.addEventListener("click", handleOutgoingChat);
})();
