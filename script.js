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
  const dimensionModeRadios = document.querySelectorAll(
    'input[name="dimensionMode"]'
  );

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
  let currentDimensionMode = "width"; // Default dimension mode

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

  // Upload image
  uploadBtn.addEventListener("click", () => {
    imageInput.click();
  });

  imageInput.addEventListener("change", (e) => {
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

        // Set the correct input field state based on current mode
        if (currentDimensionMode === "width") {
          realWidthInput.disabled = false;
          realHeightInput.disabled = true;
        } else {
          realWidthInput.disabled = true;
          realHeightInput.disabled = false;
        }

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

  // Handle dimension mode radio button changes
  dimensionModeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      currentDimensionMode = radio.value;

      if (currentDimensionMode === "width") {
        realWidthInput.disabled = false;
        realHeightInput.disabled = true;

        // If height has a value, calculate width based on aspect ratio
        if (realHeightInput.value && selectionWidth && selectionHeight) {
          const aspectRatio = selectionWidth / selectionHeight;
          realWidthInput.value = (
            parseFloat(realHeightInput.value) * aspectRatio
          ).toFixed(1);
        }
      } else {
        realWidthInput.disabled = true;
        realHeightInput.disabled = false;

        // If width has a value, calculate height based on aspect ratio
        if (realWidthInput.value && selectionWidth && selectionHeight) {
          const aspectRatio = selectionHeight / selectionWidth;
          realHeightInput.value = (
            parseFloat(realWidthInput.value) * aspectRatio
          ).toFixed(1);
        }
      }
    });
  });

  // Calculate the other dimension when one is entered
  realWidthInput.addEventListener("input", () => {
    if (
      currentDimensionMode === "width" &&
      realWidthInput.value &&
      selectionWidth &&
      selectionHeight
    ) {
      const aspectRatio = selectionHeight / selectionWidth;
      realHeightInput.value = (
        parseFloat(realWidthInput.value) * aspectRatio
      ).toFixed(1);
    }
  });

  realHeightInput.addEventListener("input", () => {
    if (
      currentDimensionMode === "height" &&
      realHeightInput.value &&
      selectionWidth &&
      selectionHeight
    ) {
      const aspectRatio = selectionWidth / selectionHeight;
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
    // Re-attach upload button listener
    document.getElementById("uploadBtn").addEventListener("click", () => {
      document.getElementById("imageInput").click();
    });

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

    // Re-attach dimension mode radio listeners
    dimensionModeRadios.forEach((radio) => {
      radio.addEventListener("change", handleDimensionModeChange);
    });

    // Re-attach dimension input listeners
    realWidthInput.addEventListener("input", () => {
      if (
        currentDimensionMode === "width" &&
        realWidthInput.value &&
        selectionWidth &&
        selectionHeight
      ) {
        const aspectRatio = selectionHeight / selectionWidth;
        realHeightInput.value = (
          parseFloat(realWidthInput.value) * aspectRatio
        ).toFixed(1);
      }
    });

    realHeightInput.addEventListener("input", () => {
      if (
        currentDimensionMode === "height" &&
        realHeightInput.value &&
        selectionWidth &&
        selectionHeight
      ) {
        const aspectRatio = selectionWidth / selectionHeight;
        realWidthInput.value = (
          parseFloat(realHeightInput.value) * aspectRatio
        ).toFixed(1);
      }
    });
  }

  // Define the handleDimensionModeChange function at the top level
  function handleDimensionModeChange() {
    currentDimensionMode = this.value;

    if (currentDimensionMode === "width") {
      realWidthInput.disabled = false;
      realHeightInput.disabled = true;

      // If height has a value, calculate width based on aspect ratio
      if (realHeightInput.value && selectionWidth && selectionHeight) {
        const aspectRatio = selectionWidth / selectionHeight;
        realWidthInput.value = (
          parseFloat(realHeightInput.value) * aspectRatio
        ).toFixed(1);
      }
    } else {
      realWidthInput.disabled = true;
      realHeightInput.disabled = false;

      // If width has a value, calculate height based on aspect ratio
      if (realWidthInput.value && selectionWidth && selectionHeight) {
        const aspectRatio = selectionHeight / selectionWidth;
        realHeightInput.value = (
          parseFloat(realWidthInput.value) * aspectRatio
        ).toFixed(1);
      }
    }
  }
});
