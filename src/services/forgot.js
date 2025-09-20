function initForgot() {
    const form = document.getElementById('forgotForm');
    const msg = document.getElementById('forgotMsg');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.hidden = true;
        msg.textContent = '';

        const email = document.getElementById('femail').value.trim();
        if (!email) {
            msg.hidden = false;
            msg.textContent = 'Ingresa tu correo.';
            return;
        }

        try {
            const res = await fetch("http://localhost8080:/api/v1/users/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            msg.hidden = false;
            msg.textContent = data.message || "Revisa tu correo.";
            msg.style.color = res.ok ? "green" : "red";
        } catch (err) {
            msg.hidden = false;
            msg.textContent = "Error al conectar con el servidor.";
            msg.style.color = "red";
        }
    });
}