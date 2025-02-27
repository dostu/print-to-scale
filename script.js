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
  const saveBtn = document.getElementById("saveBtn");
  const selectionInstructions = document.getElementById(
    "selectionInstructions"
  );

  // Add visual feedback for progress
  addStepIndicator();

  // Completely remove the upload button and file input elements
  if (uploadBtn && uploadBtn.parentElement) {
    uploadBtn.parentElement.removeChild(uploadBtn);
  }

  // Don't remove the file input element - instead, create one if it doesn't exist
  let fileInput = document.getElementById("imageInput");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "imageInput";
    fileInput.accept = "image/*";
    fileInput.style.display = "none"; // Hide it visually
    document.body.appendChild(fileInput);
  }

  // Make the image container visible by default with the upload message
  if (imageContainer) {
    imageContainer.style.display = "flex";

    // Make sure we add the upload message immediately
    addUploadMessage();
  }

  // Function to setup the dropzone functionality
  function setupDropzone() {
    const dropzone = imageContainer; // Use imageContainer directly as the dropzone
    const fileInput = document.getElementById("imageInput");

    // Add click functionality to the container to open file input
    if (imageContainer) {
      imageContainer.addEventListener("click", (e) => {
        // Don't trigger if we're clicking a button or the image when it's already loaded
        if (
          e.target.tagName === "BUTTON" ||
          (uploadedImage.src && e.target === uploadedImage)
        ) {
          return;
        }

        // Make sure we have a file input element to click
        if (fileInput) {
          fileInput.click();
        } else {
          console.error("File input element not found");
        }
      });
    }

    // Create replace image button
    function addReplaceButton() {
      // Remove any existing replace buttons first
      const existingButton = document.querySelector(".replace-image-btn");
      if (existingButton) {
        existingButton.remove();
      }

      const replaceBtn = document.createElement("button");
      replaceBtn.className = "replace-image-btn";
      replaceBtn.innerHTML = `
        <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 10h7V3l-2.35 3.35z"/>
        </svg>
        Replace Image
      `;
      replaceBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event from bubbling to imageContainer
        if (fileInput) {
          fileInput.click();
        }
      });

      imageContainer.appendChild(replaceBtn);
    }

    // Handle file input change event
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          originalImageType = file.type || "image/png";

          const reader = new FileReader();
          reader.onload = (event) => {
            uploadedImage.src = event.target.result;
            uploadedImage.onload = () => {
              // Show the image container
              imageContainer.style.display = "flex";

              // Remove the upload message
              removeUploadMessage();

              // Show the selection instructions
              selectionInstructions.classList.remove("hidden");

              // Reset selection state
              selectionBox.style.display = "none";
              dimensionsSection.style.display = "none";
              resultSection.style.display = "none";

              // Get image dimensions for selection
              imageRect = uploadedImage.getBoundingClientRect();

              // Update step indicator
              updateSteps(2);

              // Add the replace button
              addReplaceButton();
            };
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Setup drag and drop functionality
    if (dropzone) {
      // Prevent default behavior for drag events
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropzone.addEventListener(
          eventName,
          (e) => {
            e.preventDefault();
            e.stopPropagation();
          },
          false
        );
      });

      // Add visual feedback for drag events
      ["dragenter", "dragover"].forEach((eventName) => {
        dropzone.addEventListener(
          eventName,
          () => {
            dropzone.classList.add("drag-over");
          },
          false
        );
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropzone.addEventListener(
          eventName,
          () => {
            dropzone.classList.remove("drag-over");
          },
          false
        );
      });

      // Handle file drop
      dropzone.addEventListener("drop", (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          originalImageType = file.type || "image/png";

          const reader = new FileReader();
          reader.onload = (event) => {
            uploadedImage.src = event.target.result;
            uploadedImage.onload = () => {
              // Show the image container
              imageContainer.style.display = "flex";

              // Remove the upload message
              removeUploadMessage();

              // Show the selection instructions
              selectionInstructions.classList.remove("hidden");

              // Reset selection state
              selectionBox.style.display = "none";
              dimensionsSection.style.display = "none";
              resultSection.style.display = "none";

              // Get image dimensions for selection
              imageRect = uploadedImage.getBoundingClientRect();

              // Update step indicator
              updateSteps(2);

              // Add the replace button
              addReplaceButton();
            };
          };
          reader.readAsDataURL(file);
        } else {
          alert("Please drop an image file (JPEG, PNG, GIF, etc.)");
        }
      });
    }
  }

  // Create crosshair guide elements
  const horizontalGuide = document.createElement("div");
  horizontalGuide.className = "selection-guide horizontal-guide";
  horizontalGuide.style.display = "none";

  const verticalGuide = document.createElement("div");
  verticalGuide.className = "selection-guide vertical-guide";
  verticalGuide.style.display = "none";

  // Add guides to container when available
  if (imageContainer) {
    imageContainer.appendChild(horizontalGuide);
    imageContainer.appendChild(verticalGuide);
  }

  // Variables for selection
  let isSelecting = false;
  let startX, startY;
  let selectionWidth, selectionHeight;
  let imageRect;
  let pixelRatio = window.devicePixelRatio || 1;
  let hasSelection = false;
  let originalImageType = "image/png"; // Default image type

  // Standard DPI for screens (96 DPI is standard for most displays)
  const STANDARD_DPI = 96;
  // Higher DPI options for better quality printing
  const HIGH_DPI = 300; // 300 DPI is standard for quality printing
  const ULTRA_DPI = 600; // 600 DPI for even higher quality
  const PRINT_DPI = 1200; // Very high resolution for printing with "Fit to page"
  const MM_TO_INCH = 25.4;

  // Standard A4 paper has a 210mm x 297mm printable area
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // Calculate pixels per mm at different resolutions
  const PIXELS_PER_MM = STANDARD_DPI / MM_TO_INCH;
  const HIGH_PIXELS_PER_MM = HIGH_DPI / MM_TO_INCH;
  const ULTRA_PIXELS_PER_MM = ULTRA_DPI / MM_TO_INCH;
  const PRINT_PIXELS_PER_MM = PRINT_DPI / MM_TO_INCH;

  // Prevent default image dragging behavior
  uploadedImage.addEventListener("dragstart", (e) => {
    e.preventDefault();
  });

  // Keep the imageInput change event in case it's needed for other functionality
  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        originalImageType = file.type || "image/png"; // Store the original image type

        const reader = new FileReader();

        reader.onload = (event) => {
          uploadedImage.src = event.target.result;
          uploadedImage.onload = () => {
            imageContainer.style.display = "block";

            // Hide the upload message when an image is loaded
            const uploadMessage = document.querySelector(".upload-message");
            if (uploadMessage) {
              uploadMessage.style.display = "none";
            }

            // Reset selection
            selectionBox.style.display = "none";
            dimensionsSection.style.display = "none";
            resultSection.style.display = "none";
            hasSelection = false;

            // Show the selection instructions
            selectionInstructions.classList.remove("hidden");

            // Get image dimensions for selection
            imageRect = uploadedImage.getBoundingClientRect();
          };
        };

        reader.readAsDataURL(file);
      }
    });
  }

  // Show and position guidelines on mouse move over the image (before selection starts)
  uploadedImage.addEventListener("mousemove", (e) => {
    if (hasSelection || isSelecting) return;

    // Get fresh image position measurements
    const imageRect = uploadedImage.getBoundingClientRect();

    // Calculate cursor position relative to the page
    const cursorPageX = e.clientX;
    const cursorPageY = e.clientY;

    // Position horizontal guide directly at cursor Y position
    horizontalGuide.style.display = "block";
    horizontalGuide.style.top = `${cursorPageY}px`;
    horizontalGuide.style.left = "0";

    // Position vertical guide directly at cursor X position
    verticalGuide.style.display = "block";
    verticalGuide.style.left = `${cursorPageX}px`;
    verticalGuide.style.top = "0";

    // Adjust guide positions to be relative to the document (fixed position)
    horizontalGuide.style.position = "fixed";
    verticalGuide.style.position = "fixed";
  });

  // Hide guidelines when mouse leaves the image
  uploadedImage.addEventListener("mouseleave", () => {
    if (!isSelecting) {
      horizontalGuide.style.display = "none";
      verticalGuide.style.display = "none";
    }
  });

  // Hide guidelines when selection starts
  uploadedImage.addEventListener("mousedown", (e) => {
    horizontalGuide.style.display = "none";
    verticalGuide.style.display = "none";

    // Prevent default browser behavior
    e.preventDefault();

    // Only start a new selection if we don't have one already
    // or if the user is clicking outside the current selection
    if (!hasSelection) {
      isSelecting = true;

      // Get the image wrapper element
      const imageWrapper = uploadedImage.parentElement;

      // Get exact positions
      imageRect = uploadedImage.getBoundingClientRect();
      const wrapperRect = imageWrapper.getBoundingClientRect();

      // Calculate offset of image within wrapper
      const imageOffsetLeft = imageRect.left - wrapperRect.left;
      const imageOffsetTop = imageRect.top - wrapperRect.top;

      // Calculate cursor position relative to the image
      startX = e.clientX - imageRect.left;
      startY = e.clientY - imageRect.top;

      // Initialize selection box at cursor position
      // Setting position relative to the wrapper since the selection box is a child of the wrapper
      selectionBox.style.left = `${startX + imageOffsetLeft}px`;
      selectionBox.style.top = `${startY + imageOffsetTop}px`;
      selectionBox.style.width = "0";
      selectionBox.style.height = "0";
      selectionBox.style.display = "block";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;

    // Get fresh measurements
    const imageWrapper = uploadedImage.parentElement;
    const currentImageRect = uploadedImage.getBoundingClientRect();
    const currentWrapperRect = imageWrapper.getBoundingClientRect();

    // Calculate offset of image within wrapper
    const imageOffsetLeft = currentImageRect.left - currentWrapperRect.left;
    const imageOffsetTop = currentImageRect.top - currentWrapperRect.top;

    // Calculate current position relative to the image
    const currentX = Math.min(
      Math.max(0, e.clientX - currentImageRect.left),
      currentImageRect.width
    );
    const currentY = Math.min(
      Math.max(0, e.clientY - currentImageRect.top),
      currentImageRect.height
    );

    // Calculate width and height
    selectionWidth = Math.abs(currentX - startX);
    selectionHeight = Math.abs(currentY - startY);

    // Calculate top-left position
    const selectionLeft = Math.min(startX, currentX);
    const selectionTop = Math.min(startY, currentY);

    // Update selection box with position relative to the wrapper
    selectionBox.style.left = `${selectionLeft + imageOffsetLeft}px`;
    selectionBox.style.top = `${selectionTop + imageOffsetTop}px`;
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

        // Clear any previous input values
        realWidthInput.value = "";
        realHeightInput.value = "";

        // Enable both input fields (no longer using dimension mode)
        realWidthInput.disabled = false;
        realHeightInput.disabled = false;

        // Update step indicator to mark "Select Area" as complete
        updateSteps(3);

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
      // Get fresh measurements
      const imageWrapper = uploadedImage.parentElement;
      const currentImageRect = uploadedImage.getBoundingClientRect();
      const currentWrapperRect = imageWrapper.getBoundingClientRect();

      // Calculate offset of image within wrapper
      const imageOffsetLeft = currentImageRect.left - currentWrapperRect.left;
      const imageOffsetTop = currentImageRect.top - currentWrapperRect.top;

      // Calculate click position relative to image
      const clickX = e.clientX - currentImageRect.left;
      const clickY = e.clientY - currentImageRect.top;

      // Get selection box position relative to the image (not the wrapper)
      const selStyle = window.getComputedStyle(selectionBox);
      const selLeftStr = selStyle.left;
      const selTopStr = selStyle.top;
      const selWidthStr = selStyle.width;
      const selHeightStr = selStyle.height;

      // Extract numeric values
      const selLeft = parseFloat(selLeftStr) - imageOffsetLeft;
      const selTop = parseFloat(selTopStr) - imageOffsetTop;
      const selRight = selLeft + parseFloat(selWidthStr);
      const selBottom = selTop + parseFloat(selHeightStr);

      // Check if click is outside the current selection
      if (
        clickX < selLeft ||
        clickX > selRight ||
        clickY < selTop ||
        clickY > selBottom
      ) {
        // Clear the selection and allow a new one
        selectionBox.style.display = "none";
        hasSelection = false;
      }
    }
  });

  // Update the input event handlers to always calculate the other dimension
  realWidthInput.addEventListener("input", () => {
    if (realWidthInput.value && selectionWidth && selectionHeight) {
      const aspectRatio = selectionHeight / selectionWidth;
      // Only update height if width changed by user (not by this code)
      realHeightInput.value = (
        parseFloat(realWidthInput.value) * aspectRatio
      ).toFixed(1);
    }
  });

  realHeightInput.addEventListener("input", () => {
    if (realHeightInput.value && selectionWidth && selectionHeight) {
      const aspectRatio = selectionWidth / selectionHeight;
      // Only update width if height changed by user (not by this code)
      realWidthInput.value = (
        parseFloat(realHeightInput.value) * aspectRatio
      ).toFixed(1);
    }
  });

  // Prepare image for 1:1 printing
  scaleBtn.addEventListener("click", () => {
    const realWidth = parseFloat(realWidthInput.value);
    const realHeight = parseFloat(realHeightInput.value);

    if (
      isNaN(realWidth) ||
      isNaN(realHeight) ||
      realWidth <= 0 ||
      realHeight <= 0
    ) {
      alert("Please enter a valid dimension (greater than 0)");
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

    // Use ULTRA_DPI for very high resolution output
    const pixelsPerMM = PRINT_PIXELS_PER_MM; // Use very high DPI for printing with "Fit to page"

    // A4 paper dimensions in mm
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;

    // Create a high-resolution canvas that matches A4 dimensions exactly
    // This approach relies on "Fit to page" printing to scale correctly
    const canvasWidthInPixels = A4_WIDTH_MM * pixelsPerMM;
    const canvasHeightInPixels = A4_HEIGHT_MM * pixelsPerMM;

    // Calculate calibration square size (10mm) in proportion to A4 width
    // 10mm is 1/21 of A4 width (210mm)
    const calibrationSquareSizeInPixels = 10 * pixelsPerMM;
    console.log(
      `Calibration square size: ${calibrationSquareSizeInPixels} pixels (10mm at ${PRINT_DPI} DPI)`
    );

    // Calculate the scaling factor to make the selection match the real-world dimensions
    const scalingFactorByWidth =
      ((realWidth / A4_WIDTH_MM) * canvasWidthInPixels) /
      originalSelectionWidth;
    const scalingFactorByHeight =
      ((realHeight / A4_HEIGHT_MM) * canvasHeightInPixels) /
      originalSelectionHeight;

    // Use the minimum scaling factor to ensure both dimensions fit
    const imageScaleFactor = Math.min(
      scalingFactorByWidth,
      scalingFactorByHeight
    );
    console.log(`Image scale factor: ${imageScaleFactor}`);

    // Calculate the final dimensions of the image
    const scaledWidth = imageNaturalWidth * imageScaleFactor;
    const scaledHeight = imageNaturalHeight * imageScaleFactor;

    // Calculate padding as a percentage of A4 dimensions
    const paddingXInPixels = canvasWidthInPixels * 0.05; // 5% of width
    const paddingYInPixels = canvasHeightInPixels * 0.05; // 5% of height

    // Text and calibration area
    // Calculate font size so all three lines fit in 10mm (same as calibration square)
    const fontSize = Math.max(6, pixelsPerMM * 2.5); // Font size for 3 lines to fit in 10mm
    const lineSpacing = fontSize * 1.2; // Spacing between lines
    const calibrationAreaHeight = calibrationSquareSizeInPixels;

    // Position the image centered horizontally and vertically
    const imageX = (canvasWidthInPixels - scaledWidth) / 2;

    // Calculate vertical centering on the entire page, disregarding the calibration area
    // Center the image on the entire canvas height
    const imageY = (canvasHeightInPixels - scaledHeight) / 2;

    // Create canvas with A4 proportions
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    // Set canvas to A4 dimensions at high DPI
    canvas.width = canvasWidthInPixels;
    canvas.height = canvasHeightInPixels;

    // Set image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill background white
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw calibration square (10mm × 10mm) at top left with padding
    const squareX = paddingXInPixels;
    const squareY = paddingYInPixels;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(2, pixelsPerMM / 4); // Readable but not too thick
    ctx.strokeRect(
      squareX,
      squareY,
      calibrationSquareSizeInPixels,
      calibrationSquareSizeInPixels
    );

    // Set font size proportional to the page
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = "#000000";

    // Add calibration information
    // Position text with proper spacing to fit within the 10mm height
    ctx.fillText(
      "10mm × 10mm calibration square",
      squareX + calibrationSquareSizeInPixels + paddingXInPixels / 2,
      squareY + fontSize
    );

    ctx.fillText(
      `Selected area: ${realWidth}mm × ${realHeight}mm when printed at 100% scale`,
      squareX + calibrationSquareSizeInPixels + paddingXInPixels / 2,
      squareY + fontSize + lineSpacing
    );

    ctx.fillText(
      "IMPORTANT: Use 'Fit to page' when printing",
      squareX + calibrationSquareSizeInPixels + paddingXInPixels / 2,
      squareY + fontSize + lineSpacing * 2
    );

    // Draw the image - use multi-step approach for better quality
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d", { alpha: false });

    // For very large scaling factors, use a three-step approach
    if (imageScaleFactor > 8) {
      // First intermediate scale
      const intermediateScale1 = Math.pow(imageScaleFactor, 1 / 3);
      const intermediateWidth1 = imageNaturalWidth * intermediateScale1;
      const intermediateHeight1 = imageNaturalHeight * intermediateScale1;

      tempCanvas.width = intermediateWidth1;
      tempCanvas.height = intermediateHeight1;
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = "high";

      // Fill with white background first
      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillRect(0, 0, intermediateWidth1, intermediateHeight1);

      // First scale
      tempCtx.drawImage(
        uploadedImage,
        0,
        0,
        imageNaturalWidth,
        imageNaturalHeight,
        0,
        0,
        intermediateWidth1,
        intermediateHeight1
      );

      // Second intermediate scale
      const intermediateScale2 = Math.pow(imageScaleFactor, 2 / 3);
      const intermediateWidth2 = imageNaturalWidth * intermediateScale2;
      const intermediateHeight2 = imageNaturalHeight * intermediateScale2;

      // Create second temp canvas
      const tempCanvas2 = document.createElement("canvas");
      const tempCtx2 = tempCanvas2.getContext("2d", { alpha: false });
      tempCanvas2.width = intermediateWidth2;
      tempCanvas2.height = intermediateHeight2;
      tempCtx2.imageSmoothingEnabled = true;
      tempCtx2.imageSmoothingQuality = "high";

      // Fill with white background first
      tempCtx2.fillStyle = "#FFFFFF";
      tempCtx2.fillRect(0, 0, intermediateWidth2, intermediateHeight2);

      // Second scale
      tempCtx2.drawImage(
        tempCanvas,
        0,
        0,
        intermediateWidth1,
        intermediateHeight1,
        0,
        0,
        intermediateWidth2,
        intermediateHeight2
      );

      // Draw the final image centered in the available space
      ctx.drawImage(
        tempCanvas2,
        0,
        0,
        intermediateWidth2,
        intermediateHeight2,
        imageX,
        imageY,
        scaledWidth,
        scaledHeight
      );
    }
    // For large scaling factors, use a two-step approach
    else if (imageScaleFactor > 2) {
      // Use an intermediate size
      const intermediateScale = Math.sqrt(imageScaleFactor);
      const intermediateWidth = imageNaturalWidth * intermediateScale;
      const intermediateHeight = imageNaturalHeight * intermediateScale;

      tempCanvas.width = intermediateWidth;
      tempCanvas.height = intermediateHeight;
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = "high";

      // Fill with white background first
      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillRect(0, 0, intermediateWidth, intermediateHeight);

      // First scale to intermediate size
      tempCtx.drawImage(
        uploadedImage,
        0,
        0,
        imageNaturalWidth,
        imageNaturalHeight,
        0,
        0,
        intermediateWidth,
        intermediateHeight
      );

      // Draw the final image centered in the available space
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        intermediateWidth,
        intermediateHeight,
        imageX,
        imageY,
        scaledWidth,
        scaledHeight
      );
    } else {
      // For smaller scaling factors, draw directly
      // Create a white background behind the image
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(imageX, imageY, scaledWidth, scaledHeight);

      ctx.drawImage(
        uploadedImage,
        0,
        0,
        imageNaturalWidth,
        imageNaturalHeight,
        imageX,
        imageY,
        scaledWidth,
        scaledHeight
      );
    }

    // Use the original image type if possible, fallback to PNG
    let imageType = originalImageType;
    if (imageType !== "image/png" && imageType !== "image/jpeg") {
      imageType = "image/png";
    }

    // Convert to data URL with maximum quality
    const quality = imageType === "image/jpeg" ? 1.0 : undefined;
    scaledImage.src = canvas.toDataURL(imageType, quality);

    resultSection.style.display = "block";

    // Scroll to result section
    resultSection.scrollIntoView({ behavior: "smooth" });
  });

  // Print functionality
  printBtn.addEventListener("click", function printHandler() {
    if (!scaledImage || !scaledImage.src) {
      console.error("No image to print");
      alert("Please scale an image first before printing.");
      return;
    }

    try {
      // Store the current image source
      const imageSource = scaledImage.src;

      // Use the actual image source directly - hideImage checkbox removed
      let finalImageSource = imageSource;

      // Create a new window for printing
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        alert("Please allow pop-ups to print the image.");
        return;
      }

      // A simpler, more reliable approach to creating the print window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Image</title>
          <style>
            /* Basic reset */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            /* Page setup */
            html, body {
              width: 100%;
              height: 100%;
              background: white;
            }

            /* Image container */
            .image-container {
              width: 100%;
              height: 100%;
              padding: 0;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: flex-start;
            }

            /* Print instructions */
            .print-instructions {
              width: 100%;
              padding: 20px;
              margin-bottom: 30px;
              background: #f0f0f0;
              border: 1px solid #ddd;
              font-family: Arial, sans-serif;
              text-align: center;
            }

            .print-instructions h3 {
              margin-bottom: 10px;
              color: #d00;
            }

            .print-instructions p {
              margin: 8px 0;
            }

            /* Hide instructions when printing */
            @media print {
              .print-instructions {
                display: none;
              }
            }

            /* Image styling */
            img {
              max-width: 100%;
              max-height: 100%;
              display: block;
            }

            /* Print specific styles */
            @media print {
              @page {
                size: auto;
                margin: 0mm;
              }

              body {
                width: 100%;
                height: 100%;
              }

              .image-container {
                width: 100%;
                height: 100%;
              }

              img {
                width: auto;
                height: auto;
                max-width: 100%;
                max-height: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="image-container">
            <div class="print-instructions">
              <h3>IMPORTANT PRINTING INSTRUCTIONS</h3>
              <p>When the print dialog opens, make sure to select <strong>"Fit to page"</strong> or equivalent option.</p>
              <p>The image has been created specifically for A4 paper size with correct proportions.</p>
              <p>The 10mm calibration square should print exactly 10mm wide when printed correctly.</p>
            </div>
            <img src="${finalImageSource}" alt="Print image" />
          </div>

          <script>
            // Make sure the image is fully loaded before printing
            document.querySelector('img').onload = function() {
              // Wait a moment to ensure everything is rendered
              setTimeout(function() {
                window.print();
                // Close window after printing (or if print is canceled)
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };

            // Fallback in case the image doesn't trigger the onload event
            setTimeout(function() {
              if (!document.querySelector('img').complete) {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }
            }, 2000);
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error("Error printing image:", error);
      alert("There was an error printing the image. Please try again.");
    }
  });

  // Save Image functionality - defined at the top level
  function saveImage() {
    if (!scaledImage || !scaledImage.src) {
      console.error("No image to save");
      return;
    }

    try {
      // Create a temporary link element
      const link = document.createElement("a");

      // Set the download attribute with a default filename
      link.download = "scaled-image.png";

      // Set the href to the image source
      link.href = scaledImage.src;

      // Append to the body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("There was an error saving the image. Please try again.");
    }
  }

  // Attach save event listener
  saveBtn.addEventListener("click", saveImage);

  // Function to re-initialize event listeners after printing
  function initializeEventListeners() {
    // Re-attach image input change listener
    document.getElementById("imageInput").addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        originalImageType = file.type || "image/png"; // Store the original image type

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

            // Show the selection instructions
            selectionInstructions.classList.remove("hidden");

            // Get image dimensions for selection
            imageRect = uploadedImage.getBoundingClientRect();
          };
        };

        reader.readAsDataURL(file);
      }
    });

    // Re-attach image selection events
    uploadedImage.addEventListener("mousedown", (e) => {
      // Prevent default browser behavior
      e.preventDefault();

      // Only start a new selection if we don't have one already
      // or if the user is clicking outside the current selection
      if (!hasSelection) {
        isSelecting = true;

        // Get the image wrapper element
        const imageWrapper = uploadedImage.parentElement;

        // Get exact positions
        imageRect = uploadedImage.getBoundingClientRect();
        const wrapperRect = imageWrapper.getBoundingClientRect();

        // Calculate offset of image within wrapper
        const imageOffsetLeft = imageRect.left - wrapperRect.left;
        const imageOffsetTop = imageRect.top - wrapperRect.top;

        // Calculate cursor position relative to the image
        startX = e.clientX - imageRect.left;
        startY = e.clientY - imageRect.top;

        // Initialize selection box at cursor position
        // Setting position relative to the wrapper since the selection box is a child of the wrapper
        selectionBox.style.left = `${startX + imageOffsetLeft}px`;
        selectionBox.style.top = `${startY + imageOffsetTop}px`;
        selectionBox.style.width = "0";
        selectionBox.style.height = "0";
        selectionBox.style.display = "block";
      }
    });

    // Re-attach save button listener
    document.getElementById("saveBtn").addEventListener("click", saveImage);

    // Re-attach scale button listener
    document.getElementById("scaleBtn").addEventListener("click", () => {
      // Scale button logic (abbreviated for clarity)
      const realWidth = parseFloat(realWidthInput.value);
      const realHeight = parseFloat(realHeightInput.value);

      if (
        isNaN(realWidth) ||
        isNaN(realHeight) ||
        realWidth <= 0 ||
        realHeight <= 0
      ) {
        alert("Please enter a valid dimension (greater than 0)");
        return;
      }

      // Rest of scaling logic...
      // (This is abbreviated to avoid repeating the entire function)
      // The full implementation is already in the file
    });

    // Re-attach dimension input listeners
    realWidthInput.addEventListener("input", () => {
      if (realWidthInput.value && selectionWidth && selectionHeight) {
        const aspectRatio = selectionHeight / selectionWidth;
        realHeightInput.value = (
          parseFloat(realWidthInput.value) * aspectRatio
        ).toFixed(1);
      }
    });

    realHeightInput.addEventListener("input", () => {
      if (realHeightInput.value && selectionWidth && selectionHeight) {
        const aspectRatio = selectionWidth / selectionHeight;
        realWidthInput.value = (
          parseFloat(realHeightInput.value) * aspectRatio
        ).toFixed(1);
      }
    });
  }

  // Function to create progress step indicators
  function addStepIndicator() {
    const stepsContainer = document.createElement("div");
    stepsContainer.className = "steps-container";

    const steps = [
      { label: "Upload Image" },
      { label: "Select Area" },
      { label: "Set Dimensions" },
      { label: "Preview & Print" },
    ];

    steps.forEach((stepInfo, index) => {
      const step = document.createElement("div");
      step.className = "step";
      step.innerHTML = (index + 1).toString();

      const label = document.createElement("div");
      label.className = "step-label";
      label.textContent = stepInfo.label;

      step.appendChild(label);
      stepsContainer.appendChild(step);
    });

    // Insert after the paragraph that follows the title, not directly after the title
    const introText = document.querySelector(".container > p");
    if (introText) {
      introText.after(stepsContainer);
    } else {
      // Fallback to inserting after title if paragraph not found
      const title = document.querySelector("h1");
      if (title) {
        title.after(stepsContainer);
      } else {
        document.body.prepend(stepsContainer);
      }
    }

    // Update active step based on current state
    updateSteps(1); // Start with step 1 active

    // Add event listeners to update steps
    uploadedImage.addEventListener("load", () => {
      if (uploadedImage.src && uploadedImage.src !== "") {
        updateSteps(2);
      }
    });

    selectionBox.addEventListener("mouseup", () => {
      if (hasSelection) updateSteps(3);
    });

    scaleBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (scaledImage.src) updateSteps(4);
      }, 100);
    });
  }

  // Function to update the active step
  function updateSteps(activeStep) {
    const steps = document.querySelectorAll(".step");
    steps.forEach((step, index) => {
      // Reset all classes
      step.classList.remove("active", "completed");

      // Mark completed steps
      if (index + 1 < activeStep) {
        step.classList.add("completed");
      }

      // Mark active step
      if (index + 1 === activeStep) {
        step.classList.add("active");
      }
    });
  }

  // Add upload message
  function addUploadMessage() {
    // Remove any existing upload message
    const existingMessage = document.querySelector(".upload-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const uploadMessage = document.createElement("div");
    uploadMessage.className = "upload-message";

    // Add an upload icon using inline SVG
    const uploadIcon = document.createElement("div");
    uploadIcon.className = "upload-icon";

    // Use inline SVG directly instead of fetch
    uploadIcon.innerHTML = `<svg width="60" height="60" viewBox="0 0 24 24">
      <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
    </svg>`;

    // Add text description - now mentioning click functionality
    const textDesc = document.createElement("div");
    textDesc.className = "upload-text"; // Add a class for better styling
    textDesc.innerHTML = `
      <p><strong>Drop an image here</strong> or <strong>click</strong> to begin</p>
    `;

    // Ensure text is centered
    textDesc.style.textAlign = "center";
    textDesc.style.width = "100%";

    uploadMessage.appendChild(uploadIcon);
    uploadMessage.appendChild(textDesc);

    if (imageContainer) {
      imageContainer.appendChild(uploadMessage);

      // Make sure the upload message is visible and centered
      uploadMessage.style.display = "flex";
      uploadMessage.style.justifyContent = "center";
      uploadMessage.style.alignItems = "center";

      // Hide the alt text by modifying the alt attribute
      if (uploadedImage) {
        uploadedImage.alt = "";
      }
    }
  }

  // Remove upload message
  function removeUploadMessage() {
    const uploadMessage = document.querySelector(".upload-message");
    if (uploadMessage) {
      uploadMessage.remove();
    }
  }

  // Handle remove button click
  function handleRemoveButtonClick() {
    const imageContainer = document.getElementById("imageContainer");
    const uploadedImage = document.getElementById("uploadedImage");
    const canvas = document.getElementById("canvas");
    const selectionInstructions = document.getElementById(
      "selectionInstructions"
    );

    // Hide image and canvas
    uploadedImage.src = "";
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;

    // Hide instructions
    selectionInstructions.classList.add("hidden");

    // Show upload message
    addUploadMessage();

    // Clear any selection
    if (window.selection) {
      window.selection = null;
    }

    // Update display
    imageContainer.style.display = "none";
    document.getElementById("outputSection").style.display = "none";
    document.getElementById("dimensionsSection").style.display = "none";
  }

  // Initialize the application - this should be at the end
  addUploadMessage();
  setupDropzone();

  // Make sure the file input has a change event listener
  const fileInputElement = document.getElementById("imageInput");
  if (fileInputElement) {
    // Remove any existing event listeners by cloning and replacing the element
    const newFileInput = fileInputElement.cloneNode(true);
    // Ensure the input is hidden
    newFileInput.style.display = "none";
    fileInputElement.parentNode.replaceChild(newFileInput, fileInputElement);

    // Add the change event listener to the new element
    newFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        originalImageType = file.type || "image/png";

        const reader = new FileReader();
        reader.onload = (event) => {
          uploadedImage.src = event.target.result;
          uploadedImage.onload = () => {
            // Show the image container
            imageContainer.style.display = "flex";

            // Remove the upload message
            removeUploadMessage();

            // Show the selection instructions
            selectionInstructions.classList.remove("hidden");

            // Reset selection state
            selectionBox.style.display = "none";
            dimensionsSection.style.display = "none";
            resultSection.style.display = "none";

            // Get image dimensions for selection
            imageRect = uploadedImage.getBoundingClientRect();

            // Update step indicator
            updateSteps(2);

            // Add the replace button
            addReplaceButton();
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Check if an image is already loaded and add replace button if needed
  if (
    uploadedImage &&
    uploadedImage.src &&
    uploadedImage.src !== "" &&
    !uploadedImage.src.endsWith("#")
  ) {
    // Add the replace button after a short delay to ensure the DOM is fully ready
    setTimeout(() => {
      if (typeof addReplaceButton === "function") {
        addReplaceButton();
      }
    }, 100);
  }
});
