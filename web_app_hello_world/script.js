function sayHello() {
    const name = document.getElementById("nameInput").value;
    const output = document.getElementById("output");
    output.textContent = "Hello, " + name + "!";
}