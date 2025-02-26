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

  // Inject modern styling after DOM elements are initialized
  injectModernStyling();

  // Add visual feedback for progress
  addStepIndicator();

  // Completely remove the upload button and file input elements
  if (uploadBtn && uploadBtn.parentElement) {
    uploadBtn.parentElement.removeChild(uploadBtn);
  }

  if (imageInput && imageInput.parentElement) {
    imageInput.parentElement.removeChild(imageInput);
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

    // Add CSS for the guides
    const style = document.createElement("style");
    style.textContent = `
      .selection-guide {
        position: absolute;
        pointer-events: none;
        z-index: 10;
      }
      .horizontal-guide {
        height: 1px;
        width: 100%;
        background-color: rgba(255, 0, 0, 0.7);
      }
      .vertical-guide {
        width: 1px;
        height: 100%;
        background-color: rgba(255, 0, 0, 0.7);
      }
    `;
    document.head.appendChild(style);
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

  // Function to inject modern styling into the page
  function injectModernStyling() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      :root {
        --primary-color: #4361ee;
        --primary-light: #4cc9f0;
        --primary-dark: #3a0ca3;
        --secondary-color: #f72585;
        --accent-color: #7209b7;
        --success-color: #06d6a0;
        --warning-color: #ffd166;
        --error-color: #ef476f;
        --text-dark: #2b2d42;
        --text-light: #edf2f4;
        --background-light: #ffffff;
        --background-off: #f8f9fa;
        --border-color: #e0e0e0;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        --shadow-md: 0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);
        --shadow-lg: 0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05);
        --border-radius: 8px;
        --transition-speed: 0.3s;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: var(--text-dark);
        background-color: var(--background-off);
        margin: 0;
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        transition: all var(--transition-speed) ease;
      }

      h1, h2, h3, h4, h5, h6 {
        color: var(--text-dark);
        margin-bottom: 1rem;
        font-weight: 600;
      }

      h1 {
        font-size: 2.2rem;
        text-align: center;
        margin-bottom: 1.5rem;
        color: var(--primary-dark);
      }

      .container {
        background: var(--background-light);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        padding: 2rem;
        margin-bottom: 2rem;
        transition: all var(--transition-speed) ease;
      }

      .container:hover {
        box-shadow: var(--shadow-lg);
      }

      /* Button styling */
      button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: 600;
        transition: background-color var(--transition-speed), transform var(--transition-speed);
        box-shadow: var(--shadow-sm);
        outline: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      button:hover {
        background-color: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      button:active {
        transform: translateY(0);
      }

      button.action-btn {
        background-color: var(--secondary-color);
      }

      button.action-btn:hover {
        background-color: var(--accent-color);
      }

      /* Form inputs */
      input[type="text"], input[type="number"] {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        display: inline-block;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-sizing: border-box;
        transition: border-color var(--transition-speed), box-shadow var(--transition-speed);
      }

      input[type="text"]:focus, input[type="number"]:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.3);
        outline: none;
      }

      label {
        font-weight: 600;
        margin-bottom: 8px;
        display: block;
      }

      /* Image container - update for better initial layout */
      #imageContainer {
        background-color: var(--background-off);
        border: 2px dashed var(--border-color);
        border-radius: var(--border-radius);
        min-height: 250px;
        max-height: 70vh;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
        transition: all var(--transition-speed) ease;
        margin-bottom: 2rem;
        cursor: pointer;
      }

      #imageContainer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 1;
        pointer-events: none;
      }

      #imageContainer:hover {
        border-color: var(--primary-color);
        background-color: var(--background-light);
      }

      #uploadedImage {
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        border-radius: calc(var(--border-radius) - 4px);
      }

      /* Hide the default alt text when using our custom message */
      #uploadedImage[alt] {
        font-size: 0;
        color: transparent;
      }

      /* Selection box */
      #selectionBox {
        position: absolute;
        border: 2px solid var(--secondary-color);
        background-color: rgba(247, 37, 133, 0.1);
        pointer-events: none;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
        z-index: 5;
      }

      /* Dimensions section */
      #dimensionsSection {
        background: var(--background-light);
        padding: 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        margin-top: 2rem;
        margin-bottom: 2rem;
        border-left: 5px solid var(--primary-color);
      }

      /* Result section */
      #resultSection {
        text-align: center;
        padding: 20px;
      }

      #scaledImage {
        max-width: 100%;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        margin-bottom: 1rem;
      }

      /* Selection guides */
      .selection-guide.horizontal-guide {
        height: 1px;
        background-color: var(--secondary-color);
        box-shadow: 0 0 3px var(--secondary-color);
      }

      .selection-guide.vertical-guide {
        width: 1px;
        background-color: var(--secondary-color);
        box-shadow: 0 0 3px var(--secondary-color);
      }

      /* Upload message - enhance for dropzone */
      .upload-message {
        position: absolute;
        text-align: center;
        max-width: 90%;
        color: var(--text-dark);
        opacity: 0.8;
        padding: 25px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: var(--border-radius);
        backdrop-filter: blur(2px);
        transition: all var(--transition-speed);
        z-index: 3;
        box-shadow: var(--shadow-sm);
      }

      .upload-message:hover {
        opacity: 1;
        box-shadow: var(--shadow-md);
      }

      .upload-message svg {
        opacity: 0.8;
        margin-bottom: 10px;
        fill: var(--primary-color);
        width: 70px;
        height: 70px;
        transition: transform 0.3s ease;
      }

      .dropzone-active .upload-message svg {
        transform: translateY(-5px);
        fill: var(--secondary-color);
      }

      /* Steps indicator */
      .steps-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2rem;
        position: relative;
        padding: 0 20px 20px 20px;
      }

      .steps-container::before {
        content: '';
        position: absolute;
        top: 15px;
        left: 20px;
        right: 20px;
        height: 4px;
        background-color: var(--border-color);
        z-index: 1;
      }

      .step {
        position: relative;
        z-index: 2;
        background-color: var(--background-light);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border: 2px solid var(--border-color);
        transition: all var(--transition-speed) ease;
      }

      .step.active {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 5px rgba(67, 97, 238, 0.2);
      }

      .step.completed {
        background-color: var(--success-color);
        color: white;
        border-color: var(--success-color);
      }

      .step-label {
        position: absolute;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-dark);
        width: 100px;
      }

      /* Description section */
      .description {
        text-align: center;
        margin-bottom: 3.5rem;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
      }

      @media print {
        .steps-container {
          display: none;
        }
      }

      /* Responsive layout */
      @media (max-width: 768px) {
        body {
          padding: 10px;
        }

        .container {
          padding: 1rem;
        }

        h1 {
          font-size: 1.8rem;
        }

        #imageContainer {
          min-height: 200px;
        }

        .upload-message {
          max-width: 95%;
          padding: 15px;
        }

        .upload-message svg {
          width: 40px;
          height: 40px;
        }

        .steps-container {
          overflow-x: auto;
          padding-bottom: 30px;
        }

        .step-label {
          width: 80px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Add a title to the page if it doesn't exist
    if (!document.querySelector("h1")) {
      const title = document.createElement("h1");
      title.textContent = "Image Scale & Print Tool";
      document.body.prepend(title);
    }

    // Wrap sections in containers if needed
    const sections = [
      "#imageContainer",
      "#dimensionsSection",
      "#resultSection",
    ];
    sections.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element && !element.parentElement.classList.contains("container")) {
        const container = document.createElement("div");
        container.className = "container";
        element.parentNode.insertBefore(container, element);
        container.appendChild(element);
      }
    });

    // Add icons to buttons
    styleButtons();
  }

  // Function to style buttons with icons
  function styleButtons() {
    if (uploadBtn) {
      uploadBtn.innerHTML =
        '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg> Upload Image';
    }

    if (scaleBtn) {
      scaleBtn.innerHTML =
        '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg> Scale Image';
      scaleBtn.classList.add("action-btn");
    }

    if (printBtn) {
      printBtn.innerHTML =
        '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/><path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5z"/><path d="M8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg> Print';
    }

    if (saveBtn) {
      saveBtn.innerHTML =
        '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.5 1.5A1.5 1.5 0 0 1 10 0h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h6c-.314.418-.5.937-.5 1.5v6h-2a.5.5 0 0 0-.354.854l2.5 2.5a.5.5 0 0 0 .708 0l2.5-2.5A.5.5 0 0 0 10.5 7.5h-2v-6z"/></svg> Save';
    }
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

    // Insert at the top of the page, after the title
    const title = document.querySelector("h1");
    if (title) {
      title.after(stepsContainer);
    } else {
      document.body.prepend(stepsContainer);
    }

    // Update active step based on current state
    updateSteps(1); // Start with step 1 active

    // Add event listeners to update steps
    uploadedImage.addEventListener("load", () => updateSteps(2));
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
  addUploadMessage();

  // Setup the dropzone
  setupDropzone();

  // Improve overall layout
  improveLayout();

  // Hide the traditional upload button since we're using drag-and-drop
  if (uploadBtn) {
    uploadBtn.style.display = "none";
  }
});

