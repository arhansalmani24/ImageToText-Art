const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const sourcePreview = document.getElementById("sourcePreview");
const originalImage = document.getElementById("originalImage");
const removeImage = document.getElementById("removeImage");

const outputWidth = document.getElementById("outputWidth");
const widthValue = document.getElementById("widthValue");
const charSet = document.getElementById("charSet");
const invertColors = document.getElementById("invertColors");

const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("status");

const monoPreview = document.getElementById("monoPreview");
const colorPreview = document.getElementById("colorPreview");

const copyMono = document.getElementById("copyMono");
const copyColor = document.getElementById("copyColor");
const downloadMono = document.getElementById("downloadMono");
const downloadColor = document.getElementById("downloadColor");

const canvas = document.getElementById("processingCanvas");
const ctx = canvas.getContext("2d", {
  willReadFrequently: true
});

let currentImage = null;
let monoArtwork = "";
let colorArtworkHTML = "";
let colorArtworkText = "";

// Character palettes: dark to light
const characterSets = {
  standard: "@%#*+=-:. ",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  blocks: "█▓▒░ ",
  simple: "#@+=:. "
};

// Update detail slider
outputWidth.addEventListener("input", () => {
  widthValue.textContent = outputWidth.value;
});

// Upload image
imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    statusText.textContent = "Please select a valid image.";
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const image = new Image();

    image.onload = () => {
      currentImage = image;

      originalImage.src = reader.result;
      sourcePreview.hidden = false;
      uploadArea.style.display = "none";

      generateBtn.disabled = false;
      statusText.textContent =
        "Image ready. Generate your text artwork.";

      clearResults();
    };

    image.onerror = () => {
      statusText.textContent = "Could not load this image.";
    };

    image.src = reader.result;
  };

  reader.onerror = () => {
    statusText.textContent = "Unable to read the selected file.";
  };

  reader.readAsDataURL(file);
});

// Remove uploaded image
removeImage.addEventListener("click", () => {
  currentImage = null;
  imageInput.value = "";
  originalImage.removeAttribute("src");

  sourcePreview.hidden = true;
  uploadArea.style.display = "flex";

  generateBtn.disabled = true;
  statusText.textContent = "Upload an image to get started.";

  clearResults();
});

// Reset results
function clearResults() {
  monoArtwork = "";
  colorArtworkHTML = "";
  colorArtworkText = "";

  monoPreview.innerHTML =
    '<span class="placeholder">Your black & white artwork will appear here.</span>';

  colorPreview.innerHTML =
    '<span class="placeholder">Your coloured artwork will appear here.</span>';

  copyMono.disabled = true;
  copyColor.disabled = true;
  downloadMono.disabled = true;
  downloadColor.disabled = true;
}

// Get character based on brightness
function brightnessToCharacter(brightness, palette) {
  const index = Math.floor(
    (brightness / 255) * (palette.length - 1)
  );

  return palette[index];
}

