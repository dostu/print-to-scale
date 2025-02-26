# Image Resizer - Print to Scale

A simple web application that allows you to upload an image, select a specific part of it (like a watch head) with known dimensions, and print the entire image to scale (1:1).

## Features

- Upload any image
- Select a specific area of the image using click and drag
- Specify the real-world dimensions (in millimeters) of the selected area
- Automatically scale the entire image to print at 1:1 scale
- Print the scaled image directly from the browser

## How to Use

1. **Open the application**

   - Simply open the `index.html` file in any modern web browser

2. **Upload an image**

   - Click the "Upload Image" button and select an image from your computer
   - The image will be displayed on the screen

3. **Select the area with known dimensions**

   - Click and drag on the image to select the specific part you know the exact dimensions of (e.g., the watch head)
   - A red dashed box will appear showing your selection

4. **Enter real-world dimensions**

   - Once you've made a selection, the dimensions section will appear
   - Enter the actual width and height in millimeters of the selected area
   - For example, if you selected a watch head and know it's 40mm wide and 48mm tall, enter those values

5. **Scale the image**

   - Click the "Scale Image" button
   - The application will calculate the correct scale to ensure the entire image is scaled proportionally

6. **Print the image**

   - Click the "Print" button to open your browser's print dialog
   - **Important**: Make sure to disable "Fit to page" or similar options in your print dialog to maintain the 1:1 scale
   - Print the image

7. **Try it on**
   - Cut out the printed image and try it on your wrist to see how it looks and fits

## Technical Details

- The application uses HTML5 Canvas to scale the image
- Scaling calculations are based on standard screen resolution (96 DPI)
- The entire image is scaled based on the dimensions of the selected area
- No server-side processing is required; everything happens in your browser
- No external libraries or dependencies are needed

## Browser Compatibility

This application works best with modern browsers:

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Privacy

All processing happens locally in your browser. Your images are never uploaded to any server.