function addUploadMessage() {
  // Remove any existing upload message
  const existingMessage = document.querySelector(".upload-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const uploadMessage = document.createElement("div");
  uploadMessage.className = "upload-message";

  // Add an upload icon
  const uploadIcon = document.createElement("div");
  uploadIcon.innerHTML = `<svg width="60" height="60" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z"/>
    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 13h-8.906C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
  </svg>`;

  // Add text description - now mentioning click functionality
  const textDesc = document.createElement("div");
  textDesc.innerHTML = `
    <p><strong>Drop an image here</strong> or <strong>click</strong> to begin</p>
  `;

  uploadMessage.appendChild(uploadIcon);
  uploadMessage.appendChild(textDesc);

  if (imageContainer) {
    imageContainer.appendChild(uploadMessage);

    // Hide the alt text by modifying the alt attribute
    if (uploadedImage) {
      uploadedImage.alt = "";
    }
  }
}

// Function to setup the dropzone functionality
function setupDropzone() {
  if (!imageContainer) return;

  // Create a hidden file input element for the click functionality
  const hiddenFileInput = document.createElement("input");
  hiddenFileInput.type = "file";
  hiddenFileInput.accept = "image/*";
  hiddenFileInput.style.display = "none";
  hiddenFileInput.id = "hiddenImageInput";
  document.body.appendChild(hiddenFileInput);

  // Add file change event listener to the hidden input
  hiddenFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      originalImageType = file.type || "image/png";

      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImage.src = event.target.result;
        uploadedImage.onload = () => {
          imageContainer.style.display = "block";

          // Hide the upload message
          const uploadMessage = document.querySelector(".upload-message");
          if (uploadMessage) {
            uploadMessage.style.display = "none";
          }

          // Reset selection
          selectionBox.style.display = "none";
          dimensionsSection.style.display = "none";
          resultSection.style.display = "none";
          hasSelection = false;

          // Get image dimensions for selection
          imageRect = uploadedImage.getBoundingClientRect();

          // Update step indicator
          updateSteps(2);

          // Add remove button
          addRemoveButton();
        };
      };
      reader.readAsDataURL(file);
    }
  });

  // Add click handler to the image container
  imageContainer.style.cursor = "pointer";
  imageContainer.addEventListener("click", (e) => {
    // Don't trigger file dialog if clicking on the remove button
    if (e.target.closest(".remove-image-btn")) {
      console.log("Clicked remove button, not opening file picker");
      return;
    }

    // Open file picker if we're not currently selecting and either:
    // 1. There's no image yet
    // 2. We clicked the upload message
    // 3. We don't have an active selection
    const uploadMessage = document.querySelector(".upload-message");
    const isClickingUploadMessage = e.target.closest(".upload-message");
    const hasNoImage = !uploadedImage.src || uploadedImage.src === "";

    console.log("Click on container:", {
      isSelecting,
      hasSelection,
      isClickingUploadMessage: isClickingUploadMessage ? true : false,
      hasNoImage,
    });

    if (
      !isSelecting &&
      (hasNoImage || isClickingUploadMessage || !hasSelection)
    ) {
      console.log("Opening file picker");
      hiddenFileInput.click();
    }
  });

  // Add dragover event listeners
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    imageContainer.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
  });

  // Add visual feedback when dragging
  imageContainer.addEventListener(
    "dragenter",
    () => {
      imageContainer.classList.add("dropzone-active");
    },
    false
  );

  imageContainer.addEventListener(
    "dragover",
    () => {
      imageContainer.classList.add("dropzone-active");
    },
    false
  );

  imageContainer.addEventListener(
    "dragleave",
    () => {
      imageContainer.classList.remove("dropzone-active");
    },
    false
  );

  imageContainer.addEventListener(
    "drop",
    () => {
      imageContainer.classList.remove("dropzone-active");
    },
    false
  );

  // Handle dropped files
  imageContainer.addEventListener(
    "drop",
    (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files && files.length > 0) {
        const file = files[0];

        if (file.type.startsWith("image/")) {
          originalImageType = file.type || "image/png";

          const reader = new FileReader();
          reader.onload = (event) => {
            uploadedImage.src = event.target.result;
            uploadedImage.onload = () => {
              imageContainer.style.display = "block";

              // Hide the upload message
              const uploadMessage = document.querySelector(".upload-message");
              if (uploadMessage) {
                uploadMessage.style.display = "none";
              }

              // Reset selection
              selectionBox.style.display = "none";
              dimensionsSection.style.display = "none";
              resultSection.style.display = "none";
              hasSelection = false;

              // Get image dimensions for selection
              imageRect = uploadedImage.getBoundingClientRect();

              // Update step indicator
              updateSteps(2);

              // Add remove button
              addRemoveButton();
            };
          };
          reader.readAsDataURL(file);
        } else {
          alert("Please drop an image file (JPEG, PNG, GIF, etc.)");
        }
      }
    },
    false
  );

  // Add dropzone styles
  const style = document.createElement("style");
  style.textContent = `
    .dropzone-active {
      border: 3px dashed var(--secondary-color) !important;
      background-color: rgba(247, 37, 133, 0.05) !important;
      transform: scale(1.02);
      box-shadow: var(--shadow-lg);
    }

    #imageContainer {
      transition: all 0.3s ease;
    }

    #imageContainer:hover .upload-message {
      opacity: 1;
    }

    .remove-image-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(239, 71, 111, 0.9);
      color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 20;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      opacity: 0.8;
      transition: all 0.2s ease;
      border: none;
      font-size: 16px;
    }

    .remove-image-btn:hover {
      opacity: 1;
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
  `;
  document.head.appendChild(style);
}

