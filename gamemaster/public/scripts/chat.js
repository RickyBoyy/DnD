(function () {
  console.log("Chat script loaded");

  const chatInput = document.querySelector("#chat-input");
  const sendButton = document.querySelector("#send_btn");
  let typingChatDiv = null;

  const createChatElement = (message, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);

    const chatContent = document.createElement("div");
    chatContent.classList.add("chat-content");

    const chatDetails = document.createElement("div");
    chatDetails.classList.add("chat-details");

    const userImg = document.createElement("img");
    if (className === "outgoing") {
      userImg.src = "user-image.png";
      userImg.alt = "user-img";
    } else if (className === "incoming") {
      userImg.src = "./logoonly.png";
      userImg.alt = "logo-img";
    }

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
      getChatResponse(userText);
    }
  };
  const copyResponse = (copyBtn) => {
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(responseTextElement, textContent);
    copyBtn.textContent = "done";
    setTimeout(() => (copyBtn.textContent = "content_copy"), 1000);
  };

  const showTypingAnimation = () => {
    if (typingChatDiv) return;

    typingChatDiv = document.createElement("div");
    typingChatDiv.classList.add("chat", "incoming");

    const chatContent = document.createElement("div");
    chatContent.classList.add("chat-content");

    const chatDetails = document.createElement("div");
    chatDetails.classList.add("chat-details");

    const logoImg = document.createElement("img");
    logoImg.src = "./logoonly.png";
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
  };

  const hideTypingAnimation = () => {
    if (typingChatDiv) {
      typingChatDiv.remove();
      typingChatDiv = null;
    }
  };

  sendButton.addEventListener("click", handleOutgoingChat);
})();
