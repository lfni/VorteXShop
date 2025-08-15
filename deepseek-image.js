let images = [];
let currentImageId = null;

const DAILY_IMAGE_LIMIT = 40;

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

function getImageCountToday() {
  const data = JSON.parse(localStorage.getItem("daily_image_count")) || {};
  return data[getTodayDateStr()] || 0;
}

function incrementImageCount() {
  const data = JSON.parse(localStorage.getItem("daily_image_count")) || {};
  const today = getTodayDateStr();
  data[today] = (data[today] || 0) + 1;
  localStorage.setItem("daily_image_count", JSON.stringify(data));
}

function saveToLocalStorage() {
  localStorage.setItem("ai_images", JSON.stringify(images));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem("ai_images");
  if (saved) {
    images = JSON.parse(saved);
    if (images.length > 0 && !currentImageId) {
      currentImageId = images[0].id;
      selectImage(currentImageId);
    }
  } else {
    createNewImage();
  }
}

function generateImageId() {
  return "image_" + Math.random().toString(36).substr(2, 9);
}

function createNewImage(title = "تصویر جدید") {
  const imageId = generateImageId();
  const newImage = {
    id: imageId,
    title: title,
    prompt: "",
    imageUrl: ""
  };

  images.push(newImage);
  currentImageId = imageId;

  saveToLocalStorage();
  renderImages();
  selectImage(imageId);
}

function renderImages() {
  const imageList = document.getElementById("images-list");
  if (!imageList) return;

  imageList.innerHTML = "";

  images.forEach(img => {
    const item = document.createElement("a");
    item.href = "#";
    item.className = "image-item";
    item.textContent = img.title;
    item.onclick = () => selectImage(img.id);
    if (img.id === currentImageId) item.classList.add("active");
    imageList.appendChild(item);
  });
}

function selectImage(imageId) {
  currentImageId = imageId;

  const chatBox = document.getElementById("image-chat-box");
  if (!chatBox) return;

  const currentImage = images.find(i => i.id === imageId);
  chatBox.innerHTML = "";

  if (currentImage?.imageUrl) {
    const promptDiv = document.createElement("div");
    promptDiv.className = "image-message prompt";
    promptDiv.textContent = currentImage.prompt;

    const imageDiv = document.createElement("div");
    imageDiv.className = "image-message image-output";

    const img = document.createElement("img");
    img.src = currentImage.imageUrl;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "10px";

    const downloadLink = document.createElement("a");
    downloadLink.href = currentImage.imageUrl;
    downloadLink.download = "ai-image.png";
    downloadLink.textContent = "📥 دانلود";
    downloadLink.className = "download-btn";
    downloadLink.target = "_blank";

    imageDiv.appendChild(img);
    imageDiv.appendChild(downloadLink);
    chatBox.appendChild(promptDiv);
    chatBox.appendChild(imageDiv);
  } else if (currentImage?.prompt) {
    const promptDiv = document.createElement("div");
    promptDiv.className = "image-message prompt";
    promptDiv.textContent = currentImage.prompt;
    chatBox.appendChild(promptDiv);
  }

  chatBox.scrollTop = chatBox.scrollHeight;
  renderImages();
}

// ==================== قابلیت آپلود و پیش‌نمایش عکس ====================
let uploadedImageFile = null;

document.getElementById("imageUpload")?.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("فقط می‌توانید عکس آپلود کنید.");
    e.target.value = "";
    return;
  }

  uploadedImageFile = file;

  // نمایش پیش‌نمایش در چت
  const chatBox = document.getElementById("image-chat-box");
  const previewDiv = document.createElement("div");
  previewDiv.className = "image-message image-output";

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.maxWidth = "150px";
  img.style.borderRadius = "10px";

  previewDiv.appendChild(img);
  chatBox.appendChild(previewDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ==================== منوی بازشو برای دکمه + ====================
document.getElementById("uploadMenuBtn")?.addEventListener("click", function () {
  const menu = document.getElementById("uploadMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
});

document.getElementById("uploadImageOption")?.addEventListener("click", function () {
  document.getElementById("imageUpload").click();
  document.getElementById("uploadMenu").style.display = "none";
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".upload-menu-container")) {
    const menu = document.getElementById("uploadMenu");
    if (menu) menu.style.display = "none";
  }
});
// ======================================================================

document.getElementById('image-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const input = document.getElementById("promptInput");
  const chatBox = document.getElementById("image-chat-box");
  const prompt = input.value.trim();

  if (!prompt && !uploadedImageFile) return;

  // محدودیت روزانه
  const count = getImageCountToday();
  if (count >= DAILY_IMAGE_LIMIT) {
    const warning = document.createElement("div");
    warning.className = "image-message image-output";
    warning.style.color = "red";
    warning.textContent = "🚫 محدودیت روزانه نسخه استاندارد: فقط ۲ تصویر در روز مجاز است.";
    chatBox.appendChild(warning);
    chatBox.scrollTop = chatBox.scrollHeight;
    return;
  }

  if (!currentImageId) createNewImage(prompt.substring(0, 20));
  const currentImage = images.find(i => i.id === currentImageId);

  if (prompt) {
    currentImage.prompt = prompt;
    const promptDiv = document.createElement("div");
    promptDiv.className = "image-message prompt";
    promptDiv.textContent = prompt;
    chatBox.appendChild(promptDiv);
  }

  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    if (uploadedImageFile) {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("image", uploadedImageFile);

      const response = await fetch("https://api.example.com/process-image", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در پردازش تصویر");

      if (data.imageUrl) {
        currentImage.imageUrl = data.imageUrl;
        const imageDiv = document.createElement("div");
        imageDiv.className = "image-message image-output";

        const img = document.createElement("img");
        img.src = data.imageUrl;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "10px";

        imageDiv.appendChild(img);
        chatBox.appendChild(imageDiv);
      }

      uploadedImageFile = null;
    } else {
      const response = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": "Bearer tgp_v1_G1pfjhNvjm33bZyBkjG7dikaba658FK5MXH8cF2vu7M",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          model: "black-forest-labs/FLUX.1-dev",
          n: 1,
          size: "355x355"
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "خطا در تولید تصویر");

      let imageUrl = data.data?.[0]?.url || data.choices?.[0]?.image_url || data.output?.url || data.image_url || data.images?.[0];
      if (!imageUrl) throw new Error("❌ API تصویری تولید نکرد.");

      currentImage.imageUrl = imageUrl;

      const imageDiv = document.createElement("div");
      imageDiv.className = "image-message image-output";

      const img = document.createElement("img");
      img.src = imageUrl;

      const downloadLink = document.createElement("a");
      downloadLink.href = imageUrl;
      downloadLink.download = "ai-image.png";
      downloadLink.textContent = "📥 دانلود";
      downloadLink.className = "download-btn";
      downloadLink.target = "_blank";

      imageDiv.appendChild(img);
      imageDiv.appendChild(downloadLink);
      chatBox.appendChild(imageDiv);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
    incrementImageCount();
    saveToLocalStorage();
    renderImages();
  } catch (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "image-message image-output";
    errorDiv.textContent = "⚠️ خطا: " + error.message;
    chatBox.appendChild(errorDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

window.onload = () => {
  loadFromLocalStorage();
  renderImages();
};