// Function to add a remove button to the image container
function addRemoveButton() {
  // Remove any existing remove button
  const existingButton = document.querySelector(".remove-image-btn");
  if (existingButton) {
    existingButton.remove();
  }

  // Create the remove button
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-image-btn";
  removeBtn.innerHTML = "×";
  removeBtn.title = "Remove image";

  // Add event listener to remove the image
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent opening file picker

    // Clear the image
    uploadedImage.src = "";

    // Show the upload message
    const uploadMessage = document.querySelector(".upload-message");
    if (uploadMessage) {
      uploadMessage.style.display = "flex";
    } else {
      addUploadMessage();
    }

    // Reset selection and related elements
    selectionBox.style.display = "none";
    dimensionsSection.style.display = "none";
    resultSection.style.display = "none";
    hasSelection = false;

    // Reset step indicators
    updateSteps(1);

    // Remove the button itself
    removeBtn.remove();
  });

  // Add to image container
  imageContainer.appendChild(removeBtn);
}

// Function to update the DOM for a cleaner layout
function improveLayout() {
  // Remove the description completely
  const existingDescription = document.querySelector(".description");
  if (existingDescription) {
    existingDescription.parentElement.removeChild(existingDescription);
  }

  // Ensure steps container has proper spacing in card
  const stepsContainer = document.querySelector(".steps-container");
  if (stepsContainer && stepsContainer.closest(".container")) {
    const container = stepsContainer.closest(".container");
    if (container) {
      container.style.paddingTop = "20px";
    }
  } else if (stepsContainer) {
    // If steps are not in a container yet, wrap them
    const container = document.createElement("div");
    container.className = "container";
    container.style.paddingTop = "20px";
    stepsContainer.parentNode.insertBefore(container, stepsContainer);
    container.appendChild(stepsContainer);
  }

  // Ensure the main layout is wrapped properly
  const mainSections = document.querySelector("body > form");
  if (
    mainSections &&
    !mainSections.parentElement.classList.contains("container")
  ) {
    const mainContainer = document.createElement("div");
    mainContainer.className = "container";
    mainSections.parentNode.insertBefore(mainContainer, mainSections);
    mainContainer.appendChild(mainSections);
  }

  // Make sure buttons have proper spacing
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    if (!button.style.marginRight) {
      button.style.marginRight = "10px";
    }
  });
}
