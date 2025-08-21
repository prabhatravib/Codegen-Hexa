# Marimo Server

This Flask server launches Marimo notebooks and provides URLs for embedding in the frontend.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Marimo:**
   ```bash
   pip install marimo
   ```

3. **Run the server:**
   ```bash
   python server.py
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### POST /launch
Launches a Marimo notebook and returns the URL.

**Request Body:**
```json
{
  "notebook": "# Python code content here"
}
```

**Response:**
```json
{
  "notebook_id": "uuid-here",
  "url": "http://localhost:port"
}
```

## Usage

1. The frontend sends notebook content to `/launch`
2. The server creates a temporary file and launches Marimo
3. Marimo runs on a free port in headless mode
4. The frontend receives the URL and embeds it in an iframe
5. Users can interact with the full Marimo notebook in the browser

## Notes

- Notebooks are stored temporarily in `/tmp/`
- Each notebook gets a unique port
- The server keeps track of running processes
- Marimo runs in headless mode without opening a browser
