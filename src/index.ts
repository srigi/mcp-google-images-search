import http from 'node:http';

const port = Number(process.env.PORT || 8000);

http.createServer().listen(port, '0.0.0.0', () => console.log(`Server is running on port ${port}`));
