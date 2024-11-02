(function () {
  console.log("Chat script loaded");

  const chatInput = document.querySelector("#chat-input");
  const sendButton = document.querySelector("#send_btn");
  let typingChatDiv = null;
  const API_KEY =
    "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";

  if (!chatInput || !sendButton) {
    console.error("Chat input or send button not found.");
    return;
  }

  const getChatResponse = async (userText) => {
    const API_URL = "https://api.openai.com/v1/completions";

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userText }],
        max_tokens: 100,
        temperature: 0.2,
      }),
    };

    try {
      const response = await fetch(API_URL, requestOptions);
      const data = await response.json();

      console.log("API Response:", data);

      if (response.ok && data.choices && data.choices.length > 0) {
        const reply = data.choices[0].text.trim();
        createChatElement(reply, "incoming");
      } else {
        console.error("Error in response data:", data);
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
    } finally {
      hideTypingAnimation();
    }
  };

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
      getChatResponse(userText);
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
  };

  const hideTypingAnimation = () => {
    if (typingChatDiv) {
      typingChatDiv.remove();
      typingChatDiv = null;
    }
  };

  sendButton.addEventListener("click", handleOutgoingChat);
})();
