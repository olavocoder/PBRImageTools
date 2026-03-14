# 🎨 PBR Image Tools

A modern web application for creative image processing, offering essential tools for 3D content creators and designers.

## 📋 Description

**Mask Map Generator** is a suite of tools for image processing with a special focus on PBR (Physically Based Rendering) textures. The application is completely free and runs 100% in the browser, with no need to upload files to external servers.

## 🎯 Features

### 1. 🎨 Mask Map Generator
Combines multiple image channels into a single PBR mask map:

- **Channel R (Red)**: Metallic
- **Channel G (Green)**: Ambient Occlusion (AO)
- **Channel B (Blue)**: Detail Mask
- **Channel A (Alpha)**: Smoothness (Inverted Roughness)

Supports multiple formats: PNG, JPG, TGA, EXR

### 2. 🔹 PBR Generator
Automatically generates professional PBR maps from a Diffuse texture:

- **Normal Map**: Calculated via Sobel Filter with intensity control
- **Roughness Map**: Derived from luminance variation
- **Metallic Map**: Extracted from color saturation
- **Ambient Occlusion (AO)**: Based on inverted luminance
- **Mask Map (RGBA)**: Combination of all channels in a single file
  - R: Metallic
  - G: Ambient Occlusion
  - B: Detail Mask
  - A: Roughness

Includes adjustable controls for each parameter and real-time visualization

### 3. 💧 Watermark Removal
Tools for removing watermarks from images

## 🚀 How to Use

### Mask Map Generator

1. **Import Images**:
   - Drag and drop your images into the input fields, or
   - Click to open the file browser

2. **Configure Channels**:
   - Each field represents a channel:
     - Metallic → Will be written to the red channel (R)
     - Ambient Occlusion → Will be written to the green channel (G)
     - Detail Mask → Will be written to the blue channel (B)
     - Roughness → Will be written to the alpha channel (A)

3. **Options**:
   - Check "Invert (Roughness → Smoothness)" to convert roughness to smoothness

4. **Generate**:
   - Click "Generate Mask Map" to combine the channels

5. **Download**:
   - Choose your desired format (PNG, JPG)
   - Click "Download" to save the file

### PBR Generator

1. **Import Diffuse Texture**:
   - Drag and drop your texture or click to browse

2. **Adjust Parameters**:
   - **Normal Strength**: Controls the intensity of the normal map (0-1)
   - **Roughness Level**: Sets the base roughness level (0-255)
   - **Metallic Amount**: Defines how much metallic will be detected (0-255)
   - **AO Intensity**: Controls the intensity of ambient occlusion (0-1)

3. **Preview**:
   - Maps are generated in real-time as you adjust the controls
   - See a preview of each map: Normal, Roughness, Metallic, AO, and Mask Map

4. **Download**:
   - Click "Download" to save all 5 automatically generated maps:
     - `normal.png`
     - `roughness.png`
     - `metallic.png`
     - `ambient_occlusion.png`
     - `mask_map.png` (combined RGBA)

## 📁 Project Structure

```
MaskmapApp/
├── index.html          # Main HTML structure
├── style.css           # Interface styles
├── script.js           # Main logic for Mask Map Generator
├── pbr.js              # PBR Generator logic
├── watermark.js        # Watermark Removal logic
├── tabs.js             # Tab manager
└── README.md           # This file
```

## 🛠️ Technologies

- **HTML5**: Semantic structure
- **CSS3**: Responsive and modern design
- **JavaScript (Vanilla)**: Image processing in the browser
- **Canvas API**: Image manipulation
- **FileReader API**: Local file reading

## ✨ Features

- ✅ 100% local processing (no server upload)
- ✅ Intuitive interface with drag & drop
- ✅ Real-time preview
- ✅ Supports multiple image formats
- ✅ Responsive and mobile-friendly
- ✅ Modern dark theme

## 💡 Usage Tips

- Images can have different sizes; they will be resized to match the largest one
- Roughness inversion is done through the formula: `smoothness = 1 - roughness`
- All processing occurs locally in your browser

## 📝 Development Notes

- The application uses Canvas API for channel composition
- Each JS file is modular and responsible for a specific functionality
- The tab manager allows easy extension with new processors

## 🤝 Contributions

For suggestions or improvements, open an issue or contact the developer.

## 📄 License

This project is provided as-is, without explicit or implicit warranties.

---

**Developed with ❤️ for 3D creators**
