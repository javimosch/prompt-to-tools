module.exports = function ioService(io) {
    return {
        configureSocket(socket) {
            socket.on('requestCurlItem', () => {
                
                socket.emit('requestCurlItemComplete', {
                    relativeURL: "/api/completion",
                    method: "POST",
                    payload: {
                        prompt: "Yes",
                    }
                })
            })
        }
    }
}