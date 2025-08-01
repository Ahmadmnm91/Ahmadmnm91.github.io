<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DICOM Image Viewer</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>DICOM Image Viewer</h1>
        
        <?php
        // Get the file parameter from URL
        $file = isset($_GET['file']) ? $_GET['file'] : '';
        
        if (!empty($file)) {
            // Validate filename to prevent directory traversal
            $file = basename($file);
            $txtFilePath = "images/{$file}.txt";
            
            if (file_exists($txtFilePath)) {
                // Read the text file content
                $binFiles = file($txtFilePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                
                if (!empty($binFiles)) {
                    echo "<div class='viewer-container'>";
                    
                    foreach ($binFiles as $index => $binFile) {
                        // Sanitize the bin filename
                        $binFile = basename($binFile);
                        echo "<div class='image-viewer' id='viewer-{$index}' data-bin-file='{$binFile}'>";
                        echo "<div class='canvas-container'>";
                        echo "<canvas id='canvas-{$index}'></canvas>";
                        echo "</div>";
                        echo "<div class='controls'>";
                        echo "<button class='prev-btn' data-viewer-id='{$index}'>Previous</button>";
                        echo "<span class='image-counter' id='counter-{$index}'>Image 1 of ?</span>";
                        echo "<button class='next-btn' data-viewer-id='{$index}'>Next</button>";
                        echo "</div>";
                        echo "<div class='adjustments'>";
                        echo "<div class='adjustment'><label for='zoom-{$index}'>Zoom:</label><input type='range' id='zoom-{$index}' class='zoom-slider' min='50' max='300' value='100' data-viewer-id='{$index}'></div>";
                        echo "<div class='adjustment'><label for='brightness-{$index}'>Brightness:</label><input type='range' id='brightness-{$index}' class='brightness-slider' min='-100' max='100' value='0' data-viewer-id='{$index}'></div>";
                        echo "<div class='adjustment'><label for='contrast-{$index}'>Contrast:</label><input type='range' id='contrast-{$index}' class='contrast-slider' min='-100' max='100' value='0' data-viewer-id='{$index}'></div>";
                        echo "<div class='adjustment'><label for='gamma-{$index}'>Gamma:</label><input type='range' id='gamma-{$index}' class='gamma-slider' min='10' max='300' value='100' data-viewer-id='{$index}'></div>";
                        echo "<div class='adjustment'><label for='sharpness-{$index}'>Sharpness:</label><input type='range' id='sharpness-{$index}' class='sharpness-slider' min='0' max='100' value='0' data-viewer-id='{$index}'></div>";
                        echo "<div class='adjustment'><label for='blur-{$index}'>Blur:</label><input type='range' id='blur-{$index}' class='blur-slider' min='0' max='20' value='0' data-viewer-id='{$index}'></div>";
                        echo "</div>";
                        echo "</div>";
                    }
                    
                    echo "</div>";
                } else {
                    echo "<p class='error'>No binary files found in the text file.</p>";
                }
            } else {
                echo "<p class='error'>Text file not found: {$txtFilePath}</p>";
            }
        } else {
            echo "<p>Please provide a file parameter in the URL.</p>";
            echo "<p>Example: <code>https://MYSite.Com/?file=filename</code> (without .txt extension)</p>";
            
            // List available text files
            echo "<h2>Available Files:</h2>";
            echo "<ul class='file-list'>";
            $txtFiles = glob("images/*.txt");
            foreach ($txtFiles as $txtFile) {
                $fileName = basename($txtFile, ".txt");
                echo "<li><a href='?file={$fileName}'>{$fileName}</a></li>";
            }
            echo "</ul>";
        }
        ?>
    </div>
    
    <script src="script.js"></script>
</body>
</html>