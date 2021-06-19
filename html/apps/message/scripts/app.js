let message = {
    event: (data) => {
        console.log(data);
    },
    init: () => {
        console.log("init app message called!");
    },
    start: () => {
        console.log("start message app called!");
    }
};

APP["message"] = message;