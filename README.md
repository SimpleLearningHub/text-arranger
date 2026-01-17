# Text Arranger
A drag-and-drop style text editor solution

This is a javascript library that provides a drag-and-drop style text editor solution. You can drag single or multiple lines together to reorder them. Each line is individually editable. 

The library takes JSON as input and outputs JSON. The JSON format is as follows:

{
    "lines": [
        {
            "lineNumber": 1,
            "text": "Line 1",
        },
        {
            "lineNumber": 2,
            "text": "Line 2",
        }
    ]
}
```

## Sample
See `sample.html` for a complete working example using `sample.json` data.

## Usage

1. Include the script in your HTML file:
```html
<script src="textarranger.js"></script>
```

2. Create a container element:
```html
<div id="text-arranger"></div>
```

3. Initialize and render the component:
```javascript
const data = { ... }; // Your JSON data
const container = document.getElementById('text-arranger');

// Optional: Element to output updated JSON
const outputArea = document.getElementById('text'); 

// Initialize with data, container, and optional output area
const arranger = new TextArranger(data, container, outputArea);
arranger.render();
```

4. (Optional) Add a textarea for JSON output:
```html
<textarea id="text"></textarea>
```
If provided to the constructor, the component will automatically update this textarea with the current state.

