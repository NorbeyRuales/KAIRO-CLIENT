// src/controllers/update.js
import { getProfile, updateProfile } from "../services/userService.js";
import { showToast } from "../api/utils/helpers.js";

export function initUpdate() {
  console.log("Update profile view loaded");

  const btnUpdate = document.getElementById("updateSubmit");
  const msgBox    = document.getElementById("updateMsg");

  // Si no existen elementos clave, salimos silenciosamente
  if (!btnUpdate || !msgBox) return;

  // Cargar datos actuales al entrar
  loadCurrentData();

  // Evento botón actualizar
  btnUpdate.addEventListener("click", async () => {
    const firstname = (document.getElementById("firstname")?.value || "").trim();
    const lastname  = (document.getElementById("lastname")?.value  || "").trim();
    const ageRaw    = (document.getElementById("age")?.value       || "").trim();
    const email     = (document.getElementById("email")?.value     || "").trim();

    const newData = {};
    if (firstname) newData.username = firstname; // 👈 map al backend (se conserva)
    if (lastname)  newData.lastname = lastname;

    if (ageRaw) {
      const ageNum = Number(ageRaw);
      if (!Number.isNaN(ageNum) && Number.isFinite(ageNum)) {
        // calculamos birthdate aprox a partir de la edad (enero 1)
        const today     = new Date();
        const birthYear = today.getFullYear() - ageNum;
        const birthdate = `${birthYear}-01-01`; // ✅ template string corregido
        newData.birthdate = birthdate;
      }
    }

    if (email) newData.email = email;

    try {
      await updateProfile(newData);
      msgBox.hidden = false;
      msgBox.textContent = "Datos actualizados correctamente ✅";
      msgBox.className = "kairo-alert success";

      // refrescamos datos actuales
      loadCurrentData();

      // limpiamos inputs
      const ids = ["firstname", "lastname", "age", "email"];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      if (showToast) showToast("Perfil actualizado con éxito");
    } catch (err) {
      console.error(err);
      msgBox.hidden = false;
      msgBox.textContent = err.message || "Error al actualizar los datos ❌";
      msgBox.className = "kairo-alert error";
    }
  });
}

async function loadCurrentData() {
  try {
    const user = await getProfile();
    if (!user) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? "";
    };

    // llenar campos actuales
    setVal("c-firstname", user.username || "");
    setVal("c-lastname",  user.lastname || "");

    if (user.birthdate) {
      const birthYear = new Date(user.birthdate).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      setVal("c-age", age);
    } else {
      setVal("c-age", "");
    }

    setVal("c-email", user.email || "");
  } catch (err) {
    console.error("Error cargando perfil:", err);
  }
}
