module.exports = {
    apps: [
        {
            name: "api",
            script: "src/app.js",
            interpreter: "node",
            watch: true
        },
        {
            name: "emailWorker",
            script: "src/workers/email_worker.js",
            interpreter: "node"
        },
        {
            name: "fileWorker",
            script: "src/workers/file_worker.js",
            interpreter: "node"
        },
    ]
};
