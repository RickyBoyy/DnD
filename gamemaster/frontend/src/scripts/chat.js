export default function initializeChat(socket) {
  console.log("Chat script initialized");

  const chatInput = document.querySelector("#chat-input");
  const sendButton = document.querySelector("#send_btn");
  let typingChatDiv = null;

  socket.on("connect", () => {
    console.log("Successfully connected to the server:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Connection failed:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected from the server:", reason);
  });

  // Function to create chat elements
  const createChatElement = (message, className) => {
    console.log("Creating chat element:", message, className);

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
    if (className === "incoming") {
      const copyButton = document.createElement("button");
      copyButton.textContent = "content_copy";
      copyButton.classList.add("copy-btn");

      copyButton.addEventListener("click", () => copyResponse(copyButton));

      chatDetails.appendChild(copyButton);
    }
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

      const actionData = {
        action: userText,
        player: "Elven Mage",
      };

      socket.emit("playerAction", actionData, (response) => {
        hideTypingAnimation();

        if (response.success) {
          createChatElement(response.response, "incoming");
        } else {
          createChatElement("Error: " + response.response, "incoming");
        }
      });
    }
  };

  const copyResponse = (copyBtn) => {
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    if (responseTextElement) {
      const textToCopy = responseTextElement.textContent;
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.textContent = "done";
        setTimeout(() => {
          copyBtn.textContent = "content_copy";
        }, 1000);
      });
    }
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
}
