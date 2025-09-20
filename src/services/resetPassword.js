const API_URL = "http://localhost:4000/api/v1/auth";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetForm");
    const msgBox = document.getElementById("resetMsg");

    // Capturar token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById("newPassword").value;

        try {
            const res = await fetch('${ API_URL } / reset - password', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await res.json();
            msgBox.hidden = false;
            msgBox.style.color = res.ok ? "green" : "red";
            msgBox.textContent = data.message || "Ocurrió un error";
        } catch (err) {
            msgBox.hidden = false;
            msgBox.style.color = "red";
            msgBox.textContent = "Error de conexión con el servidor";
        }
    });
});