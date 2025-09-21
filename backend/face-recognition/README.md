# Face Recognition Web App - Luxand Cloud

A simple web application for testing Luxand Cloud's face recognition API.

## Features

- **Enroll Person**: Add new persons to the face recognition database
- **Recognize Person**: Identify enrolled persons from photos
- **Manage Enrolled Persons**: View and manage locally stored person records
- **Modern UI**: Clean, responsive interface with smooth animations

## How to Use

### 1. Setup
- Open `index.html` in your web browser
- The API key is already hardcoded in the application

### 2. Enroll Persons
1. Go to the "Enroll Person" section
2. Enter the person's name
3. Select a clear photo of the person (well-lit, face clearly visible)
4. Click "Enroll Person"
5. The system will return a UUID for the enrolled person

### 3. Recognize Persons
1. Go to the "Recognize Person" section
2. Select a photo containing a face you want to identify
3. Click "Recognize Person"
4. The system will show if the person is recognized and their confidence level

### 4. View Enrolled Persons
- The "Enrolled Persons" section shows all locally stored person records
- You can remove persons from the local list (this doesn't delete from Luxand's database)

## API Details

**API Token**: `20913b25e33641a9815c95a1f78948cf` (hardcoded)

**Endpoints Used**:
- `POST /v2/person` - Enroll new person
- `GET /v2/person/{uuid}` - Get person details
- `POST /photo/search/v2` - Recognize person from photo

## File Structure

```
face-recognition/
├── index.html      # Main HTML interface
├── script.js       # JavaScript functionality
├── style.css       # Modern CSS styling
└── README.md       # This file
```

## Tips for Best Results

1. **Photo Quality**: Use clear, well-lit photos
2. **Face Visibility**: Ensure faces are clearly visible and not blurred
3. **Lighting**: Good lighting improves recognition accuracy
4. **Multiple Angles**: For better recognition, you can enroll the same person with different photos

## Browser Compatibility

- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses HTML5 File API for photo uploads

## Local Storage

The app uses browser's localStorage to keep track of enrolled persons locally. This data persists between browser sessions but is stored only in your browser.

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, serve the files through a local server
- **File Upload**: Make sure to select image files only
- **API Errors**: Check browser console for detailed error messages

## Starting a Local Server (if needed)

If you encounter CORS issues, you can start a simple local server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.
