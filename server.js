const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Handle all routes - serve login.html as default
app.get('*', (req, res) => {
    // If it's an API route, don't serve HTML
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    
    // For HTML pages, serve the specific file or login.html
    if (req.path.endsWith('.html') || req.path === '/') {
        const filePath = req.path === '/' ? '/login.html' : req.path;
        const fullPath = path.join(__dirname, 'frontend/public', filePath);
        
        // Check if file exists, otherwise serve 404
        if (require('fs').existsSync(fullPath)) {
            res.sendFile(fullPath);
        } else {
            res.status(404).send('Page not found');
        }
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, () => {
    console.log(`✅ Frontend server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from frontend/public`);
});
