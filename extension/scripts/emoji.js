const quickReactions = [
  ["❤️", "Heart"], ["👍", "Thumbs up"], ["😂", "Laugh"], ["👏", "Clap"],
  ["🎉", "Celebrate"], ["😮", "Surprised"], ["😢", "Sad"], ["🔥", "Fire"],
];

const emojiGroups = {
  "Smileys": [
    ["😀", "Grinning"], ["😊", "Smile"], ["😂", "Laugh tears"], ["🤣", "Rolling laugh"],
    ["🥹", "Holding back tears"], ["😍", "Heart eyes"], ["🥰", "Loved"], ["😘", "Kiss"],
    ["😉", "Wink"], ["😎", "Cool sunglasses"], ["🤔", "Thinking"], ["🤭", "Giggle"],
    ["🫢", "Hand over mouth"], ["😮", "Surprised"], ["😳", "Flushed"], ["😭", "Crying"],
    ["😢", "Sad"], ["🙄", "Eye roll"], ["😴", "Sleepy"], ["🥳", "Party"],
    ["🤯", "Mind blown"], ["😱", "Scream"], ["😅", "Nervous laugh"], ["😬", "Grimace"],
  ],
  "Gestures": [
    ["👍", "Thumbs up"], ["👎", "Thumbs down"], ["👏", "Clap"], ["🙌", "Hands up"],
    ["👋", "Wave hello"], ["🙏", "Thanks please"], ["👌", "Okay"], ["🫶", "Heart hands"],
    ["🤝", "Handshake"], ["✌️", "Peace"], ["💪", "Strong"], ["🤞", "Fingers crossed"],
  ],
  "Hearts and symbols": [
    ["❤️", "Red heart love"], ["💜", "Purple heart"], ["🩷", "Pink heart"], ["💙", "Blue heart"],
    ["💔", "Broken heart"], ["🔥", "Fire"], ["✨", "Sparkles"], ["⭐", "Star"],
    ["💯", "Hundred"], ["👀", "Eyes"], ["💀", "Skull"], ["✅", "Check"],
  ],
  "Movie night": [
    ["🍿", "Popcorn"], ["🎬", "Movie clapper"], ["🎥", "Camera"], ["🎉", "Celebrate"],
    ["🍕", "Pizza"], ["☕", "Coffee"], ["🍫", "Chocolate"], ["🫖", "Tea"],
  ],
};

function makeEmojiButton(emoji, label, choose) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "huddle-emoji-option";
  button.textContent = emoji;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", () => choose(emoji));
  return button;
}

function setupRoomEmoji(chatInput) {
  const reactionBar = document.getElementById("huddle-reactions");
  const pickerButton = document.getElementById("huddle-emoji-button");
  const picker = document.getElementById("huddle-emoji-picker");
  const search = document.getElementById("huddle-emoji-search");
  const results = document.getElementById("huddle-emoji-results");

  for (const [emoji, label] of quickReactions) {
    reactionBar.append(makeEmojiButton(emoji, label, () => {
      if (!socket.connected) {
        showToast("Reconnect to the room to send a reaction.", "warning");
        return;
      }
      socket.timeout(3500).emit("roomReaction", { roomCode: currentRoomCode, emoji }, (error, sent) => {
        if (error || !sent) showToast("Could not send the reaction.", "warning");
      });
    }));
  }

  function insertEmoji(emoji) {
    const start = chatInput.selectionStart;
    const end = chatInput.selectionEnd;
    if (chatInput.value.length - (end - start) + emoji.length <= chatInput.maxLength) {
      chatInput.setRangeText(emoji, start, end, "end");
    } else {
      showToast("Chat messages can be up to 300 characters.", "warning");
    }
    picker.close();
    chatInput.focus();
  }

  function renderEmojis() {
    const query = search.value.trim().toLowerCase();
    results.replaceChildren();
    for (const [group, emojis] of Object.entries(emojiGroups)) {
      const matches = emojis.filter(([emoji, label]) => emoji.includes(query) || label.toLowerCase().includes(query));
      if (matches.length === 0) continue;
      const title = document.createElement("h3");
      title.textContent = group;
      const grid = document.createElement("div");
      grid.className = "huddle-emoji-grid";
      grid.append(...matches.map(([emoji, label]) => makeEmojiButton(emoji, label, insertEmoji)));
      results.append(title, grid);
    }
    if (!results.childElementCount) results.textContent = "No matching emojis.";
  }

  pickerButton.addEventListener("click", () => {
    search.value = "";
    renderEmojis();
    picker.showModal();
    search.focus();
  });
  picker.addEventListener("keydown", (event) => event.stopPropagation());
  search.addEventListener("input", renderEmojis);
}

function showRoomReaction(name, emoji) {
  let stack = document.getElementById("huddle-reaction-overlay");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "huddle-reaction-overlay";
    stack.setAttribute("aria-live", "polite");
    document.documentElement.append(stack);
  }

  const reaction = document.createElement("div");
  reaction.className = "huddle-reaction-burst";
  const icon = document.createElement("span");
  icon.textContent = emoji;
  const sender = document.createElement("small");
  sender.textContent = name;
  reaction.append(icon, sender);
  stack.append(reaction);
  if (stack.childElementCount > 8) stack.firstElementChild.remove();
  setTimeout(() => reaction.remove(), 2400);
}
