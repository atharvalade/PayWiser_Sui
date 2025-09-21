# Face Recognition Demo Instructions

## Quick Start Guide

### Step 1: Open the Application
1. Navigate to the `face-recognition` folder
2. Double-click on `index.html` to open it in your web browser
3. You should see a beautiful face recognition interface

### Step 2: Enroll Two Persons

**Person 1:**
1. In the "Enroll Person" section, enter a name (e.g., "John Doe")
2. Click "Select Photo" and choose a clear photo of the first person
3. Click "Enroll Person"
4. You should see a success message with a UUID

**Person 2:**
1. Enter another name (e.g., "Jane Smith")
2. Select a different person's photo
3. Click "Enroll Person"
4. You should see another success message with a different UUID

### Step 3: Test Recognition
1. In the "Recognize Person" section, select a photo that contains one of the enrolled persons
2. Click "Recognize Person"
3. The system should identify the person and show their name with a confidence percentage

### Step 4: View Enrolled Persons
- Check the "Enrolled Persons" section to see your enrolled persons list
- You can remove persons from the local list if needed

## Expected Results

✅ **Successful Enrollment**: You'll see green success messages with UUIDs  
✅ **Successful Recognition**: You'll see the person's name and confidence level  
❓ **No Match**: If the photo doesn't match any enrolled person, you'll see "No matching person found"  
❌ **Errors**: Any API errors will be displayed in red alerts  

## Troubleshooting

**If you get CORS errors:**
1. Open Terminal/Command Prompt
2. Navigate to the face-recognition folder
3. Run: `python -m http.server 8000`
4. Open `http://localhost:8000` in your browser

**If enrollment fails:**
- Check that the photo is a valid image file
- Ensure the photo contains a clear, visible face
- Check your internet connection

**If recognition fails:**
- Make sure you've enrolled at least one person first
- Use a clear photo with a visible face
- The person in the photo should be one of the enrolled persons

## Testing Tips

1. **Use Good Quality Photos**: Clear, well-lit photos work best
2. **Face Visibility**: Make sure faces are not blurred or obscured
3. **Different Angles**: You can test with different angles of the same person
4. **Lighting**: Good lighting improves accuracy

## API Limits

The Luxand Cloud API may have rate limits or usage restrictions. If you encounter API errors, wait a moment before trying again.

Enjoy testing your face recognition system! 🎉
