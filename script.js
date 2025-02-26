document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const imageInput = document.getElementById("imageInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadedImage = document.getElementById("uploadedImage");
  const imageContainer = document.getElementById("imageContainer");
  const selectionBox = document.getElementById("selectionBox");
  const dimensionsSection = document.getElementById("dimensionsSection");
  const realWidthInput = document.getElementById("realWidth");
  const realHeightInput = document.getElementById("realHeight");
  const scaleBtn = document.getElementById("scaleBtn");
  const resultSection = document.getElementById("resultSection");
  const scaledImage = document.getElementById("scaledImage");
  const printBtn = document.getElementById("printBtn");

  // Variables for selection
  let isSelecting = false;
  let startX, startY;
  let selectionWidth, selectionHeight;
  let imageRect;
  let pixelRatio = window.devicePixelRatio || 1;
  let hasSelection = false;

  // Prevent default image dragging behavior
  uploadedImage.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  // Upload image
  uploadBtn.addEventListener("click", () => {
    imageInput.click();
  });

  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();

      reader.onload = (event) => {
        uploadedImage.src = event.target.result;
        uploadedImage.onload = () => {
          imageContainer.style.display = "block";
          // Reset selection
          selectionBox.style.display = "none";
          dimensionsSection.style.display = "none";
          resultSection.style.display = "none";
          hasSelection = false;

          // Get image dimensions for selection
          imageRect = uploadedImage.getBoundingClientRect();
        };
      };

      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // Selection functionality
  uploadedImage.addEventListener("mousedown", (e) => {
    // Prevent default browser behavior
    e.preventDefault();

    // Only start a new selection if we don't have one already
    // or if the user is clicking outside the current selection
    if (!hasSelection) {
      isSelecting = true;

      // Get image position
      imageRect = uploadedImage.getBoundingClientRect();

      // Calculate start position relative to the image
      startX = e.clientX - imageRect.left;
      startY = e.clientY - imageRect.top;

      // Initialize selection box
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = "0";
      selectionBox.style.height = "0";
      selectionBox.style.display = "block";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;

    // Calculate current position relative to the image
    const currentX = Math.min(
      Math.max(0, e.clientX - imageRect.left),
      imageRect.width
    );
    const currentY = Math.min(
      Math.max(0, e.clientY - imageRect.top),
      imageRect.height
    );

    // Calculate width and height
    selectionWidth = Math.abs(currentX - startX);
    selectionHeight = Math.abs(currentY - startY);

    // Calculate top-left position
    const selectionLeft = Math.min(startX, currentX);
    const selectionTop = Math.min(startY, currentY);

    // Update selection box
    selectionBox.style.left = `${selectionLeft}px`;
    selectionBox.style.top = `${selectionTop}px`;
    selectionBox.style.width = `${selectionWidth}px`;
    selectionBox.style.height = `${selectionHeight}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isSelecting) {
      isSelecting = false;

      // Show dimensions section if selection is made
      if (selectionWidth > 10 && selectionHeight > 10) {
        hasSelection = true;
        dimensionsSection.style.display = "block";

        // Scroll to dimensions section
        dimensionsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  });

  // Add a way to clear the selection and make a new one
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && hasSelection) {
      // Clear the selection
      selectionBox.style.display = "none";
      hasSelection = false;
    }
  });

  // Allow clicking outside the selection to start a new one
  document.addEventListener("click", (e) => {
    if (hasSelection && e.target === uploadedImage) {
      const clickX = e.clientX - imageRect.left;
      const clickY = e.clientY - imageRect.top;

      // Check if click is outside the current selection
      const selLeft = parseInt(selectionBox.style.left);
      const selTop = parseInt(selectionBox.style.top);
      const selRight = selLeft + parseInt(selectionBox.style.width);
      const selBottom = selTop + parseInt(selectionBox.style.height);

      if (
        clickX < selLeft ||
        clickX > selRight ||
        clickY < selTop ||
        clickY > selBottom
      ) {
        // Clear the selection and allow a new one
        hasSelection = false;
      }
    }
  });

  // Scale image based on real-world dimensions
  scaleBtn.addEventListener("click", () => {
    const realWidth = parseFloat(realWidthInput.value);
    const realHeight = parseFloat(realHeightInput.value);

    if (
      isNaN(realWidth) ||
      isNaN(realHeight) ||
      realWidth <= 0 ||
      realHeight <= 0
    ) {
      alert("Please enter valid dimensions (greater than 0)");
      return;
    }

    // Get the selection coordinates relative to the original image
    const imageNaturalWidth = uploadedImage.naturalWidth;
    const imageNaturalHeight = uploadedImage.naturalHeight;

    const scaleX = imageNaturalWidth / imageRect.width;
    const scaleY = imageNaturalHeight / imageRect.height;

    const selectionLeft = parseInt(selectionBox.style.left);
    const selectionTop = parseInt(selectionBox.style.top);

    // Calculate selection in original image coordinates
    const originalSelectionLeft = selectionLeft * scaleX;
    const originalSelectionTop = selectionTop * scaleY;
    const originalSelectionWidth = selectionWidth * scaleX;
    const originalSelectionHeight = selectionHeight * scaleY;

    // Calculate the scale factor to achieve 1:1 real-world size
    // 1 mm = 3.779528 pixels at 96 DPI (standard screen resolution)
    const DPI = 96;
    const MM_TO_INCH = 25.4;
    const pixelsPerMM = DPI / MM_TO_INCH;

    // Calculate the scale factor based on the selected area
    const scaleFactorWidth = (realWidth * pixelsPerMM) / originalSelectionWidth;
    const scaleFactorHeight =
      (realHeight * pixelsPerMM) / originalSelectionHeight;

    // Use the average scale factor to maintain aspect ratio
    const scaleFactor = (scaleFactorWidth + scaleFactorHeight) / 2;

    // Create a canvas to scale the entire image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match the scaled entire image
    canvas.width = imageNaturalWidth * scaleFactor;
    canvas.height = imageNaturalHeight * scaleFactor;

    // Draw the entire image onto the canvas, scaled based on the selection's real-world size
    ctx.drawImage(
      uploadedImage,
      0,
      0,
      imageNaturalWidth,
      imageNaturalHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Display the scaled image
    scaledImage.src = canvas.toDataURL("image/png");
    resultSection.style.display = "block";

    // Scroll to result section
    resultSection.scrollIntoView({ behavior: "smooth" });
  });

  // Print functionality
  printBtn.addEventListener("click", () => {
    window.print();
  });
});