// Convert RGB to CSS color
function rgbToCSS(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

// Main conversion engine
function generateArtwork() {
  if (!currentImage) {
    statusText.textContent = "Upload an image first.";
    return;
  }

  try {
    generateBtn.disabled = true;
    statusText.textContent = "Converting your entire image...";

    const palette =
      characterSets[charSet.value] || characterSets.standard;

    const requestedWidth = Number(outputWidth.value);

    const aspectRatio =
      currentImage.naturalHeight / currentImage.naturalWidth;

    // Character cells are wider than they are tall.
    // This correction helps preserve the original image proportions.
    let columns = requestedWidth;
    let rows = Math.max(
      1,
      Math.round(columns * aspectRatio * 0.5)
    );

    // Prevent excessively large outputs.
    if (rows > 260) {
      rows = 260;
      columns = Math.max(
        1,
        Math.round(rows / (aspectRatio * 0.5))
      );
    }

    canvas.width = columns;
    canvas.height = rows;

    // Draw the complete image, not just its main subject.
    ctx.drawImage(
      currentImage,
      0,
      0,
      columns,
      rows
    );

    const imageData = ctx.getImageData(
      0,
      0,
      columns,
      rows
    );

    const pixels = imageData.data;

    const monoRows = [];
    const colorHTMLRows = [];
    const colorTextRows = [];

    const invert = invertColors.checked;

    for (let y = 0; y < rows; y++) {
      let monoLine = "";
      let colorHTMLLine = "";
      let colorTextLine = "";

      for (let x = 0; x < columns; x++) {
        const index = (y * columns + x) * 4;

        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        // Calculate perceived brightness
        let brightness =
          0.2126 * r +
          0.7152 * g +
          0.0722 * b;

        if (invert) {
          brightness = 255 - brightness;
        }

        const character = brightnessToCharacter(
          brightness,
          palette
        );

        monoLine += character;

        // Preserve the original pixel colour
        const cssColor = rgbToCSS(r, g, b);

        colorHTMLLine +=
          `<span style="color:${cssColor}">${character}</span>`;

        colorTextLine += character;
      }

      monoRows.push(monoLine);
      colorHTMLRows.push(colorHTMLLine);
      colorTextRows.push(colorTextLine);
    }

    monoArtwork = monoRows.join("\n");
    colorArtworkHTML = colorHTMLRows.join("\n");
    colorArtworkText = colorTextRows.join("\n");

    // Display monochrome result
    const monoPre = document.createElement("pre");
    monoPre.textContent = monoArtwork;

    monoPreview.replaceChildren(monoPre);

    // Display coloured result
    const colorPre = document.createElement("pre");

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const index = (y * columns + x) * 4;

        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        const brightness =
          0.2126 * r +
          0.7152 * g +
          0.0722 * b;

        const character = brightnessToCharacter(
          invert ? 255 - brightness : brightness,
          palette
        );

        const span = document.createElement("span");

        span.style.color = rgbToCSS(r, g, b);
        span.textContent = character;

        colorPre.appendChild(span);
      }

      if (y < rows - 1) {
        colorPre.appendChild(
          document.createTextNode("\n")
        );
      }
    }

    colorPreview.replaceChildren(colorPre);

    // Enable download and copy controls
    copyMono.disabled = false;
    copyColor.disabled = false;
    downloadMono.disabled = false;
    downloadColor.disabled = false;

    statusText.textContent =
      `Successfully generated ${columns} × ${rows} character artwork!`;

  } catch (error) {
    console.error(error);

    statusText.textContent =
      "Conversion failed. Try another image or lower the detail level.";

  } finally {
    generateBtn.disabled = !currentImage;
  }
}

// Generate button
generateBtn.addEventListener("click", generateArtwork);

// Copy monochrome art
copyMono.addEventListener("click", async () => {
  if (!monoArtwork) return;

  try {
    await navigator.clipboard.writeText(monoArtwork);
    statusText.textContent = "Black & white artwork copied!";
  } catch (error) {
    statusText.textContent =
      "Clipboard unavailable. Try opening the site over HTTPS.";
  }
});

// Copy coloured art
copyColor.addEventListener("click", async () => {
  if (!colorArtworkHTML) return;

  try {
    if (
      navigator.clipboard &&
      window.ClipboardItem &&
      navigator.clipboard.write
    ) {
      const htmlBlob = new Blob(
        [
          `<pre style="font-family:monospace;white-space:pre;">${colorArtworkHTML}</pre>`
        ],
        { type: "text/html" }
      );

      const textBlob = new Blob(
        [colorArtworkText],
        { type: "text/plain" }
      );

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob
        })
      ]);

      statusText.textContent =
        "Coloured artwork copied (where supported)!";

    } else {
      await navigator.clipboard.writeText(colorArtworkText);

      statusText.textContent =
        "Text copied. Use Download HTML to preserve colours.";
    }

  } catch (error) {
    statusText.textContent =
      "Clipboard unavailable. Try Download HTML instead.";
  }
});

// Download helper
function downloadFile(filename, content, type) {
  const blob = new Blob(
    [content],
    { type: `${type};charset=utf-8` }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

// Download monochrome text
downloadMono.addEventListener("click", () => {
  if (!monoArtwork) return;

  downloadFile(
    "image-text-art.txt",
    monoArtwork,
    "text/plain"
  );
});

// Download coloured HTML
downloadColor.addEventListener("click", () => {
  if (!colorArtworkHTML) return;

  const htmlDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ImageToText Art - Colour Artwork</title>
<style>
body {
  background: #080d18;
  color: white;
  padding: 24px;
}
pre {
  font-family: monospace;
  font-size: 7px;
  line-height: 1;
  white-space: pre;
  width: max-content;
}
</style>
</head>
<body>
<h2>ImageToText.Art - Coloured Artwork</h2>
<pre>${colorArtworkHTML}</pre>
</body>
</html>`;

  downloadFile(
    "image-text-art-colour.html",
    htmlDocument,
    "text/html"
  );
});
